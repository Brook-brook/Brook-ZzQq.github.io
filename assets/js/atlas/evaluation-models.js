export const EVALUATION_DATA_ID = 'atlas-synthetic-evaluation-v1';
export const EVALUATION_SCENARIOS = ['rare', 'balanced', 'none'];
const ratio = (numerator, denominator) => denominator ? numerator / denominator : null;

export function validateBinaryRows(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 500) throw new Error('样本需为 1–500 条。');
  const ids = new Set();
  return rows.map((row) => {
    if (!row || typeof row.id !== 'string' || !/^[a-zA-Z0-9-]{1,40}$/.test(row.id) || ids.has(row.id) ||
      !Number.isFinite(row.score) || row.score < 0 || row.score > 100 || ![0, 1].includes(row.label))
      throw new Error('样本 ID、分数或标签无效。');
    ids.add(row.id);
    return { id: row.id, score: row.score, label: row.label };
  });
}

export function validateEvaluationDataset(data) {
  if (data?.schema_version !== 1 || data.dataset_id !== EVALUATION_DATA_ID || !Array.isArray(data.samples) || data.samples.length !== 20 ||
    !data.scenarios || EVALUATION_SCENARIOS.some((key) => typeof data.scenarios[key] !== 'string' || !data.scenarios[key].trim() || data.scenarios[key].length > 80))
    throw new Error('教学样本格式不受支持。');
  const scenarios = {};
  for (const scenario of EVALUATION_SCENARIOS) {
    scenarios[scenario] = validateBinaryRows(data.samples.map((sample) => ({
      id: sample.id, score: sample.score, label: sample.labels?.[scenario]
    })));
  }
  for (const [key, expected] of Object.entries({ rare: 2, balanced: 10, none: 0 })) {
    if (scenarios[key].reduce((sum, row) => sum + row.label, 0) !== expected) throw new Error('教学场景的标签比例不符。');
  }
  return { dataset_id: data.dataset_id, labels: { ...data.scenarios }, scenarios };
}

export function evaluateBinary(input, threshold = 50) {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) throw new Error('阈值需在 0–100 之间。');
  const rows = validateBinaryRows(input).map((row) => {
    const predicted = Number(row.score >= threshold);
    const outcome = row.label ? (predicted ? 'TP' : 'FN') : (predicted ? 'FP' : 'TN');
    return { ...row, predicted, outcome };
  });
  const count = { TP: 0, FP: 0, FN: 0, TN: 0 };
  rows.forEach((row) => count[row.outcome]++);
  const { TP, FP, FN, TN } = count;
  return {
    threshold, total: rows.length, count, actualPositive: TP + FN, predictedPositive: TP + FP,
    accuracy: (TP + TN) / rows.length, precision: ratio(TP, TP + FP), recall: ratio(TP, TP + FN),
    f1: ratio(2 * TP, 2 * TP + FP + FN), prevalence: (TP + FN) / rows.length, rows
  };
}

export function negativeBaseline(input) {
  const rows = validateBinaryRows(input);
  const result = evaluateBinary(rows.map((row) => ({ ...row, score: 0 })), 100);
  // A constant-label strategy has no decision threshold or altered source scores.
  return Object.fromEntries(Object.entries(result).filter(([key]) => !['rows', 'threshold'].includes(key)));
}

export function exportEvaluation(dataset, scenario, threshold) {
  if (!EVALUATION_SCENARIOS.includes(scenario)) throw new Error('未知教学场景。');
  return {
    schema_version: 1, lab: 'binary-evaluation', dataset_id: dataset.dataset_id,
    synthetic: true, score_definition: 'Original teaching scores, not calibrated probabilities or a trained model.',
    scenario, decision_rule: 'score >= threshold predicts 1',
    evaluation: evaluateBinary(dataset.scenarios[scenario], threshold),
    baseline: { strategy: 'always predict 0', evaluation: negativeBaseline(dataset.scenarios[scenario]) }
  };
}
