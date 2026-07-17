// Timeline DSL → {events:[{stamp, text}]}. Line = `<stamp> <text>`;
// a single-token line is text without a stamp. Never throws.

export function parseTimeline(text) {
  const events = [];
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const sp = line.indexOf(' ');
    if (sp === -1) events.push({ stamp: '', text: line });
    else events.push({ stamp: line.slice(0, sp), text: line.slice(sp + 1).trim() });
  }
  return { events };
}
