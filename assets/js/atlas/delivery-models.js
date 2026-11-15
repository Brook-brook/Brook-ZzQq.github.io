/* Original Brook bounded teaching model. Local integer effects and deliberately
 * dropped receipts; no HTTP, model, private store or durable server is implied. */
const modes = ['plain', 'keyed'], faults = ['before', 'after', 'none'];
const statuses = ['applied', 'replayed', 'found', 'conflict', 'not_found', 'lookup_unavailable', 'write_limit'];
const successful = new Set(['applied', 'replayed', 'found']);
const copy = (value) => structuredClone(value);
function need(condition, code) { if (!condition) throw new Error(`Invalid teaching delivery: ${code}`); }
function record(value, fields) {
  need(value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype, 'record');
  need(Object.keys(value).sort().join(',') === fields.slice().sort().join(','), 'record_fields');
}
const integer = (n, low, high) => Number.isSafeInteger(n) && n >= low && n <= high;
function command(key, units) { need(['op-1', 'op-2'].includes(key), 'command_key'); need(integer(units, 1, 3), 'command_units'); }
function receiptShape(receipt) {
  record(receipt, ['id', 'key', 'units', 'value_after']); command(receipt.key, receipt.units);
  need(typeof receipt.id === 'string' && /^r-[1-6]$/.test(receipt.id) && integer(receipt.value_after, 1, 18), 'receipt_identity');
}
export function newReceiver(mode) {
  need(modes.includes(mode), 'receiver_mode'); return { mode, value: 0, writes: 0, receipts: [] };
}
export function checkedReceiver(receiver) {
  record(receiver, ['mode', 'value', 'writes', 'receipts']);
  need(modes.includes(receiver.mode), 'receiver_mode');
  need(integer(receiver.writes, 0, 6) && integer(receiver.value, receiver.writes, receiver.writes * 3), 'receiver_counts');
  need(Array.isArray(receiver.receipts) && receiver.receipts.length <= 2, 'receiver_receipts');
  if (receiver.mode === 'plain') need(receiver.receipts.length === 0, 'plain_cache');
  else {
    let running = 0; const seen = new Set();
    for (const [index, receipt] of receiver.receipts.entries()) {
      receiptShape(receipt); running += receipt.units;
      need(!seen.has(receipt.key) && receipt.id === `r-${index + 1}` && receipt.value_after === running, 'cache_identity');
      seen.add(receipt.key);
    }
    need(receiver.writes === receiver.receipts.length && receiver.value === running, 'cache_consistency');
  }
}
export function applyEffect(receiver, key, units) {
  checkedReceiver(receiver); command(key, units); const next = copy(receiver);
  const cached = receiver.mode === 'keyed' ? receiver.receipts.find((row) => row.key === key) : undefined;
  if (cached) return { receiver: next, response: cached.units === units ? { status: 'replayed', receipt: copy(cached) } : { status: 'conflict', receipt: null } };
  if (receiver.writes >= 6) return { receiver: next, response: { status: 'write_limit', receipt: null } };
  next.value += units; next.writes++;
  const receipt = { id: `r-${next.writes}`, key, units, value_after: next.value };
  if (receiver.mode === 'keyed') next.receipts.push(copy(receipt));
  return { receiver: next, response: { status: 'applied', receipt } };
}
export function lookupEffect(receiver, key, units) {
  checkedReceiver(receiver); command(key, units);
  if (receiver.mode === 'plain') return { status: 'lookup_unavailable', receipt: null };
  const cached = receiver.receipts.find((row) => row.key === key);
  if (!cached) return { status: 'not_found', receipt: null };
  return cached.units === units ? { status: 'found', receipt: copy(cached) } : { status: 'conflict', receipt: null };
}
export function createDelivery(settings = { mode: 'plain', first_fault: 'after' }) {
  record(settings, ['mode', 'first_fault']);
  const { mode, first_fault } = settings;
  need(modes.includes(mode) && faults.includes(first_fault), 'settings');
  return { schema_version: 1, kind: 'brook-delivery-teaching', config: { mode, first_fault }, receiver: newReceiver(mode), events: [] };
}
export function validateDelivery(state) {
  record(state, ['schema_version', 'kind', 'config', 'receiver', 'events']);
  need(state.schema_version === 1 && state.kind === 'brook-delivery-teaching', 'version');
  record(state.config, ['mode', 'first_fault']);
  need(modes.includes(state.config.mode) && faults.includes(state.config.first_fault), 'settings');
  checkedReceiver(state.receiver); need(state.receiver.mode === state.config.mode, 'mode_changed');
  need(Array.isArray(state.events) && state.events.length <= 12, 'event_bound');
  let writes = 0, lookups = 0;
  for (const event of state.events) {
    record(event, ['type', 'command', 'fault', 'response']);
    record(event.command, ['key', 'units']); command(event.command.key, event.command.units);
    need(['write', 'lookup'].includes(event.type), 'event_type');
    if (event.type === 'write') writes++; else lookups++;
    const expectedFault = event.type === 'write' && writes === 1 ? state.config.first_fault : 'none';
    need(event.fault === expectedFault, 'fault_sequence');
    if (event.response === null) need(event.type === 'write' && event.fault !== 'none', 'missing_response');
    else {
      need(event.fault === 'none', 'unexpected_response');
      record(event.response, ['status', 'receipt']); need(statuses.includes(event.response.status), 'response_status');
      need((event.type === 'write' ? ['applied', 'replayed', 'conflict', 'write_limit'] : ['found', 'conflict', 'not_found', 'lookup_unavailable']).includes(event.response.status), 'response_role');
      if (successful.has(event.response.status)) {
        receiptShape(event.response.receipt);
        need(event.response.receipt.key === event.command.key && event.response.receipt.units === event.command.units, 'response_correlation');
      } else need(event.response.receipt === null, 'error_receipt');
    }
  }
  need(writes <= 6 && lookups <= 6 && state.receiver.writes <= writes, 'attempt_bound');
  return state;
}
export function deliveryView(state) {
  validateDelivery(state);
  const last = state.events.at(-1), response = last?.response;
  return {
    write_attempts: state.events.filter((event) => event.type === 'write').length,
    lookup_attempts: state.events.filter((event) => event.type === 'lookup').length,
    responses_received: state.events.filter((event) => event.response !== null).length,
    accepted_observations: state.events.filter((event) => successful.has(event.response?.status)).length,
    effects_applied: state.receiver.writes,
    current_status: !last ? 'not_sent' : response === null ? 'unknown' : successful.has(response.status) ? 'confirmed' : response.status,
    command: last ? copy(last.command) : null,
    receipt: response && successful.has(response.status) ? copy(response.receipt) : null,
    response_kind: response?.status || null
  };
}
export function sendDelivery(state, key, units) {
  const view = deliveryView(state); command(key, units); need(view.write_attempts < 6, 'write_attempt_budget');
  const next = copy(state), fault = view.write_attempts === 0 ? state.config.first_fault : 'none';
  let response = null;
  if (fault !== 'before') {
    const applied = applyEffect(state.receiver, key, units); next.receiver = applied.receiver;
    if (fault !== 'after') response = applied.response;
  }
  next.events.push({ type: 'write', command: { key, units }, fault, response });
  validateDelivery(next); return next;
}
export function lookupDelivery(state, key, units) {
  const view = deliveryView(state); command(key, units); need(view.lookup_attempts < 6, 'lookup_attempt_budget');
  const next = copy(state);
  next.events.push({ type: 'lookup', command: { key, units }, fault: 'none', response: lookupEffect(state.receiver, key, units) });
  validateDelivery(next); return next;
}
export function deliveryReport(state) {
  validateDelivery(state);
  return { ...copy(state), model_called: false, transport: 'in-memory-js', summary: deliveryView(state), scope: 'Original bounded in-memory teaching receiver. Local JS effects and scripted receipt loss; no HTTP, model, durable cache, authentication, private journal or external write. Unsent draft controls are not executed events.' };
}
