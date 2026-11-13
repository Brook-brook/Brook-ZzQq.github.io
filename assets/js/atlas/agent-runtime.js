import { runtimeScenarios, runtimeDefaults, createRuntimeRun, advanceRuntime,
  cancelRuntime, isRuntimeTerminal, createRuntimeReport, validateRuntimeSettings } from './runtime-models.js';
import { validateToolCatalog } from './tool-models.js';

const root = document.querySelector('[data-agent-runtime]');
if (root) {
  const get = (id) => root.querySelector(`#${id}`);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const phases = { decision: '等待脚本提议', validation: '提议尚未执行，先检查', execution: '参数已通过，等待派发', observation: '已有执行，等待对应回执', terminal: '本次已停止' };
  const labels = { decision: '产生脚本提议', validation: '检查这次提议', execution: '执行下一个本机工具', observation: '交回本次回执' };
  const states = { completed: '本页脚本条件已完成', failed: '未通过检查', budget_exhausted: '预算耗尽，尚未完成', cancelled: '已由你停止', insufficient: '现有目录不足以回答' };
  const make = (tag, text) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; };
  let catalog, run, runNumber = 0, dirty = false, animation;
  const settings = () => ({ scenario: get('runtime-scenario').value, max_decisions: Number(get('runtime-decisions').value), max_dispatches: Number(get('runtime-dispatches').value) });
  const currentSettingsMatch = () => JSON.stringify(settings()) === JSON.stringify(run.settings);
  const describe = (item) => {
    if (item.status === 'error') return `明确的模拟错误：${item.error.message}`;
    const r = item.output.result;
    if (item.tool === 'find_places') return `匹配 ${r.count} 个目录点：${r.places.map((p) => p.name).join('、') || '没有结果'}。`;
    if (item.tool === 'measure_distance') return `${r.from.name}到${r.to.name}的代表点球面距离 ${r.distance_m.toFixed(1)} 米。`;
    return `当前目录中，${r.radius_m}米内有 ${r.count} 个其他代表点；不是完整现实覆盖。`;
  };
  function feedback(text, error = false) { get('runtime-status').textContent = text; get('runtime-status').dataset.error = String(error); }
  function render() {
    const terminal = isRuntimeTerminal(run), count = run.counters;
    get('runtime-task').textContent = runtimeScenarios.find((s) => s.id === run.settings.scenario).task;
    get('runtime-proposal-count').textContent = `${count.decisions} / ${run.settings.max_decisions}`;
    get('runtime-dispatch-count').textContent = `${count.dispatch_attempts} / ${run.settings.max_dispatches}`;
    get('runtime-receipt-count').textContent = String(count.receipts_accepted);
    get('runtime-phase').textContent = terminal ? states[run.status] : phases[run.phase];
    get('runtime-step').textContent = terminal ? '本次已停止' : run.phase === 'observation' && run.trace.at(-1)?.event === 'receipt_rejected' ? '重交当前回执' : labels[run.phase];
    get('runtime-step').disabled = terminal || dirty; get('runtime-stop').disabled = terminal;
    get('runtime-export').disabled = dirty || run.trace.length === 0;
    get('runtime-proposal').textContent = run.proposal ? JSON.stringify(run.proposal, null, 2) : '尚无提议。';
    get('runtime-context-empty').hidden = run.observations.length > 0;
    get('runtime-execution').hidden = !run.execution;
    if (run.execution) {
      const pending = run.pending[run.pending_index];
      get('runtime-execution-title').textContent = run.execution.status === 'ok' ? '已真实执行，尚未交回' : '明确的模拟失败，尚未交回';
      get('runtime-execution-text').textContent = describe({ ...run.execution, tool: pending.name });
    }
    const observations = get('runtime-observations'); observations.replaceChildren();
    for (const item of run.observations) {
      const row = make('li'); row.append(make('h3', `${item.call_id} / ${item.tool}`), make('p', describe(item))); observations.append(row);
    }
    get('runtime-answer').hidden = !run.answer; get('runtime-answer-text').textContent = run.answer || '';
    get('runtime-terminal').hidden = !terminal;
    get('runtime-terminal').textContent = terminal ? `${states[run.status]}。成功派发 ${count.dispatch_succeeded} 次，接纳 ${count.receipts_accepted} 份回执，拒绝 ${count.receipts_rejected} 份。停止不会撤销已发生的只读计算。` : '';
    const trace = get('runtime-trace'); trace.replaceChildren();
    for (const entry of run.trace) { const row = make('li'); row.append(make('strong', entry.event), make('span', entry.detail)); trace.append(row); }
    get('runtime-trace-summary').textContent = `运行事件（${run.trace.length}）`;
    get('runtime-json').textContent = JSON.stringify({ run_id: run.run_id, pending_execution: run.execution, observations: run.observations }, null, 2);
    get('runtime-result-jump').hidden = !run.execution && !run.observations.length && !terminal;
  }
  function settle() {
    animation?.cancel();
    if (!motion.matches && get('runtime-evidence').animate) animation = get('runtime-evidence').animate(
      [{ opacity: .7, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  function apply() {
    try {
      const checked = validateRuntimeSettings(settings());
      runNumber = runNumber % 99999 + 1; run = createRuntimeRun(checked, catalog, `run-${runNumber}`);
      dirty = false; animation?.cancel(); render();
      get('runtime-parameters-status').textContent = `${run.run_id}：已应用；参数留在页面内存，没有自动执行。`;
      get('runtime-parameters-status').dataset.error = 'false';
      feedback('还没有提议或执行。点击“产生脚本提议”开始；脚本不是模型。');
    } catch (error) {
      dirty = true; get('runtime-step').disabled = true; get('runtime-export').disabled = true;
      get('runtime-parameters-status').textContent = `${error.message} 原账本未改变，请修正后重新应用。`;
      get('runtime-parameters-status').dataset.error = 'true';
    }
  }
  for (const id of ['runtime-scenario', 'runtime-decisions', 'runtime-dispatches']) get(id).addEventListener('input', () => {
    dirty = !currentSettingsMatch(); render();
    get('runtime-parameters-status').textContent = dirty ? `参数已变，当前账本仍属于${run.run_id}；应用后才会重新开始。` : `${run.run_id}：当前参数与已应用设置一致。`;
  });
  get('runtime-apply').addEventListener('click', apply);
  get('runtime-step').addEventListener('click', () => {
    if (!currentSettingsMatch()) { dirty = true; render(); feedback('参数已变，请先应用；没有继续执行旧设置。', true); return; }
    try { run = advanceRuntime(run); render(); feedback(run.trace.at(-1).detail, run.trace.at(-1).event === 'receipt_rejected' || run.status === 'failed'); settle();
      if (run.answer) get('runtime-answer-title').focus();
    } catch (error) { feedback(error.message, true); }
  });
  get('runtime-stop').addEventListener('click', () => { run = cancelRuntime(run); render(); feedback(run.trace.at(-1).detail); });
  get('runtime-result-jump').addEventListener('click', (event) => { event.preventDefault(); get('runtime-evidence-title').focus(); get('runtime-evidence-title').scrollIntoView({ block: 'start' }); });
  motion.addEventListener('change', () => { if (motion.matches) animation?.cancel(); });
  get('runtime-export').addEventListener('click', () => {
    if (!currentSettingsMatch()) { dirty = true; render(); feedback('参数已变，导出暂停；请先应用。', true); return; }
    try {
      const url = URL.createObjectURL(new Blob([JSON.stringify(createRuntimeReport(run), null, 2) + '\n'], { type: 'application/json' }));
      const link = make('a'); link.href = url; link.download = 'brooks-scripted-runtime.json'; link.hidden = true;
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { feedback(error.message, true); }
  });
  try {
    const text = root.querySelector('[data-runtime-catalog]').textContent;
    if (text.length > 256 * 1024) throw new Error('Catalog too large');
    catalog = JSON.parse(text);
    validateToolCatalog(catalog);
    get('runtime-controls').disabled = false;
    get('runtime-scenario').value = runtimeDefaults.scenario; apply();
    if (!run) get('runtime-controls').disabled = true;
  } catch { feedback('目录未通过边界检查，交互未启用；仍可阅读下面的规则、出处与原理。', true); }
}
