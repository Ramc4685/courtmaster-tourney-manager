// Enhanced Service Worker for CourtMaster Tournament Manager
// Builds upon the existing sw.js with advanced PWA capabilities

const CACHE_NAME = 'courtmaster-v1.0.0';
const RUNTIME_CACHE = 'courtmaster-runtime';
const DATA_CACHE = 'courtmaster-data';
const OFFLINE_CACHE = 'courtmaster-offline';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png'
];

// API endpoints and their cache strategies
const API_CACHE_CONFIG = {
  '/api/tournaments': { strategy: CACHE_STRATEGIES.NETWORK_FIRST, ttl: 300000 }, // 5 minutes
  '/api/matches': { strategy: CACHE_STRATEGIES.NETWORK_FIRST, ttl: 60000 }, // 1 minute
  '/api/teams': { strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, ttl: 600000 }, // 10 minutes
  '/api/auth': { strategy: CACHE_STRATEGIES.NETWORK_ONLY, ttl: 0 },
  '/api/health': { strategy: CACHE_STRATEGIES.NETWORK_ONLY, ttl: 0 }
};

// Background sync tags
const SYNC_TAGS = {
  TOURNAMENT_SYNC: 'tournament-sync',
  MATCH_SYNC: 'match-sync',
  SCORE_SYNC: 'score-sync',
  OFFLINE_ACTIONS: 'offline-actions'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Enhanced Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(OFFLINE_CACHE).then((cache) => {
        return cache.add('/offline.html');
      })
    ]).then(() => {
      console.log('Enhanced Service Worker installed');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Enhanced Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== DATA_CACHE && 
                cacheName !== OFFLINE_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('Enhanced Service Worker activated');
    })
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Skip unsupported schemes (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip cross-origin requests that aren't from our domain
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleNavigationRequest(request));
  }
});

// Handle API requests with different cache strategies
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Find matching cache configuration
  const cacheConfig = Object.entries(API_CACHE_CONFIG).find(([pattern]) => 
    pathname.startsWith(pattern)
  );
  
  const strategy = cacheConfig ? cacheConfig[1].strategy : CACHE_STRATEGIES.NETWORK_FIRST;
  const ttl = cacheConfig ? cacheConfig[1].ttl : 300000;

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, DATA_CACHE, ttl);
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, DATA_CACHE, ttl);
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, DATA_CACHE, ttl);
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return networkOnly(request);
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cacheOnly(request, DATA_CACHE);
    default:
      return networkFirst(request, DATA_CACHE, ttl);
  }
}

// Handle static assets
async function handleStaticAsset(request) {
  return cacheFirst(request, CACHE_NAME);
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    
    // Cache successful responses (only for same-origin requests)
    if (networkResponse.ok && isSameOrigin(request.url)) {
      const cache = await caches.open(RUNTIME_CACHE);
      try {
        cache.put(request, networkResponse.clone());
      } catch (cacheError) {
        console.warn('Failed to cache navigation response:', cacheError);
      }
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache, then offline page
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineCache = await caches.open(OFFLINE_CACHE);
      return offlineCache.match('/offline.html');
    }
    
    throw error;
  }
}

// Cache strategies implementation
async function cacheFirst(request, cacheName, ttl = 0) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, ttl)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && isSameOrigin(request.url)) {
      const responseToCache = addTimestamp(networkResponse.clone());
      try {
        cache.put(request, responseToCache);
      } catch (cacheError) {
        console.warn('Failed to cache response:', cacheError);
      }
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function networkFirst(request, cacheName, ttl = 0) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && isSameOrigin(request.url)) {
      const cache = await caches.open(cacheName);
      const responseToCache = addTimestamp(networkResponse.clone());
      try {
        cache.put(request, responseToCache);
      } catch (cacheError) {
        console.warn('Failed to cache response:', cacheError);
      }
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, ttl)) {
      return cachedResponse;
    }
    
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName, ttl = 0) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to update in the background
  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok && isSameOrigin(request.url)) {
      const responseToCache = addTimestamp(networkResponse.clone());
      try {
        cache.put(request, responseToCache);
      } catch (cacheError) {
        console.warn('Failed to cache response:', cacheError);
      }
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, but we might have cache
  });
  
  // Return cached response immediately if available and not expired
  if (cachedResponse && !isExpired(cachedResponse, ttl)) {
    return cachedResponse;
  }
  
  // Wait for network if no cache or expired
  return networkPromise;
}

async function networkOnly(request) {
  return fetch(request);
}

async function cacheOnly(request, cacheName) {
  const cache = await caches.open(cacheName);
  return cache.match(request);
}

// Utility functions
function addTimestamp(response) {
  // Create a new response with modified headers since headers are immutable
  const headers = new Headers(response.headers);
  headers.set('sw-cache-timestamp', Date.now().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

function isSameOrigin(url) {
  try {
    const requestUrl = new URL(url);
    return requestUrl.origin === location.origin;
  } catch {
    return false;
  }
}

function isExpired(response, ttl) {
  if (ttl === 0) return false;
  
  const timestamp = response.headers.get('sw-cache-timestamp');
  if (!timestamp) return true;
  
  return Date.now() - parseInt(timestamp) > ttl;
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.TOURNAMENT_SYNC:
      event.waitUntil(syncTournaments());
      break;
    case SYNC_TAGS.MATCH_SYNC:
      event.waitUntil(syncMatches());
      break;
    case SYNC_TAGS.SCORE_SYNC:
      event.waitUntil(syncScores());
      break;
    case SYNC_TAGS.OFFLINE_ACTIONS:
      event.waitUntil(syncOfflineActions());
      break;
    default:
      console.log('Unknown sync tag:', event.tag);
  }
});

// Background sync implementations
async function syncTournaments() {
  try {
    console.log('Syncing tournaments...');
    
    // Get offline tournament data
    const offlineData = await getOfflineData('tournaments');
    
    for (const tournament of offlineData) {
      try {
        await fetch('/api/tournaments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tournament)
        });
        
        // Remove from offline storage on success
        await removeOfflineData('tournaments', tournament.id);
      } catch (error) {
        console.error('Failed to sync tournament:', tournament.id, error);
      }
    }
  } catch (error) {
    console.error('Tournament sync failed:', error);
    throw error;
  }
}

async function syncMatches() {
  try {
    console.log('Syncing matches...');
    
    const offlineData = await getOfflineData('matches');
    
    for (const match of offlineData) {
      try {
        await fetch(`/api/matches/${match.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(match)
        });
        
        await removeOfflineData('matches', match.id);
      } catch (error) {
        console.error('Failed to sync match:', match.id, error);
      }
    }
  } catch (error) {
    console.error('Match sync failed:', error);
    throw error;
  }
}

async function syncScores() {
  try {
    console.log('Syncing scores...');
    
    const offlineData = await getOfflineData('scores');
    
    for (const score of offlineData) {
      try {
        await fetch(`/api/matches/${score.matchId}/score`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(score)
        });
        
        await removeOfflineData('scores', score.id);
      } catch (error) {
        console.error('Failed to sync score:', score.id, error);
      }
    }
  } catch (error) {
    console.error('Score sync failed:', error);
    throw error;
  }
}

async function syncOfflineActions() {
  try {
    console.log('Syncing offline actions...');
    
    const offlineActions = await getOfflineData('actions');
    
    for (const action of offlineActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        await removeOfflineData('actions', action.id);
      } catch (error) {
        console.error('Failed to sync action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('Offline actions sync failed:', error);
    throw error;
  }
}

// IndexedDB helpers for offline data
async function getOfflineData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CourtMasterOffline', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
  });
}

async function removeOfflineData(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CourtMasterOffline', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: 'You have new tournament updates!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.body || options.body;
      options.data = payload.data || options.data;
    } catch (error) {
      console.error('Failed to parse push payload:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('CourtMaster', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('Enhanced Service Worker loaded');
