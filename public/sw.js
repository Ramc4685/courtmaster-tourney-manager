// CourtMaster Tournament Manager Service Worker
// Provides offline-first capabilities for tournament venues

const CACHE_NAME = 'courtmaster-static-v1';
const DATA_CACHE = 'courtmaster-data-v1';
const ASSET_CACHE = 'courtmaster-assets-v1';

// App shell files to cache - updated for Vite build outputs
const APP_SHELL = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  '/favicon.ico'
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  '/v1/databases/',
  '/api/tournaments',
  '/api/teams',
  '/api/matches',
  '/api/registrations'
];

// Files that should always be fetched from network
const NETWORK_FIRST_PATTERNS = [
  '/api/realtime',
  '/api/sync',
  '/api/live'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (![CACHE_NAME, DATA_CACHE, ASSET_CACHE].includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip unsupported schemes (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin && !url.origin.includes('appwrite')) {
    return;
  }

  // Handle different types of requests
  if (request.method === 'GET') {
    // API requests
    if (isApiRequest(request.url)) {
      event.respondWith(handleApiRequest(request));
    }
    // App shell and static assets
    else if (isAppShellRequest(request.url)) {
      event.respondWith(handleAppShellRequest(request));
    }
    // Other GET requests
    else {
      event.respondWith(handleGenericRequest(request));
    }
  }
  // POST, PUT, DELETE requests (offline queue)
  else {
    event.respondWith(handleMutationRequest(request));
  }
});

// Handle API requests with cache-first strategy for data, network-first for realtime
async function handleApiRequest(request) {
  // Stale-while-revalidate for API data
  return handleStaleWhileRevalidate(request, DATA_CACHE);
}

// Handle app shell requests with cache-first strategy
async function handleAppShellRequest(request) {
  // App shell is pre-cached, so this should be fast
  return caches.match(request).then(response => response || fetch(request));
}

// Handle generic requests
async function handleGenericRequest(request) {
  // Cache first for other assets like fonts, etc.
  return handleCacheFirst(request, ASSET_CACHE);
}

// Handle mutation requests (POST, PUT, DELETE) with offline queue
async function handleMutationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);

    if (response.ok) {
      return response;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.log('[SW] Network request failed, queuing for offline sync:', error);

    // Queue the request for later sync
    await queueOfflineRequest(request);

    // Return a response indicating the request was queued
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Request has been queued for background sync.',
        status: 'queued',
        timestamp: Date.now()
      }),
      {
        status: 202,
        statusText: 'Accepted',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache-first strategy
async function handleStaleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

async function handleCacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Return cached response and update cache in background
      updateCacheInBackground(request, cache);
      return cachedResponse;
    }

    // No cache, fetch from network
    const response = await fetch(request);

    if (response.ok) {
      // Cache the response
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Cache-first request failed:', error);

    // Try to return a cached response if available
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || createOfflineResponse();
    }

    throw error;
  }
}

// Network-first strategy
async function handleNetworkFirst(request, cacheName) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      // Cache the response
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Network-first request failed, trying cache:', error);

    // Try cache as fallback
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || createOfflineResponse();
    }

    throw error;
  }
}

// Update cache in background
async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
  } catch (error) {
    console.log('[SW] Background cache update failed:', error);
  }
}

// Queue offline requests
async function queueOfflineRequest(request) {
  try {
    const url = new URL(request.url);
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.text() : null,
      timestamp: Date.now(),
      id: generateId()
    };

    // Parse Appwrite URL to extract collection and documentId
    let collection = 'unknown';
    let documentId = null;

    // Match Appwrite patterns: /v1/databases/{databaseId}/collections/{collectionId}/documents/{documentId?}
    const appwriteMatch = url.pathname.match(/\/v1\/databases\/[^\/]+\/collections\/([^\/]+)\/documents(?:\/([^\/]+))?/);
    if (appwriteMatch) {
      collection = appwriteMatch[1];
      documentId = appwriteMatch[2] || null;
    } else {
      // Try to extract from API patterns: /api/{collection}/{id?}
      const apiMatch = url.pathname.match(/\/api\/([^\/]+)(?:\/([^\/]+))?/);
      if (apiMatch) {
        collection = apiMatch[1];
        documentId = apiMatch[2] || null;
      }
    }

    // For POST requests, try to get documentId from body
    if (request.method === 'POST' && requestData.body) {
      try {
        const bodyData = JSON.parse(requestData.body);
        if (bodyData.id || bodyData.$id) {
          documentId = bodyData.id || bodyData.$id;
        }
      } catch (e) {
        // Failed to parse body, keep existing documentId
      }
    }

    // Add parsed collection and documentId to request data
    requestData.collection = collection;
    requestData.documentId = documentId;

    // Store in IndexedDB or postMessage to main thread
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'QUEUE_OFFLINE_REQUEST',
        data: requestData
      });
    });

  } catch (error) {
    console.error('[SW] Failed to queue offline request:', error);
  }
}

// Helper functions
function isApiRequest(url) {
  return url.includes('/api/') || url.includes('/v1/databases/');
}

function isAppShellRequest(url) {
  return APP_SHELL.some(shell => url.endsWith(shell) || url.includes(shell));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function createOfflineResponse() {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CourtMaster - Offline</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .container {
          max-width: 400px;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        p {
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        .status {
          background: rgba(255,255,255,0.1);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        button {
          background: white;
          color: #667eea;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          font-weight: 600;
        }
        button:hover {
          background: #f0f0f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏆 CourtMaster</h1>
        <div class="status">
          <p>You're currently offline, but don't worry!</p>
          <p>Your tournament data is safely stored locally and will sync when you're back online.</p>
        </div>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
      <script>
        // Auto-reload when back online
        window.addEventListener('online', () => {
          setTimeout(() => window.location.reload(), 1000);
        });
      </script>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Background sync for queued requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'courtmaster-sync') {
    event.waitUntil(processOfflineQueue());
  }
});

async function processOfflineQueue() {
  try {
    // Notify main thread to process offline queue
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PROCESS_OFFLINE_QUEUE'
      });
    });
  } catch (error) {
    console.error('[SW] Failed to process offline queue:', error);
  }
}

// Push notifications for tournament updates
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const options = {
    body: 'Tournament update available',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'View Update'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.message || options.body;
      options.data = { ...options.data, ...payload.data };
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification('CourtMaster Tournament', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service worker loaded');