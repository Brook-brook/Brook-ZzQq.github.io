import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterPlaces,
  projectPlaces,
  clampView,
  validateCampus
} from '../assets/js/atlas/campus-model.js';
const places = [
  {
    id: 'west',
    name: '主图书馆',
    english: 'Main Library',
    category: 'library',
    tags: ['library', 'study'],
    coordinates: [120.071, 30.305],
    source: 'https://mapcarta.com/W1',
    osm: 'way/1'
  },
  {
    id: 'east',
    name: '教学楼',
    english: 'Building',
    category: 'teaching',
    tags: ['teaching'],
    coordinates: [120.082, 30.307],
    source: 'https://mapcarta.com/W2',
    osm: 'way/2'
  }
];
test('campus filtering combines query, category and favorites, including verified empty categories', () => {
  assert.deepEqual(
    filterPlaces(places, { category: 'study', query: 'MAIN' }).map((p) => p.id),
    ['west']
  );
  assert.deepEqual(filterPlaces(places, { category: 'dining' }), []);
  assert.deepEqual(
    filterPlaces(places, { onlyFavorites: true, favorites: ['east'] }).map(
      (p) => p.id
    ),
    ['east']
  );
  assert.deepEqual(
    filterPlaces(places, {
      category: 'study',
      onlyFavorites: true,
      favorites: ['east']
    }),
    []
  );
});
test('Mercator point projection preserves east/right, north/up, and fits multiple screens', () => {
  for (const width of [335, 468, 960]) {
    const p = projectPlaces(places, width, 420);
    assert.ok(p[0].x < p[1].x);
    assert.ok(p[0].y > p[1].y);
    for (const point of p) {
      assert.ok(Number.isFinite(point.x));
      assert.ok(point.x >= 70 && point.x <= width - 70);
      assert.ok(point.y >= 69 && point.y <= 351);
    }
  }
});
test('invalid or unrelated-campus coordinates are rejected rather than rendered', () => {
  assert.equal(validateCampus({ coordinateSystem: 'WGS84', places }).length, 2);
  assert.throws(() => validateCampus({ coordinateSystem: 'GCJ02', places }));
  assert.throws(() =>
    validateCampus({
      coordinateSystem: 'WGS84',
      places: [{ ...places[0], coordinates: [108.76, 34.03] }]
    })
  );
  assert.throws(() =>
    validateCampus({
      coordinateSystem: 'WGS84',
      places: [places[0], places[0]]
    })
  );
});
test('stored view values are bounded and invalid storage values cannot escape the map', () => {
  assert.deepEqual(clampView({ zoom: 100, x: Infinity, y: -100 }), {
    zoom: 3,
    x: 1.2,
    y: -1.2
  });
  assert.deepEqual(clampView({ zoom: 'bad', x: 'bad', y: null }), {
    zoom: 1,
    x: 0,
    y: 0
  });
});
