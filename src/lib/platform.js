// Detects which platform a stored link belongs to, for badges and icons.
const PLATFORMS = [
  { match: ['tiktok.com'], name: 'TikTok', color: '#010101' },
  { match: ['youtube.com', 'youtu.be'], name: 'YouTube', color: '#FF0000' },
  { match: ['facebook.com', 'fb.watch', 'fb.com'], name: 'Facebook', color: '#1877F2' },
  { match: ['instagram.com'], name: 'Instagram', color: '#E1306C' },
  { match: ['x.com', 'twitter.com'], name: 'X', color: '#111111' },
  { match: ['threads.net', 'threads.com'], name: 'Threads', color: '#111111' },
  { match: ['pinterest.com', 'pin.it'], name: 'Pinterest', color: '#E60023' },
  { match: ['reddit.com'], name: 'Reddit', color: '#FF4500' },
  { match: ['spotify.com'], name: 'Spotify', color: '#1DB954' },
  { match: ['github.com'], name: 'GitHub', color: '#171515' },
];

export function detectPlatform(url) {
  let host = '';
  try {
    host = new URL(normalizeUrl(url)).hostname.replace(/^www\./, '');
  } catch {
    return { name: 'Link', color: '#2563EB', host: '' };
  }
  for (const p of PLATFORMS) {
    if (p.match.some((m) => host === m || host.endsWith('.' + m))) {
      return { ...p, host };
    }
  }
  return { name: 'Link', color: '#2563EB', host };
}

export function normalizeUrl(url) {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return 'https://' + trimmed;
}

// ---- YouTube Watch feature ----
// Extracts the 11-character video ID from any YouTube URL shape:
//   watch?v=..., youtu.be/..., /shorts/..., /embed/..., /live/..., /v/...
// including m.youtube.com and music.youtube.com subdomains.
// Returns null for non-YouTube links — that's what hides the Watch button.
// No API keys, no quota: pure RegEx → iframe embed.
export function getYouTubeId(url = '') {
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/
  );
  return m ? m[1] : null;
}
