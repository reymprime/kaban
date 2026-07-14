# Privacy & Data-Saving Shield — integration notes

## Files
- `public/sw.js` — service worker with the tracker/ad filter layer added
- `src/components/SafeEmbed.svelte` — hardened iframe wrapper

## sw.js
Drop-in replacement for the existing service worker. Already registered if your
app calls `navigator.serviceWorker.register('./sw.js')` (check `main.js`).

- Blocks ~35 curated third-party tracker/ad hosts with a silent `204`.
- `ALLOWLIST` protects functional CDNs (Google Fonts, cdnjs, unpkg, jsdelivr).
- Only inspects cross-origin requests; your own origin is never filtered.
- To add a host: put the bare domain in `BLOCKED_HOSTS`. To protect one you
  rely on: add it to `ALLOWLIST` (allowlist wins).

Test it: open DevTools → Network, load the app, and confirm a blocked host
(e.g. google-analytics.com) shows status 204 with header `X-Kaban-Shield`.

## SafeEmbed.svelte
```svelte
<script>
  import SafeEmbed from './components/SafeEmbed.svelte';
</script>

<!-- trusted tool: full sandbox with same-origin -->
<SafeEmbed src="https://www.desmos.com/calculator" title="Desmos" />

<!-- untrusted page: drop same-origin for extra isolation -->
<SafeEmbed src={userProvidedUrl} trusted={false} />

<!-- fill a fixed-height container instead of using an aspect ratio -->
<div style="height: 70vh">
  <SafeEmbed src={url} ratio={null} />
</div>
```

Sandbox grants: `allow-scripts`, `allow-same-origin` (trusted only), `allow-forms`.
Deliberately withheld: popups, popup-escape, top-navigation, downloads, autoplay.

## Play Store framing (honest)
Describe in the listing as: privacy protection + mobile-data saving + secure
embedding. All three are literally what the code does. No cloaking needed —
this scope is standard and review-clean.

---

## Shield Dashboard (added)
- `src/lib/shield.svelte.js` — store: toggle, counters, localStorage, SW messaging
- `src/components/ShieldDashboard.svelte` — toggle + "data saved" / "trackers blocked"
- Wired into `SettingsModal.svelte` (top of the panel)
- `main.js` calls `initShield()` after SW registration

How the counter works: the SW posts a `shield:blocked` message on every drop.
The app increments the count and adds a **conservative 60KB average** per block
(we intentionally do NOT fetch the tracker to measure its real size — that would
send the request we're saving). So "data saved" is an honest estimate, labelled
"(est.)" in the UI. Persisted in localStorage under `kaban:shield`.

Toggle off → the app messages the SW (`shield:setEnabled`), which stops blocking
until re-enabled. Useful when a research site misbehaves.

## SafeEmbed presets
- `preset="default"` — strict: scripts + same-origin(trusted) + forms. No popups/downloads.
- `preset="youtube"` — adds autoplay/encrypted-media/fullscreen/presentation for the
  youtube-nocookie player. Still no popups or downloads.

WatchModal now renders the player through `<SafeEmbed preset="youtube" />`.
For untrusted research embeds, use the default preset (optionally `trusted={false}`).
