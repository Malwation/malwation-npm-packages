// Indented `name: value` hierarchy → {roots:[{label,value,children}]}.
// A parent's value defaults to the sum of its children. Never throws.
export function parseHierarchy(text) {
  const roots = [];
  const stack = [];
  for (const raw of String(text ?? '').split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const indent = raw.match(/^ */)[0].length;
    const m = /^(.+?)(?::\s*(\d+(?:\.\d+)?))?\s*$/.exec(raw.trim());
    if (!m) continue;
    const node = { label: m[1].trim(), value: m[2] != null ? Number(m[2]) : null, children: [] };
    const level = Math.min(Math.floor(indent / 2), stack.length);
    if (level === 0 || !stack[level - 1]) {
      roots.push(node);
      stack.length = 0;
      stack[0] = node;
    } else {
      stack[level - 1].children.push(node);
      stack.length = level;
      stack[level] = node;
    }
  }
  const val = (n) => {
    if (n.children.length) {
      const s = n.children.reduce((a, c) => a + val(c), 0);
      if (n.value == null) n.value = s;
      return n.value;
    }
    if (n.value == null) n.value = 1;
    return n.value;
  };
  roots.forEach(val);
  return { roots };
}
