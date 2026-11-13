import { validateSpatialDataset, compareSpatialValidation, exportSpatialValidation } from './spatial-models.js';

const root = document.querySelector('[data-spatial-lab]');
const percent = (value) => value === null ? '—' : `${(value * 100).toFixed(1)}%`;
const blockNames = ['A', 'B', 'C', 'D'];
const svgNS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs, text) {
  const node = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (text) node.textContent = text;
  return node;
}
function appendRow(body, values) {
  const row = document.createElement('tr');
  values.forEach((value, i) => {
    const cell = document.createElement(i ? 'td' : 'th');
    if (!i) cell.scope = 'row';
    cell.textContent = value; row.append(cell);
  });
  body.append(row);
}

if (root) {
  const status = root.querySelector('#spatial-status');
  try {
    const dataset = validateSpatialDataset(JSON.parse(root.querySelector('[data-spatial-dataset]').textContent));
    const byId = new Map(dataset.points.map((point) => [point.id, point]));
    const form = root.querySelector('#spatial-form');
    const fields = Object.fromEntries(['pattern', 'k', 'seed', 'block'].map((key) => [key, root.querySelector(`#spatial-${key}`)]));
    const protocol = root.querySelector('#spatial-inspect-protocol');
    const sample = root.querySelector('#spatial-inspect-sample');
    const exportButton = root.querySelector('#spatial-export');
    const plots = Object.fromEntries([...root.querySelectorAll('[data-spatial-protocol]')].map((node) => [node.dataset.spatialProtocol, node]));
    let result = null;
    let dirty = false;
    const x = (value) => 36 + value * .37;
    const y = (value) => 324 - value * .37;
    const parameters = () => ({ pattern: fields.pattern.value, k: Number(fields.k.value), seed: fields.seed.value === '' ? NaN : Number(fields.seed.value), block: Number(fields.block.value) });

    function drawMaps() {
      for (const [name, figure] of Object.entries(plots)) {
        const group = result.protocols[name];
        const test = new Set(group.test_ids);
        const grid = document.createDocumentFragment();
        if (name === 'spatial') {
          const block = result.parameters.block;
          grid.append(svg('rect', { x: x(block % 2 * 400), y: y((Math.floor(block / 2) + 1) * 400), width: 148, height: 148, class: 'spatial-held-block' }));
        }
        for (const value of [0, 200, 400, 600, 800]) {
          grid.append(svg('line', { x1: x(value), x2: x(value), y1: y(800), y2: y(0), class: value === 400 ? 'spatial-split' : 'spatial-grid' }));
          grid.append(svg('line', { x1: x(0), x2: x(800), y1: y(value), y2: y(value), class: value === 400 ? 'spatial-split' : 'spatial-grid' }));
          grid.append(svg('text', { x: x(value), y: 345, 'text-anchor': 'middle' }, String(value)));
          grid.append(svg('text', { x: 28, y: y(value) + 4, 'text-anchor': 'end' }, String(value)));
        }
        grid.append(svg('text', { x: 350, y: 345 }, 'x'), svg('text', { x: 16, y: 18 }, 'y'));
        figure.querySelector('[data-spatial-grid]').replaceChildren(grid);
        const lines = document.createDocumentFragment();
        const selected = name === protocol.value ? byId.get(sample.value) : null;
        if (selected) {
          const prediction = group.predictions.find((row) => row.id === selected.id);
          for (const neighbor of prediction.neighbors) {
            const point = byId.get(neighbor.id);
            lines.append(svg('line', { x1: x(selected.x), y1: y(selected.y), x2: x(point.x), y2: y(point.y), class: 'spatial-neighbor-line' }));
          }
        }
        figure.querySelector('[data-spatial-lines]').replaceChildren(lines);
        const marks = document.createDocumentFragment();
        for (const point of dataset.points) {
          const label = point.labels[result.parameters.pattern];
          const cx = x(point.x), cy = y(point.y);
          const attrs = { class: `spatial-point ${label ? 'is-positive' : ''} ${test.has(point.id) ? 'is-test' : ''}` };
          const mark = test.has(point.id) ? svg('rect', { ...attrs, x: cx - 3.5, y: cy - 3.5, width: 7, height: 7 }) : svg('circle', { ...attrs, cx, cy, r: 2.7 });
          mark.append(svg('title', {}, `${point.id}，${test.has(point.id) ? '测试' : '训练'}，实际标签 ${label}`));
          marks.append(mark);
          if (selected?.id === point.id) marks.append(svg('path', { d: `M${cx} ${cy - 8}l8 8-8 8-8-8Z`, class: 'spatial-selected' }));
        }
        figure.querySelector('[data-spatial-marks]').replaceChildren(marks);
        figure.querySelector('desc').textContent = `60 个训练点、20 个测试点；测试正例 ${group.evaluation.actualPositive} 个。${selected ? `正在核对 ${selected.id} 的 ${result.parameters.k} 个训练邻居。` : ''}完整数字可在证据表与导出文件中核对。`;
      }
    }
    function inspect(rebuildOptions = false) {
      const group = result.protocols[protocol.value];
      if (rebuildOptions) {
        const previous = sample.value;
        sample.replaceChildren(...group.test_ids.map((id) => {
          const option = document.createElement('option'); option.value = id; option.textContent = id; return option;
        }));
        if (group.test_ids.includes(previous)) sample.value = previous;
      }
      const prediction = group.predictions.find((row) => row.id === sample.value);
      const evaluated = group.evaluation.rows.find((row) => row.id === sample.value);
      root.querySelector('#spatial-vote').textContent = `${sample.value}：${prediction.positiveVotes} / ${result.parameters.k} 票为 1 → 预测 ${prediction.predicted}；实际 ${evaluated.label}，结果 ${evaluated.outcome}。`;
      const neighbors = root.querySelector('#spatial-neighbors'); neighbors.replaceChildren();
      prediction.neighbors.forEach((row) => appendRow(neighbors, [row.id, row.label, row.distance.toFixed(2)]));
      const rows = root.querySelector('#spatial-test-rows'); rows.replaceChildren();
      group.evaluation.rows.forEach((row) => appendRow(rows, [row.id, row.label, row.predicted, row.outcome]));
      drawMaps();
    }
    function run() {
      result = compareSpatialValidation(dataset, parameters()); dirty = false;
      exportButton.disabled = false;
      for (const [name, figure] of Object.entries(plots)) {
        const group = result.protocols[name], evaluation = group.evaluation;
        figure.querySelector('[data-test-count]').textContent = `测试 ${evaluation.total} 点 · 实际正例 ${evaluation.actualPositive} / ${evaluation.total}`;
        for (const metric of ['accuracy', 'precision', 'recall', 'f1']) figure.querySelector(`[data-spatial-metric="${metric}"]`).textContent = percent(evaluation[metric]);
        figure.querySelector('[data-counts]').textContent = Object.entries(evaluation.count).map(([key, count]) => `${key} ${count}`).join(' · ');
        figure.querySelector('[data-coverage]').textContent = `平均最近训练点距离 ${group.mean_nearest_training_distance.toFixed(2)} synthetic-m`;
      }
      const p = result.parameters;
      root.querySelector('#spatial-applied').textContent = `已运行：${dataset.patterns[p.pattern]} · k = ${p.k} · 随机种子 ${p.seed} · 整区 ${blockNames[p.block]}。`;
      root.querySelector('#spatial-results').hidden = false;
      root.querySelector('#spatial-inspector').hidden = false;
      inspect(true);
      status.textContent = '对照已计算。先看测试集的构成，再沿一个样本检查训练邻居。';
    }
    function markDirty() {
      dirty = !result || JSON.stringify(parameters()) !== JSON.stringify(result.parameters);
      exportButton.disabled = dirty;
      status.textContent = dirty ? '参数已改变。下方仍是上次运行结果；点击“运行对照”后更新，导出暂不可用。' : '参数与上次运行一致；下方结果可核对和导出。';
    }
    Object.values(fields).forEach((field) => { field.addEventListener('input', markDirty); field.addEventListener('change', markDirty); });
    form.addEventListener('invalid', () => { dirty = true; exportButton.disabled = true; status.textContent = '种子需要是 0–9999 的整数。旧结果保留，修正后再运行。'; }, true);
    form.addEventListener('submit', (event) => { event.preventDefault(); try { run(); } catch { status.textContent = '参数无效，旧结果保留；请检查后再运行。'; dirty = true; exportButton.disabled = true; } });
    root.querySelector('#spatial-reset').addEventListener('click', () => { fields.pattern.value = 'zones'; fields.k.value = '3'; fields.seed.value = '42'; fields.block.value = '0'; protocol.value = 'random'; run(); });
    root.querySelectorAll('[data-inspect-group]').forEach((button) => button.addEventListener('click', () => {
      protocol.value = button.dataset.inspectGroup; inspect(true);
      root.querySelector('#spatial-inspector').scrollIntoView({ block: 'start', behavior: 'instant' });
      root.querySelector('#spatial-inspector-title').focus({ preventScroll: true });
    }));
    protocol.addEventListener('change', () => inspect(true));
    sample.addEventListener('change', () => inspect());
    exportButton.addEventListener('click', () => {
      if (dirty || !result) return;
      const record = exportSpatialValidation(dataset, result.parameters);
      const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'brooks-synthetic-spatial-validation.json';
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = '已生成完整合成实验 JSON：80 个点、划分、参数、逐点预测和邻居。';
    });
    run();
    root.querySelector('#spatial-controls').disabled = false;
  } catch {
    root.querySelector('#spatial-export').disabled = true;
    status.textContent = '合成样本暂时无法读取，计算未启用。原始数据和方法说明仍可阅读。';
  }
}
