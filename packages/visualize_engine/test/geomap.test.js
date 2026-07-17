import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGeomap } from '../src/parse/geomap.js';
import { layoutGeomap } from '../src/layout/geomap.js';

test('parse explicit coords and city lookup', () => {
  const m = parseGeomap('a: 40.7,-74.0 | HQ\nb @ Moscow\na -> b | c2 [err]');
  assert.equal(m.nodes[0].label, 'HQ');
  assert.equal(m.nodes[0].lat, 40.7);
  assert.equal(m.nodes[1].label, 'Moscow');
  assert.ok(Math.abs(m.nodes[1].lat - 55.75) < 0.1);
  assert.equal(m.edges[0].variant, 'err');
});

test('layout emits continents, graticule, pins, arc', () => {
  const l = layoutGeomap(parseGeomap('a @ London\nb @ Tokyo\na -> b'));
  assert.ok(l.decor.some((d) => d.type === 'landmass'));
  assert.equal(l.decor.filter((d) => d.type === 'pin').length, 2);
  assert.equal(l.decor.filter((d) => d.type === 'arc').length, 1);
});

test('never throws on junk', () => {
  for (const s of ['', 'a @ Atlantis', 'x: bad', '#c']) assert.doesNotThrow(() => layoutGeomap(parseGeomap(s)));
});

test('world map has realistic detail', async () => {
  const { CONTINENTS } = await import('../src/parse/worldmap.js');
  assert.ok(CONTINENTS.length >= 10, 'multiple landmasses');
  const totalPts = CONTINENTS.reduce((s, r) => s + r.length, 0);
  assert.ok(totalPts >= 400, `enough vertices for real coastlines (got ${totalPts})`);
  for (const ring of CONTINENTS) for (const [lon, lat] of ring) {
    assert.ok(lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90, `in range: ${lon},${lat}`);
  }
});
