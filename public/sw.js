/*
 * Keeps Batch OS usable on a phone with no signal.
 *
 * The whole app is static files and the data lives on the device, so caching
 * the shell is enough to open and work offline. Navigations are served from
 * the network when it is there and from the cache when it isn't; built assets
 * carry content hashes in their names, so those can be served from the cache
 * straight away and never go stale.
 *
 * Supabase and Google are never cached — sync must always see the truth.
 */

const VERSION = "batch-os-v2";
const SHELL = "/batch/app/";

/*
 * Caching the page alone leaves it unstyled and dead offline: its styles and
 * scripts were fetched before this worker existed, so they were never seen
 * here. Read them out of the shell's own markup instead — the names carry
 * build hashes, so this stays correct across deploys with nothing to maintain.
 */
async function precache() {
  const cache = await caches.open(VERSION);
  const response = await fetch(SHELL, { cache: "reload" });
  await cache.put(SHELL, response.clone());

  const html = await response.text();
  const wanted = new Set();
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (url.startsWith("/batch/_next/") || url.startsWith("/batch/assets/")) {
      wanted.add(url);
    }
  }
  /* One missing file must not throw away the whole cache, so they go in
     one at a time rather than through addAll. */
  await Promise.all(
    [...wanted].map((url) =>
      fetch(url)
        .then((r) => (r.ok ? cache.put(url, r) : null))
        .catch(() => null)
    )
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /* A page load: try the network so a deploy is picked up, fall back to the
     cached shell when there is nothing to reach. */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(SHELL, copy));
          return response;
        })
        .catch(() => caches.match(SHELL).then((hit) => hit ?? Response.error()))
    );
    return;
  }

  /* Everything else — scripts, styles, images — is immutable per build. */
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ??
        fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
