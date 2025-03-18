// Service Worker for handling push notifications and offline functionality
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('bms-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/static/js/main.bundle.js',
        '/static/css/main.css',
        '/icons/success.png',
        '/icons/warning.png',
        '/icons/error.png',
        '/icons/info.png'
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('bms-') && cacheName !== 'bms-v1')
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      // Clone the request because it's a one-time-use stream
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response because it's a one-time-use stream
        const responseToCache = response.clone();

        caches.open('bms-v1').then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

let pushSubscription = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT') {
    initPushManager(event.data.token);
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.message,
    icon: `/icons/${data.type}.png`,
    badge: '/icons/badge.png',
    tag: data.id,
    data: data,
    actions: data.actions || [],
    requireInteraction: data.priority === 'high',
    silent: data.priority === 'low'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle custom actions
    const data = event.notification.data;
    handleNotificationAction(event.action, data);
  } else {
    // Default action: focus or open window
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

async function initPushManager(token) {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    pushSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(token)
    });

    // Send subscription to server
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pushSubscription)
    });
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
  }
}

function handleNotificationAction(action, data) {
  switch (action) {
    case 'view':
      clients.openWindow(data.url);
      break;
    case 'dismiss':
      // Mark as read on server
      fetch(`/api/notifications/${data.id}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      break;
    default:
      // Forward custom actions to the client
      clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action,
            data
          });
        });
      });
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}