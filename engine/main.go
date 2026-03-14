package main

import (
	"context"
	"fmt"
	"syscall/js"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	_ "github.com/ncruces/go-sqlite3/driver"
	_ "github.com/ncruces/go-sqlite3/embed"
	"google.golang.org/protobuf/proto"
	waLog "go.mau.fi/whatsmeow/util/log"
    "encoding/json"
    "encoding/base64"
)

var client *whatsmeow.Client
var log waLog.Logger
var container *sqlstore.Container

func CheckLogin(this js.Value, args []js.Value) interface{} {
    if client == nil || client.Store == nil || client.Store.ID == nil {
        return false
    }
    return client.IsConnected() && client.IsLoggedIn()
}

func GetLoggedInPhone(this js.Value, args []js.Value) interface{} {
    if client == nil || client.Store == nil || client.Store.ID == nil {
        return ""
    }
    return client.Store.ID.User
}

func LogoutGhost(this js.Value, args []js.Value) interface{} {
    if client != nil {
        err := client.Logout(context.Background())
        if err != nil {
            return err.Error()
        }
        return nil
    }
    return "Not connected"
}

type GhostSessionData struct {
	JID           string `json:"jid"`
	NoiseKey      string `json:"noise_key"`
	IdentityKey   string `json:"identity_key"`
	AdvSecretKey  string `json:"adv_secret_key"`
}

func SaveGhostSession(this js.Value, args []js.Value) interface{} {
	if client == nil || client.Store == nil || client.Store.ID == nil {
		return nil
	}
	data := GhostSessionData{
		JID:          client.Store.ID.String(),
		NoiseKey:     base64.StdEncoding.EncodeToString(client.Store.NoiseKey.Priv[:]),
		IdentityKey:  base64.StdEncoding.EncodeToString(client.Store.IdentityKey.Priv[:]),
		AdvSecretKey: base64.StdEncoding.EncodeToString(client.Store.AdvSecretKey),
	}
	bytes, _ := json.Marshal(data)
	return string(bytes)
}

func LoadGhostSession(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return "Error: Session data required"
	}
	var data GhostSessionData
	err := json.Unmarshal([]byte(args[0].String()), &data)
	if err != nil {
		return fmt.Sprintf("Error parsing session: %v", err)
	}

	jid, err := types.ParseJID(data.JID)
	if err != nil {
		return fmt.Sprintf("Error parsing JID: %v", err)
	}

	noiseKey, _ := base64.StdEncoding.DecodeString(data.NoiseKey)
	identityKey, _ := base64.StdEncoding.DecodeString(data.IdentityKey)
	advSecretKey, _ := base64.StdEncoding.DecodeString(data.AdvSecretKey)

	if client != nil {
		client.Store.ID = &jid
		copy(client.Store.NoiseKey.Priv[:], noiseKey)
		copy(client.Store.IdentityKey.Priv[:], identityKey)
		client.Store.AdvSecretKey = advSecretKey
		fmt.Println("Ghost: Session restored from localStorage.")
		return nil
	}
	return "Error: Engine not ready"
}

func SendMessage(this js.Value, sendMessageArgs []js.Value) interface{} {
	if len(sendMessageArgs) < 2 {
		return js.Global().Get("Promise").Call("reject", "Error: Target and Message required")
	}
	target := sendMessageArgs[0].String()
	messageText := sendMessageArgs[1].String()

	handler := js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
		resolve := promiseArgs[0]
		reject := promiseArgs[1]

		go func() {
			if client == nil || !client.IsConnected() {
				reject.Invoke("Error: Engine not connected")
				return
			}

			// 1. Settle Delay: Allow history sync to start before hogging the pipe
			fmt.Println("Ghost: Settle delay for test message (2s)...")
			time.Sleep(2 * time.Second)

			recipient, err := types.ParseJID(target + "@s.whatsapp.net")
			if err != nil {
				reject.Invoke(fmt.Sprintf("Invalid JID: %v", err))
				return
			}

			msg := &waE2E.Message{
				Conversation: proto.String(messageText),
			}

			resp, err := client.SendMessage(context.Background(), recipient, msg)
			if err != nil {
				reject.Invoke(fmt.Sprintf("Send Failed: %v", err))
				return
			}
			fmt.Printf("Ghost: Message sent! ID: %s\n", resp.ID)
			resolve.Invoke(resp.ID)
		}()
		return nil
	})
	return js.Global().Get("Promise").New(handler)
}

func GetPairingCode(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return js.Global().Get("Promise").Call("reject", "Error: Phone number required")
	}
	phoneNumber := args[0].String()

	handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		resolve := args[0]
		reject := args[1]

		go func() {
			if client == nil {
				reject.Invoke("Error: Engine not initialized")
				return
			}

			if !client.IsConnected() {
				fmt.Println("Ghost: Engine not connected, attempting to reconnect...")
				err := client.Connect()
				if err != nil {
					reject.Invoke(fmt.Sprintf("Connection Failed: %v", err))
					return
				}
			}

			fmt.Println("Ghost: Waiting for socket stabilization (Ultra-Safety V1.2)...")
			maxWait := 50 // 5 seconds max
			for i := 0; i < maxWait; i++ {
				if client.IsConnected() {
					time.Sleep(3000 * time.Millisecond) // Ultra safety for protocol shake
					break
				}
				time.Sleep(100 * time.Millisecond)
			}

			fmt.Printf("Ghost: Requesting code for %s (V1.2 Backoff)...\n", phoneNumber)
            
            var code string
            var err error
            backoffs := []int{3, 7, 15}
            
            for attempt := 0; attempt < 3; attempt++ {
                // Use a standard OS name as WhatsApp is picky
                code, err = client.PairPhone(context.Background(), phoneNumber, true, whatsmeow.PairClientChrome, "Chrome (Windows)")
                if err == nil {
                    break
                }
                
                waitSec := backoffs[attempt]
                fmt.Printf("Ghost: Attempt %d failed (%v). Waiting %ds for cooldown...\n", attempt+1, err, waitSec)
                time.Sleep(time.Duration(waitSec) * time.Second)
            }

			if err != nil {
				reject.Invoke(fmt.Sprintf("WhatsApp Error: %v", err))
				return
			}
			fmt.Println("Ghost: Code received successfully.")
			resolve.Invoke(code)
		}()

		return nil
	})

	return js.Global().Get("Promise").New(handler)
}

func registerEventHandler(cli *whatsmeow.Client) {
	cli.AddEventHandler(func(evt interface{}) {
		switch v := evt.(type) {
		case *events.PairSuccess:
			fmt.Printf("Ghost SUCCESS: Successfully paired with %s\n", v.ID)
		case *events.Connected:
			fmt.Println("Ghost: Connected to WhatsApp socket.")
		case *events.HistorySync:
			fmt.Println("Ghost: History Sync detected. Skipping to save bandwidth...")
            // We don't call anything here, just let it be. 
            // Whatsmeow by default won't download full history unless we ask.
		case *events.LoggedOut:
			fmt.Println("Ghost: Logged out from WhatsApp.")
		}
	})
}

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("Ghost FATAL: Recovered from panic in main: %v\n", r)
		}
	}()

	js.Global().Set("getWhatsAppPairingCode", js.FuncOf(GetPairingCode))
	js.Global().Set("checkGhostLogin", js.FuncOf(CheckLogin))
	js.Global().Set("getLoggedInPhone", js.FuncOf(GetLoggedInPhone))
	js.Global().Set("sendGhostMessage", js.FuncOf(SendMessage))
	js.Global().Set("logoutGhost", js.FuncOf(LogoutGhost))
	js.Global().Set("saveGhostSession", js.FuncOf(SaveGhostSession))
	js.Global().Set("loadGhostSession", js.FuncOf(LoadGhostSession))
	fmt.Println("Ghost: Engine V1.2 Bridges registered.")

	log = waLog.Stdout("Main", "INFO", true)
	
	fmt.Println("Ghost: Initializing internal store...")
    
	var err error
	container, err = sqlstore.New(context.Background(), "sqlite3", "file:session.db?mode=memory&cache=shared", log)
	if err != nil {
		fmt.Printf("Ghost ERR: Failed to create store: %v\n", err)
	} else {
		deviceStore, err := container.GetFirstDevice(context.Background())
		if err != nil {
			fmt.Printf("Ghost ERR: Failed to get device store: %v\n", err)
		} else {
            if deviceStore == nil {
                fmt.Println("Ghost: No device found in memory, creating fresh device...")
                deviceStore = container.NewDevice()
            }
			deviceStore.Platform = "chrome"
			deviceStore.BusinessName = "Ghost SaaS"
			client = whatsmeow.NewClient(deviceStore, log)
			registerEventHandler(client)
			fmt.Println("Ghost: Engine connecting...")
            
            go func() {
                defer func() {
                    if r := recover(); r != nil {
                        fmt.Printf("Ghost: Connection routine recovered from panic: %v\n", r)
                    }
                }()
                err := client.Connect()
                if err != nil {
                    fmt.Printf("Ghost: Initial connection failed: %v\n", err)
                }
            }()
		}
	}

	fmt.Println("Ghost Engine Alive (Looping)")
	
	// Robust keep-alive loop with auto-reconnect and drift detection
	for {
        start := time.Now()
		time.Sleep(5 * time.Second)
        elapsed := time.Since(start)

        // Drift Detection: If we slept for > 15s when we asked for 5s, 
        // it means the browser throttled us. 
        if elapsed > 15 * time.Second {
            fmt.Printf("Ghost: Background drift detected (%v). Force stabilizing...\n", elapsed)
            if client != nil {
                _ = client.Connect()
            }
        }

		if client != nil && !client.IsConnected() && client.Store != nil && client.Store.ID != nil {
			fmt.Println("Ghost: Disconnect detected in loop. Attempting silent reconnect...")
			_ = client.Connect()
		}
	}
}
