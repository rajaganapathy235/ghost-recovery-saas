package main

import (
	"context"
	"fmt"
	"syscall/js"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	_ "github.com/ncruces/go-sqlite3/driver"
	_ "github.com/ncruces/go-sqlite3/embed"
	waLog "go.mau.fi/whatsmeow/util/log"
)

var client *whatsmeow.Client
var log waLog.Logger

// GetPairingCode is the function called from JS
func GetPairingCode(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return js.Global().Get("Promise").Call("reject", "Error: Phone number required")
	}
	// CAPTURE HERE: Outer scope to avoid "function" string issue
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
			// This prevents the "status 400: bad-request" error
			fmt.Println("Ghost: Waiting for socket stabilization...")
			maxWait := 50 // 5 seconds
			for i := 0; i < maxWait; i++ {
				if client.IsConnected() {
					// We wait a bit more even if connected, to ensure internal handshakes are done
					time.Sleep(500 * time.Millisecond)
					break
				}
				time.Sleep(100 * time.Millisecond)
			}

			// 3. Request the 8-digit code from WhatsApp
			fmt.Printf("Ghost: Requesting code for %s...\n", phoneNumber)
			// Using WhatsApp Web Chrome signature
			code, err := client.PairPhone(context.Background(), phoneNumber, true, whatsmeow.PairClientChrome, "Ghost Recovery SaaS")
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

func main() {
	// 1. IMMEDIATE REGISTRATION
	js.Global().Set("getWhatsAppPairingCode", js.FuncOf(GetPairingCode))
	fmt.Println("Ghost: Function 'getWhatsAppPairingCode' registered.")

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
			client = whatsmeow.NewClient(deviceStore, log)
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
