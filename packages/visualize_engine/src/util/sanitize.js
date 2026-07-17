// URL allowlist for untrusted document content: http(s), image data-URLs,
// and scheme-less (relative / root-relative / fragment) references.
export function safeUrl(url) {
  if (typeof url !== 'string') return null;
  const u = url.trim();
  if (!u) return null;
  if (/^https?:/i.test(u)) return u;
  if (/^data:image\/(png|gif|jpe?g|webp|svg\+xml)[;,]/i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return null;
  return u;
}
