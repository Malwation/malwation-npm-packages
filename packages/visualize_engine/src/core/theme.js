// Theme system: each theme is a COMPLETE design language — not just a palette.
// Structural tokens (font, paper texture, node fill/filter, stroke, radius,
// elevation) let themes look genuinely different: dashed sketch, glowing neon,
// soft glass, ruled notebook, flat carbon, pixel 8bit, editorial serif…
//
// Invariant: --viz-font-mono stays monospace (code + tables need alignment).
// Diagram labels use --viz-font (proportional fonts fit: box width = even(len+4)
// cells is far wider than a proportional label).

const MONO = `ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace`;
const PLEX_MONO = `'IBM Plex Mono', ${MONO}`;
const SANS = `ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;
const SERIF = `'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif`;
const DISPLAY = `'Avenir Next', 'Futura', 'Century Gothic', ui-sans-serif, sans-serif`;
const HAND = `'Chalkboard SE', 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive`;

export const FONT = MONO; // back-compat for export

// paper textures — HTML panel bg + which SVG <pattern> the diagram builds
const PAPER = {
  grid: {
    '--viz-paper-style': 'grid',
    '--viz-bg-layer':
      'linear-gradient(var(--viz-grid) 1px,transparent 1px),linear-gradient(90deg,var(--viz-grid) 1px,transparent 1px)',
    '--viz-bg-size': '9px 9px',
  },
  dots: {
    '--viz-paper-style': 'dots',
    '--viz-bg-layer': 'radial-gradient(var(--viz-grid) 1.2px,transparent 1.5px)',
    '--viz-bg-size': '12px 12px',
  },
  blueprint: {
    '--viz-paper-style': 'blueprint',
    '--viz-bg-layer':
      'linear-gradient(var(--viz-grid) 1px,transparent 1px),linear-gradient(90deg,var(--viz-grid) 1px,transparent 1px)',
    '--viz-bg-size': '22px 22px',
  },
  scanline: {
    '--viz-paper-style': 'scanline',
    '--viz-bg-layer': 'repeating-linear-gradient(transparent,transparent 26px,var(--viz-grid) 27px)',
    '--viz-bg-size': 'auto',
  },
  plain: { '--viz-paper-style': 'plain', '--viz-bg-layer': 'none', '--viz-bg-size': 'auto' },
};

const ELEV = {
  hard: '4px 4px 0 var(--viz-shadow)',
  soft: '0 10px 30px var(--viz-shadow)',
  glow: '0 0 16px var(--viz-shadow)',
  none: 'none',
};

const base = {
  '--viz-font': MONO,
  '--viz-font-mono': MONO,
  '--viz-dash-frame': '4 3',
  '--viz-dash-edge': '4 4',
  '--viz-stroke-w': '1.25',
  '--viz-radius': '0',
  '--viz-border-style': 'dashed',
  '--viz-node-fill': 'none',
  '--viz-node-filter': 'none',
  '--viz-elev': ELEV.hard,
  '--viz-node-style': 'plain',
  ...PAPER.grid,
};

// solid-stroke default used by most non-sketch languages
const solid = {
  '--viz-dash-frame': 'none',
  '--viz-dash-edge': 'none',
  '--viz-border-style': 'solid',
  '--viz-stroke-w': '1.5',
};

export const THEMES = {
  sketch: {
    ...base,
    '--viz-paper': '#ffffff',
    '--viz-grid': '#e8e8e8',
    '--viz-ink': '#1a1a1a',
    '--viz-muted': '#6b6b6b',
    '--viz-accent': '#1a1a1a',
    '--viz-shadow': 'rgba(26,26,26,0.10)',
    '--viz-ok': '#1a7f37',
    '--viz-warn': '#b58900',
    '--viz-err': '#b00020',
  },
  'sketch-dark': {
    ...base,
    '--viz-paper': '#111213',
    '--viz-grid': '#242628',
    '--viz-ink': '#d8d8d8',
    '--viz-muted': '#8a8a8a',
    '--viz-accent': '#d8d8d8',
    '--viz-shadow': 'rgba(0,0,0,0.5)',
    '--viz-ok': '#4ade80',
    '--viz-warn': '#e3b341',
    '--viz-err': '#f87171',
  },
  blueprint: {
    ...base,
    ...solid,
    ...PAPER.blueprint,
    '--viz-font': MONO,
    '--viz-paper': '#0d3b66',
    '--viz-node-style': 'cut',
    '--viz-grid': 'rgba(210,232,255,0.16)',
    '--viz-ink': '#dcebff',
    '--viz-muted': '#8fb4dd',
    '--viz-accent': '#7fd4ff',
    '--viz-shadow': 'rgba(0,10,30,0.4)',
    '--viz-ok': '#9dffb0',
    '--viz-warn': '#ffe08a',
    '--viz-err': '#ff9d9d',
    '--viz-stroke-w': '1',
    '--viz-elev': ELEV.none,
  },
  neon: {
    ...base,
    ...solid,
    ...PAPER.dots,
    '--viz-font': DISPLAY,
    '--viz-paper': '#0a0a14',
    '--viz-node-style': 'rounded',
    '--viz-grid': '#1c1c33',
    '--viz-ink': '#e6f9ff',
    '--viz-muted': '#7a7ab0',
    '--viz-accent': '#00e5ff',
    '--viz-shadow': 'rgba(0,229,255,0.5)',
    '--viz-ok': '#39ff14',
    '--viz-warn': '#ffd400',
    '--viz-err': '#ff2e63',
    '--viz-radius': '4',
    '--viz-node-fill': 'rgba(0,229,255,0.06)',
    '--viz-node-filter': 'url(#viz-glow)',
    '--viz-elev': ELEV.glow,
  },
  notebook: {
    ...base,
    ...solid,
    ...PAPER.scanline,
    '--viz-font': HAND,
    '--viz-paper': '#fbf6e9',
    '--viz-node-style': 'plain',
    '--viz-grid': '#e4d9bd',
    '--viz-ink': '#2c2c3a',
    '--viz-muted': '#7c7460',
    '--viz-accent': '#c0392b',
    '--viz-shadow': 'rgba(120,100,60,0.25)',
    '--viz-ok': '#2e7d32',
    '--viz-warn': '#c77800',
    '--viz-err': '#c0392b',
    '--viz-radius': '3',
    '--viz-elev': ELEV.soft,
  },
  glass: {
    ...base,
    ...solid,
    ...PAPER.plain,
    '--viz-font': SANS,
    '--viz-paper': '#eef1fa',
    '--viz-node-style': 'window',
    '--viz-grid': '#dfe4f2',
    '--viz-ink': '#1e2233',
    '--viz-muted': '#6b7280',
    '--viz-accent': '#6366f1',
    '--viz-shadow': 'rgba(60,70,120,0.20)',
    '--viz-ok': '#10b981',
    '--viz-warn': '#f59e0b',
    '--viz-err': '#ef4444',
    '--viz-radius': '12',
    '--viz-node-fill': 'rgba(255,255,255,0.6)',
    '--viz-node-filter': 'url(#viz-soft)',
    '--viz-elev': ELEV.soft,
  },
  terminal: {
    ...base,
    ...solid,
    ...PAPER.scanline,
    '--viz-font': MONO,
    '--viz-paper': '#001206',
    '--viz-node-style': 'bracket',
    '--viz-grid': 'rgba(51,255,102,0.10)',
    '--viz-ink': '#33ff66',
    '--viz-muted': '#1f9c46',
    '--viz-accent': '#b6ff00',
    '--viz-shadow': 'rgba(51,255,102,0.45)',
    '--viz-ok': '#33ff66',
    '--viz-warn': '#ffd400',
    '--viz-err': '#ff5f5f',
    '--viz-node-filter': 'url(#viz-glow)',
    '--viz-elev': ELEV.glow,
  },
  carbon: {
    ...base,
    ...solid,
    ...PAPER.plain,
    '--viz-font': PLEX_MONO,
    '--viz-font-mono': PLEX_MONO,
    '--viz-paper': '#f4f4f4',
    '--viz-node-style': 'plain',
    '--viz-grid': '#dcdcdc',
    '--viz-ink': '#161616',
    '--viz-muted': '#525252',
    '--viz-accent': '#0f62fe',
    '--viz-shadow': 'rgba(22,22,22,0.12)',
    '--viz-ok': '#24a148',
    '--viz-warn': '#f1c21b',
    '--viz-err': '#da1e28',
    '--viz-stroke-w': '1',
    '--viz-elev': ELEV.none,
  },
  '8bit': {
    ...base,
    ...solid,
    ...PAPER.dots,
    '--viz-font': MONO,
    '--viz-paper': '#1a1c2c',
    '--viz-node-style': 'double',
    '--viz-grid': '#2b2f4a',
    '--viz-ink': '#f4f0e8',
    '--viz-muted': '#94a1b2',
    '--viz-accent': '#ffcd75',
    '--viz-shadow': 'rgba(0,0,0,0.6)',
    '--viz-ok': '#a7f070',
    '--viz-warn': '#ffcd75',
    '--viz-err': '#ff5d5d',
    '--viz-stroke-w': '2',
    '--viz-elev': ELEV.hard,
  },
  ink: {
    ...base,
    ...solid,
    ...PAPER.plain,
    '--viz-font': SERIF,
    '--viz-paper': '#fbfbf8',
    '--viz-node-style': 'underline',
    '--viz-grid': '#e6e6e0',
    '--viz-ink': '#1a1a1a',
    '--viz-muted': '#707068',
    '--viz-accent': '#b00020',
    '--viz-shadow': 'rgba(0,0,0,0.10)',
    '--viz-ok': '#1a7f37',
    '--viz-warn': '#9a6700',
    '--viz-err': '#b00020',
    '--viz-stroke-w': '1',
    '--viz-elev': ELEV.none,
  },
  'crt-amber': {
    ...base, ...solid, ...PAPER.scanline,
    '--viz-font': MONO,
    '--viz-paper': '#1a1000', '--viz-grid': 'rgba(255,176,0,0.10)',
    '--viz-ink': '#ffb000', '--viz-muted': '#b37b00', '--viz-accent': '#ffd447',
    '--viz-shadow': 'rgba(255,176,0,0.45)',
    '--viz-ok': '#9dff3d', '--viz-warn': '#ffd447', '--viz-err': '#ff6b3d',
    '--viz-node-style': 'bracket', '--viz-node-filter': 'url(#viz-glow)', '--viz-elev': ELEV.glow,
  },
  synthwave: {
    ...base, ...solid, ...PAPER.grid,
    '--viz-font': DISPLAY,
    '--viz-paper': '#2a2139', '--viz-grid': 'rgba(255,45,151,0.16)',
    '--viz-ink': '#f6f6ff', '--viz-muted': '#a48fc7', '--viz-accent': '#ff2e97',
    '--viz-shadow': 'rgba(255,46,151,0.5)',
    '--viz-ok': '#36f9f6', '--viz-warn': '#ffd400', '--viz-err': '#fe4450',
    '--viz-bg-size': '26px 26px',
    '--viz-node-style': 'rounded', '--viz-node-fill': 'rgba(255,46,151,0.07)',
    '--viz-node-filter': 'url(#viz-glow)', '--viz-elev': ELEV.glow, '--viz-radius': '4',
  },
  midnight: {
    ...base, ...solid, ...PAPER.dots,
    '--viz-font': SANS,
    '--viz-paper': '#0d1b2a', '--viz-grid': '#1b2c3e',
    '--viz-ink': '#e0e1dd', '--viz-muted': '#778da9', '--viz-accent': '#4cc9f0',
    '--viz-shadow': 'rgba(0,0,0,0.5)',
    '--viz-ok': '#52b788', '--viz-warn': '#f4a261', '--viz-err': '#e76f51',
    '--viz-node-style': 'rounded', '--viz-node-fill': 'rgba(255,255,255,0.03)',
    '--viz-node-filter': 'url(#viz-soft)', '--viz-elev': ELEV.soft, '--viz-radius': '8',
  },
  solarized: {
    ...base, ...solid, ...PAPER.plain,
    '--viz-font': MONO,
    '--viz-paper': '#fdf6e3', '--viz-grid': '#eee8d5',
    '--viz-ink': '#586e75', '--viz-muted': '#93a1a1', '--viz-accent': '#268bd2',
    '--viz-shadow': 'rgba(88,110,117,0.14)',
    '--viz-ok': '#859900', '--viz-warn': '#b58900', '--viz-err': '#dc322f',
    '--viz-node-style': 'plain', '--viz-stroke-w': '1.25', '--viz-elev': ELEV.none,
  },
  dracula: {
    ...base, ...solid, ...PAPER.plain,
    '--viz-font': MONO,
    '--viz-paper': '#282a36', '--viz-grid': '#3a3d4e',
    '--viz-ink': '#f8f8f2', '--viz-muted': '#6272a4', '--viz-accent': '#bd93f9',
    '--viz-shadow': 'rgba(0,0,0,0.45)',
    '--viz-ok': '#50fa7b', '--viz-warn': '#f1fa8c', '--viz-err': '#ff5555',
    '--viz-node-style': 'window', '--viz-node-fill': '#21222c', '--viz-elev': ELEV.soft, '--viz-radius': '6',
  },
  nord: {
    ...base, ...solid, ...PAPER.plain,
    '--viz-font': SANS,
    '--viz-paper': '#2e3440', '--viz-grid': '#3b4252',
    '--viz-ink': '#eceff4', '--viz-muted': '#7b88a1', '--viz-accent': '#88c0d0',
    '--viz-shadow': 'rgba(0,0,0,0.35)',
    '--viz-ok': '#a3be8c', '--viz-warn': '#ebcb8b', '--viz-err': '#bf616a',
    '--viz-node-style': 'rounded', '--viz-node-fill': '#3b4252', '--viz-elev': ELEV.soft, '--viz-radius': '8',
  },
  'mono-print': {
    ...base, ...solid, ...PAPER.plain,
    '--viz-font': SERIF,
    '--viz-paper': '#ffffff', '--viz-grid': '#eeeeee',
    '--viz-ink': '#000000', '--viz-muted': '#555555', '--viz-accent': '#000000',
    '--viz-shadow': 'rgba(0,0,0,0.18)',
    '--viz-ok': '#000000', '--viz-warn': '#000000', '--viz-err': '#000000',
    '--viz-node-style': 'cut', '--viz-stroke-w': '1.5', '--viz-elev': ELEV.none,
  },
  hologram: {
    ...base, ...solid, ...PAPER.grid,
    '--viz-font': DISPLAY,
    '--viz-paper': '#011317', '--viz-grid': 'rgba(127,255,212,0.13)',
    '--viz-ink': '#aefff0', '--viz-muted': '#4f8f88', '--viz-accent': '#7fffd4',
    '--viz-shadow': 'rgba(127,255,212,0.5)',
    '--viz-ok': '#7fffd4', '--viz-warn': '#ffe08a', '--viz-err': '#ff9d9d',
    '--viz-node-style': 'hex', '--viz-node-fill': 'rgba(127,255,212,0.05)',
    '--viz-node-filter': 'url(#viz-glow)', '--viz-elev': ELEV.glow,
  },
  kraft: {
    ...base, ...solid, ...PAPER.dots,
    '--viz-font': SERIF,
    '--viz-paper': '#c8a97e', '--viz-grid': 'rgba(60,46,31,0.16)',
    '--viz-ink': '#3a2e1f', '--viz-muted': '#6b5a45', '--viz-accent': '#8b2500',
    '--viz-shadow': 'rgba(60,46,31,0.3)',
    '--viz-ok': '#4a7c1f', '--viz-warn': '#a86b00', '--viz-err': '#8b2500',
    '--viz-node-style': 'tag', '--viz-elev': ELEV.soft, '--viz-radius': '2',
  },
  wireframe: {
    ...base, ...solid, ...PAPER.grid,
    '--viz-font': MONO,
    '--viz-paper': '#f6f7f8', '--viz-grid': '#e2e5e8',
    '--viz-ink': '#444a52', '--viz-muted': '#9aa2ab', '--viz-accent': '#444a52',
    '--viz-shadow': 'rgba(0,0,0,0.08)',
    '--viz-ok': '#4a7c1f', '--viz-warn': '#a86b00', '--viz-err': '#b00020',
    '--viz-node-style': 'plain', '--viz-stroke-w': '1', '--viz-elev': ELEV.none,
  },
};

// back-compat aliases (old theme names still resolve; not in the public list)
THEMES.kind = THEMES.sketch;
THEMES['kind-dark'] = THEMES['sketch-dark'];
THEMES.monospace = THEMES.ink;
THEMES.retro = THEMES.terminal;
THEMES.modern = THEMES.glass;

export const THEME_NAMES = [
  'sketch', 'sketch-dark', 'blueprint', 'neon', 'notebook', 'glass',
  'terminal', 'carbon', '8bit', 'ink',
  'crt-amber', 'synthwave', 'midnight', 'solarized', 'dracula', 'nord',
  'mono-print', 'hologram', 'kraft', 'wireframe',
];

// emit CSS vars for every key incl. aliases so old class names still style
const themeVars = (name) =>
  `.vizengine.viz-theme-${name}{${Object.entries(THEMES[name])
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}}`;

export function buildCSS() {
  return `
${Object.keys(THEMES).map(themeVars).join('\n')}

.vizengine{
  font-family:var(--viz-font);
  font-size:14px;
  line-height:1.6;
  color:var(--viz-ink);
  background-color:var(--viz-paper);
  background-image:var(--viz-bg-layer);
  background-size:var(--viz-bg-size,9px 9px);
  padding:24px 28px;
  position:relative;
  overflow-wrap:break-word;
}
.vizengine *{box-sizing:border-box;margin:0}

.viz-h1,.viz-h2,.viz-h3,.viz-h4{
  font-weight:700;letter-spacing:.01em;margin:1.1em 0 .5em;line-height:1.3;
}
.vizengine > .viz-h1:first-child,.vizengine > .viz-h2:first-child{margin-top:0}
.viz-h1{font-size:1.5em;border-bottom:1px var(--viz-border-style) var(--viz-ink);padding-bottom:.35em}
.viz-h2{font-size:1.25em}
.viz-h3{font-size:1.1em}
.viz-h4{font-size:1em}
.viz-h1::before{content:'# ';color:var(--viz-accent);opacity:.6}
.viz-h2::before{content:'## ';color:var(--viz-accent);opacity:.6}
.viz-h3::before{content:'### ';color:var(--viz-accent);opacity:.6}
.viz-h4::before{content:'#### ';color:var(--viz-accent);opacity:.6}

.viz-para{margin:.6em 0}
.viz-para code,.viz-list code,.viz-quote code,.viz-table code{
  font-family:var(--viz-font-mono);
  border:1px solid var(--viz-grid);background:var(--viz-paper);
  padding:0 .3em;border-radius:2px;font-size:.92em;
}
.vizengine a{color:var(--viz-accent);text-decoration:underline;text-underline-offset:3px}
.vizengine a:hover{background:var(--viz-accent);color:var(--viz-paper);text-decoration:none}

.viz-list{margin:.6em 0;padding-left:1.6em;list-style:none}
.viz-list li{margin:.15em 0;position:relative}
.viz-list.viz-ul > li::before{content:'-';position:absolute;left:-1.3em;color:var(--viz-muted)}
.viz-list.viz-ol{counter-reset:vizol}
.viz-list.viz-ol > li{counter-increment:vizol}
.viz-list.viz-ol > li::before{content:counter(vizol) '.';position:absolute;left:-1.7em;color:var(--viz-muted)}

.viz-quote{
  margin:.8em 0;padding:.2em 0 .2em 1em;
  border-left:3px solid var(--viz-accent);color:var(--viz-muted);
}

.viz-table{border-collapse:collapse;margin:.9em 0;background:var(--viz-paper);border-radius:var(--viz-radius);overflow:hidden}
.viz-table th,.viz-table td{
  border:1px var(--viz-border-style) var(--viz-grid);padding:.4em .85em;font-size:.95em;
}
.viz-table thead th{font-weight:700;border-bottom:2px solid var(--viz-ink);background:color-mix(in srgb,var(--viz-ink) 6%,var(--viz-paper))}
.viz-table tbody tr:nth-child(even){background:color-mix(in srgb,var(--viz-ink) 4%,var(--viz-paper))}

.viz-code{
  font-family:var(--viz-font-mono);
  margin:.9em 0;padding:.7em .9em;border:1px var(--viz-border-style) var(--viz-ink);
  background:var(--viz-paper);position:relative;overflow-x:auto;border-radius:var(--viz-radius);
  font-size:.92em;line-height:1.5;
}
.viz-code code{font-family:var(--viz-font-mono);white-space:pre}
.viz-code-lang{
  position:absolute;top:0;right:0;padding:.1em .6em;font-size:.8em;
  color:var(--viz-muted);border-left:1px var(--viz-border-style) var(--viz-grid);
  border-bottom:1px var(--viz-border-style) var(--viz-grid);background:var(--viz-paper);
}
.viz-copy{
  position:absolute;bottom:6px;right:6px;font:inherit;font-size:.75em;cursor:pointer;
  color:var(--viz-muted);background:var(--viz-paper);border:1px solid var(--viz-grid);
  border-radius:3px;padding:1px 7px;opacity:0;transition:opacity .15s;
}
.viz-code:hover .viz-copy{opacity:1}
.viz-pending{opacity:.75}
.viz-pending::after{content:'\\2588';animation:viz-blink 1s steps(2) infinite;color:var(--viz-muted)}
@keyframes viz-blink{50%{opacity:0}}

.viz-figure{
  margin:1em 0;padding:10px;border:1px var(--viz-border-style) var(--viz-ink);
  background:var(--viz-paper);display:inline-block;max-width:100%;border-radius:var(--viz-radius);
  box-shadow:var(--viz-elev);
}
.viz-figure img{display:block;max-width:100%}
.vizengine.viz-theme-8bit .viz-figure img{image-rendering:pixelated}
.viz-figure figcaption{margin-top:8px;color:var(--viz-muted);font-size:.85em}
.viz-figure figcaption::before{content:'\\2192 ';color:var(--viz-muted)}

.viz-hr{border:none;border-top:1px var(--viz-border-style) var(--viz-ink);margin:1.4em 0}

.viz-diagram-wrap{
  margin:1em 0;border:1px var(--viz-border-style) var(--viz-ink);background:var(--viz-paper);
  position:relative;overflow:hidden;touch-action:none;border-radius:var(--viz-radius);
  box-shadow:var(--viz-elev);
}
.viz-diagram{display:block;max-width:100%;height:auto;margin:0 auto;cursor:grab;user-select:none}
.viz-diagram:active{cursor:grabbing}
.viz-diagram text{font-family:var(--viz-font)}
.viz-node{cursor:pointer}

/* semantic svg classes — all theme-driven */
.viz-gridline{stroke:var(--viz-grid);stroke-width:1;fill:none}
.viz-griddot{fill:var(--viz-grid);stroke:none}
.viz-shape{stroke:var(--viz-ink);fill:var(--viz-node-fill,none);stroke-width:var(--viz-stroke-w);filter:var(--viz-node-filter,none)}
.viz-box{rx:var(--viz-radius)}
.viz-frame{stroke-dasharray:var(--viz-dash-frame);fill:none}
.viz-edge{stroke:var(--viz-ink);fill:none;stroke-width:var(--viz-stroke-w);stroke-dasharray:var(--viz-dash-edge)}
.viz-arrowhead{fill:var(--viz-accent);stroke:none}
.viz-edge-ok{stroke:var(--viz-ok)}
.viz-edge-warn{stroke:var(--viz-warn)}
.viz-edge-err{stroke:var(--viz-err)}
.viz-edge-accent{stroke:var(--viz-accent)}
.viz-arrowhead-ok{fill:var(--viz-ok)}
.viz-arrowhead-warn{fill:var(--viz-warn)}
.viz-arrowhead-err{fill:var(--viz-err)}
.viz-arrowhead-accent{fill:var(--viz-accent)}
.viz-label{fill:var(--viz-ink)}
.viz-label-muted{fill:var(--viz-muted)}
.viz-decor-line{stroke:var(--viz-muted);fill:none;stroke-width:1}
.viz-arc{stroke:var(--viz-accent);fill:none;stroke-width:1.5;opacity:.85}
.viz-pin{fill:var(--viz-accent);stroke:var(--viz-paper);stroke-width:1}
.viz-geo-land{fill:color-mix(in srgb,var(--viz-ink) 18%,var(--viz-paper));stroke:color-mix(in srgb,var(--viz-ink) 34%,var(--viz-paper));stroke-width:1;stroke-linejoin:round}
.viz-icon-stroke{stroke:var(--viz-ink);fill:none;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
.viz-icon-dot{fill:var(--viz-ink);stroke:none}
.viz-container-tab{fill:var(--viz-paper);stroke:none}
.viz-iso-plate{fill:var(--viz-paper);stroke:var(--viz-grid);stroke-width:.75;opacity:.94;rx:3}
.viz-iso-top{fill:var(--viz-node-fill,var(--viz-paper))}
.viz-iso-side{fill:var(--viz-ink);opacity:.10;stroke:var(--viz-ink);stroke-width:.75}
.viz-bar-fill{opacity:.92;stroke:none}
.viz-fill-0{fill:var(--viz-accent)}
.viz-fill-1{fill:var(--viz-ok)}
.viz-fill-2{fill:var(--viz-warn)}
.viz-fill-3{fill:var(--viz-err)}
.viz-fill-4{fill:var(--viz-muted)}
.viz-fill-5{fill:var(--viz-ink)}

/* interactive graph states */
.viz-dim{opacity:.15;transition:opacity .15s}
.viz-collapsed-hidden{display:none}

.viz-error-note{
  color:var(--viz-muted);font-size:.85em;padding:.2em .9em .5em;
  border:1px var(--viz-border-style) var(--viz-ink);border-top:none;margin:-0.9em 0 .9em;
  background:var(--viz-paper);
}

.viz-callout{
  border:1px var(--viz-border-style) var(--viz-grid);border-left:3px solid var(--viz-ink);
  margin:.9em 0;background:var(--viz-paper);border-radius:var(--viz-radius);box-shadow:var(--viz-elev);
}
.viz-callout-title{padding:.4em .9em .15em;font-weight:700;letter-spacing:.02em;display:flex;align-items:center;gap:.5em}
.viz-callout-title::before{
  display:inline-flex;align-items:center;justify-content:center;width:1.5em;height:1.5em;
  border-radius:4px;font-size:.8em;color:var(--viz-paper);
}
.viz-callout-body{padding:.15em .9em .5em}
.viz-callout-note{border-left-color:var(--viz-accent)}
.viz-callout-note .viz-callout-title{color:var(--viz-accent)}
.viz-callout-note .viz-callout-title::before{content:'i';background:var(--viz-accent)}
.viz-callout-tip{border-left-color:var(--viz-ok)}
.viz-callout-tip .viz-callout-title{color:var(--viz-ok)}
.viz-callout-tip .viz-callout-title::before{content:'*';background:var(--viz-ok)}
.viz-callout-warn{border-left-color:var(--viz-warn)}
.viz-callout-warn .viz-callout-title{color:var(--viz-warn)}
.viz-callout-warn .viz-callout-title::before{content:'!';background:var(--viz-warn)}
.viz-callout-danger{border-left-color:var(--viz-err)}
.viz-callout-danger .viz-callout-title{color:var(--viz-err)}
.viz-callout-danger .viz-callout-title::before{content:'x';background:var(--viz-err)}
.viz-callout-success{border-left-color:var(--viz-ok)}
.viz-callout-success .viz-callout-title{color:var(--viz-ok)}
.viz-callout-success .viz-callout-title::before{content:'+';background:var(--viz-ok)}

.viz-check{color:var(--viz-muted);margin-right:.45em}
.viz-task-done .viz-check{color:var(--viz-ok)}
.viz-task-done{color:var(--viz-muted);text-decoration:line-through}
.viz-list.viz-ul > li.viz-task::before{content:''}

.viz-badge{
  display:inline-block;border:1px solid var(--viz-ink);border-radius:3px;
  padding:0 .45em;font-size:.82em;letter-spacing:.03em;line-height:1.5;
  font-family:var(--viz-font-mono);
}
.viz-badge-ok{color:var(--viz-ok);border-color:var(--viz-ok)}
.viz-badge-warn{color:var(--viz-warn);border-color:var(--viz-warn)}
.viz-badge-err{color:var(--viz-err);border-color:var(--viz-err)}

.viz-dl{display:grid;grid-template-columns:max-content 1fr;gap:.15em 1.4em;margin:.8em 0}
.viz-dl-term{color:var(--viz-muted)}
.viz-dl-term::after{content:' ::';color:var(--viz-grid)}

.viz-collapse{border:1px var(--viz-border-style) var(--viz-grid);margin:.9em 0;background:var(--viz-paper);border-radius:var(--viz-radius)}
.viz-collapse > summary{padding:.4em .9em;cursor:pointer;font-weight:700;list-style:none;user-select:none}
.viz-collapse > summary::-webkit-details-marker{display:none}
.viz-collapse > summary::before{content:'[+] ';color:var(--viz-muted)}
.viz-collapse[open] > summary::before{content:'[-] '}
.viz-collapse-body{padding:0 .9em .4em}

.viz-preview{
  border:1px var(--viz-border-style) var(--viz-grid);margin:.9em 0;border-radius:var(--viz-radius);
  background:var(--viz-paper);box-shadow:var(--viz-elev);overflow:hidden;
}
.viz-preview-tabs{display:flex;border-bottom:1px var(--viz-border-style) var(--viz-grid)}
.viz-preview-tabs button{
  font-family:var(--viz-font-mono);font-size:.85em;background:none;border:none;
  border-right:1px var(--viz-border-style) var(--viz-grid);padding:.35em 1.1em;
  cursor:pointer;color:var(--viz-muted);
}
.viz-preview-tabs button.active{color:var(--viz-ink);font-weight:700}
.viz-preview-frame{display:block;width:100%;height:280px;border:none;background:#ffffff}
.viz-preview .viz-code{border:none;margin:0;box-shadow:none;border-radius:0}

.viz-tooltip{
  position:absolute;z-index:10;pointer-events:none;max-width:320px;
  background:var(--viz-paper);color:var(--viz-ink);border:1px solid var(--viz-ink);
  padding:4px 10px;font-size:12px;font-family:var(--viz-font-mono);border-radius:var(--viz-radius);
  box-shadow:var(--viz-elev);white-space:pre-line;
}
${COMPONENT_CSS}
${ANIM_CSS}
`;
}

// component-library CSS — appended to buildCSS() so the main block stays readable
const COMPONENT_CSS = `
/* tabs */
.viz-tabs{border:1px var(--viz-border-style) var(--viz-grid);border-radius:var(--viz-radius);margin:.9em 0;background:var(--viz-paper);box-shadow:var(--viz-elev);overflow:hidden}
.viz-tabs-bar{display:flex;flex-wrap:wrap;border-bottom:1px var(--viz-border-style) var(--viz-grid)}
.viz-tab-btn{font:inherit;font-size:.9em;background:none;border:none;border-right:1px var(--viz-border-style) var(--viz-grid);padding:.4em 1.1em;cursor:pointer;color:var(--viz-muted)}
.viz-tab-btn.active{color:var(--viz-ink);font-weight:700;box-shadow:inset 0 -2px 0 var(--viz-accent)}
.viz-tab-panel{padding:.4em 1em}

/* accordion */
.viz-accordion{margin:.9em 0}
.viz-accordion-item{border:1px var(--viz-border-style) var(--viz-grid);border-radius:var(--viz-radius);margin:.35em 0;background:var(--viz-paper)}
.viz-accordion-item > summary{padding:.45em .9em;cursor:pointer;font-weight:700;list-style:none;user-select:none}
.viz-accordion-item > summary::-webkit-details-marker{display:none}
.viz-accordion-item > summary::before{content:'▸ ';color:var(--viz-accent)}
.viz-accordion-item[open] > summary::before{content:'▾ '}
.viz-accordion-body{padding:0 .9em .5em}

/* steps (horizontal stepper) */
.viz-steps{display:flex;flex-wrap:wrap;gap:0;margin:1em 0;align-items:flex-start}
.viz-step{display:flex;flex-direction:column;align-items:center;flex:1;min-width:74px;position:relative;text-align:center;padding:0 .3em}
.viz-step::before{content:'';position:absolute;top:15px;left:-50%;width:100%;height:2px;background:var(--viz-grid)}
.viz-step:first-child::before{display:none}
.viz-step-done::before,.viz-step-current::before{background:var(--viz-accent)}
.viz-step-dot{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--viz-grid);background:var(--viz-paper);color:var(--viz-muted);font-weight:700;font-size:.85em;position:relative;z-index:1}
.viz-step-done .viz-step-dot{border-color:var(--viz-ok);color:var(--viz-ok)}
.viz-step-current .viz-step-dot{border-color:var(--viz-accent);color:var(--viz-accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--viz-accent) 20%,transparent)}
.viz-step-label{margin-top:.4em;font-size:.85em;color:var(--viz-ink)}
.viz-step-todo .viz-step-label{color:var(--viz-muted)}

/* meta panel */
.viz-meta{display:grid;grid-template-columns:max-content 1fr;gap:.25em 1.2em;margin:.9em 0;padding:.7em .9em;border:1px var(--viz-border-style) var(--viz-grid);border-radius:var(--viz-radius);background:var(--viz-paper);box-shadow:var(--viz-elev)}
.viz-meta-key{color:var(--viz-muted);font-size:.9em}
.viz-meta-val{font-family:var(--viz-font-mono);word-break:break-all}

/* stat tiles */
.viz-stats{display:flex;flex-wrap:wrap;gap:.7em;margin:1em 0}
.viz-stat{flex:1;min-width:120px;padding:.7em .9em;border:1px var(--viz-border-style) var(--viz-grid);border-radius:var(--viz-radius);background:var(--viz-paper);box-shadow:var(--viz-elev)}
.viz-stat-value{font-size:1.8em;font-weight:700;line-height:1.1;font-family:var(--viz-font-mono)}
.viz-stat-label{color:var(--viz-muted);font-size:.82em;margin-top:.15em}
.viz-stat-delta{font-size:.82em;margin-top:.3em;font-weight:700}
.viz-stat-up{color:var(--viz-ok)}
.viz-stat-down{color:var(--viz-err)}
.viz-stat-flat{color:var(--viz-muted)}

/* chips */
.viz-chips{display:flex;flex-wrap:wrap;gap:.4em;margin:.7em 0}
.viz-chip{display:inline-block;padding:.15em .7em;border-radius:999px;font-size:.82em;border:1px solid var(--viz-grid);background:color-mix(in srgb,var(--viz-ink) 5%,var(--viz-paper));color:var(--viz-ink)}
.viz-chip-ok{color:var(--viz-ok);border-color:var(--viz-ok)}
.viz-chip-warn{color:var(--viz-warn);border-color:var(--viz-warn)}
.viz-chip-err{color:var(--viz-err);border-color:var(--viz-err)}

/* progress bar (inline) */
.viz-progress{display:inline-flex;align-items:center;gap:.5em;vertical-align:middle;font-size:.85em}
.viz-progress-track{display:inline-block;width:130px;height:10px;border:1px solid var(--viz-grid);border-radius:6px;overflow:hidden;background:color-mix(in srgb,var(--viz-ink) 5%,var(--viz-paper))}
.viz-progress-fill{display:block;height:100%;background:var(--viz-accent)}
.viz-progress-num{color:var(--viz-muted);font-family:var(--viz-font-mono)}

/* sparkline (inline) */
.viz-spark{vertical-align:middle;margin:0 .2em}
.viz-spark-line{stroke:var(--viz-accent);stroke-width:1.4;stroke-linejoin:round;stroke-linecap:round}
.viz-spark-dot{fill:var(--viz-accent)}

/* metric (inline big number) */
.viz-metric{display:inline-flex;flex-direction:column;line-height:1.05;vertical-align:middle;margin:0 .5em}
.viz-metric-value{font-size:1.5em;font-weight:800;font-family:var(--viz-font-mono);color:var(--viz-ink)}
.viz-metric-label{font-size:.7em;color:var(--viz-muted);text-transform:uppercase;letter-spacing:.05em}

/* avatar (inline) */
.viz-avatar{display:inline-flex;align-items:center;gap:.4em;vertical-align:middle}
.viz-avatar-dot{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--viz-accent);color:var(--viz-paper);font-size:.7em;font-weight:700}
.viz-avatar-name{font-size:.9em}

/* progress ring */
.viz-ring{display:inline-flex;flex-direction:column;align-items:center;gap:.3em;margin:.4em 1em .4em 0;vertical-align:top}
.viz-ring-track{stroke:color-mix(in srgb,var(--viz-ink) 12%,var(--viz-paper));stroke-width:6}
.viz-ring-fill{stroke:var(--viz-accent);stroke-width:6;stroke-linecap:round;transition:stroke-dashoffset 1.1s cubic-bezier(.2,.7,.3,1)}
.viz-ring-text{fill:var(--viz-ink);font-size:15px;font-weight:800;font-family:var(--viz-font-mono)}
.viz-ring-label{color:var(--viz-muted);font-size:.82em}

/* banner */
.viz-banner{margin:1em 0;padding:1.1em 1.4em;border-radius:var(--viz-radius);border:1px var(--viz-border-style) var(--viz-ink);background:color-mix(in srgb,var(--viz-accent) 10%,var(--viz-paper));box-shadow:var(--viz-elev)}
.viz-banner-title{font-size:1.5em;font-weight:800;letter-spacing:.01em}
.viz-banner-sub{color:var(--viz-muted);margin-top:.3em}

/* sticky note */
.viz-note{margin:1em 0;padding:.9em 1.1em;background:color-mix(in srgb,var(--viz-warn) 16%,var(--viz-paper));border:1px solid color-mix(in srgb,var(--viz-warn) 40%,var(--viz-paper));border-radius:var(--viz-radius);box-shadow:var(--viz-elev);position:relative}
.viz-note-pin{font-weight:700;color:var(--viz-warn);margin-bottom:.3em;text-transform:uppercase;letter-spacing:.05em;font-size:.82em}
.viz-note-pin::before{content:'📌 '}

/* pull quote */
.viz-pullquote{margin:1.1em 0;padding:.4em 0 .4em 1.2em;border-left:4px solid var(--viz-accent)}
.viz-pullquote-text{font-size:1.2em;font-style:italic;line-height:1.4}
.viz-pullquote-cite{margin-top:.4em;color:var(--viz-muted);font-size:.9em}
.viz-pullquote-cite::before{content:'— '}

/* color swatches */
.viz-swatches{display:flex;flex-wrap:wrap;gap:.7em;margin:.9em 0}
.viz-swatch{display:flex;align-items:center;gap:.5em;border:1px var(--viz-border-style) var(--viz-grid);border-radius:var(--viz-radius);padding:.3em .5em;background:var(--viz-paper)}
.viz-swatch-chip{width:28px;height:28px;border-radius:5px;border:1px solid color-mix(in srgb,var(--viz-ink) 15%,transparent);flex:none}
.viz-swatch-name{font-size:.85em;font-weight:600}
.viz-swatch-hex{font-size:.75em;color:var(--viz-muted);font-family:var(--viz-font-mono)}

/* severity dots */
.viz-sev{display:inline-flex;gap:2px;vertical-align:middle}
.viz-sev-dot{width:9px;height:9px;border-radius:50%;border:1px solid var(--viz-muted);display:inline-block}
.viz-sev-on{border-color:transparent}

/* filetree */
.viz-filetree{margin:.9em 0;padding:.6em .9em;border:1px var(--viz-border-style) var(--viz-grid);border-radius:var(--viz-radius);background:var(--viz-paper);font-family:var(--viz-font-mono);font-size:.9em;box-shadow:var(--viz-elev)}
.viz-filetree ul{list-style:none;margin:0;padding-left:1.2em}
.viz-filetree > ul{padding-left:0}
.viz-ft-row{cursor:default;white-space:nowrap}
.viz-ft-dir > .viz-ft-row{cursor:pointer;color:var(--viz-ink)}
.viz-ft-dir > .viz-ft-row::before{content:'▾ ';color:var(--viz-accent)}
.viz-ft-dir.viz-ft-collapsed > .viz-ft-row::before{content:'▸ '}
.viz-ft-dir.viz-ft-collapsed > ul{display:none}
.viz-ft-file > .viz-ft-row{color:var(--viz-muted)}
.viz-ft-file > .viz-ft-row::before{content:'  '}

/* diff */
.viz-diff{margin:.9em 0;border:1px var(--viz-border-style) var(--viz-grid);border-radius:var(--viz-radius);overflow:hidden;font-family:var(--viz-font-mono);font-size:.9em;box-shadow:var(--viz-elev)}
.viz-diff-line{padding:.05em .8em;white-space:pre;display:block}
.viz-diff-add{background:color-mix(in srgb,var(--viz-ok) 16%,var(--viz-paper));color:var(--viz-ink)}
.viz-diff-del{background:color-mix(in srgb,var(--viz-err) 16%,var(--viz-paper));color:var(--viz-ink)}
.viz-diff-ctx{color:var(--viz-muted)}

/* card grid + card */
.viz-cardgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:.7em;margin:1em 0}
.viz-card{border:1px var(--viz-border-style) var(--viz-grid);border-radius:var(--viz-radius);background:var(--viz-paper);box-shadow:var(--viz-elev);overflow:hidden}
.viz-card-solo{margin:1em 0}
.viz-card-title{padding:.4em .8em;font-weight:700;border-bottom:1px var(--viz-border-style) var(--viz-grid);background:color-mix(in srgb,var(--viz-ink) 5%,var(--viz-paper))}
.viz-card-body{padding:.5em .8em}

/* alert banner */
.viz-alert{margin:.9em 0;padding:.6em 1em;border-radius:var(--viz-radius);border-left:4px solid var(--viz-accent);background:color-mix(in srgb,var(--viz-accent) 10%,var(--viz-paper));font-weight:600}
.viz-alert::before{font-weight:700;margin-right:.5em}
.viz-alert-note{border-left-color:var(--viz-accent);background:color-mix(in srgb,var(--viz-accent) 10%,var(--viz-paper))}
.viz-alert-note::before{content:'ℹ';color:var(--viz-accent)}
.viz-alert-tip{border-left-color:var(--viz-ok);background:color-mix(in srgb,var(--viz-ok) 10%,var(--viz-paper))}
.viz-alert-tip::before{content:'✓';color:var(--viz-ok)}
.viz-alert-success{border-left-color:var(--viz-ok);background:color-mix(in srgb,var(--viz-ok) 12%,var(--viz-paper))}
.viz-alert-success::before{content:'✓';color:var(--viz-ok)}
.viz-alert-warn{border-left-color:var(--viz-warn);background:color-mix(in srgb,var(--viz-warn) 12%,var(--viz-paper))}
.viz-alert-warn::before{content:'⚠';color:var(--viz-warn)}
.viz-alert-danger{border-left-color:var(--viz-err);background:color-mix(in srgb,var(--viz-err) 12%,var(--viz-paper))}
.viz-alert-danger::before{content:'✕';color:var(--viz-err)}

/* kbd */
.viz-kbd-group{display:inline-flex;align-items:center;gap:.15em;vertical-align:middle}
.viz-kbd{font-family:var(--viz-font-mono);font-size:.82em;padding:.1em .5em;border:1px solid var(--viz-muted);border-bottom-width:2px;border-radius:4px;background:color-mix(in srgb,var(--viz-ink) 6%,var(--viz-paper));color:var(--viz-ink)}

/* terminal window */
.viz-term{margin:.9em 0;border-radius:calc(var(--viz-radius) + 4px);overflow:hidden;border:1px solid var(--viz-grid);box-shadow:var(--viz-elev);font-family:var(--viz-font-mono);font-size:.88em}
.viz-term-bar{display:flex;align-items:center;gap:.4em;padding:.35em .7em;background:color-mix(in srgb,var(--viz-ink) 12%,var(--viz-paper));border-bottom:1px solid var(--viz-grid)}
.viz-term-dot{width:10px;height:10px;border-radius:50%;background:var(--viz-muted);opacity:.6}
.viz-term-dot:nth-child(1){background:var(--viz-err)}
.viz-term-dot:nth-child(2){background:var(--viz-warn)}
.viz-term-dot:nth-child(3){background:var(--viz-ok)}
.viz-term-title{margin-left:.5em;color:var(--viz-muted);font-size:.85em}
.viz-term-body{padding:.6em .8em;background:color-mix(in srgb,var(--viz-ink) 4%,var(--viz-paper));white-space:pre-wrap}
.viz-term-cmd{color:var(--viz-ink)}
.viz-term-prompt{color:var(--viz-ok);font-weight:700}
.viz-term-out{color:var(--viz-muted)}

/* columns */
.viz-columns{display:flex;flex-wrap:wrap;gap:1.4em;margin:1em 0}
.viz-column{flex:1;min-width:160px}
.viz-column-title{font-weight:700;margin-bottom:.3em;padding-bottom:.2em;border-bottom:1px var(--viz-border-style) var(--viz-grid)}

/* labeled divider */
.viz-divider{display:flex;align-items:center;gap:.8em;margin:1.3em 0;color:var(--viz-muted);font-size:.85em;text-transform:uppercase;letter-spacing:.08em}
.viz-divider::before,.viz-divider::after{content:'';flex:1;border-top:1px var(--viz-border-style) var(--viz-grid)}

/* status list */
.viz-statuslist{margin:.8em 0;display:flex;flex-direction:column;gap:.25em}
.viz-status{display:flex;align-items:center;gap:.5em}
.viz-status-dot{width:9px;height:9px;border-radius:50%;background:var(--viz-muted);flex:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--viz-muted) 20%,transparent)}
.viz-status-ok .viz-status-dot,.viz-status-up{}
.viz-status-ok{background:var(--viz-ok);box-shadow:0 0 0 3px color-mix(in srgb,var(--viz-ok) 22%,transparent)}
.viz-status-up{background:var(--viz-ok);box-shadow:0 0 0 3px color-mix(in srgb,var(--viz-ok) 22%,transparent)}
.viz-status-warn,.viz-status-idle{background:var(--viz-warn);box-shadow:0 0 0 3px color-mix(in srgb,var(--viz-warn) 22%,transparent)}
.viz-status-err,.viz-status-down{background:var(--viz-err);box-shadow:0 0 0 3px color-mix(in srgb,var(--viz-err) 22%,transparent)}
.viz-status-info{background:var(--viz-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--viz-accent) 22%,transparent)}

/* gauge */
.viz-gauge{display:inline-block;text-align:center;margin:.6em 1em .6em 0;vertical-align:top}
.viz-gauge-track{stroke:color-mix(in srgb,var(--viz-ink) 14%,var(--viz-paper));stroke-width:9;stroke-linecap:round}
.viz-gauge-fill{stroke:var(--viz-accent);stroke-width:9;stroke-linecap:round}
.viz-gauge-val{fill:var(--viz-ink);font-size:20px;font-weight:700;font-family:var(--viz-font-mono)}
.viz-gauge-label{color:var(--viz-muted);font-size:.82em;margin-top:-.3em}

/* rating */
.viz-rating{display:inline-flex;align-items:center;gap:.5em;margin:.3em 0}
.viz-rating-stars{color:var(--viz-muted);letter-spacing:1px;font-size:1.1em}
.viz-star-on{color:var(--viz-warn)}
.viz-rating-label{color:var(--viz-muted);font-size:.85em}

/* ioc rows */
.viz-ioc{margin:.9em 0;border:1px var(--viz-border-style) var(--viz-grid);border-radius:var(--viz-radius);overflow:hidden;box-shadow:var(--viz-elev)}
.viz-ioc-row{display:flex;align-items:center;gap:.7em;padding:.35em .8em;border-top:1px var(--viz-border-style) var(--viz-grid);font-family:var(--viz-font-mono);font-size:.88em}
.viz-ioc-row:first-child{border-top:none}
.viz-ioc-type{min-width:74px;color:var(--viz-accent);font-weight:700;text-transform:uppercase;font-size:.82em;letter-spacing:.04em}
.viz-ioc-val{flex:1;word-break:break-all}
.viz-ioc-note{color:var(--viz-muted);font-size:.85em}
.viz-ioc-copy{background:none;border:none;cursor:pointer;color:var(--viz-muted);font-size:1em}
.viz-ioc-copy:hover{color:var(--viz-accent)}

/* verdict banner */
.viz-verdict{display:flex;align-items:center;gap:1em;margin:.9em 0;padding:.7em 1em;border-radius:var(--viz-radius);border:2px solid var(--viz-muted);box-shadow:var(--viz-elev)}
.viz-verdict-level{font-size:1.3em;font-weight:800;letter-spacing:.05em;padding:.15em .6em;border-radius:4px;color:var(--viz-paper)}
.viz-verdict-info{color:var(--viz-ink)}
.viz-verdict-malicious{border-color:var(--viz-err);background:color-mix(in srgb,var(--viz-err) 10%,var(--viz-paper))}
.viz-verdict-malicious .viz-verdict-level{background:var(--viz-err)}
.viz-verdict-suspicious{border-color:var(--viz-warn);background:color-mix(in srgb,var(--viz-warn) 10%,var(--viz-paper))}
.viz-verdict-suspicious .viz-verdict-level{background:var(--viz-warn)}
.viz-verdict-clean,.viz-verdict-benign{border-color:var(--viz-ok);background:color-mix(in srgb,var(--viz-ok) 10%,var(--viz-paper))}
.viz-verdict-clean .viz-verdict-level,.viz-verdict-benign .viz-verdict-level{background:var(--viz-ok)}
.viz-verdict-unknown .viz-verdict-level{background:var(--viz-muted)}

/* mitre chips */
.viz-mitre{display:flex;flex-wrap:wrap;gap:.4em;margin:.7em 0}
.viz-mitre-chip{display:inline-flex;align-items:center;border:1px solid var(--viz-grid);border-radius:var(--viz-radius);overflow:hidden;font-size:.82em}
.viz-mitre-id{background:var(--viz-accent);color:var(--viz-paper);padding:.12em .5em;font-family:var(--viz-font-mono);font-weight:700}
.viz-mitre-name{padding:.12em .6em;color:var(--viz-ink)}

/* hexdump */
.viz-hexdump{margin:.9em 0;padding:.6em .8em;border:1px var(--viz-border-style) var(--viz-grid);border-radius:var(--viz-radius);background:var(--viz-paper);font-family:var(--viz-font-mono);font-size:.82em;overflow-x:auto;box-shadow:var(--viz-elev)}
.viz-hex-row{white-space:pre;display:flex;gap:1em}
.viz-hex-off{color:var(--viz-muted)}
.viz-hex-bytes{color:var(--viz-ink)}
.viz-hex-ascii{color:var(--viz-accent)}

/* yara */
.viz-yara{margin:.9em 0;padding:.7em .9em;border:1px var(--viz-border-style) var(--viz-grid);border-radius:var(--viz-radius);background:var(--viz-paper);font-family:var(--viz-font-mono);font-size:.88em;white-space:pre;overflow-x:auto;box-shadow:var(--viz-elev);line-height:1.45}
.viz-yara-kw{color:var(--viz-accent);font-weight:700}

/* score */
.viz-score{display:inline-flex;flex-direction:column;align-items:center;margin:.6em 1em .6em 0;padding:.6em 1.2em;border:1px var(--viz-border-style) var(--viz-grid);border-radius:var(--viz-radius);box-shadow:var(--viz-elev);vertical-align:top}
.viz-score-value{font-size:2em;font-weight:800;line-height:1;font-family:var(--viz-font-mono)}
.viz-score-grade{font-size:1.4em;font-weight:800;color:var(--viz-accent);margin-top:.1em}
.viz-score-label{color:var(--viz-muted);font-size:.82em;margin-top:.2em}

/* heatmap */
.viz-heatmap{display:inline-flex;flex-direction:column;gap:2px;margin:.7em 0}
.viz-heatmap-row{display:flex;gap:2px}
.viz-heatmap-cell{width:18px;height:18px;border-radius:2px;border:1px solid color-mix(in srgb,var(--viz-ink) 8%,transparent)}

/* doc timeline */
.viz-dtimeline{margin:.9em 0;position:relative}
.viz-dt-item{display:grid;grid-template-columns:72px 20px 1fr;align-items:start;gap:.4em}
.viz-dt-stamp{color:var(--viz-muted);font-size:.82em;text-align:right;font-family:var(--viz-font-mono);padding-top:.1em}
.viz-dt-marker{position:relative;justify-self:center}
.viz-dt-marker::before{content:'';position:absolute;left:50%;top:6px;bottom:-100%;width:2px;transform:translateX(-50%);background:var(--viz-grid)}
.viz-dt-item:last-child .viz-dt-marker::before{display:none}
.viz-dt-marker::after{content:'';position:absolute;left:50%;top:4px;width:9px;height:9px;border-radius:50%;transform:translateX(-50%);background:var(--viz-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--viz-accent) 20%,transparent)}
.viz-dt-body{padding-bottom:.7em}

/* compare */
.viz-compare{display:flex;align-items:stretch;gap:0;margin:1em 0}
.viz-compare-side{flex:1;padding:.6em .9em;border:1px var(--viz-border-style) var(--viz-grid);background:var(--viz-paper)}
.viz-compare-side:first-child{border-radius:var(--viz-radius) 0 0 var(--viz-radius)}
.viz-compare-side:last-child{border-radius:0 var(--viz-radius) var(--viz-radius) 0;border-left:none}
.viz-compare-title{font-weight:700;margin-bottom:.3em;color:var(--viz-accent)}
.viz-compare-vs{display:flex;align-items:center;padding:0 .6em;color:var(--viz-muted);font-style:italic;font-size:.85em}

/* legend */
.viz-legend{display:flex;flex-wrap:wrap;gap:.4em 1em;margin:.7em 0;font-size:.85em}
.viz-legend-item{display:inline-flex;align-items:center;gap:.4em}
.viz-legend-swatch{width:12px;height:12px;border-radius:3px;border:1px solid color-mix(in srgb,var(--viz-ink) 15%,transparent)}
`;

// Animation keyframe library — CSS + SMIL-free, gated by reduced-motion.
const ANIM_CSS = `
@media (prefers-reduced-motion: reduce){
  .viz-anim-flow,.viz-anim-in,.viz-anim-pulse,.viz-anim-trace,.viz-beacon-ring,
  .viz-spinner,.viz-radar-sweep,.viz-matrix span,.viz-typewriter,.viz-loader-bar::after,
  .viz-pulsedot::after{animation:none !important}
  .viz-anim-in{opacity:1 !important}
}
.viz-anim-flow{stroke-dasharray:7 6 !important;animation:viz-flow 1.3s linear infinite}
@keyframes viz-flow{to{stroke-dashoffset:-13}}
.viz-anim-in{opacity:0;transform-box:fill-box;transform-origin:center;animation:viz-in .55s cubic-bezier(.2,.7,.3,1) both}
@keyframes viz-in{from{opacity:0;transform:scale(.55)}to{opacity:1;transform:scale(1)}}
.viz-anim-pulse{transform-box:fill-box;transform-origin:center;animation:viz-pulse 3s ease-in-out infinite}
@keyframes viz-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.72;transform:scale(1.05)}}
.viz-anim-trace{animation:viz-trace 4.2s ease-in-out infinite}
@keyframes viz-trace{0%,100%{stroke-opacity:.22}18%{stroke-opacity:1}}
.viz-beacon-ring{fill:none;stroke:var(--viz-accent);stroke-width:1.5;transform-box:fill-box;transform-origin:center;animation:viz-ring 2.6s ease-out infinite}
@keyframes viz-ring{0%{transform:scale(.35);opacity:.7}100%{transform:scale(2.6);opacity:0}}

/* auto-animated components */
.viz-progress-fill{transition:width 1.1s cubic-bezier(.2,.7,.3,1)}
.viz-gauge-fill{transition:stroke-dashoffset 1.2s cubic-bezier(.2,.7,.3,1)}

/* standalone widgets */
.viz-spinner{display:inline-block;font-family:var(--viz-font-mono);font-weight:700;color:var(--viz-accent);width:1ch}
.viz-loader{display:block;height:10px;border:1px solid var(--viz-grid);border-radius:6px;overflow:hidden;margin:.6em 0;background:color-mix(in srgb,var(--viz-ink) 5%,var(--viz-paper))}
.viz-loader-bar{display:block;height:100%;width:40%;background:var(--viz-accent);animation:viz-loader 1.6s ease-in-out infinite}
@keyframes viz-loader{0%{transform:translateX(-100%)}100%{transform:translateX(320%)}}
.viz-pulsedot{display:inline-flex;align-items:center;gap:.5em}
.viz-pulsedot::before{content:'';width:9px;height:9px;border-radius:50%;background:var(--viz-ok);animation:viz-beat 1.4s ease-in-out infinite}
@keyframes viz-beat{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--viz-ok) 60%,transparent)}70%{box-shadow:0 0 0 8px transparent}}
.viz-typewriter{font-family:var(--viz-font-mono);white-space:pre;overflow:hidden;border-right:2px solid var(--viz-accent);width:0;animation:viz-type 4.5s steps(40,end) infinite, viz-caret .8s step-end infinite}
@keyframes viz-type{0%{width:0}60%,100%{width:var(--viz-tw,20ch)}}
@keyframes viz-caret{50%{border-color:transparent}}
.viz-radar{display:block;margin:.6em 0}
.viz-radar-grid{stroke:var(--viz-grid);fill:none}
.viz-radar-sweep{fill:var(--viz-accent);opacity:.25;transform-box:fill-box;transform-origin:center;animation:viz-spin 4.5s linear infinite}
.viz-radar-blip{fill:var(--viz-accent);animation:viz-blip 4.5s ease-in-out infinite}
@keyframes viz-spin{to{transform:rotate(360deg)}}
@keyframes viz-blip{0%,40%,100%{opacity:.15}45%{opacity:1}}
.viz-matrix{display:block;overflow:hidden;font-family:var(--viz-font-mono);color:var(--viz-ok);background:var(--viz-paper);border:1px solid var(--viz-grid);border-radius:var(--viz-radius);height:140px;position:relative;margin:.7em 0}
.viz-matrix span{position:absolute;top:-1.4em;animation:viz-fall linear infinite;white-space:pre;line-height:1.2;font-size:.85em}
@keyframes viz-fall{to{transform:translateY(160px)}}
.viz-countdown{font-family:var(--viz-font-mono);font-size:1.6em;font-weight:800;color:var(--viz-accent)}
.viz-beaconw{display:inline-block;position:relative;margin:1.2em}
.viz-beaconw-core{width:12px;height:12px;border-radius:50%;background:var(--viz-accent)}
.viz-beaconw-ring{position:absolute;inset:0;border-radius:50%;border:2px solid var(--viz-accent);animation:viz-ring2 2.4s ease-out infinite}
.viz-beaconw-ring:nth-child(3){animation-delay:1.2s}
@keyframes viz-ring2{0%{transform:scale(1);opacity:.7}100%{transform:scale(4);opacity:0}}
.viz-beaconw-label{margin-left:.6em;color:var(--viz-muted);font-size:.85em;vertical-align:middle}

.viz-spinnerw{display:inline-flex;align-items:center;gap:.5em;vertical-align:middle}
.viz-spinner-svg{animation:viz-spin 1s linear infinite}
.viz-spinner-track{stroke:color-mix(in srgb,var(--viz-ink) 14%,var(--viz-paper));stroke-width:3}
.viz-spinner-arc{stroke:var(--viz-accent);stroke-width:3;stroke-linecap:round}
.viz-spinner-label{color:var(--viz-muted);font-size:.9em}

.viz-loader-label{color:var(--viz-muted);font-size:.85em;margin-bottom:.2em}

.viz-countw{display:inline-flex;flex-direction:column;align-items:center;gap:.3em;margin:.4em 1em .4em 0;vertical-align:top}
.viz-count-track{stroke:color-mix(in srgb,var(--viz-ink) 14%,var(--viz-paper));stroke-width:5}
.viz-count-arc{stroke:var(--viz-accent);stroke-width:5;stroke-linecap:round}
.viz-count-label{font-family:var(--viz-font-mono);font-size:.85em;color:var(--viz-muted)}

.viz-radar-grid{stroke-width:1}
.viz-three{cursor:grab}
`;

export function ensureStyles(doc) {
  if (!doc || doc.getElementById('vizengine-styles')) return;
  const style = doc.createElement('style');
  style.id = 'vizengine-styles';
  style.textContent = buildCSS();
  doc.head.appendChild(style);
}
