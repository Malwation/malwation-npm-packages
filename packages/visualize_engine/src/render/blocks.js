// Document AST → themed DOM. All user text lands via textContent; urls pass
// safeUrl or the attribute is dropped. Viz blocks delegate to ctx.renderViz.

import { safeUrl } from '../util/sanitize.js';
import { parseDoc } from '../parse/markdown.js';
import { renderDirective } from './components.js';

export function renderBlocks(docAst, ctx) {
  const d = ctx.document;
  // helpers for nested content (used by directive components)
  if (!ctx.renderMarkdown) ctx.renderMarkdown = (text) => renderBlocks(parseDoc(text), ctx);
  if (!ctx.renderInlines) ctx.renderInlines = (inlines, parent) => appendInlines(parent, inlines, ctx);
  const frag = d.createDocumentFragment();
  for (const b of docAst.blocks) {
    const el = renderBlock(b, ctx);
    if (el) frag.appendChild(el);
  }
  return frag;
}

function renderBlock(b, ctx) {
  const d = ctx.document;
  switch (b.type) {
    case 'heading': {
      const h = d.createElement(`h${b.level}`);
      h.className = `viz-h${b.level}`;
      appendInlines(h, b.inlines, ctx);
      return h;
    }
    case 'para': {
      const p = d.createElement('p');
      p.className = 'viz-para';
      appendInlines(p, b.inlines, ctx);
      return p;
    }
    case 'list':
      return renderList(b, ctx);
    case 'quote': {
      const q = d.createElement('blockquote');
      q.className = 'viz-quote';
      for (const inner of b.blocks) {
        const el = renderBlock(inner, ctx);
        if (el) q.appendChild(el);
      }
      return q;
    }
    case 'table':
      return renderTable(b, ctx);
    case 'callout':
      return renderCallout(b, ctx);
    case 'dl':
      return renderDl(b, ctx);
    case 'collapse':
      return renderCollapse(b, ctx);
    case 'directive':
      return renderDirective(b, ctx);
    case 'filetree':
      return renderFiletree(b, ctx);
    case 'diff':
      return renderDiff(b, ctx);
    case 'code':
      if (b.lang === 'html' && b.closed) return renderHtmlPreview(b, ctx);
      return renderCode(b, ctx);
    case 'viz':
      return renderVizBlock(b, ctx);
    case 'figure':
      return renderFigure(b, ctx);
    case 'hr': {
      const hr = d.createElement('hr');
      hr.className = 'viz-hr';
      return hr;
    }
    default:
      return null;
  }
}

function renderList(b, ctx) {
  const d = ctx.document;
  const list = d.createElement(b.ordered ? 'ol' : 'ul');
  list.className = `viz-list ${b.ordered ? 'viz-ol' : 'viz-ul'}`;
  for (const item of b.items) {
    const li = d.createElement('li');
    if (item.task) {
      li.className = `viz-task${item.task === 'done' ? ' viz-task-done' : ''}`;
      const check = d.createElement('span');
      check.className = 'viz-check';
      check.textContent = item.task === 'done' ? '[x]' : '[ ]';
      li.appendChild(check);
    }
    appendInlines(li, item.inlines, ctx);
    for (const child of item.children) {
      const el = renderBlock(child, ctx);
      if (el) li.appendChild(el);
    }
    list.appendChild(li);
  }
  return list;
}

function renderCallout(b, ctx) {
  const d = ctx.document;
  const box = d.createElement('div');
  box.className = `viz-callout viz-callout-${b.kind}`;
  const title = d.createElement('div');
  title.className = 'viz-callout-title';
  title.textContent = b.title || b.kind.toUpperCase();
  box.appendChild(title);
  const body = d.createElement('div');
  body.className = 'viz-callout-body';
  for (const inner of b.blocks) {
    const el = renderBlock(inner, ctx);
    if (el) body.appendChild(el);
  }
  box.appendChild(body);
  return box;
}

function renderDl(b, ctx) {
  const d = ctx.document;
  const dl = d.createElement('div');
  dl.className = 'viz-dl';
  for (const item of b.items) {
    const term = d.createElement('div');
    term.className = 'viz-dl-term';
    term.textContent = item.term;
    const def = d.createElement('div');
    def.className = 'viz-dl-def';
    appendInlines(def, item.def, ctx);
    dl.append(term, def);
  }
  return dl;
}

function renderCollapse(b, ctx) {
  const d = ctx.document;
  const details = d.createElement('details');
  details.className = `viz-collapse${b.closed ? '' : ' viz-pending'}`;
  if (!b.closed) details.open = true;
  const summary = d.createElement('summary');
  summary.textContent = b.summary;
  details.appendChild(summary);
  const body = d.createElement('div');
  body.className = 'viz-collapse-body';
  for (const inner of b.blocks) {
    const el = renderBlock(inner, ctx);
    if (el) body.appendChild(el);
  }
  details.appendChild(body);
  return details;
}

// Claude-web-style previewer for closed ```html fences: tabbed preview/code.
// The iframe is sandboxed with allow-scripts only (no same-origin) — the
// document runs isolated from the host page.
function renderHtmlPreview(b, ctx) {
  const d = ctx.document;
  const wrap = d.createElement('div');
  wrap.className = 'viz-preview';
  const tabs = d.createElement('div');
  tabs.className = 'viz-preview-tabs';
  const btnPreview = d.createElement('button');
  btnPreview.type = 'button';
  btnPreview.textContent = 'preview';
  btnPreview.className = 'active';
  const btnCode = d.createElement('button');
  btnCode.type = 'button';
  btnCode.textContent = 'code';
  tabs.append(btnPreview, btnCode);
  wrap.appendChild(tabs);

  const frame = d.createElement('iframe');
  frame.className = 'viz-preview-frame';
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.setAttribute('title', 'html preview');
  frame.srcdoc = b.text;
  wrap.appendChild(frame);

  const code = renderCode(b, ctx);
  code.style.display = 'none';
  wrap.appendChild(code);

  const select = (preview) => {
    btnPreview.className = preview ? 'active' : '';
    btnCode.className = preview ? '' : 'active';
    frame.style.display = preview ? 'block' : 'none';
    code.style.display = preview ? 'none' : 'block';
  };
  btnPreview.addEventListener('click', () => select(true));
  btnCode.addEventListener('click', () => select(false));
  return wrap;
}

function renderTable(b, ctx) {
  const d = ctx.document;
  const table = d.createElement('table');
  table.className = 'viz-table';
  const alignOf = (i) => b.aligns[i] ?? null;
  const thead = d.createElement('thead');
  const hrow = d.createElement('tr');
  b.header.forEach((cell, i) => {
    const th = d.createElement('th');
    if (alignOf(i)) th.style.textAlign = alignOf(i);
    appendInlines(th, cell, ctx);
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  table.appendChild(thead);
  const tbody = d.createElement('tbody');
  for (const row of b.rows) {
    const tr = d.createElement('tr');
    row.forEach((cell, i) => {
      const td = d.createElement('td');
      if (alignOf(i)) td.style.textAlign = alignOf(i);
      appendInlines(td, cell, ctx);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

function renderCode(b, ctx, extraClass = '') {
  const d = ctx.document;
  const pre = d.createElement('pre');
  pre.className = `viz-code${b.closed === false ? ' viz-pending' : ''}${extraClass}`;
  if (b.lang) {
    const badge = d.createElement('div');
    badge.className = 'viz-code-lang';
    badge.textContent = b.lang;
    pre.appendChild(badge);
  }
  const code = d.createElement('code');
  code.textContent = b.text;
  pre.appendChild(code);
  if (b.closed !== false && b.text) {
    const copy = d.createElement('button');
    copy.type = 'button';
    copy.className = 'viz-copy';
    copy.textContent = 'copy';
    copy.addEventListener('click', () => {
      d.defaultView?.navigator?.clipboard?.writeText(b.text);
      copy.textContent = 'copied';
      setTimeout(() => (copy.textContent = 'copy'), 1200);
    });
    pre.appendChild(copy);
  }
  return pre;
}

function renderVizBlock(b, ctx) {
  const d = ctx.document;
  if (b.closed === false) {
    return renderCode({ lang: b.kind, text: b.text, closed: false }, ctx);
  }
  let el = null;
  try {
    el = ctx.renderViz(b);
  } catch {
    el = null;
  }
  if (el) return el;
  const wrap = d.createElement('div');
  wrap.appendChild(renderCode({ lang: b.kind, text: b.text, closed: true }, ctx));
  const note = d.createElement('div');
  note.className = 'viz-error-note';
  note.textContent = 'could not render diagram';
  wrap.appendChild(note);
  return wrap;
}

function renderFigure(b, ctx) {
  const d = ctx.document;
  const src = safeUrl(b.src);
  if (!src) {
    const p = d.createElement('p');
    p.className = 'viz-para';
    p.textContent = b.alt || '';
    return p;
  }
  const fig = d.createElement('figure');
  fig.className = 'viz-figure';
  const img = d.createElement('img');
  img.src = src;
  img.alt = b.alt || '';
  img.loading = 'lazy';
  fig.appendChild(img);
  if (b.alt) {
    const cap = d.createElement('figcaption');
    cap.textContent = b.alt;
    fig.appendChild(cap);
  }
  return fig;
}

// collapsible file/registry tree from 2-space-indented text
function renderFiletree(b, ctx) {
  const d = ctx.document;
  const wrap = d.createElement('div');
  wrap.className = 'viz-filetree';
  const lines = b.text.split('\n').filter((l) => l.trim());
  const rows = lines.map((l) => ({ indent: (l.match(/^ */)[0].length / 2) | 0, name: l.trim() }));
  // a row is a directory if the next row is deeper, or it ends with '/'
  const isDir = (i) =>
    rows[i].name.endsWith('/') || (i + 1 < rows.length && rows[i + 1].indent > rows[i].indent);

  let idx = 0;
  const build = (depth) => {
    const ul = d.createElement('ul');
    while (idx < rows.length && rows[idx].indent === depth) {
      const here = idx;
      const li = d.createElement('li');
      const row = d.createElement('div');
      row.className = 'viz-ft-row';
      row.textContent = rows[here].name.replace(/\/$/, '');
      li.appendChild(row);
      idx++;
      if (isDir(here)) {
        li.className = 'viz-ft-dir';
        if (idx < rows.length && rows[idx].indent > depth) li.appendChild(build(depth + 1));
        row.addEventListener('click', () => li.classList.toggle('viz-ft-collapsed'));
      } else {
        li.className = 'viz-ft-file';
      }
      ul.appendChild(li);
    }
    return ul;
  };
  wrap.appendChild(build(0));
  return wrap;
}

// unified-diff style block: +added / -removed / context
function renderDiff(b, ctx) {
  const d = ctx.document;
  const wrap = d.createElement('div');
  wrap.className = 'viz-diff';
  for (const line of b.text.split('\n')) {
    const span = d.createElement('span');
    const c = line[0];
    span.className =
      'viz-diff-line ' + (c === '+' ? 'viz-diff-add' : c === '-' ? 'viz-diff-del' : 'viz-diff-ctx');
    span.textContent = line || ' ';
    wrap.appendChild(span);
  }
  return wrap;
}

function appendInlines(parent, inlines, ctx) {
  const d = ctx.document;
  for (const inline of inlines ?? []) {
    switch (inline.type) {
      case 'text':
        parent.appendChild(d.createTextNode(inline.text));
        break;
      case 'strong': {
        const el = d.createElement('strong');
        appendInlines(el, inline.children, ctx);
        parent.appendChild(el);
        break;
      }
      case 'em': {
        const el = d.createElement('em');
        appendInlines(el, inline.children, ctx);
        parent.appendChild(el);
        break;
      }
      case 'code': {
        const el = d.createElement('code');
        el.textContent = inline.text;
        parent.appendChild(el);
        break;
      }
      case 'badge': {
        const el = d.createElement('span');
        el.className = `viz-badge viz-badge-${inline.variant}`;
        el.textContent = inline.text;
        parent.appendChild(el);
        break;
      }
      case 'progress': {
        const pct = inline.max > 0 ? Math.min(100, Math.max(0, (inline.value / inline.max) * 100)) : 0;
        const el = d.createElement('span');
        el.className = 'viz-progress';
        const track = d.createElement('span');
        track.className = 'viz-progress-track';
        const fill = d.createElement('span');
        fill.className = 'viz-progress-fill';
        const win = d.defaultView;
        const noMotion = win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (noMotion || !win?.requestAnimationFrame) {
          fill.style.width = `${pct.toFixed(1)}%`;
        } else {
          fill.style.width = '0%';
          win.requestAnimationFrame(() => win.requestAnimationFrame(() => (fill.style.width = `${pct.toFixed(1)}%`)));
        }
        track.appendChild(fill);
        const num = d.createElement('span');
        num.className = 'viz-progress-num';
        num.textContent = inline.max === 100 ? `${Math.round(pct)}%` : `${inline.value}/${inline.max}`;
        el.append(track, num);
        parent.appendChild(el);
        break;
      }
      case 'sev': {
        const el = d.createElement('span');
        el.className = 'viz-sev';
        const ratio = inline.m > 0 ? inline.n / inline.m : 0;
        const color = ratio >= 0.67 ? 'var(--viz-err)' : ratio >= 0.34 ? 'var(--viz-warn)' : 'var(--viz-ok)';
        for (let k = 0; k < inline.m; k++) {
          const dot = d.createElement('span');
          const on = k < inline.n;
          dot.className = 'viz-sev-dot' + (on ? ' viz-sev-on' : '');
          if (on) dot.style.background = color;
          el.appendChild(dot);
        }
        parent.appendChild(el);
        break;
      }
      case 'spark': {
        const vals = inline.values;
        const NS = 'http://www.w3.org/2000/svg';
        const svg = d.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'viz-spark');
        const w = 64;
        const h = 18;
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.setAttribute('width', w);
        svg.setAttribute('height', h);
        if (vals.length >= 2) {
          const min = Math.min(...vals);
          const max = Math.max(...vals);
          const span = max - min || 1;
          const pts = vals.map((v, i) => `${((i / (vals.length - 1)) * (w - 2) + 1).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`);
          const line = d.createElementNS(NS, 'polyline');
          line.setAttribute('class', 'viz-spark-line');
          line.setAttribute('points', pts.join(' '));
          line.setAttribute('fill', 'none');
          svg.appendChild(line);
          const last = pts[pts.length - 1].split(',');
          const dot = d.createElementNS(NS, 'circle');
          dot.setAttribute('class', 'viz-spark-dot');
          dot.setAttribute('cx', last[0]);
          dot.setAttribute('cy', last[1]);
          dot.setAttribute('r', '1.6');
          svg.appendChild(dot);
        }
        parent.appendChild(svg);
        break;
      }
      case 'metric': {
        const el = d.createElement('span');
        el.className = 'viz-metric';
        const v = d.createElement('span');
        v.className = 'viz-metric-value';
        v.textContent = inline.value;
        el.appendChild(v);
        if (inline.label) {
          const l = d.createElement('span');
          l.className = 'viz-metric-label';
          l.textContent = inline.label;
          el.appendChild(l);
        }
        parent.appendChild(el);
        break;
      }
      case 'avatar': {
        const el = d.createElement('span');
        el.className = 'viz-avatar';
        const initials = inline.name
          .split(/\s+/)
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        const dot = d.createElement('span');
        dot.className = 'viz-avatar-dot';
        dot.textContent = initials;
        const name = d.createElement('span');
        name.className = 'viz-avatar-name';
        name.textContent = inline.name;
        el.append(dot, name);
        parent.appendChild(el);
        break;
      }
      case 'link': {
        const href = safeUrl(inline.href);
        const el = d.createElement(href ? 'a' : 'span');
        if (href) {
          el.href = href;
          el.target = '_blank';
          el.rel = 'noopener noreferrer';
        }
        appendInlines(el, inline.children, ctx);
        parent.appendChild(el);
        break;
      }
      case 'image': {
        const src = safeUrl(inline.src);
        if (src) {
          const img = d.createElement('img');
          img.src = src;
          img.alt = inline.alt || '';
          img.style.maxHeight = '1.4em';
          img.style.verticalAlign = 'text-bottom';
          parent.appendChild(img);
        } else {
          parent.appendChild(d.createTextNode(inline.alt || ''));
        }
        break;
      }
      default:
        break;
    }
  }
}
