// Kaban service worker
// ─────────────────────────────────────────────────────────────────────────
// Two jobs:
//   1. App-shell caching (network-first, offline fallback)
//   2. Privacy & Data-Saving Shield — drops known third-party tracking /
//      telemetry / ad-network requests BEFORE they leave the device, so
//      students on capped mobile plans don't pay for bytes the app never
//      needed. Scoped entirely to requests made by this PWA. Nothing outside
//      the app is touched.
//
// Bump CACHE when you ship a new build to force a clean refresh.
const CACHE = 'kaban-v39';

// ── Privacy & Data-Saving Shield ───────────────────────────────────────────
// A small, curated list of the heaviest, most common third-party tracking,
// analytics, and ad-serving hosts on mobile. Deliberately NOT a 10MB EasyList
// clone — just the top offenders, matched by hostname suffix.
//
// IMPORTANT: this list contains only telemetry / ad / tracking hosts. It must
// never contain a functional CDN. See ALLOWLIST below.
const BLOCKED_HOSTS = [
  // Google ad / tracking (NOT googleapis/gstatic/fonts — those are allowed)
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'google-analytics.com',
  'analytics.google.com',
  'googletagmanager.com',
  'googletagservices.com',
  'adservice.google.com',
  // Programmatic ad exchanges
  'appnexus.com',
  'adnxs.com',
  'pubmatic.com',
  'rubiconproject.com',
  'openx.net',
  'criteo.com',
  'criteo.net',
  'taboola.com',
  'outbrain.com',
  'adcolony.com',
  'applovin.com',
  // Social / cross-site trackers
  'connect.facebook.net',
  'facebook.com/tr',
  'ads-twitter.com',
  'analytics.tiktok.com',
  // Analytics / telemetry / session-replay
  'scorecardresearch.com',
  'quantserve.com',
  'hotjar.com',
  'mixpanel.com',
  'segment.com',
  'segment.io',
  'amplitude.com',
  'fullstory.com',
  'mouseflow.com',
  'clarity.ms',
  'branch.io',
  'appsflyer.com',
  'adjust.com',
];

// Functional hosts we must NEVER block, even if a fuzzy match tempted us to.
// Kept as an explicit guard so future edits to BLOCKED_HOSTS can't quietly
// take out a CDN the app or an academic embed depends on.
const ALLOWLIST = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'ajax.googleapis.com',
  'apis.google.com',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'cdn.jsdelivr.net',
  'esm.sh',
];

function hostMatches(hostname, list) {
  return list.some(
    (entry) => hostname === entry || hostname.endsWith('.' + entry)
  );
}

function isBlocked(url) {
  const host = url.hostname;
  if (hostMatches(host, ALLOWLIST)) return false;
  if (hostMatches(host, BLOCKED_HOSTS)) return true;
  // path-qualified entries (host/path) like facebook.com/tr
  const hostPath = host + url.pathname;
  return BLOCKED_HOSTS.some(
    (entry) => entry.includes('/') && hostPath.startsWith(entry)
  );
}

// Shield on/off. The app pushes the user's saved preference after activation;
// until then we default to on so protection is active from the very first load.
let shieldEnabled = true;

self.addEventListener('message', (event) => {
  const d = event.data;
  if (d && d.type === 'shield:setEnabled') {
    shieldEnabled = !!d.enabled;
  }
});

// Tell every open tab that we just blocked something. We deliberately do NOT
// fetch the tracker to read its size — that would send the exact request we're
// trying to save. The app applies a conservative average estimate instead, so
// the "data saved" figure stays honest and no bytes are spent measuring it.
async function reportBlocked(url) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const c of clients) {
    c.postMessage({ type: 'shield:blocked', host: url.hostname });
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      // Claim immediately so the shield is active from the first load
      .then(() => self.clients.claim())
  );
});

// ── Fetch ────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return; // malformed — let the browser handle it
  }

  // 1) Shield: drop known third-party trackers/ads with a clean, silent 204.
  //    A 204 (No Content) is the gentlest possible response — libraries that
  //    fire-and-forget a beacon see a successful empty reply instead of a
  //    network error, so nothing in the UI throws.
  if (shieldEnabled && url.origin !== location.origin && isBlocked(url)) {
    event.respondWith(
      new Response('', {
        status: 204,
        statusText: 'No Content',
        headers: { 'X-Kaban-Shield': 'blocked' },
      })
    );
    reportBlocked(url); // fire-and-forget; doesn't delay the 204
    return;
  }

  // 2) Only cache-manage our own origin. Third-party functional assets
  //    (fonts, CDNs) fall through to the browser's own cache.
  if (url.origin !== location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) cache.put(request, fresh.clone());
        return fresh;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const shell = await cache.match(
            new URL('./index.html', self.registration.scope).href
          );
          if (shell) return shell;
        }
        return Response.error();
      }
    })()
  );
});
