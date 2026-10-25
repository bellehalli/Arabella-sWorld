const ALLOWED = new Set(['P','BR','STRONG','B','EM','I','U','UL','OL','LI','BLOCKQUOTE','A']);

export function sanitizeRichHtml(input) {
  if (typeof DOMParser === 'undefined') return escapeHtml(String(input ?? ''));
  const doc = new DOMParser().parseFromString(String(input ?? ''), 'text/html');
  const clean = node => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 1) {
        if (!ALLOWED.has(child.tagName)) { clean(child); child.replaceWith(...child.childNodes); continue; }
        const href = child.tagName === 'A' ? child.getAttribute('href') || '' : '';
        for (const attr of [...child.attributes]) child.removeAttribute(attr.name);
        if (child.tagName === 'A') {
          if (/^(https?:|mailto:)/i.test(href)) { child.setAttribute('href', href); child.setAttribute('rel', 'noopener noreferrer'); }
          else { clean(child); child.replaceWith(...child.childNodes); continue; }
        }
        clean(child);
      } else if (child.nodeType !== 3) child.remove();
    }
  };
  clean(doc.body);
  return doc.body.innerHTML;
}

export function richHtmlFromPlainText(value) {
  return String(value ?? '').split(/\n{2,}/).map(p => `<p>${escapeHtml(p).replace(/\n/g,'<br>')}</p>`).join('');
}
export function plainTextFromRichHtml(value) {
  if (typeof DOMParser === 'undefined') return String(value ?? '').replace(/<[^>]*>/g, ' ');
  const doc = new DOMParser().parseFromString(sanitizeRichHtml(value), 'text/html');
  return doc.body.innerText || doc.body.textContent || '';
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
