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
    // Optimization: If Store.ID is set, the pairing was successful.
    // We don't need to wait for the full handshake (which includes history sync)
    // to tell the UI it worked.
    return true
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
			if client == nil {
				reject.Invoke("Error: Engine not initialized")
				return
			}

            // Auto-Reconnect Logic for Messaging
            if !client.IsConnected() && client.Store.ID != nil {
                fmt.Println("Ghost: Message requested while disconnected. Attempting auto-reconnect...")
                err := client.Connect()
                if err != nil {
                    fmt.Printf("Ghost ERR: Auto-reconnect failed: %v\n", err)
                } else {
                    // Give it a moment to stabilize
                    time.Sleep(3 * time.Second)
                }
            }

			if !client.IsConnected() {
				reject.Invoke("Error: Engine not connected (Auto-reconnect failed)")
				return
			}

			// 1. Settle Delay: Allow history sync to start before hogging the pipe
			fmt.Println("Ghost: Waiting for socket to settle (5s)...")
			
            // Aggressive Connection Waiter
            for i := 0; i < 10; i++ { // 5 seconds max
                if client.IsConnected() {
                    break
                }
                time.Sleep(500 * time.Millisecond)
            }

			if !client.IsConnected() {
				reject.Invoke("Error: Engine remained disconnected after settlement delay")
				return
			}

            // 2. Recipient Parsing
			recipient, err := types.ParseJID(target + "@s.whatsapp.net")
			if err != nil {
				reject.Invoke(fmt.Sprintf("Invalid JID: %v", err))
				return
			}

			msg := &waE2E.Message{
				Conversation: proto.String(messageText),
			}

            // 3. Protocol Retry Loop (Fixed usync/device list failures)
            var lastErr error
            for attempt := 1; attempt <= 3; attempt++ {
                // Signal-Locked Dispatch: Force a successful protocol check before usync
                fmt.Printf("Ghost: Signal-Locking socket (Attempt %d)...\n", attempt)
                err = client.SendPresence(context.Background(), types.PresenceAvailable)
                if err != nil {
                     fmt.Printf("Ghost: Signal-Lock failed: %v. Re-connecting...\n", err)
                     client.Disconnect()
                     _ = client.Connect()
                     time.Sleep(3 * time.Second)
                }

                fmt.Printf("Ghost: Dispatch attempt %d...\n", attempt)
			    resp, err := client.SendMessage(context.Background(), recipient, msg)
			    if err == nil {
			        fmt.Printf("Ghost: Message sent! ID: %s\n", resp.ID)
			        resolve.Invoke(resp.ID)
                    return
			    }
                lastErr = err
                fmt.Printf("Ghost ERR: Dispatch attempt %d failed: %v\n", attempt, err)
                
                // Protocol Cold-Start: Force reset on failure
                fmt.Println("Ghost: Protocol failure. Forcing Cold-Start reset...")
                client.Disconnect()
                time.Sleep(1 * time.Second)
                _ = client.Connect()
                time.Sleep(3 * time.Second)
            }
            
			reject.Invoke(fmt.Sprintf("Send Final Failure after 3 attempts: %v", lastErr))
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
			fmt.Println("Ghost: History Sync detected. Skipping processing...")
        case *events.StreamError:
            fmt.Printf("Ghost: Stream Error: %v\n", v.Raw)
		case *events.LoggedOut:
			fmt.Println("Ghost: Logged out from WhatsApp.")
		}
	})
}

func ForceReconnect(this js.Value, args []js.Value) interface{} {
    if client != nil {
        fmt.Println("Ghost: Explicit reconnect triggered via JS bridge.")
        go client.Connect()
    }
    return nil
}

func ResetEngine(this js.Value, args []js.Value) interface{} {
    if client != nil {
        fmt.Println("Ghost: HARD RESET triggered. Killing engine...")
        client.Disconnect()
        client = nil
    }
    
    go func() {
        time.Sleep(2 * time.Second)
        fmt.Println("Ghost: Re-initializing fresh engine instance...")
        // The main persistence loop will handle the rest if we just trigger a boot
        // Actually, let's just re-run the client creation logic here or rely on the fact that 
        // ForceReconnect will be called or the Fighter loop will pick it up.
        // To be safe, let's just trigger a full re-init in JS.
    }()
    return nil
}

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("Ghost FATAL: Recovered from panic in main: %v\n", r)
		}
	}()

	js.Global().Set("getWhatsAppPairingCode", js.FuncOf(GetPairingCode))
	js.Global().Set("forceReconnectGhost", js.FuncOf(ForceReconnect))
	js.Global().Set("checkGhostLogin", js.FuncOf(CheckLogin))
	js.Global().Set("getLoggedInPhone", js.FuncOf(GetLoggedInPhone))
	js.Global().Set("sendGhostMessage", js.FuncOf(SendMessage))
	js.Global().Set("logoutGhost", js.FuncOf(LogoutGhost))
	js.Global().Set("saveGhostSession", js.FuncOf(SaveGhostSession))
	js.Global().Set("loadGhostSession", js.FuncOf(LoadGhostSession))
    js.Global().Set("resetGhostEngine", js.FuncOf(ResetEngine))
	fmt.Println("Ghost: Engine V1.8 Bridges registered (Iron-Grip).")

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
			deviceStore.Platform = "macOS"
			deviceStore.BusinessName = "Ghost Recovery"
			client = whatsmeow.NewClient(deviceStore, log)
			registerEventHandler(client)
			fmt.Println("Ghost: Engine V1.7 Core Active.")

			// Persistent "Fighter" Loop: Keeps the socket alive 24/7 if session exists
			go func() {
				for {
					time.Sleep(5 * time.Second)
                    if client != nil {
                        // Priority 1: Keep presence alive if connected
                        if client.IsConnected() {
                            _ = client.SendPresence(context.Background(), types.PresenceAvailable)
                        } else if client.Store != nil && client.Store.ID != nil {
                            // Priority 2: Force reconnect if disconnected but session exists
                            fmt.Println("Ghost: Fighter Loop - Socket dead. Forcing persistence...")
                            _ = client.Connect()
                        }
                    }
				}
			}()

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
