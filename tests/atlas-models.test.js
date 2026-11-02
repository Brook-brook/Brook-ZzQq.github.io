import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gameModel,
  mercatorScale,
  copyState
} from '../assets/js/atlas/models.js';
test('prisoner: individual equilibrium differs from social optimum', () => {
  const g = gameModel('prisoner', 5);
  assert.deepEqual(g.equilibria, [[1, 1]]);
  assert.equal(g.bestTotal, 6);
  assert.equal(g.matrix[1][1][0] + g.matrix[1][1][1], 2);
});
test('stag has two coordination equilibria and handles indifference', () => {
  assert.deepEqual(gameModel('stag', 2).equilibria, [
    [0, 0],
    [1, 1]
  ]);
  assert.deepEqual(gameModel('stag', 4).equilibria, [
    [0, 0],
    [1, 1]
  ]);
  assert.deepEqual(gameModel('stag', 5).equilibria, [[1, 1]]);
});
test('all reported equilibria resist unilateral improvements across slider range', () => {
  for (const kind of ['stag', 'prisoner'])
    for (let t = 0; t <= 6; t += 0.5) {
      const g = gameModel(kind, t);
      for (const [i, j] of g.equilibria) {
        assert.ok(g.matrix[i][j][0] >= g.matrix[1 - i][j][0]);
        assert.ok(g.matrix[i][j][1] >= g.matrix[i][1 - j][1]);
      }
    }
});
test('Mercator: equator, 60 degrees, symmetry and domain', () => {
  assert.equal(mercatorScale(0), 1);
  assert.ok(Math.abs(mercatorScale(60) - 2) < 1e-12);
  assert.equal(mercatorScale(-60), mercatorScale(60));
  assert.throws(() => mercatorScale(90), RangeError);
  assert.throws(() => mercatorScale(NaN), RangeError);
});
test('copy ownership: mutation and destruction', () => {
  assert.equal(copyState(false, 2).bValue, 9);
  assert.equal(copyState(true, 2).bValue, 7);
  assert.equal(copyState(false, 3).dangling, true);
  assert.equal(copyState(true, 3).dangling, false);
});
