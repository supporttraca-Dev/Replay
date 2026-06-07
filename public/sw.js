const CACHE_NAME = 'traca-cache-v1';

const PRELOAD_ASSETS = [
    // Backgrounds
    '/assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/background/01_bg.png',
    '/assets/levels/level_01_casbah/scenes/02_rez_de_chaussee_nuit/background/02_bg.png',
    '/assets/levels/level_01_casbah/scenes/03_etage/background/03_bg.png',
    '/assets/levels/level_01_casbah/scenes/04_chambre/background/04_bg.png',
    '/assets/levels/level_01_casbah/scenes/05_sous_sol/background/05_bg.png',
    
    // Music & Ambience
    '/assets/levels/level_01_casbah/global/music/casbah_day_music_01.mp3',
    '/assets/levels/level_01_casbah/global/music/casbah_night_music_01.mp3',
    '/assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/elements/ambience/01_ambience_day.mp3',
    '/assets/levels/level_01_casbah/scenes/02_rez_de_chaussee_nuit/elements/ambience/02_ambience_night.mp3',
    
    // SFX & UI
    '/assets/levels/level_01_casbah/global/ui/click.mp3',
    '/assets/levels/level_01_casbah/global/ui/enter.mp3',
    '/assets/levels/level_01_casbah/global/ui/error.mp3',
    '/assets/levels/level_01_casbah/global/sfx/sfx_magical_focus.mp3',
    '/assets/levels/level_01_casbah/global/sfx/sfx_reveal_artifact.mp3',
    '/assets/levels/level_01_casbah/global/sfx/time_warp.mp3',
    
    // Narrations & Voices
    '/assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/elements/narration/01_narration.mp3',
    '/assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/elements/narration/01_narration_fawara.mp3',
    '/assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/elements/expression/01_zahra_replique_01.mp3',
    '/assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/elements/expression/01_zahra_replique_02.mp3',
    '/assets/levels/level_01_casbah/scenes/03_etage/elements/expression/03_aicha_replique_01.mp3',
    
    // Images & Objects
    '/assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/elements/artefact/journal intime.png',
    '/assets/levels/level_01_casbah/scenes/01_rez_de_chaussee_jour/elements/artefact/journal intime ouvert.png',
    '/assets/levels/level_01_casbah/scenes/04_chambre/elements/objects/04_key.png'
];

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'START_PRELOAD') {
        preloadAll(event.source);
    }
});

async function preloadAll(client) {
    const cache = await caches.open(CACHE_NAME);
    let loaded = 0;
    const total = PRELOAD_ASSETS.length;
    
    // Send initial 0 progress
    if (client) client.postMessage({ type: 'PRELOAD_PROGRESS', loaded, total });
    
    for (const url of PRELOAD_ASSETS) {
        try {
            const cachedResponse = await cache.match(url);
            if (!cachedResponse) {
                // Fetch and cache
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                }
            }
            loaded++;
            if (client) {
                client.postMessage({ type: 'PRELOAD_PROGRESS', loaded, total, url });
            }
        } catch (error) {
            console.error('[SW] Error preloading:', url, error);
        }
    }
    
    if (client) {
        client.postMessage({ type: 'PRELOAD_COMPLETE' });
    }
}

self.addEventListener('fetch', event => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;
    
    // Only cache our assets (images, audio, videos)
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then(response => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                });
            })
        );
    }
});
