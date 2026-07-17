// Bars DSL → {rows:[{label, value, max}]}. Line = `label: value [/ max]`.
// Never throws; non-numeric lines are skipped.

const RE_ROW = /^(.+?):\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?\s*$/;

export function parseBars(text) {
  const rows = [];
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = RE_ROW.exec(line);
    if (!m || !m[1].trim()) continue;
    rows.push({ label: m[1].trim(), value: Number(m[2]), max: m[3] != null ? Number(m[3]) : null });
  }
  return { rows };
}
