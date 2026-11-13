import { validateEvaluationDataset, evaluateBinary, negativeBaseline, exportEvaluation } from './evaluation-models.js';

const root = document.querySelector('[data-evaluation-lab]');
const percent = (value) => value === null ? '—' : `${(value * 100).toFixed(1)}%`;
const names = { all: '全部样本', TP: '正确识别 TP', FP: '误报 FP', FN: '漏报 FN', TN: '正确排除 TN' };
const svgNS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs, text) {
  const node = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (text) node.textContent = text;
  return node;
}

if (root) {
  const status = root.querySelector('#evaluation-status');
  try {
    const dataset = validateEvaluationDataset(JSON.parse(root.querySelector('[data-evaluation-dataset]').textContent));
    const scenario = root.querySelector('#evaluation-scenario');
    const threshold = root.querySelector('#evaluation-threshold');
    const plot = root.querySelector('#evaluation-score-plot');
    let filter = 'all';
    let result;
    const x = (score) => 42 + 290 * score / 100;
    const axes = plot.querySelector('[data-evaluation-axes]');
    for (const score of [0, 25, 50, 75, 100]) {
      axes.append(svg('line', { x1: x(score), x2: x(score), y1: 36, y2: 174, class: 'evaluation-grid-line' }));
      axes.append(svg('text', { x: x(score), y: 194, 'text-anchor': 'middle' }, String(score)));
    }
    axes.append(svg('text', { x: 3, y: 83 }, '实际1'), svg('text', { x: 3, y: 151 }, '实际0'));

    function render() {
      result = evaluateBinary(dataset.scenarios[scenario.value], Number(threshold.value));
      const { TP, FP, FN, TN } = result.count;
      root.querySelector('#evaluation-threshold-value').textContent = threshold.value;
      root.querySelector('#evaluation-rule').textContent = `分数 ≥ ${threshold.value} 判为 1；低于 ${threshold.value} 判为 0。`;
      threshold.setAttribute('aria-valuetext', `阈值 ${threshold.value}，达到阈值判为 1`);
      const formulas = {
        accuracy: `(TP + TN) / N = ${TP + TN} / ${result.total}`,
        precision: TP + FP ? `TP / (TP + FP) = ${TP} / ${TP + FP}` : '无预测正例，分母为 0',
        recall: TP + FN ? `TP / (TP + FN) = ${TP} / ${TP + FN}` : '样本无正例，分母为 0',
        f1: 2 * TP + FP + FN ? `2TP / (2TP + FP + FN) = ${2 * TP} / ${2 * TP + FP + FN}` : 'TP、FP、FN 均为 0'
      };
      for (const metric of ['accuracy', 'precision', 'recall', 'f1']) {
        root.querySelector(`[data-metric="${metric}"]`).textContent = percent(result[metric]);
        root.querySelector(`[data-formula="${metric}"]`).textContent = formulas[metric];
      }
      for (const [key, value] of Object.entries(result.count)) root.querySelector(`[data-count="${key}"]`).textContent = value;
      const baseline = negativeBaseline(dataset.scenarios[scenario.value]);
      root.querySelector('#evaluation-baseline').textContent = `只预测 0 的基线：${percent(baseline.accuracy)} 准确率，${baseline.recall === null ? '召回率未定义' : `召回率 ${percent(baseline.recall)}`}。`;
      const shown = result.rows.filter((row) => filter === 'all' || row.outcome === filter);
      const body = document.createDocumentFragment();
      for (const row of shown) {
        const tr = document.createElement('tr');
        tr.dataset.sampleId = row.id;
        [row.id, row.score, row.label, row.predicted, `${names[row.outcome]}`].forEach((value, index) => {
          const cell = document.createElement(index === 0 ? 'th' : 'td');
          if (index === 0) cell.scope = 'row';
          cell.textContent = value; tr.append(cell);
        });
        body.append(tr);
      }
      root.querySelector('#evaluation-samples').replaceChildren(body);
      const sampleCount = root.querySelector('#evaluation-sample-count');
      const sampleLabel = `${shown.length} / ${result.total} 条 · ${names[filter]}`;
      if (sampleCount.textContent !== sampleLabel) sampleCount.textContent = sampleLabel;
      root.querySelector('#evaluation-empty').hidden = shown.length > 0;
      root.querySelectorAll('[data-evaluation-filter]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.evaluationFilter === filter)));
      const marks = document.createDocumentFragment();
      for (const row of result.rows) {
        const cy = row.label ? 78 : 146;
        const attrs = { class: `evaluation-point ${row.predicted ? 'is-predicted' : ''}`, opacity: filter === 'all' || filter === row.outcome ? '1' : '.22' };
        const mark = row.label ? svg('circle', { ...attrs, cx: x(row.score), cy, r: 4 }) : svg('rect', { ...attrs, x: x(row.score) - 4, y: cy - 4, width: 8, height: 8 });
        mark.append(svg('title', {}, `${row.id}，分数 ${row.score}，实际 ${row.label}，预测 ${row.predicted}，${names[row.outcome]}`));
        marks.append(mark);
      }
      plot.querySelector('[data-evaluation-marks]').replaceChildren(marks);
      const cut = plot.querySelector('[data-evaluation-cut]');
      cut.setAttribute('x1', x(result.threshold)); cut.setAttribute('x2', x(result.threshold));
      root.querySelector('#evaluation-plot-desc').textContent = `20 个合成样本，${result.actualPositive} 个正例，阈值 ${threshold.value}。TP ${TP}、FP ${FP}、FN ${FN}、TN ${TN}。全部数值在表格中可核对。`;
      const summary = `阈值 ${threshold.value}：TP ${TP} · FP ${FP} · FN ${FN} · TN ${TN}`;
      if (status.textContent !== summary) status.textContent = summary;
    }
    scenario.addEventListener('change', () => { filter = 'all'; render(); });
    threshold.addEventListener('input', () => render());
    threshold.addEventListener('change', () => render());
    root.querySelectorAll('[data-evaluation-filter]').forEach((button) => button.addEventListener('click', () => { filter = button.dataset.evaluationFilter; render(); }));
    root.querySelector('#evaluation-reset').addEventListener('click', () => { scenario.value = 'rare'; threshold.value = '50'; filter = 'all'; render(); });
    root.querySelector('#evaluation-export').addEventListener('click', () => {
      const record = exportEvaluation(dataset, scenario.value, Number(threshold.value));
      const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'brooks-synthetic-evaluation.json';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = '已生成完整实验 JSON：20 条合成样本、参数与基线。';
    });
    render();
    root.querySelector('#evaluation-controls').disabled = false;
    root.querySelectorAll('[data-evaluation-filter]').forEach((button) => { button.disabled = false; });
  } catch {
    status.textContent = '教学样本暂时无法读取，交互未启用。下方默认例子和阅读链接仍可使用。';
  }
}
