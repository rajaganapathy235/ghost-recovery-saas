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
    console.log('Ghost Push Received:', payload);

    if (payload.type === 'WAKEUP') {
      event.waitUntil(processRemindersInBackground());
    } else {
      event.waitUntil(sendWhatsAppBackground(payload));
    }
  } catch (err) {
    console.error('Failed to parse push payload', err);
  }
});

async function processRemindersInBackground() {
  // Show a notification so the user knows the ghost is working
  self.registration.showNotification('Ghost Engine Active', {
    body: 'Syncing decentralized messages...',
    icon: '/icon-192x192.png',
    tag: 'ghost-sync',
    silent: true
  });

  const go = new Go();
  const binaryResponse = await fetch('/whatsapp.wasm');
  const buffer = await binaryResponse.arrayBuffer();
  const result = await WebAssembly.instantiate(buffer, go.importObject);
  go.run(result.instance);

  // Note: We need a way to call the server from the SW to get due reminders.
  // Since we can't easily import 'actions.ts' in a raw SW, we'll fetch from a custom endpoint
  // Or reuse the existing worker logic if we had an API.
  // For now, let's assume the payload itself might have the data in a future iteration.
  // Wait for the engine to stabilize
  await new Promise(r => setTimeout(r, 2000));
}

async function sendWhatsAppBackground(data) {
  const go = new Go();
  const binaryResponse = await fetch('/whatsapp.wasm');
  const buffer = await binaryResponse.arrayBuffer();
  const result = await WebAssembly.instantiate(buffer, go.importObject);
  go.run(result.instance);

  try {
    // Correct bridge name: sendGhostMessage
    await Promise.race([
      self.sendGhostMessage(data.phone, data.message || "Ghost background alert"),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Send Timeout')), 25000))
    ]);

    console.log('Ghost: Message sent successfully via Push');
  } catch (err) {
    console.error('Ghost: Push send failed', err);
  }
}
