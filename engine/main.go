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

func SendMessage(this js.Value, args []js.Value) interface{} {
	handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		resolve := args[0]
		reject := args[1]

		if len(args) < 2 {
			reject.Invoke("Error: Target and Message required")
			return nil
		}
		target := args[0].String()
		messageText := args[1].String()

		go func() {
			if client == nil || !client.IsConnected() {
				reject.Invoke("Error: Engine not connected")
				return
			}

			// 1. Settle Delay: Allow history sync to start before hogging the pipe
			fmt.Println("Ghost: Settle delay for test message (3s)...")
			time.Sleep(3 * time.Second)

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

func CheckLogin(this js.Value, args []js.Value) interface{} {
    if client == nil || client.Store == nil || client.Store.ID == nil {
        return false
    }
    return client.IsConnected() && client.IsLoggedIn()
}

// GetPairingCode remains same
func GetPairingCode(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return js.Global().Get("Promise").Call("reject", "Error: Phone number required")
	}
	// CAPTURE HERE: Outer scope
	phoneNumber := args[0].String()

	handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		resolve := args[0]
		reject := args[1]

		go func() {
			if client == nil {
				reject.Invoke("Error: Engine not initialized")
				return
			}

			// 1. Ensure we are physically connected
			if !client.IsConnected() {
				fmt.Println("Ghost: Engine not connected, attempting to reconnect...")
				err := client.Connect()
				if err != nil {
					reject.Invoke(fmt.Sprintf("Connection Failed: %v", err))
					return
				}
			}

			// 2. WAIT for the socket to authenticate and be ready for queries
			// The server needs a few seconds to stabilize the session
			fmt.Println("Ghost: Waiting for socket stabilization...")
			maxWait := 30 // 3 seconds
			for i := 0; i < maxWait; i++ {
				if client.IsConnected() {
					// Add an extra buffer as recommended by whatsmeow for PairPhone
					time.Sleep(2000 * time.Millisecond)
					break
				}
				time.Sleep(100 * time.Millisecond)
			}

			// 3. Request the 8-digit code from WhatsApp
			fmt.Printf("Ghost: Requesting code for %s...\n", phoneNumber)
            
            // CRITICAL FIX: The display name MUST be in "Browser (OS)" format or WhatsApp returns 400 Bad Request
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

	// Return a Promise to JS
	promiseClass := js.Global().Get("Promise")
	return promiseClass.New(handler)
}

func registerEventHandler(cli *whatsmeow.Client) {
	cli.AddEventHandler(func(evt interface{}) {
		switch v := evt.(type) {
		case *events.PairSuccess:
			fmt.Printf("Ghost SUCCESS: Successfully paired with %s (Business: %s)\n", v.ID, v.BusinessName)
		case *events.PairError:
			fmt.Printf("Ghost ERR: Pairing failed: %v\n", v.Error)
		case *events.Connected:
			fmt.Println("Ghost: Connected to WhatsApp socket.")
		case *events.HistorySync:
			fmt.Println("Ghost: Initial History Sync in progress... (Syncing chats/messages)")
		case *events.LoggedOut:
			fmt.Println("Ghost: Logged out from WhatsApp.")
		}
	})
}

func main() {
	// 1. IMMEDIATE REGISTRATION
	js.Global().Set("getWhatsAppPairingCode", js.FuncOf(GetPairingCode))
	js.Global().Set("checkGhostLogin", js.FuncOf(CheckLogin))
	js.Global().Set("sendGhostMessage", js.FuncOf(SendMessage))
	fmt.Println("Ghost: Bridges registered.")

	log = waLog.Stdout("Main", "INFO", true)
	
	// 2. BACKGROUND INITIALIZATION
	fmt.Println("Ghost: Initializing internal store (Wasm SQLite)...")
	// Use ncruces/go-sqlite3 which works in JS/Wasm
	container, err := sqlstore.New(context.Background(), "sqlite3", "file:session.db?mode=memory&cache=shared", log)
	if err != nil {
		fmt.Printf("Ghost ERR: Failed to create store: %v\n", err)
	} else {
		deviceStore, err := container.GetFirstDevice(context.Background())
		if err != nil {
			fmt.Printf("Ghost ERR: Failed to get device store: %v\n", err)
		} else {
			// Set some default props to help with identity
			deviceStore.Platform = "chrome"
			deviceStore.BusinessName = "Ghost SaaS"
            
			client = whatsmeow.NewClient(deviceStore, log)
			registerEventHandler(client) // Start listening for pairing success
			fmt.Println("Ghost: Engine connecting...")
			err = client.Connect()
			if err != nil {
				fmt.Printf("Ghost ERR: Failed to start connection: %v\n", err)
			} else {
				fmt.Println("Ghost: Engine connection routine started.")
			}
		}
	}

	// Keep the Go program alive
	fmt.Println("Ghost Engine Alive (Looping)")
	select {}
}
