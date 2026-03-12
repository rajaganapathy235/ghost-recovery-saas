/* Ghost Engine Service Worker */
/* Responsible for decentralized message sending via Wasm bridge */

self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Ghost Service Worker installed.');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  console.log('Ghost Service Worker activated.');
});

// Placeholder for the Go-Wasm bridge
let wasmInstance = null;

async function loadWasmEngine() {
  if (wasmInstance) return wasmInstance;
  
  console.log('Loading Ghost Wasm engine (whatsapp.wasm)...');
  try {
    // In a real scenario, we would fetch and instantiate the wasm here
    // const response = await fetch('/whatsapp.wasm');
    // const bits = await response.arrayBuffer();
    // wasmInstance = await WebAssembly.instantiate(bits, go.importObject);
    
    // For now, we simulate a successful load
    wasmInstance = {
      send: (phone, msg) => {
        console.log(`[Ghost engine] Sending WhatsApp to ${phone}: ${msg}`);
        return true;
      }
    };
    return wasmInstance;
  } catch (err) {
    console.error('Failed to load Wasm engine:', err);
    return null;
  }
}

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  console.log('Push event received:', data);

  const { phone, message, title } = data;

  event.waitUntil(
    (async () => {
      const engine = await loadWasmEngine();
      if (engine) {
        engine.send(phone, message);
      } else {
        console.error('Handled push but engine failed to load.');
      }

      // Show a local notification for visibility in this demo/sprint
      return self.registration.showNotification(title || 'Recovery System', {
        body: message || 'Executing recovery logic...',
        icon: '/icon.png', // Placeholder
        badge: '/badge.png', // Placeholder
      });
    })()
  );
});

async function sendWhatsAppMessage(phone, message) {
  const engine = await loadWasmEngine();
  if (engine) {
    return engine.send(phone, message);
  }
  return false;
}
