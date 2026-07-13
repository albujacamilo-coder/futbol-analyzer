// Service Worker de FutbolStats Pro
// Estrategia: NETWORK-FIRST — siempre intenta traer la versión más nueva del
// servidor primero. Solo usa la copia guardada si no hay internet.
// Esto es a propósito, para evitar el problema de "veo datos viejos" que
// tuvimos con el caché del navegador — preferimos perder un poco de velocidad
// antes que mostrar información desactualizada.

const CACHE_NAME = 'futbolstats-pro-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Nunca interceptar llamadas a Supabase — esas siempre van directo a la red,
  // sin caché, para que los datos sean siempre en tiempo real.
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardamos una copia de respaldo por si se pierde la conexión,
        // pero SIEMPRE se prefiere la respuesta de red cuando está disponible.
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => {
        // Sin internet: como último recurso, usar la copia guardada
        return caches.match(event.request);
      })
  );
});
