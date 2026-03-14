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
	log = waLog.Stdout("Main", "INFO", true)
	
	// Initialize Client (Simplified for Wasm context)
	// In production, we'll use a custom store that talks to browser IndexedDB
	container, err := sqlstore.New(context.Background(), "sqlite3", "file:session.db?mode=memory", log)
	if err != nil {
		fmt.Printf("Failed to create store: %v\n", err)
		return
	}
	deviceStore, err := container.GetFirstDevice(context.Background())
	if err != nil {
		fmt.Printf("Failed to get device store: %v\n", err)
		return
	}
	
	client = whatsmeow.NewClient(deviceStore, log)

	// Export function to the Browser's Global Window
	js.Global().Set("getWhatsAppPairingCode", js.FuncOf(GetPairingCode))

	fmt.Println("Ghost WhatsApp Engine Loaded (Wasm)")

	// Keep the Go program alive
	select {}
}
