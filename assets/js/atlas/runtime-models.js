import { validateToolCatalog, parseToolCall, executeLocalTool,
  acceptToolObservation, explainToolObservation } from './tool-models.js';

export const runtimeScenarios = [
  { id: 'distance', title: '先找图书馆，再计算距离', task: '查目录中的两座图书馆，再比较代表点球面距离。' },
  { id: 'batch', title: '一个提议，两个调用', task: '一次提议同时查距离与200米内的点，比较两种计数。' },
  { id: 'failed-once', title: '一次模拟失败，再重试', task: '先注入一次模拟错误，再看脚本重试与实际计算。' },
  { id: 'repeat', title: '重复查询，没有进展', task: '重复同一查询，观察预算怎样让它停下。' },
  { id: 'receipt', title: '回执来自旧运行', task: '旧运行回执应被拒绝；重交是否需要再次派发？' },
  { id: 'forbidden', title: '请求未开放的工具', task: '脚本请求publish_notes，检查派发前是否被拒绝。' }
];
export const runtimeDefaults = { scenario: 'distance', max_decisions: 4, max_dispatches: 3 };
const terminalStates = ['completed', 'failed', 'budget_exhausted', 'cancelled', 'insufficient'];
const MAX_EVENTS = 64;
function exact(value, fields) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === fields.length && fields.every((key) => Object.hasOwn(value, key));
}
export function validateRuntimeSettings(value) {
  if (!exact(value, ['scenario', 'max_decisions', 'max_dispatches']) ||
    !runtimeScenarios.some((s) => s.id === value.scenario) ||
    ![value.max_decisions, value.max_dispatches].every((n) => Number.isInteger(n) && n >= 1 && n <= 8))
    throw new Error('情景须来自本页枚举；提议与派发预算各为1到8的整数。');
  return { ...value };
}
export function createRuntimeRun(settings, catalog, runId = 'run-1') {
  validateToolCatalog(catalog);
  if (typeof runId !== 'string' || !/^run-[1-9]\d{0,4}$/.test(runId)) throw new Error('运行ID无效。');
  return { schema_version: 1, run_id: runId, settings: validateRuntimeSettings(settings),
    catalog: structuredClone(catalog), status: 'running', phase: 'decision',
    counters: { decisions: 0, dispatch_attempts: 0, dispatch_succeeded: 0,
      receipts_accepted: 0, receipts_rejected: 0 }, issued: 0, pending: [], pending_index: 0,
    proposal: null, execution: null, observations: [], trace: [], answer: null,
    terminal_reason: null, injected_failure: false, injected_receipt: false };
}
export function isRuntimeTerminal(run) { return terminalStates.includes(run.status); }
function event(run, name, detail, call) {
  run.trace.push({ seq: run.trace.length + 1, event: name, phase: run.phase,
    detail, ...(call ? { call_id: call.call_id, tool: call.name } : {}) });
}
function stop(run, status, reason, detail) {
  run.status = status; run.terminal_reason = reason; run.phase = 'terminal';
  event(run, status, detail); return run;
}
function libraries(run) { return run.catalog.places.filter((p) => p.tags.includes('library')).slice(0, 2); }
function proposalFor(run) {
  const find = { name: 'find_places', arguments: { query: '图书馆', category: 'library' } };
  const scenario = run.settings.scenario;
  if (scenario === 'forbidden') return { kind: 'calls', calls: [{ name: 'publish_notes', arguments: {} }] };
  if (scenario === 'repeat') return { kind: 'calls', calls: [find] };
  if (scenario === 'batch') {
    if (run.observations.length >= 2) return { kind: 'finish' };
    const places = libraries(run);
    if (places.length < 2) return { kind: 'insufficient' };
    return { kind: 'calls', calls: [
      { name: 'measure_distance', arguments: { from: places[0].id, to: places[1].id } },
      { name: 'nearby_places', arguments: { center: places[0].id, radius_m: 200 } }
    ] };
  }
  const found = run.observations.find((o) => o.tool === 'find_places' && o.status === 'ok');
  const measured = run.observations.find((o) => o.tool === 'measure_distance' && o.status === 'ok');
  if (measured) return { kind: 'finish' };
  if (!found) return { kind: 'calls', calls: [find] };
  const places = found.output.result.places;
  if (places.length < 2) return { kind: 'insufficient' };
  return { kind: 'calls', calls: [{ name: 'measure_distance', arguments: { from: places[0].id, to: places[1].id } }] };
}
function candidateReceipt(run, call) {
  const old = run.settings.scenario === 'receipt' && !run.injected_receipt;
  run.injected_receipt = run.injected_receipt || old;
  return { run_id: old ? 'run-0' : run.run_id, call_id: call.call_id, tool: call.name,
    status: run.execution.status, ...(run.execution.status === 'ok' ?
      { output: structuredClone(run.execution.output) } : { error: structuredClone(run.execution.error) }) };
}
export function acceptRuntimeReceipt(run, receipt) {
  const call = run.pending[run.pending_index];
  if (run.phase !== 'observation' || !call || !run.execution) throw new Error('当前没有等待交回的执行。');
  const fields = run.execution.status === 'ok' ? ['run_id', 'call_id', 'tool', 'status', 'output'] : ['run_id', 'call_id', 'tool', 'status', 'error'];
  if (!exact(receipt, fields) || receipt.run_id !== run.run_id || receipt.call_id !== call.call_id ||
    receipt.tool !== call.name || receipt.status !== run.execution.status)
    throw new Error('run ID、调用ID、工具或状态不对应当前执行；这份回执未进入上下文。');
  if (receipt.status === 'ok') {
    acceptToolObservation(call.call_id, { name: call.name, arguments: call.arguments },
      { call_id: receipt.call_id, tool: receipt.tool, output: receipt.output }, run.catalog);
  } else if (JSON.stringify(receipt.error) !== JSON.stringify(run.execution.error))
    throw new Error('错误回执与本次记录不一致。');
  return structuredClone(receipt);
}
export function advanceRuntime(input) {
  const run = structuredClone(input);
  if (isRuntimeTerminal(run)) throw new Error('本次已停止；请重新开始，不把旧结果继续当作新运行。');
  validateRuntimeSettings(run.settings); validateToolCatalog(run.catalog);
  if (run.trace.length >= MAX_EVENTS - 1) return stop(run, 'failed', 'event_limit', '本页事件边界已到；没有继续执行。');
  if (run.phase === 'decision') {
    if (run.counters.decisions >= run.settings.max_decisions)
      return stop(run, 'budget_exhausted', 'decision_budget', '提议预算耗尽；任务未被标为完成。');
    run.counters.decisions++; run.pending = []; run.pending_index = 0; run.execution = null;
    run.proposal = proposalFor(run); run.phase = 'validation';
    event(run, 'script_proposal', '固定脚本产生一个提议；还没有执行任何工具。');
  } else if (run.phase === 'validation') {
    if (run.proposal.kind === 'insufficient') return stop(run, 'insufficient', 'catalog_coverage', '目录不足两个匹配图书馆；不补造地点或距离。');
    if (run.proposal.kind === 'finish') {
      const good = run.observations.filter((o) => o.status === 'ok');
      if (!good.some((o) => o.tool === 'measure_distance')) return stop(run, 'failed', 'completion_without_evidence', '缺少距离观察；不能接受完成提议。');
      run.answer = good.filter((o) => o.tool !== 'find_places').map((o) =>
        explainToolObservation(o.call, { output: o.output })).join('\n');
      return stop(run, 'completed', 'script_goal', '固定脚本的本页完成条件满足；下面仍是固定模板，不是模型回答。');
    }
    try {
      if (!Array.isArray(run.proposal.calls) || !run.proposal.calls.length || run.proposal.calls.length > 2) throw new Error('每个提议只允许1到2个调用。');
      run.pending = run.proposal.calls.map((call) => ({ ...parseToolCall(JSON.stringify(call), run.catalog), call_id: `call-${++run.issued}` }));
      run.pending_index = 0; run.execution = null; run.phase = 'execution';
      event(run, 'validated', '整批参数通过只读白名单与类型检查；下一步才派发。');
    } catch (error) { return stop(run, 'failed', 'contract_rejected', error.message); }
  } else if (run.phase === 'execution') {
    if (run.counters.dispatch_attempts >= run.settings.max_dispatches)
      return stop(run, 'budget_exhausted', 'dispatch_budget', '派发预算耗尽；保留已经发生的只读计算，不执行下一调用。');
    const call = run.pending[run.pending_index];
    if (!call) return stop(run, 'failed', 'missing_call', '当前没有可派发调用。');
    run.counters.dispatch_attempts++;
    if (run.settings.scenario === 'failed-once' && !run.injected_failure) {
      run.injected_failure = true;
      run.execution = { status: 'error', error: { code: 'simulated-transient', message: '自编故障注入：本次没有执行本机函数。' } };
    } else {
      try {
        run.execution = { status: 'ok', output: executeLocalTool({ name: call.name, arguments: call.arguments }, run.catalog) };
        run.counters.dispatch_succeeded++;
      } catch (error) {
        run.status = 'failed'; run.terminal_reason = 'local_execution_failed'; run.phase = 'terminal';
        event(run, 'execution_failed', `本机派发未成功：${error.message}`, call); return run;
      }
    }
    run.phase = 'observation';
    event(run, run.execution.status === 'ok' ? 'executed' : 'simulated_failure', run.execution.status === 'ok' ? '本机函数已经真实执行；结果尚未交回下一轮。' : run.execution.error.message, call);
  } else if (run.phase === 'observation') {
    const call = run.pending[run.pending_index], candidate = candidateReceipt(run, call);
    try {
      const receipt = acceptRuntimeReceipt(run, candidate);
      run.observations.push({ ...receipt, call: { name: call.name, arguments: structuredClone(call.arguments) } });
      run.counters.receipts_accepted++; run.execution = null; run.pending_index++;
      run.phase = run.pending_index < run.pending.length ? 'execution' : 'decision';
      event(run, 'receipt_accepted', '当前运行/调用的回执进入公开上下文；下一提议才能使用它。', call);
    } catch (error) {
      run.counters.receipts_rejected++;
      event(run, 'receipt_rejected', `${error.message} 可以重交本次回执；不重新派发工具。`, call);
    }
  } else return stop(run, 'failed', 'unknown_phase', '阶段无法识别；没有执行。');
  return run;
}
export function cancelRuntime(input) {
  const run = structuredClone(input);
  if (isRuntimeTerminal(run)) return run;
  return stop(run, 'cancelled', 'user_stopped', '已停止后续推进；不撤销已发生的只读计算。');
}
export function createRuntimeReport(run) {
  validateRuntimeSettings(run.settings); validateToolCatalog(run.catalog);
  return { schema_version: 1, kind: 'bounded-scripted-runtime-teaching', model_called: false,
    policy: 'fixed script; answer is a fixed template, not hidden reasoning or live model output',
    protocol: 'original teaching envelopes, not MCP or a provider API implementation',
    counter_scope: 'dispatch attempts include the labelled injected failure; local receipt recomputation is not a new dispatch',
    snapshot: structuredClone(run) };
}
