// Geomap DSL → {nodes:[{id,label,lat,lon}], edges}.
//   id: lat,lon [| label]     explicit coordinates
//   id @ City   [| label]     built-in city lookup
//   a -> b [| label] [err]    connection arc
// Never throws.

// city → [lat, lon]
export const CITIES = {
  amsterdam: [52.37, 4.9], moscow: [55.75, 37.62], beijing: [39.9, 116.4], tokyo: [35.68, 139.69],
  london: [51.51, -0.13], newyork: [40.71, -74.01], 'new york': [40.71, -74.01], losangeles: [34.05, -118.24],
  'los angeles': [34.05, -118.24], berlin: [52.52, 13.4], paris: [48.86, 2.35], saopaulo: [-23.55, -46.63],
  'sao paulo': [-23.55, -46.63], sydney: [-33.87, 151.21], mumbai: [19.08, 72.88], singapore: [1.35, 103.82],
  dubai: [25.2, 55.27], lagos: [6.52, 3.38], johannesburg: [-26.2, 28.05], toronto: [43.65, -79.38],
  chicago: [41.88, -87.63], seoul: [37.57, 126.98], istanbul: [41.01, 28.98], kyiv: [50.45, 30.52],
  tehran: [35.69, 51.39], cairo: [30.04, 31.24], bucharest: [44.43, 26.1], hongkong: [22.32, 114.17],
  'hong kong': [22.32, 114.17], delhi: [28.61, 77.21], bangkok: [13.76, 100.5], jakarta: [-6.21, 106.85],
  madrid: [40.42, -3.7], rome: [41.9, 12.5], sanfrancisco: [37.77, -122.42], 'san francisco': [37.77, -122.42],
  washington: [38.9, -77.04], frankfurt: [50.11, 8.68], stockholm: [59.33, 18.06], oslo: [59.91, 10.75],
  reykjavik: [64.15, -21.94], nairobi: [-1.29, 36.82],
};

import { extractIcon } from '../util/icon.js';

const RE_COORD = /^([A-Za-z_][\w-]*)\s*:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*(?:\|\s*(.*))?$/;
const RE_CITY = /^([A-Za-z_][\w-]*)\s*@\s*([^|]+?)\s*(?:\|\s*(.*))?$/;
const RE_EDGE = /^([A-Za-z_][\w-]*)\s*->\s*([A-Za-z_][\w-]*)\s*(?:\|\s*(.*?))?\s*(?:\[(ok|warn|err|accent)\])?\s*(dashed|dotted|solid)?\s*$/;

export function parseGeomap(text) {
  const nodes = new Map();
  const edges = [];
  const set = (id, lat, lon, rawLabel) => {
    const { icon, label } = extractIcon(rawLabel || id);
    nodes.set(id, { id, lat, lon, label: label || id, icon });
  };

  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    let m = RE_COORD.exec(line);
    if (m) {
      set(m[1], Number(m[2]), Number(m[3]), m[4]);
      continue;
    }
    m = RE_CITY.exec(line);
    if (m) {
      const c = CITIES[m[2].trim().toLowerCase()];
      if (c) set(m[1], c[0], c[1], m[3] || m[2].trim());
      continue;
    }
    m = RE_EDGE.exec(line);
    if (m && nodes.has(m[1]) && nodes.has(m[2])) {
      edges.push({ from: m[1], to: m[2], label: m[3]?.trim() || null, variant: m[4] || null, dash: m[5] || null });
    }
  }
  return { nodes: [...nodes.values()], edges };
}
