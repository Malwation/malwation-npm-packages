// Markdown-superset block + inline parser → document AST.
// Tolerant by design: never throws, unknown constructs degrade to paragraphs,
// unterminated fences yield blocks with closed:false (streaming support).

const RE_HEADING = /^(#{1,4})\s+(.*)$/;
const RE_HR = /^ *-{3,} *$/;
const RE_FENCE = /^```(.*)$/;
const RE_LIST_ITEM = /^(\s*)(?:([-*])|(\d+)\.)\s+(.*)$/;
const RE_QUOTE = /^ *> ?(.*)$/;
const RE_FIGURE = /^!\[([^\]]*)\]\((\S+)\)\s*$/;
const RE_CALLOUT = /^\[!(note|tip|warn|warning|danger|success)\]\s*(.*)$/i;
const RE_DL = /^(.+?)\s+::\s+(.+)$/;
const RE_COLLAPSE_OPEN = /^\+\+\+\s+(.+)$/;
const RE_COLLAPSE_END = /^\+\+\+\s*$/;
const RE_TASK = /^\[( |x|X)\]\s+(.*)$/;
const RE_DIRECTIVE_OPEN = /^:::\s*([a-z][\w-]*)\s*(.*)$/i;
const RE_DIRECTIVE_END = /^:::\s*$/;
const RE_TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

export const VIZ_KINDS = new Set([
  'graph', 'tree', 'sequence', 'timeline', 'bars', 'pie', 'gantt', 'graph3d', 'bars3d',
  'sankey', 'treemap', 'flame', 'geomap', 'network', 'mermaid', 'dot',
]);

export function parseDoc(src) {
  const lines = String(src ?? '').replace(/\r\n?/g, '\n').split('\n');
  return { type: 'doc', blocks: parseBlocks(lines) };
}

function parseBlocks(lines) {
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    let m = RE_FENCE.exec(line);
    if (m) {
      const info = m[1].trim();
      const word = info.split(/\s+/)[0] || '';
      const rest = info.slice(word.length).trim();
      const body = [];
      i++;
      let closed = false;
      while (i < lines.length) {
        if (lines[i].trim() === '```') { closed = true; i++; break; }
        body.push(lines[i]);
        i++;
      }
      const text = body.join('\n');
      if (VIZ_KINDS.has(word)) {
        blocks.push({ type: 'viz', kind: word, info: rest, text, closed });
      } else if (word === 'filetree' || word === 'diff') {
        blocks.push({ type: word, text, closed });
      } else {
        blocks.push({ type: 'code', lang: word, text, closed });
      }
      continue;
    }

    m = RE_HEADING.exec(line);
    if (m) {
      blocks.push({ type: 'heading', level: m[1].length, inlines: parseInlines(m[2].trim()) });
      i++;
      continue;
    }

    if (RE_HR.test(line) && !RE_LIST_ITEM.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    if (RE_QUOTE.test(line)) {
      const inner = [];
      while (i < lines.length && RE_QUOTE.test(lines[i])) {
        inner.push(RE_QUOTE.exec(lines[i])[1]);
        i++;
      }
      const co = RE_CALLOUT.exec(inner[0] ?? '');
      if (co) {
        const kind = co[1].toLowerCase() === 'warning' ? 'warn' : co[1].toLowerCase();
        blocks.push({ type: 'callout', kind, title: co[2].trim(), blocks: parseBlocks(inner.slice(1)) });
      } else {
        blocks.push({ type: 'quote', blocks: parseBlocks(inner) });
      }
      continue;
    }

    m = RE_DIRECTIVE_OPEN.exec(line);
    if (m && !RE_DIRECTIVE_END.test(line)) {
      const name = m[1].toLowerCase();
      let args = m[2].trim();
      // single-line form: `:::name a, b, c :::`
      if (args.endsWith(':::')) {
        blocks.push({ type: 'directive', name, args: args.slice(0, -3).trim(), lines: [], closed: true });
        i++;
        continue;
      }
      const body = [];
      i++;
      let closed = false;
      while (i < lines.length) {
        if (RE_DIRECTIVE_END.test(lines[i])) {
          closed = true;
          i++;
          break;
        }
        body.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'directive', name, args, lines: body, closed });
      continue;
    }

    m = RE_COLLAPSE_OPEN.exec(line);
    if (m) {
      const summary = m[1].trim();
      const inner = [];
      i++;
      let closed = false;
      while (i < lines.length) {
        if (RE_COLLAPSE_END.test(lines[i])) {
          closed = true;
          i++;
          break;
        }
        inner.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'collapse', summary, closed, blocks: parseBlocks(inner) });
      continue;
    }

    if (RE_DL.test(line) && !line.includes('|')) {
      const items = [];
      while (i < lines.length && RE_DL.test(lines[i]) && !lines[i].includes('|')) {
        const [, term, def] = RE_DL.exec(lines[i]);
        items.push({ term: term.trim(), def: parseInlines(def.trim()) });
        i++;
      }
      blocks.push({ type: 'dl', items });
      continue;
    }

    if (RE_LIST_ITEM.test(line)) {
      const items = [];
      let firstOrdered = null;
      while (i < lines.length && RE_LIST_ITEM.test(lines[i])) {
        const [, indent, bullet, num, text] = RE_LIST_ITEM.exec(lines[i]);
        const level = Math.floor(indent.length / 2);
        const ordered = num != null;
        // a top-level bullet-type change starts a new list block
        if (level === 0) {
          if (firstOrdered === null) firstOrdered = ordered;
          else if (ordered !== firstOrdered) break;
        }
        items.push({ level, ordered, text, bullet });
        i++;
      }
      blocks.push(buildList(items, 0));
      continue;
    }

    m = RE_FIGURE.exec(line);
    if (m) {
      blocks.push({ type: 'figure', src: m[2], alt: m[1] });
      i++;
      continue;
    }

    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('-') && RE_TABLE_SEP.test(lines[i + 1])) {
      const header = splitRow(line).map(parseInlines);
      const aligns = splitRow(lines[i + 1]).map((cell) => {
        const c = cell.trim();
        const l = c.startsWith(':');
        const r = c.endsWith(':');
        return l && r ? 'center' : r ? 'right' : l ? 'left' : null;
      });
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitRow(lines[i]).map(parseInlines));
        i++;
      }
      blocks.push({ type: 'table', aligns, header, rows });
      continue;
    }

    // paragraph: consume consecutive plain lines
    const para = [];
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) {
      para.push(lines[i].trim());
      i++;
    }
    if (para.length) {
      blocks.push({ type: 'para', inlines: parseInlines(para.join(' ')) });
    } else {
      i++; // defensive: line claimed by startsBlock but no handler matched
    }
  }
  return blocks;
}

function startsBlock(line) {
  return (
    RE_FENCE.test(line) ||
    RE_HEADING.test(line) ||
    (RE_HR.test(line) && !RE_LIST_ITEM.test(line)) ||
    RE_QUOTE.test(line) ||
    RE_LIST_ITEM.test(line) ||
    RE_FIGURE.test(line) ||
    RE_COLLAPSE_OPEN.test(line) ||
    RE_DIRECTIVE_OPEN.test(line) ||
    (RE_DL.test(line) && !line.includes('|'))
  );
}

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

// items: flat [{level, ordered, text}] → nested list block
function buildList(items, level) {
  const list = { type: 'list', ordered: items[0]?.ordered ?? false, items: [] };
  let i = 0;
  while (i < items.length) {
    const it = items[i];
    if (it.level <= level) {
      const tm = RE_TASK.exec(it.text);
      list.items.push({
        inlines: parseInlines(tm ? tm[2] : it.text),
        children: [],
        task: tm ? (tm[1] === ' ' ? 'todo' : 'done') : null,
      });
      i++;
    } else {
      const sub = [];
      while (i < items.length && items[i].level > level) {
        sub.push(items[i]);
        i++;
      }
      const parent = list.items[list.items.length - 1] ?? { inlines: [], children: [], task: null };
      if (!list.items.length) list.items.push(parent);
      parent.children.push(buildList(sub, level + 1));
    }
  }
  return list;
}

const RE_INLINE_IMAGE = /^!\[([^\]]*)\]\(([^)]*)\)/;
const RE_INLINE_LINK = /^\[([^\]]+)\]\(([^)]*)\)/;

export function parseInlines(s) {
  const out = [];
  let buf = '';
  let i = 0;
  const flush = () => {
    if (buf) { out.push({ type: 'text', text: buf }); buf = ''; }
  };
  while (i < s.length) {
    const rest = s.slice(i);
    let m;
    if (rest[0] === '`') {
      const end = s.indexOf('`', i + 1);
      if (end !== -1) {
        flush();
        out.push({ type: 'code', text: s.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (rest.startsWith('[[') && (m = /^\[\[([^\]]+?)\]\]/.exec(rest))) {
      flush();
      const inner = m[1].trim();
      let mm;
      if ((mm = /^progress\s+(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?$/i.exec(inner))) {
        out.push({ type: 'progress', value: Number(mm[1]), max: mm[2] != null ? Number(mm[2]) : 100 });
      } else if ((mm = /^sev\s+(\d+)\s*\/\s*(\d+)$/i.exec(inner))) {
        out.push({ type: 'sev', n: Number(mm[1]), m: Number(mm[2]) });
      } else if ((mm = /^spark\s+(.+)$/i.exec(inner))) {
        const vals = mm[1].split(/[\s,]+/).map(Number).filter((v) => !Number.isNaN(v));
        out.push({ type: 'spark', values: vals });
      } else if ((mm = /^metric\s+(\S+)\s*(.*)$/i.exec(inner))) {
        out.push({ type: 'metric', value: mm[1], label: mm[2].trim() });
      } else if ((mm = /^avatar\s+(.+)$/i.exec(inner))) {
        out.push({ type: 'avatar', name: mm[1].trim() });
      } else {
        const mark = inner[0];
        const variant = { '!': 'err', '+': 'ok', '~': 'warn' }[mark] ?? 'neutral';
        out.push({ type: 'badge', variant, text: variant === 'neutral' ? inner : inner.slice(1).trim() });
      }
      i += m[0].length;
      continue;
    }
    if (rest[0] === '!' && (m = RE_INLINE_IMAGE.exec(rest))) {
      flush();
      out.push({ type: 'image', alt: m[1], src: m[2].trim() });
      i += m[0].length;
      continue;
    }
    if (rest[0] === '[' && (m = RE_INLINE_LINK.exec(rest))) {
      flush();
      out.push({ type: 'link', href: m[2].trim(), children: parseInlines(m[1]) });
      i += m[0].length;
      continue;
    }
    if (rest.startsWith('**')) {
      const end = s.indexOf('**', i + 2);
      if (end !== -1) {
        flush();
        out.push({ type: 'strong', children: parseInlines(s.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    if (rest[0] === '*') {
      const end = s.indexOf('*', i + 1);
      if (end > i + 1) {
        flush();
        out.push({ type: 'em', children: parseInlines(s.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    buf += s[i];
    i++;
  }
  flush();
  return out;
}
