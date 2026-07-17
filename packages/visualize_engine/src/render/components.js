// Component library: `:::name … :::` directives → themed DOM.
// ctx provides {document, renderMarkdown(text)->fragment, renderInlines(inlines,parent)}.
// Every builder is tolerant; unknown names render a small note.

import { parseInlines } from '../parse/markdown.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const svgEl = (d, name, attrs = {}) => {
  const e = d.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};
const arcPath = (cx, cy, r, a0, a1) => {
  const p = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy - r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

// split inner lines on `== Label` headers → [{label, lines}]
export function splitSections(lines) {
  const sections = [];
  let cur = null;
  for (const raw of lines) {
    const m = /^==\s+(.*)$/.exec(raw.trim());
    if (m) {
      cur = { label: m[1].trim(), lines: [] };
      sections.push(cur);
    } else if (cur) {
      cur.lines.push(raw);
    }
  }
  return sections;
}

export function renderDirective(block, ctx) {
  const builder = DIRECTIVES[block.name];
  const d = ctx.document;
  let el;
  try {
    el = builder ? builder(block, ctx) : null;
  } catch {
    el = null;
  }
  if (!el) {
    el = d.createElement('div');
    el.className = 'viz-error-note';
    el.style.border = '1px dashed var(--viz-grid)';
    el.textContent = `unknown component: ${block.name}`;
  }
  if (block.closed === false) el.classList.add('viz-pending');
  return el;
}

const inlineInto = (el, text, ctx) => ctx.renderInlines(parseInlines(text), el);

const reduced = (d) => !!d.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// count a leading number up to target (~1.1s), preserving any suffix
function countUp(d, el, text) {
  const m = /^(\d+(?:\.\d+)?)(.*)$/.exec(text);
  const win = d.defaultView;
  if (!m || reduced(d) || !win?.requestAnimationFrame) {
    el.textContent = text;
    return;
  }
  const target = Number(m[1]);
  const suffix = m[2];
  const decimals = (m[1].split('.')[1] || '').length;
  let start = null;
  const step = (ts) => {
    if (start == null) start = ts;
    const t = Math.min(1, (ts - start) / 1100);
    const v = target * (1 - Math.pow(1 - t, 3));
    el.textContent = (decimals ? v.toFixed(decimals) : Math.round(v)) + suffix;
    if (t < 1) win.requestAnimationFrame(step);
  };
  el.textContent = '0' + suffix;
  win.requestAnimationFrame(step);
}

const DIRECTIVES = {
  tabs(block, ctx) {
    const d = ctx.document;
    const sections = splitSections(block.lines);
    if (!sections.length) return null;
    const wrap = d.createElement('div');
    wrap.className = 'viz-tabs';
    const bar = d.createElement('div');
    bar.className = 'viz-tabs-bar';
    const bodies = [];
    sections.forEach((s, i) => {
      const btn = d.createElement('button');
      btn.type = 'button';
      btn.className = 'viz-tab-btn' + (i === 0 ? ' active' : '');
      btn.textContent = s.label;
      const body = d.createElement('div');
      body.className = 'viz-tab-panel';
      body.style.display = i === 0 ? 'block' : 'none';
      body.appendChild(ctx.renderMarkdown(s.lines.join('\n')));
      btn.addEventListener('click', () => {
        bar.querySelectorAll('.viz-tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        bodies.forEach((el, k) => (el.style.display = k === i ? 'block' : 'none'));
      });
      bar.appendChild(btn);
      bodies.push(body);
    });
    wrap.appendChild(bar);
    bodies.forEach((b) => wrap.appendChild(b));
    return wrap;
  },

  accordion(block, ctx) {
    const d = ctx.document;
    const sections = splitSections(block.lines);
    if (!sections.length) return null;
    const wrap = d.createElement('div');
    wrap.className = 'viz-accordion';
    sections.forEach((s, i) => {
      const det = d.createElement('details');
      det.className = 'viz-accordion-item';
      if (i === 0) det.open = true;
      const sum = d.createElement('summary');
      sum.textContent = s.label;
      det.appendChild(sum);
      const body = d.createElement('div');
      body.className = 'viz-accordion-body';
      body.appendChild(ctx.renderMarkdown(s.lines.join('\n')));
      det.appendChild(body);
      wrap.appendChild(det);
    });
    return wrap;
  },

  steps(block, ctx) {
    const d = ctx.document;
    const items = block.lines.map((l) => l.trim()).filter(Boolean);
    if (!items.length) return null;
    const wrap = d.createElement('div');
    wrap.className = 'viz-steps';
    items.forEach((raw, i) => {
      let state = 'todo';
      let text = raw;
      if (/^x\s+/i.test(raw)) {
        state = 'done';
        text = raw.replace(/^x\s+/i, '');
      } else if (/^>\s+/.test(raw)) {
        state = 'current';
        text = raw.replace(/^>\s+/, '');
      }
      const step = d.createElement('div');
      step.className = `viz-step viz-step-${state}`;
      const dot = d.createElement('div');
      dot.className = 'viz-step-dot';
      dot.textContent = state === 'done' ? '✓' : String(i + 1);
      const label = d.createElement('div');
      label.className = 'viz-step-label';
      inlineInto(label, text, ctx);
      step.append(dot, label);
      wrap.appendChild(step);
    });
    return wrap;
  },

  meta(block, ctx) {
    const d = ctx.document;
    const rows = block.lines
      .map((l) => /^(.+?)\s*::\s*(.*)$/.exec(l.trim()))
      .filter(Boolean);
    if (!rows.length) return null;
    const wrap = d.createElement('div');
    wrap.className = 'viz-meta';
    for (const m of rows) {
      const term = d.createElement('div');
      term.className = 'viz-meta-key';
      term.textContent = m[1].trim();
      const val = d.createElement('div');
      val.className = 'viz-meta-val';
      inlineInto(val, m[2].trim(), ctx);
      wrap.append(term, val);
    }
    return wrap;
  },

  stat(block, ctx) {
    const d = ctx.document;
    const tiles = block.lines
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.split('|').map((p) => p.trim()));
    if (!tiles.length) return null;
    const wrap = d.createElement('div');
    wrap.className = 'viz-stats';
    for (const [value, label, delta] of tiles) {
      const tile = d.createElement('div');
      tile.className = 'viz-stat';
      const v = d.createElement('div');
      v.className = 'viz-stat-value';
      countUp(d, v, value ?? '');
      const l = d.createElement('div');
      l.className = 'viz-stat-label';
      l.textContent = label ?? '';
      tile.append(v, l);
      if (delta) {
        const dd = d.createElement('div');
        const dir = delta.startsWith('+') ? 'up' : delta.startsWith('-') ? 'down' : 'flat';
        dd.className = `viz-stat-delta viz-stat-${dir}`;
        dd.textContent = delta;
        tile.appendChild(dd);
      }
      wrap.appendChild(tile);
    }
    return wrap;
  },

  chips(block, ctx) {
    const d = ctx.document;
    const raw = [block.args, ...block.lines].join(' ');
    const items = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!items.length) return null;
    const wrap = d.createElement('div');
    wrap.className = 'viz-chips';
    for (const it of items) {
      const chip = d.createElement('span');
      const mark = it[0];
      const variant = { '!': 'err', '+': 'ok', '~': 'warn' }[mark];
      chip.className = 'viz-chip' + (variant ? ` viz-chip-${variant}` : '');
      chip.textContent = variant ? it.slice(1).trim() : it;
      wrap.appendChild(chip);
    }
    return wrap;
  },

  grid(block, ctx) {
    const d = ctx.document;
    const sections = splitSections(block.lines);
    if (!sections.length) return null;
    const wrap = d.createElement('div');
    wrap.className = 'viz-cardgrid';
    for (const s of sections) {
      const card = d.createElement('div');
      card.className = 'viz-card';
      const h = d.createElement('div');
      h.className = 'viz-card-title';
      h.textContent = s.label;
      const body = d.createElement('div');
      body.className = 'viz-card-body';
      body.appendChild(ctx.renderMarkdown(s.lines.join('\n')));
      card.append(h, body);
      wrap.appendChild(card);
    }
    return wrap;
  },

  card(block, ctx) {
    const d = ctx.document;
    const card = d.createElement('div');
    card.className = 'viz-card viz-card-solo';
    if (block.args) {
      const h = d.createElement('div');
      h.className = 'viz-card-title';
      h.textContent = block.args;
      card.appendChild(h);
    }
    const body = d.createElement('div');
    body.className = 'viz-card-body';
    body.appendChild(ctx.renderMarkdown(block.lines.join('\n')));
    card.appendChild(body);
    return card;
  },

  alert(block, ctx) {
    const d = ctx.document;
    const parts = block.args.split(/\s+/);
    let kind = 'note';
    if (['note', 'info', 'tip', 'warn', 'warning', 'danger', 'success'].includes(parts[0]?.toLowerCase())) {
      kind = parts.shift().toLowerCase();
    }
    if (kind === 'warning') kind = 'warn';
    if (kind === 'info') kind = 'note';
    const msg = [parts.join(' '), ...block.lines].filter(Boolean).join(' ');
    const el = d.createElement('div');
    el.className = `viz-alert viz-alert-${kind}`;
    inlineInto(el, msg, ctx);
    return el;
  },

  kbd(block, ctx) {
    const d = ctx.document;
    const raw = [block.args, ...block.lines].join(' ').trim();
    if (!raw) return null;
    const wrap = d.createElement('span');
    wrap.className = 'viz-kbd-group';
    const keys = raw.split(/\s*\+\s*|\s+/).filter(Boolean);
    keys.forEach((k, i) => {
      if (i) wrap.appendChild(d.createTextNode(' + '));
      const kbd = d.createElement('kbd');
      kbd.className = 'viz-kbd';
      kbd.textContent = k;
      wrap.appendChild(kbd);
    });
    return wrap;
  },

  terminal(block, ctx) {
    const d = ctx.document;
    const wrap = d.createElement('div');
    wrap.className = 'viz-term';
    const bar = d.createElement('div');
    bar.className = 'viz-term-bar';
    for (let k = 0; k < 3; k++) {
      const dot = d.createElement('span');
      dot.className = 'viz-term-dot';
      bar.appendChild(dot);
    }
    if (block.args) {
      const t = d.createElement('span');
      t.className = 'viz-term-title';
      t.textContent = block.args;
      bar.appendChild(t);
    }
    const body = d.createElement('div');
    body.className = 'viz-term-body';
    for (const line of block.lines) {
      const row = d.createElement('div');
      if (line.startsWith('$ ') || line.startsWith('# ')) {
        row.className = 'viz-term-cmd';
        const prompt = d.createElement('span');
        prompt.className = 'viz-term-prompt';
        prompt.textContent = line.slice(0, 1) + ' ';
        row.appendChild(prompt);
        row.appendChild(d.createTextNode(line.slice(2)));
      } else {
        row.className = 'viz-term-out';
        row.textContent = line;
      }
      body.appendChild(row);
    }
    wrap.append(bar, body);
    return wrap;
  },

  columns(block, ctx) {
    const d = ctx.document;
    const sections = splitSections(block.lines);
    if (!sections.length) return null;
    const wrap = d.createElement('div');
    wrap.className = 'viz-columns';
    for (const s of sections) {
      const col = d.createElement('div');
      col.className = 'viz-column';
      const h = d.createElement('div');
      h.className = 'viz-column-title';
      h.textContent = s.label;
      col.appendChild(h);
      col.appendChild(ctx.renderMarkdown(s.lines.join('\n')));
      wrap.appendChild(col);
    }
    return wrap;
  },

  divider(block, ctx) {
    const d = ctx.document;
    const el = d.createElement('div');
    el.className = 'viz-divider';
    const span = d.createElement('span');
    span.textContent = block.args || '';
    el.appendChild(span);
    return el;
  },

  status(block, ctx) {
    const d = ctx.document;
    const rows = [block.args, ...block.lines].map((l) => l.trim()).filter(Boolean);
    if (!rows.length) return null;
    const wrap = d.createElement('div');
    wrap.className = 'viz-statuslist';
    for (const row of rows) {
      const m = /^(ok|up|warn|err|down|info|idle)\b\s*(.*)$/i.exec(row);
      const state = (m ? m[1] : 'info').toLowerCase();
      const label = m ? m[2] : row;
      const line = d.createElement('div');
      line.className = 'viz-status';
      const dot = d.createElement('span');
      dot.className = `viz-status-dot viz-status-${state}`;
      const txt = d.createElement('span');
      inlineInto(txt, label, ctx);
      line.append(dot, txt);
      wrap.appendChild(line);
    }
    return wrap;
  },

  gauge(block, ctx) {
    const d = ctx.document;
    const raw = [block.args, ...block.lines].join(' ').trim();
    const m = /^(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?\s*(.*)$/.exec(raw);
    if (!m) return null;
    const value = Number(m[1]);
    const max = m[2] != null ? Number(m[2]) : 100;
    const label = m[3] || '';
    const frac = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
    const wrap = d.createElement('div');
    wrap.className = 'viz-gauge';
    const svg = svgEl(d, 'svg', { viewBox: '0 0 120 74', width: 120, height: 74 });
    svg.appendChild(svgEl(d, 'path', { class: 'viz-gauge-track', d: arcPath(60, 62, 46, 180, 0), fill: 'none' }));
    // full arc with dash sweep so the fill animates 0 → value
    const fill = svgEl(d, 'path', {
      class: 'viz-gauge-fill',
      d: arcPath(60, 62, 46, 180, 0),
      fill: 'none',
      pathLength: '100',
      'stroke-dasharray': '100',
      'stroke-dashoffset': reduced(d) ? String(100 - frac * 100) : '100',
    });
    svg.appendChild(fill);
    if (!reduced(d)) {
      d.defaultView?.requestAnimationFrame?.(() =>
        d.defaultView?.requestAnimationFrame?.(() => fill.setAttribute('stroke-dashoffset', String(100 - frac * 100))),
      );
    }
    const val = svgEl(d, 'text', { class: 'viz-gauge-val', x: 60, y: 58, 'text-anchor': 'middle' });
    val.textContent = max === 100 ? `${Math.round(frac * 100)}%` : `${value}`;
    svg.appendChild(val);
    wrap.appendChild(svg);
    if (label) {
      const l = d.createElement('div');
      l.className = 'viz-gauge-label';
      l.textContent = label;
      wrap.appendChild(l);
    }
    return wrap;
  },

  rating(block, ctx) {
    const d = ctx.document;
    const raw = [block.args, ...block.lines].join(' ').trim();
    const m = /^(\d+)\s*\/\s*(\d+)\s*(.*)$/.exec(raw);
    if (!m) return null;
    const n = Number(m[1]);
    const total = Number(m[2]);
    const wrap = d.createElement('div');
    wrap.className = 'viz-rating';
    const stars = d.createElement('span');
    stars.className = 'viz-rating-stars';
    for (let k = 0; k < total; k++) {
      const star = d.createElement('span');
      star.className = 'viz-star' + (k < n ? ' viz-star-on' : '');
      star.textContent = k < n ? '★' : '☆';
      stars.appendChild(star);
    }
    wrap.appendChild(stars);
    if (m[3]) {
      const lab = d.createElement('span');
      lab.className = 'viz-rating-label';
      lab.textContent = m[3];
      wrap.appendChild(lab);
    }
    return wrap;
  },

  // --- malware-analysis + data components ---

  ioc(block, ctx) {
    const d = ctx.document;
    const rows = block.lines.map((l) => l.trim()).filter(Boolean);
    if (!rows.length) return null;
    const wrap = d.createElement('div');
    wrap.className = 'viz-ioc';
    for (const row of rows) {
      const m = /^(\S+)\s+(.+?)(?:\s*\|\s*(.*))?$/.exec(row);
      if (!m) continue;
      const line = d.createElement('div');
      line.className = 'viz-ioc-row';
      const type = d.createElement('span');
      type.className = 'viz-ioc-type';
      type.textContent = m[1];
      const val = d.createElement('span');
      val.className = 'viz-ioc-val';
      val.textContent = m[2];
      const copy = d.createElement('button');
      copy.type = 'button';
      copy.className = 'viz-ioc-copy';
      copy.textContent = '⧉';
      copy.title = 'copy';
      copy.addEventListener('click', () => {
        d.defaultView?.navigator?.clipboard?.writeText(m[2]);
        copy.textContent = '✓';
        setTimeout(() => (copy.textContent = '⧉'), 1000);
      });
      line.append(type, val, copy);
      if (m[3]) {
        const note = d.createElement('span');
        note.className = 'viz-ioc-note';
        note.textContent = m[3];
        line.appendChild(note);
      }
      wrap.appendChild(line);
    }
    return wrap;
  },

  verdict(block, ctx) {
    const d = ctx.document;
    const raw = (block.args || block.lines.join(' ')).trim();
    const m = /^(malicious|suspicious|clean|benign|unknown)\s*(.*)$/i.exec(raw);
    const level = (m ? m[1] : 'unknown').toLowerCase();
    const rest = m ? m[2] : raw;
    const wrap = d.createElement('div');
    wrap.className = `viz-verdict viz-verdict-${level}`;
    const badge = d.createElement('div');
    badge.className = 'viz-verdict-level';
    badge.textContent = level.toUpperCase();
    const info = d.createElement('div');
    info.className = 'viz-verdict-info';
    inlineInto(info, rest, ctx);
    wrap.append(badge, info);
    return wrap;
  },

  mitre(block, ctx) {
    const d = ctx.document;
    const items = [block.args, ...block.lines]
      .join('\n')
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!items.length) return null;
    const wrap = d.createElement('div');
    wrap.className = 'viz-mitre';
    for (const it of items) {
      const m = /^(T\d{4}(?:\.\d{3})?)\s*(.*)$/i.exec(it);
      const chip = d.createElement('span');
      chip.className = 'viz-mitre-chip';
      const id = d.createElement('span');
      id.className = 'viz-mitre-id';
      id.textContent = m ? m[1] : it;
      chip.appendChild(id);
      if (m && m[2]) {
        const name = d.createElement('span');
        name.className = 'viz-mitre-name';
        name.textContent = m[2];
        chip.appendChild(name);
      }
      wrap.appendChild(chip);
    }
    return wrap;
  },

  hexdump(block, ctx) {
    const d = ctx.document;
    const text = block.lines.join('\n');
    if (!text) return null;
    const enc = d.defaultView?.TextEncoder ? new d.defaultView.TextEncoder() : null;
    const bytes = enc ? enc.encode(text) : Uint8Array.from([...text].map((c) => c.charCodeAt(0) & 0xff));
    const wrap = d.createElement('div');
    wrap.className = 'viz-hexdump';
    for (let off = 0; off < bytes.length; off += 16) {
      const row = bytes.slice(off, off + 16);
      const line = d.createElement('div');
      line.className = 'viz-hex-row';
      const o = d.createElement('span');
      o.className = 'viz-hex-off';
      o.textContent = off.toString(16).padStart(8, '0');
      const hex = d.createElement('span');
      hex.className = 'viz-hex-bytes';
      hex.textContent = [...row].map((b) => b.toString(16).padStart(2, '0')).join(' ').padEnd(47, ' ');
      const ascii = d.createElement('span');
      ascii.className = 'viz-hex-ascii';
      ascii.textContent = [...row].map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('');
      line.append(o, hex, ascii);
      wrap.appendChild(line);
    }
    return wrap;
  },

  yara(block, ctx) {
    const d = ctx.document;
    const pre = d.createElement('pre');
    pre.className = 'viz-yara';
    const kw = /\b(rule|meta|strings|condition|import|include|private|global|and|or|not|all|any|of|them|for|in|at|filesize|entrypoint)\b/g;
    for (const raw of block.lines) {
      const line = d.createElement('div');
      let last = 0;
      let mm;
      kw.lastIndex = 0;
      while ((mm = kw.exec(raw))) {
        if (mm.index > last) line.appendChild(d.createTextNode(raw.slice(last, mm.index)));
        const k = d.createElement('span');
        k.className = 'viz-yara-kw';
        k.textContent = mm[0];
        line.appendChild(k);
        last = mm.index + mm[0].length;
      }
      line.appendChild(d.createTextNode(raw.slice(last) || '​'));
      pre.appendChild(line);
    }
    return pre;
  },

  score(block, ctx) {
    const d = ctx.document;
    const raw = [block.args, ...block.lines].join(' ').trim();
    const m = /^(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?\s*([A-F][+-]?|\w+)?\s*(.*)$/.exec(raw);
    if (!m) return null;
    const value = m[1];
    const max = m[2];
    const grade = m[3] || '';
    const label = m[4] || '';
    const wrap = d.createElement('div');
    wrap.className = 'viz-score';
    const big = d.createElement('div');
    big.className = 'viz-score-value';
    countUp(d, big, value + (max ? ` / ${max}` : ''));
    wrap.appendChild(big);
    if (grade) {
      const g = d.createElement('div');
      g.className = 'viz-score-grade';
      g.textContent = grade;
      wrap.appendChild(g);
    }
    if (label) {
      const l = d.createElement('div');
      l.className = 'viz-score-label';
      l.textContent = label;
      wrap.appendChild(l);
    }
    return wrap;
  },

  heatmap(block, ctx) {
    const d = ctx.document;
    const rows = block.lines
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n)));
    if (!rows.length) return null;
    const max = Math.max(1, ...rows.flat());
    const wrap = d.createElement('div');
    wrap.className = 'viz-heatmap';
    for (const row of rows) {
      const r = d.createElement('div');
      r.className = 'viz-heatmap-row';
      for (const v of row) {
        const cell = d.createElement('span');
        cell.className = 'viz-heatmap-cell';
        cell.style.background = `color-mix(in srgb, var(--viz-accent) ${Math.round((v / max) * 100)}%, var(--viz-paper))`;
        cell.title = String(v);
        r.appendChild(cell);
      }
      wrap.appendChild(r);
    }
    return wrap;
  },

  dtimeline(block, ctx) {
    const d = ctx.document;
    const rows = block.lines
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const m = /^(.+?)\s*\|\s*(.*)$/.exec(l);
        return m ? { stamp: m[1], text: m[2] } : { stamp: '', text: l };
      });
    if (!rows.length) return null;
    const wrap = d.createElement('div');
    wrap.className = 'viz-dtimeline';
    for (const r of rows) {
      const item = d.createElement('div');
      item.className = 'viz-dt-item';
      const stamp = d.createElement('div');
      stamp.className = 'viz-dt-stamp';
      stamp.textContent = r.stamp;
      const marker = d.createElement('div');
      marker.className = 'viz-dt-marker';
      const body = d.createElement('div');
      body.className = 'viz-dt-body';
      inlineInto(body, r.text, ctx);
      item.append(stamp, marker, body);
      wrap.appendChild(item);
    }
    return wrap;
  },

  compare(block, ctx) {
    const d = ctx.document;
    const sections = splitSections(block.lines);
    if (sections.length < 2) return null;
    const wrap = d.createElement('div');
    wrap.className = 'viz-compare';
    sections.slice(0, 2).forEach((s, i) => {
      if (i) {
        const vs = d.createElement('div');
        vs.className = 'viz-compare-vs';
        vs.textContent = 'vs';
        wrap.appendChild(vs);
      }
      const side = d.createElement('div');
      side.className = 'viz-compare-side';
      const h = d.createElement('div');
      h.className = 'viz-compare-title';
      h.textContent = s.label;
      const body = d.createElement('div');
      body.appendChild(ctx.renderMarkdown(s.lines.join('\n')));
      side.append(h, body);
      wrap.appendChild(side);
    });
    return wrap;
  },

  ring(block, ctx) {
    const d = ctx.document;
    const raw = [block.args, ...block.lines].join(' ').trim();
    const m = /^(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?\s*(.*)$/.exec(raw);
    if (!m) return null;
    const value = Number(m[1]);
    const max = m[2] != null ? Number(m[2]) : 100;
    const label = m[3] || '';
    const frac = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
    const circ = 2 * Math.PI * 26;
    const wrap = d.createElement('div');
    wrap.className = 'viz-ring';
    const svg = svgEl(d, 'svg', { viewBox: '0 0 64 64', width: 64, height: 64 });
    svg.appendChild(svgEl(d, 'circle', { class: 'viz-ring-track', cx: 32, cy: 32, r: 26, fill: 'none' }));
    const arc = svgEl(d, 'circle', {
      class: 'viz-ring-fill',
      cx: 32,
      cy: 32,
      r: 26,
      fill: 'none',
      transform: 'rotate(-90 32 32)',
      'stroke-dasharray': String(circ.toFixed(1)),
      'stroke-dashoffset': reduced(d) ? String((circ * (1 - frac)).toFixed(1)) : String(circ.toFixed(1)),
    });
    svg.appendChild(arc);
    const txt = svgEl(d, 'text', { class: 'viz-ring-text', x: 32, y: 32, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
    txt.textContent = max === 100 ? `${Math.round(frac * 100)}%` : `${value}`;
    svg.appendChild(txt);
    wrap.appendChild(svg);
    if (!reduced(d)) {
      d.defaultView?.requestAnimationFrame?.(() =>
        d.defaultView?.requestAnimationFrame?.(() => arc.setAttribute('stroke-dashoffset', String((circ * (1 - frac)).toFixed(1)))),
      );
    }
    if (label) {
      const l = d.createElement('div');
      l.className = 'viz-ring-label';
      l.textContent = label;
      wrap.appendChild(l);
    }
    return wrap;
  },

  banner(block, ctx) {
    const d = ctx.document;
    const parts = (block.args || block.lines[0] || '').split('|');
    const el = d.createElement('div');
    el.className = 'viz-banner';
    const t = d.createElement('div');
    t.className = 'viz-banner-title';
    inlineInto(t, (parts[0] || '').trim(), ctx);
    el.appendChild(t);
    const subText = [parts.slice(1).join('|'), ...block.lines.slice(block.args ? 0 : 1)].filter(Boolean).join(' ').trim();
    if (subText) {
      const s = d.createElement('div');
      s.className = 'viz-banner-sub';
      inlineInto(s, subText, ctx);
      el.appendChild(s);
    }
    return el;
  },

  note(block, ctx) {
    const d = ctx.document;
    const el = d.createElement('div');
    el.className = 'viz-note';
    if (block.args) {
      const h = d.createElement('div');
      h.className = 'viz-note-pin';
      h.textContent = block.args;
      el.appendChild(h);
    }
    const body = d.createElement('div');
    body.className = 'viz-note-body';
    body.appendChild(ctx.renderMarkdown(block.lines.join('\n')));
    el.appendChild(body);
    return el;
  },

  quote(block, ctx) {
    const d = ctx.document;
    const text = block.lines.join('\n').trim() || block.args;
    const m = /^([\s\S]*?)\s+[—-]{1,2}\s+(.+)$/.exec(text);
    const el = d.createElement('blockquote');
    el.className = 'viz-pullquote';
    const q = d.createElement('div');
    q.className = 'viz-pullquote-text';
    inlineInto(q, (m ? m[1] : text).trim(), ctx);
    el.appendChild(q);
    if (m) {
      const cite = d.createElement('div');
      cite.className = 'viz-pullquote-cite';
      cite.textContent = m[2].trim();
      el.appendChild(cite);
    }
    return el;
  },

  swatches(block, ctx) {
    const d = ctx.document;
    const items = [block.args, ...block.lines]
      .join('\n')
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!items.length) return null;
    const wrap = d.createElement('div');
    wrap.className = 'viz-swatches';
    for (const it of items) {
      const m = /^(#[0-9a-f]{3,8}|rgb[a]?\([^)]+\))\s*(.*)$/i.exec(it);
      if (!m) continue;
      const sw = d.createElement('div');
      sw.className = 'viz-swatch';
      const chip = d.createElement('div');
      chip.className = 'viz-swatch-chip';
      chip.style.background = m[1];
      const meta = d.createElement('div');
      meta.className = 'viz-swatch-meta';
      const name = d.createElement('div');
      name.className = 'viz-swatch-name';
      name.textContent = m[2] || m[1];
      const hex = d.createElement('div');
      hex.className = 'viz-swatch-hex';
      hex.textContent = m[1];
      meta.append(name, hex);
      sw.append(chip, meta);
      wrap.appendChild(sw);
    }
    return wrap;
  },

  // --- animated widgets (CSS/SMIL-driven, no JS timers) ---

  spinner(block, ctx) {
    const d = ctx.document;
    const wrap = d.createElement('span');
    wrap.className = 'viz-spinnerw';
    const svg = svgEl(d, 'svg', { class: 'viz-spinner-svg', viewBox: '0 0 24 24', width: 20, height: 20 });
    svg.appendChild(svgEl(d, 'circle', { class: 'viz-spinner-track', cx: 12, cy: 12, r: 9, fill: 'none' }));
    svg.appendChild(
      svgEl(d, 'path', { class: 'viz-spinner-arc', d: 'M12 3 a9 9 0 0 1 9 9', fill: 'none' }),
    );
    wrap.appendChild(svg);
    if (block.args) {
      const l = d.createElement('span');
      l.className = 'viz-spinner-label';
      l.textContent = block.args;
      wrap.appendChild(l);
    }
    return wrap;
  },

  loader(block, ctx) {
    const d = ctx.document;
    const wrap = d.createElement('div');
    if (block.args) {
      const l = d.createElement('div');
      l.className = 'viz-loader-label';
      l.textContent = block.args;
      wrap.appendChild(l);
    }
    const bar = d.createElement('div');
    bar.className = 'viz-loader';
    const inner = d.createElement('span');
    inner.className = 'viz-loader-bar';
    bar.appendChild(inner);
    wrap.appendChild(bar);
    return wrap;
  },

  pulsedot(block, ctx) {
    const d = ctx.document;
    const el = d.createElement('span');
    el.className = 'viz-pulsedot';
    const l = d.createElement('span');
    inlineInto(l, block.args || 'live', ctx);
    el.appendChild(l);
    return el;
  },

  typewriter(block, ctx) {
    const d = ctx.document;
    const text = (block.args || block.lines.join(' ')).trim();
    const el = d.createElement('div');
    el.className = 'viz-typewriter';
    el.style.setProperty('--viz-tw', `${Math.max(4, text.length)}ch`);
    el.textContent = text;
    return el;
  },

  beacon(block, ctx) {
    const d = ctx.document;
    const wrap = d.createElement('div');
    const w = d.createElement('span');
    w.className = 'viz-beaconw';
    w.appendChild(Object.assign(d.createElement('span'), { className: 'viz-beaconw-core' }));
    w.appendChild(Object.assign(d.createElement('span'), { className: 'viz-beaconw-ring' }));
    w.appendChild(Object.assign(d.createElement('span'), { className: 'viz-beaconw-ring' }));
    wrap.appendChild(w);
    if (block.args) {
      const l = d.createElement('span');
      l.className = 'viz-beaconw-label';
      l.textContent = block.args;
      wrap.appendChild(l);
    }
    return wrap;
  },

  radar(block, ctx) {
    const d = ctx.document;
    const svg = svgEl(d, 'svg', { class: 'viz-radar', viewBox: '0 0 140 140', width: 150, height: 150 });
    for (const r of [22, 44, 66]) svg.appendChild(svgEl(d, 'circle', { class: 'viz-radar-grid', cx: 70, cy: 70, r }));
    svg.appendChild(svgEl(d, 'line', { class: 'viz-radar-grid', x1: 4, y1: 70, x2: 136, y2: 70 }));
    svg.appendChild(svgEl(d, 'line', { class: 'viz-radar-grid', x1: 70, y1: 4, x2: 70, y2: 136 }));
    const sweep = svgEl(d, 'path', { class: 'viz-radar-sweep', d: 'M70 70 L70 6 A64 64 0 0 1 128 44 Z' });
    svg.appendChild(sweep);
    for (const [cx, cy] of [[96, 52], [52, 92], [86, 96]]) {
      svg.appendChild(svgEl(d, 'circle', { class: 'viz-radar-blip', cx, cy, r: 3 }));
    }
    return svg;
  },

  countdown(block, ctx) {
    const d = ctx.document;
    const raw = (block.args || '7s').trim();
    const dur = /^(\d+)/.exec(raw)?.[1] || '7';
    const circ = 163;
    const wrap = d.createElement('div');
    wrap.className = 'viz-countw';
    const svg = svgEl(d, 'svg', { viewBox: '0 0 60 60', width: 60, height: 60 });
    svg.appendChild(svgEl(d, 'circle', { class: 'viz-count-track', cx: 30, cy: 30, r: 26, fill: 'none' }));
    const arc = svgEl(d, 'circle', {
      class: 'viz-count-arc',
      cx: 30,
      cy: 30,
      r: 26,
      fill: 'none',
      transform: 'rotate(-90 30 30)',
      'stroke-dasharray': String(circ),
    });
    // SMIL deplete over the duration (no JS timer)
    const anim = svgEl(d, 'animate', {
      attributeName: 'stroke-dashoffset',
      from: '0',
      to: String(circ),
      dur: `${dur}s`,
      repeatCount: 'indefinite',
    });
    arc.appendChild(anim);
    svg.appendChild(arc);
    wrap.appendChild(svg);
    const lab = d.createElement('div');
    lab.className = 'viz-count-label';
    lab.textContent = block.lines.join(' ').trim() || `${dur}s`;
    wrap.appendChild(lab);
    return wrap;
  },

  matrix(block, ctx) {
    const d = ctx.document;
    const wrap = d.createElement('div');
    wrap.className = 'viz-matrix';
    const glyphs = '01ｱｲｳｴｵｶｷｸｹｺﾊﾋﾌﾍﾎ<>/\\|=+*#';
    const cols = 26;
    for (let i = 0; i < cols; i++) {
      const span = d.createElement('span');
      span.style.left = `${(i / cols) * 100}%`;
      span.style.animationDuration = `${3 + ((i * 37) % 40) / 10}s`;
      span.style.animationDelay = `${((i * 53) % 70) / 10}s`;
      let s = '';
      for (let j = 0; j < 14; j++) s += glyphs[(i * 7 + j * 13) % glyphs.length] + '\n';
      span.textContent = s;
      wrap.appendChild(span);
    }
    return wrap;
  },

  legend(block, ctx) {
    const d = ctx.document;
    const rows = block.lines.map((l) => l.trim()).filter(Boolean);
    if (!rows.length) return null;
    const wrap = d.createElement('div');
    wrap.className = 'viz-legend';
    const varMap = { ok: 'var(--viz-ok)', warn: 'var(--viz-warn)', err: 'var(--viz-err)', accent: 'var(--viz-accent)', muted: 'var(--viz-muted)', ink: 'var(--viz-ink)' };
    for (const row of rows) {
      const m = /^(\S+)\s+(.*)$/.exec(row);
      if (!m) continue;
      const color = varMap[m[1].toLowerCase()] || (/^#|^rgb/.test(m[1]) ? m[1] : 'var(--viz-muted)');
      const item = d.createElement('span');
      item.className = 'viz-legend-item';
      const sw = d.createElement('span');
      sw.className = 'viz-legend-swatch';
      sw.style.background = color;
      const lab = d.createElement('span');
      lab.textContent = m[2];
      item.append(sw, lab);
      wrap.appendChild(item);
    }
    return wrap;
  },
};
