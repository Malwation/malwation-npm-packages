// Gantt DSL → {tasks:[{label, start, dur}]}. Line = `label: start duration`
// in abstract numeric units. Never throws; malformed lines are skipped.

const RE_TASK = /^(.+?):\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*$/;

export function parseGantt(text) {
  const tasks = [];
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = RE_TASK.exec(line);
    if (!m || !m[1].trim()) continue;
    tasks.push({ label: m[1].trim(), start: Number(m[2]), dur: Number(m[3]) });
  }
  return { tasks };
}
