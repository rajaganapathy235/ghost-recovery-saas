package main

import (
	"context"
	"fmt"
	"syscall/js"

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
	handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		resolve := args[0]
		reject := args[1]

		if len(args) < 1 {
			reject.Invoke("Error: Phone number required")
			return nil
		}
		phoneNumber := args[0].String()

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

			fmt.Printf("Ghost: Requesting code for %s...\n", phoneNumber)
			code, err := client.PairPhone(context.Background(), phoneNumber, true, whatsmeow.PairClientChrome, "SaaS Reminder PWA")
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

func main() {
	js.Global().Set("getWhatsAppPairingCode", js.FuncOf(GetPairingCode))
	fmt.Println("Ghost: Function 'getWhatsAppPairingCode' registered.")

	log = waLog.Stdout("Main", "INFO", true)
	
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

	fmt.Println("Ghost Engine Alive (Looping)")
	select {}
}
