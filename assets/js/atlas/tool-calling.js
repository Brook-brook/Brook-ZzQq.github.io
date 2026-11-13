import { parseToolCall, validateToolCatalog, executeLocalTool, acceptToolObservation,
  explainToolObservation, createToolReport, toolDefinitions, toolScenarios } from './tool-models.js';

const root = document.querySelector('[data-tool-lab]');
if (root) {
  const get = (id) => root.querySelector(`#${id}`);
  const controls = get('tool-controls'), input = get('tool-call'), status = get('tool-status');
  const next = get('tool-next'), output = get('tool-output'), result = get('tool-result');
  const title = get('tool-result-title'), jump = get('tool-result-jump');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let data, phase = 0, counter = 0, call, callId, approvedRaw, receipt, calculation;
  let scenario = toolScenarios[0], mismatched = false, animation;
  const labels = ['检查调用', '执行本机工具', '交回工具结果', '生成模板说明', '本次已完成'];

  function render() {
    next.textContent = labels[phase]; next.disabled = phase === 4;
    get('tool-export').disabled = phase !== 4;
    root.querySelectorAll('.tool-progress li').forEach((item, i) => {
      if (i === phase) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
      item.dataset.done = String(i < phase);
    });
    get('tool-empty').hidden = phase >= 2;
    result.hidden = phase < 2; jump.hidden = phase < 2;
    get('tool-answer').hidden = phase < 4;
    title.textContent = ['结果还没发生', '校验通过，等待执行', '工具已在本机执行', '这份回执，属于本次调用', '回到这次实际结果'][phase];
    if (phase >= 2) {
      output.textContent = JSON.stringify(phase >= 3 ? receipt : calculation, null, 2);
      get('tool-result-caption').textContent = phase === 2 ?
        `${callId}：程序已完成。下一步检查回执 ID、工具名，并重算比对本页结果。` :
        `${callId}：已对应本次调用。这是自编教学信封，不是 MCP 或某家模型 API 的完整消息。`;
    } else output.textContent = '';
    if (phase === 4) get('tool-answer-text').textContent = explainToolObservation(call, receipt);
    else get('tool-answer-text').textContent = '';
  }

  function feedback(text, error = false) {
    status.textContent = error ? `未通过：${text}` : text;
    status.dataset.error = String(error);
    input.setAttribute('aria-invalid', String(error && phase === 0));
  }

  function invalidate(text) {
    animation?.cancel(); phase = 0;
    call = receipt = calculation = approvedRaw = null;
    mismatched = false; render(); feedback(text);
  }

  function loadScenario() {
    scenario = toolScenarios.find((s) => s.id === get('tool-scenario').value) || toolScenarios[0];
    input.value = JSON.stringify(scenario.call, null, 2);
    get('tool-request').textContent = scenario.request;
    invalidate('提议来自固定脚本；尚未校验或执行。可先改参数，查看契约与地点表。');
  }

  function settle() {
    animation?.cancel();
    if (!motion.matches && !result.hidden && result.animate)
      animation = result.animate([{ opacity: .65, transform: 'translateY(4px)' },
        { opacity: 1, transform: 'translateY(0)' }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
  }

  next.addEventListener('click', () => {
    try {
      if (phase === 0) {
        call = parseToolCall(input.value, data); approvedRaw = input.value;
        counter = counter % 999999 + 1; callId = `call-${counter}`; phase = 1;
        feedback(`${callId} 参数符合本页契约。下一次点击才会执行 ${call.name}；只读已有地点目录。`);
      } else {
        if (input.value !== approvedRaw) { invalidate('调用已修改，请重新检查。'); return; }
        if (phase === 1) {
          calculation = executeLocalTool(call, data); phase = 2;
          feedback(`${callId} 已在本机计算；结果尚未交回说明模板。`);
        } else if (phase === 2) {
          const candidate = { call_id: scenario.id === 'receipt' && !mismatched ? 'call-0' : callId,
            tool: call.name, output: calculation };
          mismatched = true;
          receipt = acceptToolObservation(callId, call, candidate, data); phase = 3;
          feedback(`${callId} 回执匹配，且与本页重算结果一致。可以查看固定模板怎样使用数值；这不核实资料现状。`);
        } else if (phase === 3) {
          phase = 4; feedback('本次完成。模板只概括这份回执；可以导出核对，或修改参数开始新一次实验。');
        }
      }
      render(); settle();
      if (phase === 4) get('tool-answer-title').focus();
    } catch (error) {
      feedback(error.message, true);
      if (phase === 0) input.focus();
      else if (phase === 2) next.textContent = '重交正确回执';
    }
  });

  input.addEventListener('input', () => invalidate('调用已修改。旧校验与结果已清除，请重新检查。'));
  get('tool-scenario').addEventListener('change', loadScenario);
  get('tool-reset').addEventListener('click', loadScenario);
  jump.addEventListener('click', (event) => { event.preventDefault(); title.focus(); title.scrollIntoView({ block: 'start' }); });
  motion.addEventListener('change', () => { if (motion.matches) animation?.cancel(); });
  get('tool-export').addEventListener('click', () => {
    if (phase !== 4 || input.value !== approvedRaw) { invalidate('调用已修改，请重新检查后再导出。'); return; }
    try {
      const report = createToolReport(callId, call, receipt, data);
      const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2) + '\n'], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'brooks-local-tool-experiment.json';
      link.hidden = true; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { feedback(error.message, true); }
  });

  try {
    data = JSON.parse(root.querySelector('[data-tool-catalog]').textContent);
    validateToolCatalog(data);
    const list = get('tool-contract-list'); list.replaceChildren();
    for (const tool of toolDefinitions) {
      const section = document.createElement('div'), head = document.createElement('h3');
      head.textContent = tool.name; section.append(head);
      const description = document.createElement('p'); description.textContent = tool.description; section.append(description);
      const pre = document.createElement('pre'); pre.tabIndex = 0;
      pre.setAttribute('aria-label', `${tool.name} 参数契约`);
      pre.textContent = JSON.stringify(tool.parameters, null, 2); section.append(pre); list.append(section);
    }
    controls.disabled = false; loadScenario();
  } catch {
    feedback('地点目录无法校验，工具未启用。请刷新重试；仍可阅读下方资料与教程。', true);
  }
}
