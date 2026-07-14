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

// ---- Suspicious-link check (safe-browsing warning) ----
// Deliberately CONSERVATIVE: only flags links with clear scam/ad-farm signals,
// so normal links (YouTube, GitHub, news, .edu, etc.) open instantly with no
// interruption. Returns { suspicious: boolean, reasons: string[] }.
//
// This never blocks — it only lets the UI show an optional "are you sure"
// warning. Real navigation still happens in the external browser.

// TLDs disproportionately used by throwaway scam / ad-farm / phishing sites.
const RISKY_TLDS = new Set([
  'zip', 'mov', 'xyz', 'top', 'click', 'link', 'gq', 'cf', 'tk', 'ml', 'ga',
  'work', 'fit', 'rest', 'country', 'kim', 'loan', 'racing', 'download',
  'stream', 'review', 'win', 'bid', 'trade', 'date', 'faith', 'cricket',
  'science', 'party', 'accountant', 'men', 'webcam',
]);

// Words that show up constantly in scam/ad-farm hostnames.
const SCAM_HOST_WORDS = [
  'yojna', 'sarkari', 'freegift', 'giveaway', 'claim', 'reward', 'prize',
  'winner', 'lottery', 'bonus', 'crypto-invest', 'investnow', 'earnmoney',
  'quickcash', 'ad-', 'ads-', 'popads', 'redirect', 'tracker',
];

// Hosts that are safe even if their TLD looks risky, or that we always trust.
const TRUSTED_HOSTS = [
  'youtube.com', 'youtu.be', 'google.com', 'wikipedia.org', 'github.com',
  'archive.org', 'britannica.com', 'jstor.org', 'arxiv.org', 'nih.gov',
  'who.int', 'gov.ph', 'edu.ph',
];

function hostEndsWithAny(host, list) {
  return list.some((h) => host === h || host.endsWith('.' + h));
}

export function assessLinkRisk(url) {
  let host = '';
  try {
    host = new URL(normalizeUrl(url)).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return { suspicious: false, reasons: [] };
  }
  if (!host) return { suspicious: false, reasons: [] };

  // Trusted hosts (and their subdomains) are never flagged.
  if (hostEndsWithAny(host, TRUSTED_HOSTS)) return { suspicious: false, reasons: [] };
  // Any .edu / .gov / .edu.* / .gov.* is treated as safe.
  if (/\.(edu|gov)(\.[a-z]{2,})?$/.test(host)) return { suspicious: false, reasons: [] };

  const reasons = [];
  const tld = host.split('.').pop();

  if (RISKY_TLDS.has(tld)) reasons.push('Uses a domain type often linked to scam sites');
  if (SCAM_HOST_WORDS.some((w) => host.includes(w)))
    reasons.push('The address contains wording common in scam or ad pages');
  // Raw IP address instead of a domain name
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host))
    reasons.push('Points to a raw IP address, not a named site');
  // Very long or heavily-hyphenated hostnames are a classic ad-farm tell
  if (host.length > 40 || (host.match(/-/g) || []).length >= 4)
    reasons.push('Unusually long or complex address');
  // Punycode / lookalike domains
  if (host.includes('xn--')) reasons.push('Uses characters that can disguise a fake site');

  return { suspicious: reasons.length > 0, reasons };
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
