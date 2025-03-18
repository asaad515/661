/// <reference lib="webworker" />

const CACHE_NAME = 'bms-cache-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
];

declare const self: ServiceWorkerGlobalScope;

// Install event - cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(STATIC_ASSETS);
      await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
    })()
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // First, try to use the navigation preload response if it's supported
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          // Catch is only triggered if an exception is thrown, which means the 
          // network is down. Try to return the cached page:
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // If we can't serve from cache, serve the offline page
          return await cache.match(OFFLINE_URL);
        }
      })()
    );
  } else if (event.request.method === 'GET') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        // Try to get the response from the cache first
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          // Also try to fetch and update cache in background
          event.waitUntil(
            fetch(event.request).then((response) => {
              cache.put(event.request, response.clone());
              return response;
            })
          );
          return cachedResponse;
        }

        // If not in cache, fetch from network
        try {
          const response = await fetch(event.request);
          cache.put(event.request, response.clone());
          return response;
        } catch {
          // If offline and not in cache, return error response
          return new Response('Network error happened', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      })()
    );
  }
});

// Push notification event
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  const data = event.data.json();
  const options: NotificationOptions = {
    body: data.message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      ...data.metadata
    }
  };

  if (data.actions) {
    options.actions = data.actions;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const notificationData = event.notification.data;
  const urlToOpen = notificationData?.url || '/';

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      // If a window client is already open, focus it
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // If no window client is open, open a new one
      return self.clients.openWindow(urlToOpen);
    })()
  );
});

// Background sync event
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingRequests() {
  try {
    const dbName = 'offlineDB';
    const storeName = 'pendingRequests';
    const db = await openDB(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      }
    });

    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const requests = await store.getAll();

    for (const request of requests) {
      try {
        await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body
        });
        await store.delete(request.id);
      } catch (error) {
        console.error('Failed to sync request:', error);
      }
    }

    await tx.done;
    await db.close();
  } catch (error) {
    console.error('Error during sync:', error);
  }
}

// Helper function to open IndexedDB
function openDB(name: string, version: number, upgradeCallback?: any) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    if (upgradeCallback) {
      request.onupgradeneeded = (event) => {
        upgradeCallback(request.result, event.oldVersion, event.newVersion);
      };
    }
  });
}

export {};