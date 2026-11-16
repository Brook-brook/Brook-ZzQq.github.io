import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { advanceGradientRun, createGradientRun, gradientFacts, gradientReport, gradientSampleEvidence, MAX_UPDATES, validateGradientData, validateGradientRun } from '../assets/js/atlas/gradient-models.js';

const data = JSON.parse(await readFile('_data/gradient_samples.json', 'utf8'));
const close = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) <= tolerance, `${a} differs from independent ${b}`);
test('the original12-point fixture preserves roles and fails malformed, sparse, unbounded and degenerate data', () => {
  assert.equal(validateGradientData(data).samples.length, 12);
  for (const edit of [
    (x) => x.private_note = 'synthetic', (x) => x.samples.pop(), (x) => delete x.samples[2],
    (x) => x.samples[1].id = x.samples[0].id, (x) => x.samples[0].split = 'test',
    (x) => x.samples[0].x = true, (x) => x.samples[0].y = Infinity,
    (x) => x.samples[0].x = 6, (x) => x.samples[0].y = '1',
    (x) => x.samples.filter((r) => r.split === 'train').forEach((r) => r.x = 1)
  ]) { const value = structuredClone(data); edit(value); assert.throws(() => validateGradientData(value)); }
});
test('OLS and the first full-batch step agree with independently summed rational equations', () => {
  const facts = gradientFacts(data, { w: 0, b: 0 });
  close(facts.reference.w, 99 / 50); close(facts.reference.b, 17 / 16);
  close(facts.reference_training_mse, 1339 / 32000);
  close(facts.gradient.w, -297 / 10); close(facts.gradient.b, -17 / 8);
  close(facts.hessian_largest_eigenvalue, 15); close(facts.constant_rate_upper_bound, 2 / 15);
  const run = advanceGradientRun(createGradientRun(data), 1 / 20);
  close(run.history[1].parameters.w, 297 / 200); close(run.history[1].parameters.b, 17 / 160);
  assert.deepEqual(run.history[1].before, { w: 0, b: 0 }); assert.equal(run.history[1].learning_rate, 0.05);
});
test('individual original residual contributions sum to the actual training objective and gradient', () => {
  for (const theta of [{ w: 0, b: 0 }, { w: 1.485, b: 0.10625 }, { w: -1, b: 2 }]) {
    const facts = gradientFacts(data, theta);
    const evidence = data.samples.map((row) => gradientSampleEvidence(data, theta, row.id));
    const training = evidence.filter((row) => row.sample.split === 'train');
    const validation = evidence.filter((row) => row.sample.split === 'validation');
    close(training.reduce((sum, row) => sum + row.mse_contribution, 0), facts.training_mse);
    close(validation.reduce((sum, row) => sum + row.mse_contribution, 0), facts.validation_mse);
    close(training.reduce((sum, row) => sum + row.gradient_contribution.w, 0), facts.gradient.w);
    close(training.reduce((sum, row) => sum + row.gradient_contribution.b, 0), facts.gradient.b);
    assert.ok(validation.every((row) => row.gradient_contribution === null));
  }
  const first = gradientSampleEvidence(data, { w: 0, b: 0 }, 't-01');
  close(first.prediction, 0); close(first.residual, 34 / 5); close(first.squared_error, 1156 / 25);
  close(first.mse_contribution, 289 / 50); close(first.gradient_contribution.w, -34 / 5); close(first.gradient_contribution.b, 17 / 10);
});
test('sample inspection is owned public evidence and cannot change a run or invent a validation gradient', () => {
  const run = createGradientRun(data), before = gradientReport(run);
  const evidence = gradientSampleEvidence(data, run.initial, 'v-01');
  assert.equal(evidence.gradient_contribution, null); close(evidence.mse_contribution, 196 / 25);
  evidence.sample.y = 0;
  assert.equal(data.samples.find((row) => row.id === 'v-01').y, -5.6);
  assert.deepEqual(gradientReport(run), before);
  assert.throws(() => gradientSampleEvidence(data, run.initial, 'not-a-sample'));
  assert.throws(() => gradientSampleEvidence(data, { w: Infinity, b: 0 }, 't-01'));
});
test('the analytical training gradient matches independent centred finite differences', () => {
  const theta = { w: -0.7, b: 1.3 }, h = 1e-5;
  const loss = (p) => data.samples.filter((r) => r.split === 'train').map((r) => (p.w * r.x + p.b - r.y) ** 2).reduce((a, b) => a + b, 0) / 8;
  const actual = gradientFacts(data, theta).gradient;
  for (const k of ['w', 'b']) close(actual[k], (loss({ ...theta, [k]: theta[k] + h }) - loss({ ...theta, [k]: theta[k] - h })) / (2 * h), 1e-7);
});
test('validation labels cannot alter the fit, gradients, update sequence or stop', () => {
  const changed = structuredClone(data); for (const row of changed.samples) if (row.split === 'validation') row.y += 1;
  let a = createGradientRun(data), b = createGradientRun(changed);
  for (let i = 0; i < 12; i++) { a = advanceGradientRun(a, 0.05, 10); b = advanceGradientRun(b, 0.05, 10); }
  const fitted = (run) => run.history.map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => key !== 'validation_mse')));
  assert.deepEqual(fitted(a), fitted(b)); assert.equal(a.stop, b.stop);
  assert.notEqual(a.history.at(-1).validation_mse, b.history.at(-1).validation_mse);
  const factsA = gradientFacts(data, { w: 1, b: 2 }), factsB = gradientFacts(changed, { w: 1, b: 2 });
  assert.deepEqual(factsA.reference, factsB.reference); assert.deepEqual(factsA.gradient, factsB.gradient);
  assert.equal(factsA.constant_rate_upper_bound, factsB.constant_rate_upper_bound);
});
test('a stable constant rate lowers convex training MSE and budget exhaustion is not convergence certification', () => {
  let run = createGradientRun(data);
  while (!run.stop) run = advanceGradientRun(run, 0.05, 10);
  assert.equal(run.history.length, MAX_UPDATES + 1); assert.equal(run.stop, 'update_budget');
  for (let i = 1; i < run.history.length; i++) assert.ok(run.history[i].training_mse <= run.history[i - 1].training_mse + 1e-12);
  close(run.history.at(-1).parameters.w, 99 / 50, 1e-6); close(run.history.at(-1).parameters.b, 17 / 16, 1e-5);
  assert.throws(() => advanceGradientRun(run, 0.05));
});
test('large-rate numeric stopping matches independent eigenmode powers and preserves the last applied frame', () => {
  let run = createGradientRun(data);
  while (!run.stop) run = advanceGradientRun(run, 0.5, 10);
  assert.equal(run.stop, 'numeric_limit');
  const n = run.history.at(-1).iteration;
  close(run.history.at(-1).parameters.w, (99 / 50) * (1 - (-6.5) ** n), 1e-7);
  close(run.history.at(-1).parameters.b, 17 / 16);
  assert.equal(run.rejected.iteration, n + 1);
  assert.ok(Math.abs(run.rejected.proposed_parameters.w) > 1e6 || run.rejected.proposed_training_mse > 1e12);
  assert.ok(run.history.at(-1).training_mse <= 1e12);
});
test('mixed applied rates, immutable source snapshots and complete exports preserve actual history only', () => {
  const input = structuredClone(data); let run = createGradientRun(input, { w: -1, b: 2 }); input.samples[0].y = 15;
  run = advanceGradientRun(run, 0.01); run = advanceGradientRun(run, 0.08, 10);
  const report = gradientReport(run);
  assert.equal(report.run.data.samples[0].y, -6.8); assert.deepEqual(report.run.history.slice(1).map((r) => r.learning_rate), [0.01, ...Array(10).fill(0.08)]);
  assert.equal(report.external_model_service, false); assert.match(report.scope, /not an independent final test/);
  assert.equal(validateGradientRun(JSON.parse(JSON.stringify(report.run))).history.length, 12);
  assert.throws(() => run.history.push({})); report.run.history[1].parameters.w += 1;
  assert.throws(() => validateGradientRun(report.run));
});
test('invalid actions and altered numerical evidence cannot become training', () => {
  const run = createGradientRun(data);
  for (const value of [0, -1, NaN, Infinity, true, '0.05', 0.501]) assert.throws(() => advanceGradientRun(run, value));
  for (const value of [0, 2, 11, true]) assert.throws(() => advanceGradientRun(run, 0.05, value));
  const altered = structuredClone(advanceGradientRun(run, 0.05)); altered.history[1].validation_mse = 0;
  assert.throws(() => validateGradientRun(altered)); assert.equal(run.history.length, 1);
});
test('immutable prefixes stay replayable while validated mutable copies never gain cached trust', () => {
  for (const [learningRate, initial] of [[0.001, { w: -10, b: 10 }], [0.05, { w: 0, b: 0 }], [0.2, { w: 3, b: -4 }], [0.5, { w: 0, b: 0 }]]) {
    let run = createGradientRun(data, initial);
    while (!run.stop) {
      const prior = run, length = prior.history.length;
      run = advanceGradientRun(run, learningRate, 10);
      assert.equal(prior.history.length, length);
      const mutable = JSON.parse(JSON.stringify(run));
      assert.equal(validateGradientRun(mutable), mutable, 'serialized copies receive full replay');
      mutable.history.at(-1).training_mse += 1;
      assert.throws(() => validateGradientRun(mutable), 'previously validated mutable objects must be checked again');
      assert.equal(validateGradientRun(run), run);
      assert.ok(Object.isFrozen(run.data.samples[0]) && Object.isFrozen(run.history.at(-1).parameters));
    }
    const shallowFrozen = Object.freeze(JSON.parse(JSON.stringify(run)));
    validateGradientRun(shallowFrozen);
    shallowFrozen.data.samples[0].y += 0.1;
    assert.throws(() => validateGradientRun(shallowFrozen), 'freezing an external shell cannot forge private ownership');
  }
});
