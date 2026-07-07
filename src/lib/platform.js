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
