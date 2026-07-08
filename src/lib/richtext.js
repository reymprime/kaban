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
  const d = document.createElement('div');
  d.innerHTML = h;
  return d.innerText || d.textContent || '';
}

// Cheap tag stripper for search matching (no DOM needed)
export function stripForSearch(s = '') {
  return s.replace(/<[^>]*>/g, ' ');
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
