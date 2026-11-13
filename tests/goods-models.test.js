import test from 'node:test';
import assert from 'node:assert/strict';
import { goodsDefaults, evaluatePublicGoods, goodsEndpointSlice, createGoodsReport } from '../assets/js/atlas/goods-models.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} vs ${b}`);
test('default pool, personal deviation and social total agree with independent hand calculations', () => {
  const r = evaluatePublicGoods(goodsDefaults);
  assert.equal(r.share, 16); assert.equal(r.total_payoff, 104);
  assert.deepEqual(r.players.map((p) => p.payoff), [26, 26, 26, 26]);
  assert.equal(r.players[0].deviation_gain, 6); assert.equal(r.players[0].best_contribution, 0);
  assert.equal(r.is_nash, false); assert.equal(r.optimal_total, 128); assert.equal(r.social_gap, 24);
  const alone = evaluatePublicGoods({ ...goodsDefaults, contributions: [0, 10, 10, 10] });
  assert.equal(alone.players[0].payoff, 32); assert.equal(alone.total_payoff, 98);
  const together = evaluatePublicGoods({ ...goodsDefaults, contributions: [0, 0, 0, 0] });
  assert.equal(together.players[0].payoff, 20); assert.equal(together.total_payoff, 80);
  assert.equal(together.is_nash, true); assert.equal(together.is_social_optimum, false);
});

test('exact equality boundaries distinguish all Nash profiles from all social optima', () => {
  for (const n of [2, 3, 4, 7, 8]) {
    const c = Array.from({ length: n }, (_, i) => i % 3 * 5);
    const indifferent = evaluatePublicGoods({ endowment: 20, multiplier_tenths: n * 10, contributions: c });
    assert.equal(indifferent.nash_profiles, 'any'); assert.equal(indifferent.is_nash, true);
    assert.ok(indifferent.players.every((p) => p.best_contribution === null && p.deviation_gain === 0));
    assert.equal(indifferent.social_profiles, 'all-full'); assert.equal(indifferent.is_social_optimum, false);
    const flatSum = evaluatePublicGoods({ endowment: 20, multiplier_tenths: 10, contributions: c });
    assert.equal(flatSum.social_profiles, 'any'); assert.equal(flatSum.is_social_optimum, true);
    assert.equal(flatSum.total_payoff, n * 20); assert.equal(flatSum.nash_profiles, 'all-zero');
    const aligned = evaluatePublicGoods({ endowment: 20, multiplier_tenths: n * 10 + 1, contributions: c });
    assert.equal(aligned.nash_profiles, 'all-full'); assert.equal(aligned.social_profiles, 'all-full');
  }
});

test('small games exhaustively match independent best-response enumeration and group optimization', () => {
  for (const n of [2, 3]) for (const mt of [0, 5, 10, 15, 20, 25, 30, 35, 80]) {
    const w = 2, m = mt / 10;
    const profiles = Array.from({ length: 3 ** n }, (_, code) => Array.from({ length: n }, () => { const digit = code % 3; code = Math.floor(code / 3); return digit; }));
    const payoff = (c, i) => w - c[i] + m * c.reduce((sum, v) => sum + v, 0) / n;
    const maximum = Math.max(...profiles.map((c) => c.reduce((sum, _, i) => sum + payoff(c, i), 0)));
    for (const c of profiles) {
      const r = evaluatePublicGoods({ endowment: w, multiplier_tenths: mt, contributions: c });
      let nash = true;
      for (let i = 0; i < n; i++) {
        const alternatives = Array.from({ length: w + 1 }, (_, choice) => { const alt = [...c]; alt[i] = choice; return payoff(alt, i); });
        const best = Math.max(...alternatives), gain = best - payoff(c, i);
        close(r.players[i].payoff, payoff(c, i)); close(r.players[i].deviation_gain, gain);
        if (gain > 1e-9) nash = false;
      }
      assert.equal(r.is_nash, nash); close(r.optimal_total, maximum);
      assert.equal(r.is_social_optimum, Math.abs(r.total_payoff - maximum) < 1e-9);
    }
  }
});

test('endpoint slice holds all other individuals fixed and does not claim a full game', () => {
  const before = structuredClone(goodsDefaults), slice = goodsEndpointSlice(goodsDefaults);
  assert.deepEqual(slice.map((p) => [p.first_payoff, p.second_payoff]), [[28, 28], [36, 16], [16, 36], [24, 24]]);
  assert.ok(slice.every((p) => JSON.stringify(p.remaining_contributions) === '[10,10]'));
  assert.ok(slice.every((p) => !Object.hasOwn(p, 'is_nash')));
  assert.deepEqual(goodsDefaults, before);
});

test('for multiplier below one, zero contributions maximize total and private points', () => {
  const r = evaluatePublicGoods({ endowment: 20, multiplier_tenths: 0, contributions: [20, 0] });
  assert.equal(r.total_payoff, 20); assert.equal(r.optimal_total, 40);
  assert.equal(r.social_profiles, 'all-zero'); assert.equal(r.nash_profiles, 'all-zero');
  assert.equal(r.players[0].payoff, 0); assert.equal(r.players[0].deviation_gain, 20);
});

test('complete report replays current and counterfactual profiles without mutation or empirical claims', () => {
  const state = structuredClone(goodsDefaults), report = createGoodsReport(state);
  state.contributions[0] = 0;
  assert.equal(report.empirical, false); assert.equal(report.result.parameters.contributions[0], 10);
  assert.deepEqual(evaluatePublicGoods(report.result.parameters), report.result);
  assert.equal(report.comparison.zero.total_payoff, 80); assert.equal(report.comparison.full.total_payoff, 128);
  assert.match(report.assumptions.objective, /not fairness/);
});

test('invalid dimensions, types, unknown preferences and bounds fail instead of silently coercing', () => {
  for (const patch of [{ endowment: 0 }, { endowment: 101 }, { endowment: 2.5 },
    { multiplier_tenths: '16' }, { multiplier_tenths: 16.1 }, { multiplier_tenths: -1 }, { multiplier_tenths: 101 },
    { contributions: [1] }, { contributions: Array(9).fill(1) }, { contributions: [1, 21] },
    { contributions: [1, -1] }, { contributions: [1, '2'] }, { contributions: [1, 1.5] },
    { contributions: [1, NaN] }, { contributions: Array(4) }, { altruism: true }]) assert.throws(() => evaluatePublicGoods({ ...goodsDefaults, ...patch }));
  for (const value of [null, [], {}, undefined]) assert.throws(() => evaluatePublicGoods(value));
});
