const CACHE_NAME = "mobywatel-v4";
const PROFILE_CACHE = "profile-images-v2";
const RUNTIME_CACHE = "runtime-v2";
const INSTALL_ID_KEY = "pwa_install_id";
const API_BASE = self.location.origin;

const CACHE_MAX_AGE = 10 * 24 * 60 * 60 * 1000;
const NETWORK_TIMEOUT = 3000;

const STATIC_ASSETS = [
    "/",
    "/index.html",
    "/login.html",
    "/documents.html",
    "/dowod.html",
    "/diia.html",
    "/legszk.html",
    "/legstu.html",
    "/prawojazdy.html",
    "/qr.html",
    "/services.html",
    "/profiledata.html",
    "/more.html",
    "/offline.html",
    "/css/main.css",
    "/css/common.css",
    "/css/theme.css",
    "/css/overlay-camera.css",
    "/css/pages/login.css",
    "/css/pages/documents.css",
    "/css/pages/dowod.css",
    "/css/pages/diia.css",
    "/css/pages/legszk.css",
    "/css/pages/legstu.css",
    "/css/pages/prawojazdy.css",
    "/css/pages/qr.css",
    "/css/pages/services.css",
    "/css/pages/more.css",
    "/css/pages/profiledata.css",
    "/js/theme.js",
    "/js/sw-reload.js",
    "/js/logger.js",
    "/js/header.js",
    "/js/navigation.js",
    "/js/pages/login.js",
    "/js/pages/documents.js",
    "/js/pages/dowod.js",
    "/js/pages/diia.js",
    "/js/pages/legszk.js",
    "/js/pages/legstu.js",
    "/js/pages/prawojazdy.js",
    "/js/pages/activate.js",
    "/js/pages/qr.js",
    "/js/pages/services.js",
    "/js/pages/more.js",
    "/js/pages/profiledata.js",
    "/js/qrcode.min.js",
    "/manifest.json",
    "/icon.png",
];

const PRIORITY_IMAGES = [
    "/assets/dowod/mid_background_main.webp",
    "/assets/icons/coi_common_ui_mobywatel_background.webp",
    "/assets/icons/coi_common_ui_mobywatel_background_dark.webp",
    "/assets/icons/mdowod_bg_big.webp",
    "/assets/icons/diia_bg_big.webp",
    "/assets/icons/leg_szkolna_bg_big.webp",
    "/assets/icons/leg_studencka_bg_big.webp",
    "/assets/icons/prawo_jazdy_bg_big.webp",
    "/assets/dowod/glowing.png",
    "/assets/dowod/flaga_bez.gif",
    "/assets/orzel/godlo back.png",
    "/assets/orzel/godlo top.png",
];

/**
 * Get or create install ID
 */
async function getInstallId() {
    try {
        // Try to get from Cache API storage
        const cache = await caches.open("pwa-metadata");
        const response = await cache.match(INSTALL_ID_KEY);

        if (response) {
            const data = await response.json();
            return data.installId;
        }

        // Generate new UUID
        const installId = crypto.randomUUID();

        // Store it
        await cache.put(
            INSTALL_ID_KEY,
            new Response(JSON.stringify({ installId }), {
                headers: { "Content-Type": "application/json" },
            })
        );

        return installId;
    } catch (err) {
        console.error("Failed to get/create install ID:", err);
        return null;
    }
}

/**
 * Install event - cache static assets
 */
self.addEventListener("install", (event) => {
    console.log("[SW] Installing Service Worker...");

    event.waitUntil(
        (async () => {
            try {
                console.log("[SW] Creating install ID...");
                // Ensure install ID exists
                await getInstallId();

                // AGGRESSIVE CACHE CLEARING - Delete ALL old caches
                console.log("[SW] Clearing old caches...");
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME && cacheName !== PROFILE_CACHE && cacheName !== RUNTIME_CACHE && cacheName !== "pwa-metadata") {
                            console.log(`[SW] Deleting old cache: ${cacheName}`);
                            return caches.delete(cacheName);
                        }
                    })
                );

                console.log("[SW] Opening cache:", CACHE_NAME);
                // Cache static assets
                const cache = await caches.open(CACHE_NAME);

                // Cache files individually to see which ones fail
                console.log("[SW] Caching priority images...");
                for (const url of PRIORITY_IMAGES) {
                    try {
                        await cache.add(url);
                        console.log("[SW] ✅", url);
                    } catch (err) {
                        console.error("[SW] ❌", url, "-", err.message);
                    }
                }

                console.log("[SW] Caching static assets...");
                for (const url of STATIC_ASSETS) {
                    try {
                        await cache.add(url);
                        console.log("[SW] ✅", url);
                    } catch (err) {
                        console.error("[SW] ❌", url, "-", err.message);
                    }
                }

                // Verify cache was populated
                const keys = await cache.keys();
                console.log("[SW] ✅ Cache populated with", keys.length, "files");

                // Skip waiting to activate immediately
                console.log("[SW] Activating immediately...");
                await self.skipWaiting();
                console.log("[SW] ✅ Installation complete!");
            } catch (err) {
                console.error("[SW] ❌ Installation failed:", err);
                throw err;
            }
        })()
    );
});

/**
 * Activate event - cleanup old caches
 */
self.addEventListener("activate", (event) => {
    console.log("[SW] Activating...");

    event.waitUntil(
        (async () => {
            // Delete old caches (but keep profile images cache and runtime cache)
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter(
                        (name) =>
                            name !== CACHE_NAME &&
                            name !== "pwa-metadata" &&
                            name !== PROFILE_CACHE &&
                            name !== RUNTIME_CACHE
                    )
                    .map((name) => {
                        console.log("[SW] Deleting old cache:", name);
                        return caches.delete(name);
                    })
            );

            // Take control of all pages immediately
            await self.clients.claim();

            // Force reload all clients to get fresh content
            const clients = await self.clients.matchAll({ type: 'window' });
            clients.forEach((client) => {
                console.log("[SW] Force reloading client:", client.url);
                client.postMessage({
                    type: "SW_FORCE_RELOAD",
                    version: CACHE_NAME,
                });
            });
        })()
    );
});

/**
 * Cache-First strategy - returns cached version immediately
 * Updates only when CACHE_NAME changes (manual versioning)
 */
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        // Return cached version immediately
        return cachedResponse;
    }

    // Not in cache, fetch from network and cache
    try {
        const response = await fetch(request);
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        return new Response("Offline", { status: 503 });
    }
}

/**
 * Fetch event - intercept requests
 */
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle same-origin or API requests
    if (url.origin !== self.location.origin && !url.href.startsWith(API_BASE)) {
        return;
    }

    event.respondWith(
        (async () => {
            // For API requests, inject X-PWA-Install-ID header
            if (url.href.startsWith(API_BASE)) {
                const installId = await getInstallId();

                if (installId) {
                    // Clone request and add header
                    const headers = new Headers(request.headers);
                    headers.set("X-PWA-Install-ID", installId);

                    const modifiedRequest = new Request(request, { headers });

                    // Network-first strategy for API (always fresh data)
                    try {
                        const response = await fetch(modifiedRequest);
                        return response;
                    } catch (err) {
                        console.error("[SW] API request failed:", err);
                        return new Response(JSON.stringify({ error: "Network error" }), {
                            status: 503,
                            headers: { "Content-Type": "application/json" },
                        });
                    }
                }
            }

            // For profile images - НЕ перехватываем blob: URLs, они должны работать напрямую
            // Также не перехватываем data: URLs
            if (
                url.pathname === "/profile-image" &&
                !request.url.startsWith("blob:") &&
                !request.url.startsWith("data:")
            ) {
                const profileCache = await caches.open(PROFILE_CACHE);
                const profileCached = await profileCache.match("profile-image");
                if (profileCached) {
                    return profileCached;
                }
            }

            // Пропускаем blob: и data: URLs - они должны работать напрямую без перехвата
            if (request.url.startsWith("blob:") || request.url.startsWith("data:")) {
                return fetch(request);
            }

            // For HTML pages, CSS, JS, images, fonts - use cache-first
            // Updates happen only when CACHE_NAME changes
            if (
                url.pathname.endsWith(".html") ||
                url.pathname.endsWith(".css") ||
                url.pathname.endsWith(".js") ||
                url.pathname.endsWith(".png") ||
                url.pathname.endsWith(".jpg") ||
                url.pathname.endsWith(".jpeg") ||
                url.pathname.endsWith(".webp") ||
                url.pathname.endsWith(".svg") ||
                url.pathname.endsWith(".gif") ||
                url.pathname.endsWith(".woff") ||
                url.pathname.endsWith(".woff2") ||
                url.pathname.includes("/fonts/") ||
                url.pathname.includes("/assets/") ||
                url.pathname === "/"
            ) {
                return cacheFirst(request);
            }

            // Default: try cache first, then network
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }

            // Fallback to network
            try {
                const networkResponse = await fetch(request);

                // Cache successful responses
                if (networkResponse.ok && request.method === "GET") {
                    const cache = await caches.open(RUNTIME_CACHE);
                    cache.put(request, networkResponse.clone());
                }

                return networkResponse;
            } catch (err) {
                console.error("[SW] Fetch failed:", err);

                // For navigation requests, return the offline page
                if (request.mode === "navigate") {
                    const offlinePage = await caches.match("/offline.html");
                    if (offlinePage) {
                        return offlinePage;
                    }
                }

                // Return offline page if available (generic)
                const offlinePageFallback = await caches.match("/offline.html");
                if (offlinePageFallback) {
                    return offlinePageFallback;
                }

                return new Response("Offline", { status: 503 });
            }
        })()
    );
});

/**
 * Check for updates manually
 */
async function checkForUpdates() {
    try {
        const registration = await self.registration.update();
        console.log("[SW] Update check completed");
        return registration;
    } catch (err) {
        console.error("[SW] Update check failed:", err);
        return null;
    }
}

/**
 * Message handler - communication with pages
 */
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "GET_INSTALL_ID") {
        getInstallId().then((installId) => {
            event.ports[0].postMessage({ installId });
        });
    }

    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }

    if (event.data && event.data.type === "CHECK_UPDATE") {
        checkForUpdates();
    }

    if (event.data && event.data.type === "CLEAR_CACHE") {
        // Clear runtime cache on demand
        caches.delete(RUNTIME_CACHE).then(() => {
            console.log("[SW] Runtime cache cleared");
            event.ports[0]?.postMessage({ success: true });
        });
    }
});
