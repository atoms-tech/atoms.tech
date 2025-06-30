// Home Page Service Worker for Offline Caching
const CACHE_NAME = 'atoms-home-v1';
const STATIC_CACHE_NAME = 'atoms-static-v1';
const API_CACHE_NAME = 'atoms-api-v1';

// Resources to cache immediately
const STATIC_RESOURCES = [
    '/',
    '/home',
    '/manifest.json',
    '/favicon.ico',
    // Add critical CSS and JS files
    '/_next/static/css/',
    '/_next/static/js/',
    // Add common images
    '/placeholder-avatar.png',
    '/logo.png'
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/api/activity/paginated',
    '/api/projects',
    '/api/organizations'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static resources
            caches.open(STATIC_CACHE_NAME).then((cache) => {
                return cache.addAll(STATIC_RESOURCES.filter(url => !url.includes('_next')));
            }),
            // Skip waiting to activate immediately
            self.skipWaiting()
        ])
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activated');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== API_CACHE_NAME) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all clients
            self.clients.claim()
        ])
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) return;

    // Handle different types of requests
    if (url.pathname.startsWith('/api/')) {
        // API requests - Network First with Cache Fallback
        event.respondWith(handleApiRequest(request));
    } else if (url.pathname.startsWith('/_next/static/')) {
        // Static assets - Cache First
        event.respondWith(handleStaticAssets(request));
    } else if (url.pathname === '/home' || url.pathname === '/') {
        // Home page - Stale While Revalidate
        event.respondWith(handleHomePage(request));
    } else {
        // Other requests - Network First
        event.respondWith(handleOtherRequests(request));
    }
});

// API Request Handler - Network First with Cache Fallback
async function handleApiRequest(request) {
    const cache = await caches.open(API_CACHE_NAME);
    
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('📡 Network failed, trying cache for:', request.url);
        
        // Fallback to cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page or error response
        return new Response(
            JSON.stringify({ 
                error: 'Offline', 
                message: 'No network connection and no cached data available' 
            }),
            { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Static Assets Handler - Cache First
async function handleStaticAssets(request) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Fallback to network
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('📦 Failed to load static asset:', request.url);
        return new Response('Asset not available offline', { status: 404 });
    }
}

// Home Page Handler - Stale While Revalidate
async function handleHomePage(request) {
    const cache = await caches.open(CACHE_NAME);
    
    // Get cached version immediately
    const cachedResponse = await cache.match(request);
    
    // Start network request in background
    const networkResponsePromise = fetch(request).then((response) => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => null);
    
    // Return cached version if available, otherwise wait for network
    if (cachedResponse) {
        // Update cache in background
        networkResponsePromise;
        return cachedResponse;
    }
    
    // No cache, wait for network
    const networkResponse = await networkResponsePromise;
    return networkResponse || new Response('Page not available offline', { status: 503 });
}

// Other Requests Handler - Network First
async function handleOtherRequests(request) {
    try {
        return await fetch(request);
    } catch (error) {
        // Could implement additional fallback logic here
        return new Response('Request failed', { status: 503 });
    }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync-home-data') {
        event.waitUntil(syncHomeData());
    }
});

// Sync home data when back online
async function syncHomeData() {
    try {
        console.log('🔄 Syncing home data...');
        
        // Refresh critical home page data
        const endpoints = [
            '/api/activity/paginated',
            '/api/projects'
        ];
        
        const cache = await caches.open(API_CACHE_NAME);
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    await cache.put(endpoint, response.clone());
                }
            } catch (error) {
                console.log('Failed to sync:', endpoint);
            }
        }
        
        console.log('✅ Home data sync complete');
    } catch (error) {
        console.error('❌ Home data sync failed:', error);
    }
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        
        event.waitUntil(
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                tag: 'atoms-notification'
            })
        );
    }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/home')
    );
});
