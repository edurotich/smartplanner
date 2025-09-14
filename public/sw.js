const CACHE_NAME = 'smartplanner-v1'
const urlsToCache = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/offline',
  '/manifest.json',
  // Add other static assets
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Don't cache API requests or interfere with dialog functionality
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('_next/data')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response
        }
        return fetch(event.request).catch(() => {
          // If network fails and it's a navigation request, show offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline')
          }
        })
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData())
  }
})

async function syncOfflineData() {
  // Get offline data from IndexedDB and sync with server
  try {
    const offlineData = await getOfflineData()
    for (const item of offlineData) {
      await syncItem(item)
    }
    await clearOfflineData()
  } catch (error) {
    console.error('Sync failed:', error)
  }
}

// Message handler for immediate sync
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_NOW') {
    syncOfflineData()
  }
})

// Placeholder functions - implement based on your offline storage strategy
async function getOfflineData() {
  // Implement IndexedDB retrieval
  return []
}

async function syncItem(item) {
  // Implement server sync
}

async function clearOfflineData() {
  // Implement IndexedDB cleanup
}
