// Sequence DSL → {actors, messages}. Actors auto-collect in order of first
// appearance; `id: [ Label ]` declares a display label. Never throws.

import { extractIcon } from '../util/icon.js';

const RE_MSG = /^([A-Za-z_][\w-]*)\s*->\s*([A-Za-z_][\w-]*)\s*(?::\s*(.*?)\s*)?$/;
const RE_DECL = /^([A-Za-z_][\w-]*)\s*:\s*\[\s*(.*?)\s*\]\s*$/;

export function parseSequence(text) {
  const actors = new Map();
  const messages = [];
  const ensure = (id) => {
    if (!actors.has(id)) actors.set(id, { id, label: id, icon: null });
    return actors.get(id);
  };

  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    let m = RE_DECL.exec(line);
    if (m) {
      const a = ensure(m[1]);
      const ic = extractIcon(m[2]);
      a.label = ic.label || m[1];
      a.icon = ic.icon;
      continue;
    }
    m = RE_MSG.exec(line);
    if (m) {
      ensure(m[1]);
      ensure(m[2]);
      let label = m[3] ?? null;
      if (label != null) {
        const q = /^"(.*)"$/.exec(label);
        if (q) label = q[1];
        if (!label) label = null;
      }
      messages.push({ from: m[1], to: m[2], label });
    }
  }
  return { actors: [...actors.values()], messages };
}
