import { evaluateBinary } from './evaluation-models.js';

export const SPATIAL_DATA_ID = 'atlas-spatial-grid-v1';
export const SPATIAL_PATTERNS = ['zones', 'diagonal'];
export const SPATIAL_K = [1, 3, 5, 7];
const finiteCoordinate = (value) => Number.isFinite(value) && value >= 0 && value <= 800;
const validId = (id) => typeof id === 'string' && /^[a-zA-Z0-9-]{1,40}$/.test(id);

export function validateSpatialDataset(data) {
  if (data?.schema_version !== 1 || data.dataset_id !== SPATIAL_DATA_ID || data.unit !== 'synthetic-m' ||
    data.generation_seed !== 2026 || JSON.stringify(data.extent) !== '[0,0,800,800]' ||
    !Array.isArray(data.points) || data.points.length !== 80 || !data.patterns ||
    SPATIAL_PATTERNS.some((key) => typeof data.patterns[key] !== 'string' || !data.patterns[key].trim() || data.patterns[key].length > 80))
    throw new Error('合成空间样本格式不受支持。');
  const ids = new Set(), coordinates = new Set(), counts = [0, 0, 0, 0];
  const points = data.points.map((point) => {
    if (!point || !validId(point.id) || ids.has(point.id) || !finiteCoordinate(point.x) || !finiteCoordinate(point.y) ||
      !Number.isInteger(point.block) || point.block !== Number(point.x >= 400) + 2 * Number(point.y >= 400) ||
      SPATIAL_PATTERNS.some((key) => ![0, 1].includes(point.labels?.[key]))) throw new Error('合成点 ID、坐标、分区或标签无效。');
    const xy = `${point.x},${point.y}`;
    if (coordinates.has(xy)) throw new Error('合成点坐标重复。');
    ids.add(point.id); coordinates.add(xy); counts[point.block]++;
    return { id: point.id, x: point.x, y: point.y, block: point.block, labels: { zones: point.labels.zones, diagonal: point.labels.diagonal } };
  });
  if (counts.some((count) => count !== 20)) throw new Error('每个合成分区需要 20 个点。');
  return { ...data, extent: [...data.extent], patterns: { ...data.patterns }, points };
}

export function validateSpatialParameters({ pattern = 'zones', k = 3, seed = 42, block = 0 } = {}) {
  if (!SPATIAL_PATTERNS.includes(pattern) || !SPATIAL_K.includes(k) || !Number.isInteger(seed) || seed < 0 || seed > 9999 ||
    !Number.isInteger(block) || block < 0 || block > 3) throw new Error('参数无效：k 选 1/3/5/7，种子为 0–9999 的整数，分区为 A–D。');
  return { pattern, k, seed, block };
}

// The prediction function never reads a query/test label. Distances are planar.
export function predictKnn(training, query, k) {
  if (!Array.isArray(training) || !training.length || training.length > 80 || !SPATIAL_K.includes(k) || k > training.length ||
    !query || !finiteCoordinate(query.x) || !finiteCoordinate(query.y)) throw new Error('邻居预测输入无效。');
  const ids = new Set();
  const neighbors = training.map((point) => {
    if (!point || !validId(point.id) || ids.has(point.id) || !finiteCoordinate(point.x) || !finiteCoordinate(point.y) || ![0, 1].includes(point.label))
      throw new Error('训练样本无效。');
    ids.add(point.id);
    return { id: point.id, label: point.label, distance: Math.hypot(query.x - point.x, query.y - point.y) };
  }).sort((a, b) => a.distance - b.distance || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).slice(0, k);
  const positiveVotes = neighbors.reduce((sum, point) => sum + point.label, 0);
  const score = positiveVotes / k * 100;
  return { neighbors, positiveVotes, score, predicted: Number(score >= 50) };
}

export function spatialSplits(points, seed, block) {
  validateSpatialParameters({ seed, block });
  const indexes = points.map((_, index) => index);
  let state = seed >>> 0;
  for (let i = indexes.length - 1; i > 0; i--) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const j = Math.floor(state / 4294967296 * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  const randomTest = new Set(indexes.slice(0, 20));
  return {
    random: { train: points.filter((_, i) => !randomTest.has(i)), test: points.filter((_, i) => randomTest.has(i)) },
    spatial: { train: points.filter((point) => point.block !== block), test: points.filter((point) => point.block === block) }
  };
}

export function compareSpatialValidation(input, parameters = {}) {
  const dataset = validateSpatialDataset(input);
  const params = validateSpatialParameters(parameters);
  const splits = spatialSplits(dataset.points, params.seed, params.block);
  const protocols = {};
  for (const [name, split] of Object.entries(splits)) {
    const training = split.train.map((point) => ({ id: point.id, x: point.x, y: point.y, label: point.labels[params.pattern] }));
    const predictions = split.test.map((point) => ({ id: point.id, ...predictKnn(training, point, params.k) }));
    // Only the scorer sees the held-out labels, after prediction is complete.
    const evaluation = evaluateBinary(predictions.map((prediction, i) => ({ id: prediction.id, score: prediction.score, label: split.test[i].labels[params.pattern] })), 50);
    protocols[name] = {
      train_ids: split.train.map((point) => point.id), test_ids: split.test.map((point) => point.id),
      evaluation, predictions,
      mean_nearest_training_distance: predictions.reduce((sum, prediction) => sum + prediction.neighbors[0].distance, 0) / predictions.length
    };
  }
  return { parameters: params, protocols };
}

export function exportSpatialValidation(dataset, parameters) {
  const source = validateSpatialDataset(dataset);
  return {
    schema_version: 1, lab: 'spatial-holdout', synthetic: true,
    interpretation: 'One random and one spatial holdout on original synthetic planar data. Not cross-validation, calibrated probabilities or real-world performance.',
    method: 'Uniform Euclidean kNN; ASCII ID breaks distance ties; positive-vote share >= 50 predicts 1.',
    source, ...compareSpatialValidation(source, parameters)
  };
}
