// Service Worker for Sanctum - Blazing Fast Performance
const CACHE_NAME = 'sanctum-v1';
const STATIC_CACHE = 'sanctum-static-v1';
const IMAGE_CACHE = 'sanctum-images-v1';

// Assets to cache immediately
    const STATIC_ASSETS = [
      './',
      './index.html',
      './Items/',
      './assets/',
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&display=swap',
  'https://play.pokemonshowdown.com/sprites/gen5/',
  'https://play.pokemonshowdown.com/sprites/gen5-shiny/',
  'https://play.pokemonshowdown.com/sprites/gen5ani/',
  'https://play.pokemonshowdown.com/sprites/gen5ani-shiny/',
  'https://play.pokemonshowdown.com/sprites/ani/',
  'https://play.pokemonshowdown.com/sprites/ani-shiny/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS.filter(p => !p.endsWith('/')))),
      caches.open(IMAGE_CACHE).then(cache => cache.addAll([])),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== IMAGE_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - aggressive caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

        // Cache-first for static assets
      if (request.method === 'GET' && (
        url.pathname.includes('/assets/') ||
        url.pathname.includes('/Items/') ||
        url.pathname.includes('pokemonshowdown.com/sprites/') ||
        url.pathname.includes('fonts.googleapis.com')
      )) {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response;
        }
        return fetch(request).then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            const cacheName = url.pathname.includes('/Items/') ? IMAGE_CACHE : STATIC_CACHE;
            caches.open(cacheName).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for API calls
  if (url.pathname.includes('/rest/v1/') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request).then(response => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // Stale-while-revalidate for HTML pages
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any pending operations when connection is restored
  console.log('Background sync triggered');
}

// Push notifications (if needed)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: './Items/poke-ball.png',
    badge: './Items/poke-ball.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Sanctum', options)
  );
});

// Message handling for performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_ITEMS') {
    event.waitUntil(
      caches.open(IMAGE_CACHE).then(cache => {
        return Promise.all(
          event.data.items.map(item => {
            return cache.add(item).catch(() => {
              // Ignore failed cache attempts
            });
          })
        );
      })
    );
  }
});
