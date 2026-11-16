import { advanceGradientRun, createGradientRun, gradientFacts, gradientReport, gradientSampleEvidence, MAX_UPDATES } from './gradient-models.js';

const byId = (id) => document.getElementById(id);
if (byId('gradient-lab')) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)'), animations = new Set();
  let state, data, redraw, renderedHistory = [];
  const numberFormat = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 5 });
  const format = (n) => n === null ? '—' : Math.abs(n) >= 1e5 || (n !== 0 && Math.abs(n) < 1e-4) ? n.toExponential(3) : numberFormat.format(n);
  const value = (id) => byId(id).valueAsNumber;
  const inputError = (id, bad) => byId(id).setAttribute('aria-invalid', String(bad));
  function syncInputs() {
    const learningRate = value('gradient-rate'), badRate = !Number.isFinite(learningRate) || learningRate < 0.001 || learningRate > 0.5;
    inputError('gradient-rate', badRate); byId('gradient-input-message').hidden = !badRate;
    byId('gradient-input-message').textContent = badRate ? '请输入0.001到0.5之间的数；已应用结果保留，当前草稿尚未用于更新。' : '';
    const w = value('gradient-start-w'), b = value('gradient-start-b');
    const badW = !Number.isFinite(w) || Math.abs(w) > 10, badB = !Number.isFinite(b) || Math.abs(b) > 10;
    inputError('gradient-start-w', badW); inputError('gradient-start-b', badB);
    byId('gradient-start-message').hidden = !badW && !badB;
    byId('gradient-start-message').textContent = badW || badB ? '起始参数需要是−10到10之间的数；尚未重开。' : '';
    for (const id of ['gradient-step', 'gradient-ten']) byId(id).disabled = !state || badRate || state.stop !== null;
    byId('gradient-reset').disabled = !state || badW || badB;
  }
  const svgElement = (name, attrs = {}, text) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function chartBase(svg, xMax, yMax, yMin) {
    const width = svg.clientWidth, height = Math.max(240, svg.clientHeight), font = parseFloat(getComputedStyle(svg).fontSize);
    if (!Number.isFinite(font) || font <= 0) return null;
    const left = Math.max(48, 3.5 * font), right = Math.max(16, font), top = 1.8 * font, bottom = 3 * font;
    // Hidden or temporarily narrow containers have no drawable area yet.
    // Keep the last valid plot until ResizeObserver can measure the restored box.
    if (width <= left + right || height <= top + bottom) return null;
    const box = { left, right: width - right, top, bottom: height - bottom };
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.replaceChildren();
    const px = (x) => box.left + x / xMax * (box.right - box.left), py = (y) => box.bottom - (y - yMin) / (yMax - yMin) * (box.bottom - box.top);
    return { width, height, font, box, px, py };
  }
  function drawPlots() {
    if (!state) return;
    const frame = state.history.at(-1), theta = frame.parameters, facts = gradientFacts(data, theta);
    const plot = byId('gradient-fit-chart'), fitted = chartBase(plot, 10, 12, -12);
    if (!fitted) return;
    const { box, font } = fitted, x = (n) => fitted.px(n + 5), y = fitted.py;
    for (const tick of [-10, 0, 10]) {
      plot.append(svgElement('line', { x1: box.left, x2: box.right, y1: y(tick), y2: y(tick), class: 'gradient-grid' }));
      plot.append(svgElement('text', { x: box.left - font * .6, y: y(tick) + font * .3, 'text-anchor': 'end' }, String(tick)));
    }
    for (const tick of [-5, 0, 5]) plot.append(svgElement('text', { x: x(tick), y: box.bottom + font * 1.5, 'text-anchor': 'middle' }, String(tick)));
    plot.append(svgElement('text', { x: box.left, y: font }, 'y'));
    plot.append(svgElement('text', { x: (box.left + box.right) / 2, y: fitted.height - font * .3, 'text-anchor': 'middle' }, 'x（教学量）'));
    const defs = svgElement('defs'), clip = svgElement('clipPath', { id: 'gradient-fit-clip' });
    clip.append(svgElement('rect', { x: box.left, y: box.top, width: box.right - box.left, height: box.bottom - box.top })); defs.append(clip); plot.append(defs);
    const marks = svgElement('g', { 'clip-path': 'url(#gradient-fit-clip)' });
    const line = (p, className) => svgElement('line', { x1: x(-5), x2: x(5), y1: y(p.w * -5 + p.b), y2: y(p.w * 5 + p.b), class: className });
    if (byId('gradient-reference').checked) marks.append(line(facts.reference, 'gradient-reference-line'));
    marks.append(line(theta, 'gradient-current-line'));
    for (const row of data.samples) {
      const selected = byId('gradient-sample').closest('details').open && row.id === byId('gradient-sample').value, size = selected ? 7 : 5;
      if (selected) marks.append(svgElement('line', { x1: x(row.x), x2: x(row.x), y1: y(row.y), y2: y(theta.w * row.x + theta.b), class: 'gradient-residual-guide' }));
      const marker = row.split === 'train' ? svgElement('circle', { cx: x(row.x), cy: y(row.y), r: size, class: 'gradient-train-mark' }) : svgElement('rect', { x: x(row.x) - size, y: y(row.y) - size, width: size * 2, height: size * 2, class: 'gradient-validation-mark' });
      if (selected) marker.classList.add('gradient-selected-mark');
      marker.append(svgElement('title', {}, `${row.id}，${row.split === 'train' ? '训练' : '验证'}，x=${row.x}，y=${row.y}`)); marks.append(marker);
    }
    plot.append(marks); plot.setAttribute('aria-label', `12个原创教学点，当前w=${format(theta.w)}，b=${format(theta.b)}。圆点训练，方点验证；不是实测地理数据。`);
    const loss = byId('gradient-loss-chart'), maximum = Math.max(1, Math.ceil(Math.max(...state.history.flatMap((r) => [Math.log10(1 + r.training_mse), Math.log10(1 + r.validation_mse)]))));
    const chart = chartBase(loss, Math.max(1, frame.iteration), maximum, 0);
    if (!chart) return;
    for (const tick of [0, maximum / 2, maximum]) {
      loss.append(svgElement('line', { x1: chart.box.left, x2: chart.box.right, y1: chart.py(tick), y2: chart.py(tick), class: 'gradient-grid' }));
      loss.append(svgElement('text', { x: chart.box.left - chart.font * .6, y: chart.py(tick) + chart.font * .3, 'text-anchor': 'end' }, format(tick)));
    }
    for (const tick of frame.iteration ? [0, Math.floor(frame.iteration / 2), frame.iteration].filter((n, i, arr) => arr.indexOf(n) === i) : [0]) loss.append(svgElement('text', { x: chart.px(tick), y: chart.box.bottom + chart.font * 1.5, 'text-anchor': 'middle' }, String(tick)));
    loss.append(svgElement('text', { x: (chart.box.left + chart.box.right) / 2, y: chart.height - chart.font * .3, 'text-anchor': 'middle' }, '更新次数'));
    for (const [key, className] of [['training_mse', 'gradient-train-loss'], ['validation_mse', 'gradient-validation-loss']]) {
      const points = state.history.map((r) => `${chart.px(r.iteration)},${chart.py(Math.log10(1 + r[key]))}`).join(' ');
      loss.append(svgElement('polyline', { points, class: className }));
      if (state.history.length === 1) loss.append(svgElement('circle', { cx: chart.px(0), cy: chart.py(Math.log10(1 + frame[key])), r: 3, class: className }));
    }
    loss.setAttribute('aria-label', `实际0到${frame.iteration}次更新的训练实线与验证虚线，纵轴log10(1+MSE)。完整数值见步骤表。`);
  }
  function tableRow(values, heading = false) {
    const tr = document.createElement('tr');
    values.forEach((value, i) => { const cell = document.createElement(heading && i === 0 ? 'th' : 'td'); if (heading && i === 0) cell.scope = 'row'; cell.textContent = value; tr.append(cell); }); return tr;
  }
  function renderSample() {
    const evidence = gradientSampleEvidence(data, state.history.at(-1).parameters, byId('gradient-sample').value);
    const role = evidence.sample.split === 'train' ? '训练' : '验证';
    byId('gradient-sample-values').textContent = `${evidence.sample.id} · ${role}：x=${format(evidence.sample.x)}，目标y=${format(evidence.sample.y)}；当前预测=${format(evidence.prediction)}，残差=${format(evidence.residual)}，残差平方=${format(evidence.squared_error)}。`;
    byId('gradient-sample-contribution').textContent = evidence.gradient_contribution
      ? `该点对当前训练MSE贡献${format(evidence.mse_contribution)}（残差平方÷8）；对当前梯度贡献dw=${format(evidence.gradient_contribution.w)}、db=${format(evidence.gradient_contribution.b)}。本轮更新仍要累加全部8点。`
      : `该点对当前验证MSE贡献${format(evidence.mse_contribution)}（残差平方÷4）；不贡献训练梯度，也不影响训练参考或停止条件。`;
  }
  function render() {
    const frame = state.history.at(-1), theta = frame.parameters, facts = gradientFacts(data, theta);
    for (const [id, n] of [['gradient-w', theta.w], ['gradient-b', theta.b], ['gradient-training', frame.training_mse], ['gradient-validation', frame.validation_mse]]) byId(id).textContent = format(n);
    byId('gradient-status').textContent = state.stop === 'numeric_limit' ? `数值边界停止。保留最后有效的${frame.iteration}次更新；被拒绝的一步没有应用。` : state.stop === 'update_budget' ? `已应用${MAX_UPDATES}次更新，到教学步数上限；这不是收敛或任务正确认证。` : frame.iteration ? `已实际应用${frame.iteration}次更新；改学习率只影响下一次。` : '第0行是起点，还没有执行更新。';
    byId('gradient-last').textContent = frame.gradient ? `最近一步：η=${format(frame.learning_rate)}，更新前梯度w=${format(frame.gradient.w)}、b=${format(frame.gradient.b)}。用同一旧参数同时更新两项。` : '预测式 ŷ = w × x + b；MSE是平均平方误差，不是准确率。';
    byId('gradient-reference-detail').textContent = `只用训练点的闭式参考：w=${format(facts.reference.w)}，b=${format(facts.reference.b)}，训练MSE=${format(facts.reference_training_mse)}。它不是已核实的现实规律。`;
    const history = byId('gradient-history'), start = renderedHistory[0] === state.history[0] ? renderedHistory.length : 0;
    if (start === 0) history.replaceChildren();
    history.append(...state.history.slice(start).map((r) => tableRow([String(r.iteration), format(r.learning_rate), format(r.gradient?.w ?? null), format(r.gradient?.b ?? null), format(r.parameters.w), format(r.parameters.b), format(r.training_mse), format(r.validation_mse)], true)));
    renderedHistory = state.history;
    byId('gradient-samples').replaceChildren(...data.samples.map((row) => { const prediction = theta.w * row.x + theta.b; return tableRow([row.id, row.split === 'train' ? '训练' : '验证', format(row.x), format(row.y), format(prediction), format(prediction - row.y)], true); }));
    byId('gradient-rejection').hidden = !state.rejected;
    byId('gradient-rejection').textContent = state.rejected ? `拟议第${state.rejected.iteration}步越过教学数值边界，未应用；完整拟议值与训练损失保留在下载记录中。` : '';
    byId('gradient-export').disabled = false; syncInputs(); renderSample(); drawPlots();
  }
  function advance(count) {
    try {
      state = advanceGradientRun(state, value('gradient-rate'), count); render();
      for (const effect of animations) effect.cancel();
      if (!preference.matches) { const effect = byId('gradient-values')?.animate?.([{ opacity: .8 }, { opacity: 1 }], { duration: 180 }); if (effect) { animations.add(effect); effect.finished.catch(() => {}).finally(() => animations.delete(effect)); } }
      if (state.stop) byId('gradient-status').focus();
    } catch { syncInputs(); byId('gradient-input-message').hidden = false; byId('gradient-input-message').textContent = '本次未能更新。已应用的记录保留；请检查学习率或重新开始。'; }
  }
  try {
    const raw = byId('gradient-data').textContent; if (raw.length > 16000) throw new Error('data_size');
    data = JSON.parse(raw); state = createGradientRun(data); data = state.data;
    for (const id of ['gradient-rate', 'gradient-start-w', 'gradient-start-b']) { byId(id).disabled = false; byId(id).addEventListener('input', syncInputs); }
    byId('gradient-step').addEventListener('click', () => advance(1)); byId('gradient-ten').addEventListener('click', () => advance(10));
    byId('gradient-reset').addEventListener('click', () => { try { state = createGradientRun(data, { w: value('gradient-start-w'), b: value('gradient-start-b') }); render(); } catch { syncInputs(); } });
    byId('gradient-reference').disabled = false; byId('gradient-reference').addEventListener('change', drawPlots);
    byId('gradient-sample').disabled = false;
    byId('gradient-sample').addEventListener('change', () => { renderSample(); drawPlots(); });
    byId('gradient-sample').closest('details').addEventListener('toggle', drawPlots);
    byId('gradient-export').addEventListener('click', () => { const report = gradientReport(state), blob = new Blob([JSON.stringify(report, null, 2) + '\n'], { type: 'application/json' }); const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'brook-gradient-record.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
    byId('gradient-chart-fallback').hidden = true; byId('gradient-visual').hidden = false; render();
    const resize = () => { cancelAnimationFrame(redraw); redraw = requestAnimationFrame(drawPlots); };
    if (typeof ResizeObserver === 'function') { const observer = new ResizeObserver(resize); observer.observe(byId('gradient-fit-chart')); observer.observe(byId('gradient-loss-chart')); }
    else window.addEventListener('resize', resize);
    preference.addEventListener('change', () => { if (preference.matches) for (const effect of animations) effect.cancel(); });
  } catch {
    state = null;
    for (const node of document.querySelectorAll('#gradient-lab button, #gradient-lab input, #gradient-lab select')) node.disabled = true;
    byId('gradient-visual').hidden = true; byId('gradient-chart-fallback').hidden = false;
    byId('gradient-status').textContent = '教学数据未通过检查，未执行训练。可阅读原始表与教程，重新加载后再试。';
  }
}
