// Graph DSL → {direction, nodes, edges}. Tolerant: bad lines are skipped,
// referenced-but-undeclared nodes are auto-created, never throws.
//
//   graph LR
//   s:    [[ Sandbox ]]          container
//   s.p:  [ mal.exe ] "tooltip"  box nested in s, with hover title
//   ok:   ( Done )               stadium
//   q:    { Packed? }            diamond
//   s.p -> ok : "exit 0"

import { extractIcon } from '../util/icon.js';

const RE_EDGE = /^([A-Za-z_][\w.-]*)\s*(<->|->|--)\s*([A-Za-z_][\w.-]*)\s*(.*)$/;
const RE_VARIANT = /\s*\[(ok|warn|err|accent)\]\s*$/;
const EDGE_KIND = { '->': 'arrow', '<->': 'both', '--': 'line' };
const RE_NODE = /^([A-Za-z_][\w.-]*)\s*:\s*(.+)$/;
const RE_HEADER = /^graph\b\s*(.*)$/;
const DIRECTIONS = new Set(['TD', 'LR', 'BT', 'RL']);

const SHAPES = [
  ['container', /^\[\[\s*(.*?)\s*\]\]\s*(?:"(.*?)")?\s*$/],
  ['box', /^\[\s*(.*?)\s*\]\s*(?:"(.*?)")?\s*$/],
  ['stadium', /^\(\s*(.*?)\s*\)\s*(?:"(.*?)")?\s*$/],
  ['diamond', /^\{\s*(.*?)\s*\}\s*(?:"(.*?)")?\s*$/],
];

const ANIM_MODES = new Set(['anim', 'flow', 'draw', 'pulse', 'beacon', 'trace']);

function readDirectives(str, state) {
  for (const tok of String(str ?? '').trim().split(/\s+/)) {
    const up = tok.toUpperCase();
    const low = tok.toLowerCase();
    if (DIRECTIONS.has(up)) state.direction = up;
    else if (low === 'iso') state.projection = 'iso';
    else if (low === 'three' || low === '3d') state.three = true;
    else if (low === 'interactive') state.interactive = true;
    else if (ANIM_MODES.has(low)) state.animate = low === 'anim' ? state.animate || 'default' : low;
  }
}

export function parseGraph(text, infoDirection) {
  const map = new Map();
  const edges = [];
  const state = { direction: 'TD', projection: null, interactive: false, animate: null, three: false };
  readDirectives(infoDirection, state);

  const parentOf = (id) => (id.includes('.') ? id.slice(0, id.lastIndexOf('.')) : null);

  const addNode = (id, props) => {
    map.set(id, { id, parent: parentOf(id), title: null, icon: null, ...props });
  };

  // Create missing ancestors of a dot-path id; anything with children is a container.
  const ensurePath = (id) => {
    const parts = id.split('.');
    let acc = '';
    for (let k = 0; k < parts.length - 1; k++) {
      acc = acc ? `${acc}.${parts[k]}` : parts[k];
      const existing = map.get(acc);
      if (!existing) addNode(acc, { shape: 'container', label: parts[k] });
      else existing.shape = 'container';
    }
  };

  const ensureEndpoint = (id) => {
    ensurePath(id);
    if (!map.has(id)) addNode(id, { shape: 'box', label: id.split('.').pop() });
  };

  const lines = String(text ?? '').split('\n');
  for (let raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    let m = RE_HEADER.exec(line);
    if (m) {
      readDirectives(m[1], state);
      continue;
    }

    m = RE_EDGE.exec(line);
    if (m) {
      ensureEndpoint(m[1]);
      ensureEndpoint(m[3]);
      let tail = (m[4] ?? '').trim();
      let variant = null;
      const vm = RE_VARIANT.exec(tail);
      if (vm) {
        variant = vm[1];
        tail = tail.slice(0, vm.index).trim();
      }
      // a label, if present, follows a leading colon
      let label = null;
      if (tail.startsWith(':')) {
        label = tail.slice(1).trim() || null;
        if (label != null) {
          const q = /^"(.*)"$/.exec(label);
          if (q) label = q[1];
          if (!label) label = null;
        }
      }
      edges.push({ from: m[1], to: m[3], label, kind: EDGE_KIND[m[2]], variant });
      continue;
    }

    m = RE_NODE.exec(line);
    if (m) {
      const rhs = m[2].trim();
      for (const [shape, re] of SHAPES) {
        const s = re.exec(rhs);
        if (s) {
          ensurePath(m[1]);
          const existing = map.get(m[1]);
          const { icon, label } = extractIcon(s[1]);
          const props = { shape, label, icon, title: s[2] ?? null };
          // A node that already has children stays a container.
          if (existing?.shape === 'container' && shape !== 'container') props.shape = 'container';
          addNode(m[1], props);
          break;
        }
      }
      continue; // unrecognized rhs → skip line
    }
  }

  return {
    direction: state.direction,
    projection: state.projection,
    interactive: state.interactive,
    animate: state.animate,
    three: state.three,
    nodes: [...map.values()],
    edges,
  };
}
