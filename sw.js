const CACHE_NAME = 'glow-cosmetics-v6'; 
const APP_SHELL = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './manifest.json',
    './img/icons/apple-touch-icon.png',
    './img/icons/favicon-16x16.png',
    './img/icons/favicon-32x32.png',
    './img/icons/icon-72x72.png',
    './img/icons/icon-96x96.png',
    './img/icons/icon-144x144.png',
    './img/icons/icon-192x192.png',
    './img/icons/icon-512x512.png',
    './img/productos/base.jpg',
    './img/productos/iluminador.jpg',
    './img/productos/labial.jpg',
    './img/productos/mascara.jpg',
    './img/productos/rubor.jpg',
    './img/productos/sombra.jpg'
];

self.addEventListener('install', (e) => {
    console.log('[SW] Instalando...');
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cacheando archivos...');
                return cache.addAll(APP_SHELL);
            })
            .then(() => {
                console.log('[SW] Instalación completada');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('[SW] Error al cachear:', err);
            })
    );
});

self.addEventListener('activate', (e) => {
    console.log('[SW] Activando...');
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;

    const url = new URL(e.request.url);
    if (url.origin !== location.origin &&
        !url.hostname.includes('fonts.googleapis') &&
        !url.hostname.includes('fonts.gstatic') &&
        !url.hostname.includes('cdnjs.cloudflare')) {
        return;
    }

    e.respondWith(
        caches.match(e.request).then(cachedResponse => {
            if (cachedResponse) {
                fetch(e.request).then(networkResponse => {
                    if (networkResponse && networkResponse.ok) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(e.request, networkResponse.clone());
                        });
                    }
                }).catch(() => {});
                return cachedResponse;
            }

            return fetch(e.request).then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(e.request, responseClone);
                });
                return networkResponse;
            }).catch(() => {
                if (e.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return caches.match('./img/icons/icon-192x192.png');
            });
        })
    );
});

self.addEventListener('push', (e) => {
    console.log('[SW] Push recibido');
    let data = {
        title: 'GlowCosmetics',
        body: '¡Tenemos una oferta especial para ti!',
        icon: './img/icons/icon-192x192.png',
        badge: './img/icons/icon-72x72.png',
        url: './index.html'
    };

    if (e.data) {
        try {
            data = { ...data, ...e.data.json() };
        } catch (err) {
            data.body = e.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: [200, 100, 200],
        data: { url: data.url },
        actions: [
            { action: 'open', title: 'Ver ahora' },
            { action: 'close', title: 'Cerrar' }
        ]
    };

    e.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    if (e.action === 'close') return;

    const urlToOpen = e.notification.data.url || './index.html';

    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                for (const client of clientList) {
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});