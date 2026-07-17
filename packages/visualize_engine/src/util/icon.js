// `@name` icon prefix extraction, shared by graph/tree/sequence parsers.
const RE_ICON = /^@([a-z][\w-]*)\s*(.*)$/i;

export function extractIcon(label) {
  const m = RE_ICON.exec(label ?? '');
  if (!m) return { icon: null, label: label ?? '' };
  return { icon: m[1].toLowerCase(), label: m[2].trim() };
}
