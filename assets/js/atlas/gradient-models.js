// Original bounded full-batch teaching model. No LLM, service, journal or imports.
export const MAX_UPDATES = 120;
export const MAX_PARAMETER = 1e6;
export const MAX_TRAIN_LOSS = 1e12;
const scope = 'Original synthetic single-feature linear regression. Actual full-batch MSE updates use training labels only. Validation is repeatedly visible, not an independent final test. No real measurements, LLM, remote service, causal claim or learner grading.';
const number = (value, bound) => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= bound;
const object = (value, names) => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join('|') === names.slice().sort().join('|');
const clone = (value) => JSON.parse(JSON.stringify(value));
function frozen(value) {
  if (value && typeof value === 'object') { for (const child of Object.values(value)) frozen(child); Object.freeze(value); }
  return value;
}
export function validateGradientData(value) {
  if (!object(value, ['schema_version', 'id', 'source_kind', 'units', 'description', 'samples']) || value.schema_version !== 1 || value.id !== 'brook-gradient-transect-v1' || value.source_kind !== 'original_synthetic' || value.units !== 'abstract' || typeof value.description !== 'string' || !value.description.trim() || value.description.length > 400 || !Array.isArray(value.samples) || value.samples.length !== 12) throw new Error('gradient_data');
  const seen = new Set(), counts = { train: 0, validation: 0 };
  for (const row of value.samples) {
    if (!object(row, ['id', 'split', 'x', 'y']) || typeof row.id !== 'string' || !/^[tv]-\d{2}$/.test(row.id) || !Object.hasOwn(counts, row.split) || row.id[0] !== (row.split === 'train' ? 't' : 'v') || seen.has(row.id) || !number(row.x, 5) || !number(row.y, 15)) throw new Error('gradient_sample');
    seen.add(row.id); counts[row.split]++;
  }
  if (counts.train !== 8 || counts.validation !== 4) throw new Error('gradient_split');
  const train = value.samples.filter((row) => row.split === 'train');
  const mean = train.reduce((sum, row) => sum + row.x, 0) / train.length;
  if (train.reduce((sum, row) => sum + (row.x - mean) ** 2, 0) <= 1e-8) throw new Error('gradient_variance');
  return clone(value);
}
function parameters(value, bound = MAX_PARAMETER) {
  if (!object(value, ['w', 'b']) || !number(value.w, bound) || !number(value.b, bound)) throw new Error('gradient_parameters');
}
function rate(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0.001 || value > 0.5) throw new Error('gradient_rate');
}
function rows(data, split) { return data.samples.filter((row) => row.split === split); }
function lossFor(points, theta) {
  return points.reduce((sum, row) => sum + (theta.w * row.x + theta.b - row.y) ** 2, 0) / points.length;
}
function derivative(points, theta) {
  return { w: 2 * points.reduce((sum, row) => sum + (theta.w * row.x + theta.b - row.y) * row.x, 0) / points.length,
    b: 2 * points.reduce((sum, row) => sum + theta.w * row.x + theta.b - row.y, 0) / points.length };
}
export function gradientSampleEvidence(input, theta, id) {
  const data = validateGradientData(input); parameters(theta);
  const sample = data.samples.find((row) => row.id === id);
  if (!sample) throw new Error('gradient_sample_id');
  const prediction = theta.w * sample.x + theta.b, residual = prediction - sample.y;
  const count = rows(data, sample.split).length;
  return { sample: clone(sample), prediction, residual, squared_error: residual ** 2,
    mse_contribution: residual ** 2 / count,
    gradient_contribution: sample.split === 'train' ? { w: 2 * residual * sample.x / count, b: 2 * residual / count } : null };
}
export function gradientFacts(input, theta) {
  const data = validateGradientData(input); parameters(theta);
  const train = rows(data, 'train'), n = train.length;
  const meanX = train.reduce((sum, row) => sum + row.x, 0) / n;
  const meanY = train.reduce((sum, row) => sum + row.y, 0) / n;
  const variance = train.reduce((sum, row) => sum + (row.x - meanX) ** 2, 0);
  const w = train.reduce((sum, row) => sum + (row.x - meanX) * (row.y - meanY), 0) / variance;
  const reference = { w, b: meanY - w * meanX };
  const a = 2 * train.reduce((sum, row) => sum + row.x ** 2, 0) / n, c = 2 * meanX, d = 2;
  const largest = (a + d + Math.sqrt((a - d) ** 2 + 4 * c ** 2)) / 2;
  return { gradient: derivative(train, theta), training_mse: lossFor(train, theta), validation_mse: lossFor(rows(data, 'validation'), theta),
    reference, reference_training_mse: lossFor(train, reference), hessian_largest_eigenvalue: largest, constant_rate_upper_bound: 2 / largest };
}
function initialFrame(data, theta) {
  return { iteration: 0, parameters: clone(theta), learning_rate: null, before: null, gradient: null,
    training_mse: lossFor(rows(data, 'train'), theta), validation_mse: lossFor(rows(data, 'validation'), theta) };
}
function candidate(data, previous, learningRate) {
  const train = rows(data, 'train'), gradient = derivative(train, previous.parameters);
  const theta = { w: previous.parameters.w - learningRate * gradient.w, b: previous.parameters.b - learningRate * gradient.b };
  const trainingLoss = lossFor(train, theta);
  if (!number(theta.w, MAX_PARAMETER) || !number(theta.b, MAX_PARAMETER) || !Number.isFinite(trainingLoss) || trainingLoss > MAX_TRAIN_LOSS) {
    // This stop uses no validation label or validation loss.
    return { frame: null, rejected: { iteration: previous.iteration + 1, learning_rate: learningRate,
      before: clone(previous.parameters), gradient, proposed_parameters: theta, proposed_training_mse: trainingLoss, reason: 'numeric_limit' } };
  }
  return { frame: { iteration: previous.iteration + 1, parameters: theta, learning_rate: learningRate,
    before: clone(previous.parameters), gradient, training_mse: trainingLoss, validation_mse: lossFor(rows(data, 'validation'), theta) }, rejected: null };
}
export function createGradientRun(input, theta = { w: 0, b: 0 }) {
  const data = validateGradientData(input); parameters(theta, 10);
  return frozen({ schema_version: 1, kind: 'brook-gradient-run', data, initial: clone(theta), history: [initialFrame(data, theta)], stop: null, rejected: null });
}
export function validateGradientRun(run) {
  if (!object(run, ['schema_version', 'kind', 'data', 'initial', 'history', 'stop', 'rejected']) || run.schema_version !== 1 || run.kind !== 'brook-gradient-run') throw new Error('gradient_run');
  const data = validateGradientData(run.data); parameters(run.initial, 10);
  if (!Array.isArray(run.history) || run.history.length < 1 || run.history.length > MAX_UPDATES + 1) throw new Error('gradient_history');
  let previous = initialFrame(data, run.initial);
  if (JSON.stringify(previous) !== JSON.stringify(run.history[0])) throw new Error('gradient_initial_frame');
  for (const frame of run.history.slice(1)) {
    rate(frame.learning_rate); const expected = candidate(data, previous, frame.learning_rate);
    if (!expected.frame || JSON.stringify(expected.frame) !== JSON.stringify(frame)) throw new Error('gradient_trace');
    previous = expected.frame;
  }
  if (run.stop === 'numeric_limit') {
    if (!run.rejected || run.history.length === MAX_UPDATES + 1) throw new Error('gradient_rejection');
    rate(run.rejected.learning_rate);
    const expected = candidate(data, previous, run.rejected.learning_rate);
    if (!expected.rejected || JSON.stringify(expected.rejected) !== JSON.stringify(run.rejected)) throw new Error('gradient_rejection');
  } else if (run.rejected !== null || run.stop !== (run.history.length === MAX_UPDATES + 1 ? 'update_budget' : null)) throw new Error('gradient_stop');
  return run;
}
export function advanceGradientRun(input, learningRate, count = 1) {
  const run = validateGradientRun(input); rate(learningRate);
  if (![1, 10].includes(count) || run.stop !== null) throw new Error('gradient_action');
  const next = clone(run);
  for (let i = 0; i < count; i++) {
    const result = candidate(next.data, next.history.at(-1), learningRate);
    if (result.rejected) { next.stop = 'numeric_limit'; next.rejected = result.rejected; break; }
    next.history.push(result.frame);
    if (next.history.length === MAX_UPDATES + 1) { next.stop = 'update_budget'; break; }
  }
  validateGradientRun(next); return frozen(next);
}
export function gradientReport(input) {
  const run = validateGradientRun(input);
  return { schema_version: 1, kind: 'brook-gradient-teaching-record', model_kind: 'single-feature-linear-regression',
    optimizer: 'full-batch-gradient-descent-on-training-mse', external_model_service: false, run: clone(run), scope };
}
