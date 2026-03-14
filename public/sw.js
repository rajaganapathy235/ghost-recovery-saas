// Ghost Service Worker v2.0
// Transparent background worker for WhatsApp decentralized messaging

importScripts('/wasm_exec.js');

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const payload = event.data.json();
    // Keep the worker alive until the message is sent
    event.waitUntil(sendWhatsAppBackground(payload));
  } catch (err) {
    console.error('Failed to parse push payload', err);
  }
});

async function sendWhatsAppBackground(data) {
  const go = new Go();

  // 1. Load the Wasm binary
  const binaryResponse = await fetch('/whatsapp.wasm');
  const buffer = await binaryResponse.arrayBuffer();
  const result = await WebAssembly.instantiate(buffer, go.importObject);

  // 2. Run the Go instance
  go.run(result.instance);

  try {
    // 3. Dispatch the message using the exported Go function
    // We'll wrap this in a promise to handle the async Go call
    await Promise.race([
      self.sendWAMessage(data.phone, data.message),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Send Timeout')), 25000))
    ]);

    console.log('Ghost: Message sent successfully');
  } catch (err) {
    console.error('Ghost: Send failed', err);
    
    // Show notification to user on failure (if required)
    self.registration.showNotification('Ghost Recovery Alert', {
      body: `Failed to send reminder to ${data.phone}.`,
      icon: '/icon-192x192.png',
      tag: 'ghost-fail'
    });
  }
}
