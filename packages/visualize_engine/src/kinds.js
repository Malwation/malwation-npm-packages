// Registry: fence kind → (text, info) → layout result (or null for empty).
// Every layout is pure; the renderer never knows which kind produced it.

import { parseGraph } from './parse/graph.js';
import { parseTree } from './parse/tree.js';
import { parseSequence } from './parse/sequence.js';
import { parseTimeline } from './parse/timeline.js';
import { parseBars } from './parse/bars.js';
import { layoutGraph } from './layout/layered.js';
import { layoutTree } from './layout/tree.js';
import { layoutSequence } from './layout/sequence.js';
import { layoutTimeline } from './layout/timeline.js';
import { layoutBars } from './layout/bars.js';
import { layoutPie } from './layout/pie.js';
import { parseGantt } from './parse/gantt.js';
import { layoutGantt } from './layout/gantt.js';
import { layoutGraph3d } from './layout/three.js';
import { layoutBars3d } from './layout/bars3d.js';
import { parseSankey } from './parse/sankey.js';
import { layoutSankey } from './layout/sankey.js';
import { parseHierarchy } from './parse/hierarchy.js';
import { layoutTreemap } from './layout/treemap.js';
import { layoutFlame } from './layout/flame.js';
import { parseGeomap } from './parse/geomap.js';
import { layoutGeomap } from './layout/geomap.js';
import { layoutNetwork } from './layout/network.js';
import { fromMermaid } from './interop/mermaid.js';
import { fromDot } from './interop/dot.js';

export const KINDS = {
  graph(text, info) {
    const model = parseGraph(text, info);
    if (!model.nodes.length) return null;
    return model.three ? layoutGraph3d(model) : layoutGraph(model);
  },
  graph3d(text, info) {
    const model = parseGraph(text, info);
    if (!model.nodes.length) return null;
    model.three = true;
    return layoutGraph3d(model);
  },
  bars3d(text) {
    const model = parseBars(text);
    return model.rows.length ? layoutBars3d(model) : null;
  },
  tree(text) {
    const model = parseTree(text);
    return model.roots.length ? layoutTree(model) : null;
  },
  sequence(text) {
    const model = parseSequence(text);
    return model.actors.length ? layoutSequence(model) : null;
  },
  timeline(text) {
    const model = parseTimeline(text);
    return model.events.length ? layoutTimeline(model) : null;
  },
  bars(text) {
    const model = parseBars(text);
    return model.rows.length ? layoutBars(model) : null;
  },
  pie(text) {
    const model = parseBars(text);
    const layout = layoutPie(model);
    return layout.decor.length ? layout : null;
  },
  gantt(text) {
    const model = parseGantt(text);
    return model.tasks.length ? layoutGantt(model) : null;
  },
  sankey(text) {
    const model = parseSankey(text);
    return model.links.length ? layoutSankey(model) : null;
  },
  treemap(text) {
    const model = parseHierarchy(text);
    return model.roots.length ? layoutTreemap(model) : null;
  },
  flame(text) {
    const model = parseHierarchy(text);
    return model.roots.length ? layoutFlame(model) : null;
  },
  geomap(text) {
    const model = parseGeomap(text);
    return model.nodes.length ? layoutGeomap(model) : null;
  },
  network(text, info) {
    const model = parseGraph(text, info);
    return model.nodes.length ? layoutNetwork(model) : null;
  },
  mermaid(text) {
    const model = fromMermaid(text);
    return model.nodes.length ? layoutGraph(model) : null;
  },
  dot(text) {
    const model = fromDot(text);
    return model.nodes.length ? layoutGraph(model) : null;
  },
};
