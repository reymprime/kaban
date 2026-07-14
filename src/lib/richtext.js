// Rich text helpers for formatted Notes.
// Notes created before v1.8 are plain text; formatted notes are stored as HTML.

export function isHtml(s = '') {
  return /<([a-z][\w-]*)(\s[^>]*)?>/i.test(s);
}

export function escapeHtml(t = '') {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function textToHtml(t = '') {
  return escapeHtml(t).replace(/\n/g, '<br>');
}

export function htmlToText(h = '') {
  if (!isHtml(h)) return h;
  // innerText needs a rendered layout to produce line breaks — on a detached
  // element it collapses everything into one blob. So we convert breaks and
  // block boundaries to real newlines BEFORE extracting the text.
  const withBreaks = h
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|li|ul|ol|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ');
  const d = document.createElement('div');
  d.innerHTML = withBreaks;
  const text = d.textContent || '';
  // Tidy up: no trailing spaces before breaks, max one blank line in a row
  return text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Cheap tag stripper for search matching (no DOM needed)
export function stripForSearch(s = '') {
  return s.replace(/<[^>]*>/g, ' ');
}

// ---- Auto-linking (read mode only) ------------------------------------
// Turns raw URLs typed inside a note into clickable links, WITHOUT touching
// URLs that are already inside an <a>, or text inside tags/attributes.
// Applied at render time only — the stored note stays plain, so editing and
// re-saving never double-wraps.
//
// Matches: https://…, http://…, www.…, and bare domains like example.io
// (common TLDs only, to avoid turning "file.js" or "v1.2" into a link).
const URL_RE =
  /(?<![@\w])((?:https?:\/\/|www\.)[^\s<>"']+|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|net|org|io|ph|edu|gov|co|dev|app|ai|me|info|biz|tv|xyz|site|online|tech|store|blog|news)(?:\/[^\s<>"']*)?)/gi;

// Trailing punctuation that is almost never part of the URL itself
function splitTrailing(url) {
  const m = url.match(/[),.!?;:'"\]]+$/);
  if (!m) return [url, ''];
  // Keep a closing paren if the URL actually contains an opening one (wiki links)
  let trail = m[0];
  if (trail.includes(')') && (url.match(/\(/g) || []).length >= (url.match(/\)/g) || []).length) {
    trail = trail.replace(/\)+$/, '');
  }
  return [url.slice(0, url.length - trail.length), url.slice(url.length - trail.length)];
}

function anchorFor(raw) {
  const [clean, trail] = splitTrailing(raw);
  const href = /^https?:\/\//i.test(clean) ? clean : 'https://' + clean;
  const safeText = escapeHtml(clean);
  const safeHref = escapeHtml(href);
  return (
    `<a href="${safeHref}" class="note-link" data-note-link ` +
    `target="_blank" rel="noopener noreferrer nofollow">${safeText}</a>` +
    escapeHtml(trail)
  );
}

// Walks text nodes only, so existing markup/formatting is preserved.
export function linkifyHtml(html = '') {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;

  const walker = document.createTreeWalker(
    tpl.content,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Skip anything already inside a link
        for (let p = node.parentNode; p && p !== tpl.content; p = p.parentNode) {
          if (p.nodeName === 'A') return NodeFilter.FILTER_REJECT;
        }
        URL_RE.lastIndex = 0;
        return URL_RE.test(node.nodeValue)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      },
    }
  );

  const targets = [];
  let n;
  while ((n = walker.nextNode())) targets.push(n);

  for (const node of targets) {
    URL_RE.lastIndex = 0;
    const replaced = escapeHtml(node.nodeValue).replace(URL_RE, (m) => anchorFor(m));
    if (replaced !== escapeHtml(node.nodeValue)) {
      const span = document.createElement('template');
      span.innerHTML = replaced;
      node.replaceWith(span.content);
    }
  }
  return tpl.innerHTML;
}

// Sanitizer: keeps only formatting tags and safe style properties.
// Protects against scripts inside imported/shared JSON files.
const ALLOWED = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'BR',
  'DIV', 'P', 'SPAN', 'FONT', 'UL', 'OL', 'LI',
]);
const ALLOWED_STYLES = [
  'color',
  'background-color',
  'font-size',
  'font-weight',
  'font-style',
  'text-decoration',
];

export function sanitizeHtml(html = '') {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;

  function scrub(node) {
    for (const el of [...node.children]) {
      scrub(el);
      if (!ALLOWED.has(el.tagName)) {
        el.replaceWith(...el.childNodes); // unwrap unknown tags (script content dropped below)
        continue;
      }
      for (const attr of [...el.attributes]) {
        const name = attr.name.toLowerCase();
        if (name === 'style') {
          const style = el.style;
          const keep = {};
          for (const p of ALLOWED_STYLES) {
            const v = style.getPropertyValue(p);
            if (v) keep[p] = v;
          }
          el.removeAttribute('style');
          for (const [p, v] of Object.entries(keep)) el.style.setProperty(p, v);
        } else if (
          el.tagName === 'FONT' &&
          (name === 'color' || name === 'size')
        ) {
          // keep font color/size (produced by execCommand)
        } else {
          el.removeAttribute(attr.name);
        }
      }
    }
  }

  // Drop dangerous elements entirely before unwrapping pass
  tpl.content
    .querySelectorAll('script, style, iframe, object, embed, link, meta')
    .forEach((el) => el.remove());
  scrub(tpl.content);
  return tpl.innerHTML;
}
