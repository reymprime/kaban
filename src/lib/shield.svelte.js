// Shield store — owns the Privacy & Data-Saving Shield's UI state.
//
// The service worker does the actual blocking. This store:
//   • holds the on/off toggle (persisted; the SW reads it before blocking)
//   • counts blocked requests + estimated bytes saved (persisted)
//   • listens for "block" messages the SW posts on each drop
//
// Everything is best-effort: if localStorage or the SW is unavailable, the
// app still runs, the counter just stays at zero.

const KEY = 'kaban:shield';

// Average weight of a blocked tracker/ad request when Content-Length is
// unknown. Real ad scripts run large; 60KB is a deliberately conservative
// mid-point so the "data saved" number is honest rather than inflated.
const AVG_BLOCKED_BYTES = 60 * 1024;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: true, blocked: 0, bytes: 0 };
}

const initial = load();

export const shield = $state({
  enabled: initial.enabled ?? true,
  blocked: initial.blocked ?? 0,
  bytes: initial.bytes ?? 0,
});

function persist() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        enabled: shield.enabled,
        blocked: shield.blocked,
        bytes: shield.bytes,
      })
    );
  } catch {}
}

// Tell the service worker whether the shield is on. The SW keeps its own copy
// so it can decide without waking the app.
function pushEnabledToSW() {
  try {
    navigator.serviceWorker?.controller?.postMessage({
      type: 'shield:setEnabled',
      enabled: shield.enabled,
    });
  } catch {}
}

export function setShieldEnabled(on) {
  shield.enabled = !!on;
  persist();
  pushEnabledToSW();
}

export function toggleShield() {
  setShieldEnabled(!shield.enabled);
}

export function resetShieldStats() {
  shield.blocked = 0;
  shield.bytes = 0;
  persist();
}

// Human-friendly data figure, e.g. "1.4 MB" / "820 KB".
export function formatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

// Wire up SW → app messaging. Call once, from app startup.
export function initShield() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || d.type !== 'shield:blocked') return;
    shield.blocked += 1;
    shield.bytes += Number.isFinite(d.bytes) && d.bytes > 0 ? d.bytes : AVG_BLOCKED_BYTES;
    persist();
  });

  // Sync the SW with our persisted toggle once it's controlling the page.
  navigator.serviceWorker.ready.then(pushEnabledToSW).catch(() => {});
  pushEnabledToSW();
}
