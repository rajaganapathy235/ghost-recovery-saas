package main

import (
	"context"
	"fmt"
	"syscall/js"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store"
	waLog "go.mau.fi/whatsmeow/util/log"
)

var client *whatsmeow.Client
var log waLog.Logger

// GetPairingCode is the function called from JS
func GetPairingCode(this js.Value, args []js.Value) interface{} {
	// Handler for async result
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

			// 1. Ensure we are connected
			if !client.IsConnected() {
				fmt.Println("Ghost: Engine not connected, attempting to reconnect...")
				err := client.Connect()
				if err != nil {
					reject.Invoke(fmt.Sprintf("Connection Failed: %v", err))
					return
				}
				// Wait a bit for connection to stabilize
				fmt.Println("Ghost: Waiting for connection...")
			}

			// 2. Request the 8-digit code from WhatsApp
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
	fmt.Println("Ghost: Initializing in-memory store (Wasm compatible)...")
	
	// Create a minimal in-memory device store
	deviceStore := store.NewDevice()
	
	client = whatsmeow.NewClient(deviceStore, log)
	fmt.Println("Ghost: Engine connecting...")
	err := client.Connect()
	if err != nil {
		fmt.Printf("Ghost ERR: Failed to start connection: %v\n", err)
	} else {
		fmt.Println("Ghost: Engine connection routine started.")
	}

	// Keep the Go program alive
	fmt.Println("Ghost Engine Alive (Looping)")
	select {}
}
