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
        // FIX: Added context.Background()
        err := client.Logout(context.Background())
        if err != nil {
            return err.Error()
        }
        return nil
    }
    return "Not connected"
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

			fmt.Println("Ghost: Waiting for socket stabilization...")
			maxWait := 30
			for i := 0; i < maxWait; i++ {
				if client.IsConnected() {
					time.Sleep(2000 * time.Millisecond)
					break
				}
				time.Sleep(100 * time.Millisecond)
			}

			fmt.Printf("Ghost: Requesting code for %s...\n", phoneNumber)
			code, err := client.PairPhone(context.Background(), phoneNumber, true, whatsmeow.PairClientChrome, "Chrome (Mac OS)")
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
			fmt.Println("Ghost: Initial History Sync in progress...")
		case *events.LoggedOut:
			fmt.Println("Ghost: Logged out from WhatsApp.")
		}
	})
}

func main() {
	js.Global().Set("getWhatsAppPairingCode", js.FuncOf(GetPairingCode))
	js.Global().Set("checkGhostLogin", js.FuncOf(CheckLogin))
	js.Global().Set("getLoggedInPhone", js.FuncOf(GetLoggedInPhone))
	js.Global().Set("sendGhostMessage", js.FuncOf(SendMessage))
	js.Global().Set("logoutGhost", js.FuncOf(LogoutGhost))
	fmt.Println("Ghost: Bridges registered.")

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
			deviceStore.Platform = "chrome"
			deviceStore.BusinessName = "Ghost SaaS"
			client = whatsmeow.NewClient(deviceStore, log)
			registerEventHandler(client)
			fmt.Println("Ghost: Engine connecting...")
			client.Connect()
		}
	}

	fmt.Println("Ghost Engine Alive (Looping)")
	select {}
}
