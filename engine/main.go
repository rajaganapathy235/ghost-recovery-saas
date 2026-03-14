package main

import (
	"context"
	"fmt"
	"syscall/js"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	_ "github.com/mattn/go-sqlite3" 
	waLog "go.mau.fi/whatsmeow/util/log"
)

var client *whatsmeow.Client
var log waLog.Logger

// GetPairingCode is the function called from JS
func GetPairingCode(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return "Error: Phone number required"
	}
	phoneNumber := args[0].String()

	// Handler for async result
	handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		resolve := args[0]
		reject := args[1]

		go func() {
			// 1. Request the 8-digit code from WhatsApp
			// clientType 11 = Chrome (Matches PWA profile)
			code, err := client.PairPhone(context.Background(), phoneNumber, true, whatsmeow.PairClientChrome, "SaaS Reminder PWA")
			if err != nil {
				reject.Invoke(fmt.Sprintf("Pairing Failed: %v", err))
				return
			}
			resolve.Invoke(code) // Returns "ABCD-1234" to JS
		}()

		return nil
	})

	// Return a Promise to JS
	promiseClass := js.Global().Get("Promise")
	return promiseClass.New(handler)
}

func main() {
	// 1. IMMEDIATE REGISTRATION
	// We do this first so the UI knows the engine is alive, even if it's still connecting to "DB"
	js.Global().Set("getWhatsAppPairingCode", js.FuncOf(GetPairingCode))
	fmt.Println("Ghost: Function 'getWhatsAppPairingCode' registered.")

	log = waLog.Stdout("Main", "INFO", true)
	
	// 2. BACKGROUND INITIALIZATION
	// Using a memdb which is safe for experimental Wasm
	fmt.Println("Ghost: Initializing internal store...")
	container, err := sqlstore.New(context.Background(), "sqlite3", "file:session.db?mode=memory&cache=shared", log)
	if err != nil {
		fmt.Printf("Ghost ERR: Failed to create store: %v\n", err)
		// We don't exit, we let the user try again or see the log
	} else {
		deviceStore, err := container.GetFirstDevice(context.Background())
		if err != nil {
			fmt.Printf("Ghost ERR: Failed to get device store: %v\n", err)
		} else {
			client = whatsmeow.NewClient(deviceStore, log)
			fmt.Println("Ghost: Engine core ready.")
		}
	}

	// Keep the Go program alive
	fmt.Println("Ghost Engine Alive (Looping)")
	select {}
}
