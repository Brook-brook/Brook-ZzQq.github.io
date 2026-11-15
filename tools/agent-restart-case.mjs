import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const keys = (value, expected) => {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value));
  assert.deepEqual(Object.keys(value).sort(), expected.slice().sort());
};
const hash = (raw) => createHash('sha256').update(raw).digest('hex');
const cases = [
  ['after-commit-retry', [['apply', 'op-1', 2, 'after_commit'], ['apply', 'op-1', 2, 'none']], [[2, 1], [2, 1]], ['unknown', 'replayed']],
  ['before-commit-retry', [['apply', 'op-1', 2, 'before_commit'], ['apply', 'op-1', 2, 'none']], [[0, 0], [2, 1]], ['unknown', 'applied']],
  ['after-commit-lookup', [['apply', 'op-1', 2, 'after_commit'], ['lookup', 'op-1', 2, 'none']], [[2, 1], [2, 1]], ['unknown', 'found']],
  ['changed-payload', [['apply', 'op-1', 2, 'after_commit'], ['apply', 'op-1', 3, 'none']], [[2, 1], [2, 1]], ['unknown', 'conflict']],
  ['new-key', [['apply', 'op-1', 2, 'after_commit'], ['apply', 'op-2', 1, 'none']], [[2, 1], [3, 2]], ['unknown', 'applied']],
  ['historical-receipt', [['apply', 'op-1', 2, 'none'], ['apply', 'op-2', 1, 'none'], ['lookup', 'op-1', 2, 'none']], [[2, 1], [3, 2], [3, 2]], ['applied', 'applied', 'found']]
];
function receipt(value) {
  keys(value, ['id', 'key', 'units', 'value_after']);
  assert.ok(['r-1', 'r-2'].includes(value.id) && ['op-1', 'op-2'].includes(value.key));
  assert.ok(Number.isInteger(value.units) && value.units >= 1 && value.units <= 3);
  assert.ok(Number.isInteger(value.value_after) && value.value_after >= 1 && value.value_after <= 6);
}
export function assertRestartCaseCurrent(root, provided) {
  const read = (path) => readFileSync(resolve(root, path));
  const saved = read('assets/examples/agent-restart-case.json');
  assert.ok(saved.length > 0 && saved.length <= 64000);
  const value = provided ?? JSON.parse(saved);
  keys(value, ['schema_version', 'kind', 'captured_at', 'archive', 'generator', 'cases', 'scope']);
  assert.equal(value.schema_version, 1); assert.equal(value.kind, 'brook-sqlite-restart-case');
  assert.match(value.captured_at, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/); assert.ok(Number.isFinite(Date.parse(value.captured_at)));
  assert.equal(new Date(value.captured_at).toISOString().replace('.000Z', 'Z'), value.captured_at);
  assert.deepEqual(value.archive, { path: 'assets/examples/agent-restart.zip', sha256: hash(read('assets/examples/agent-restart.zip')), bytes: read('assets/examples/agent-restart.zip').length });
  assert.deepEqual(value.generator, { path: 'tools/generate-agent-restart-case.py', sha256: hash(read('tools/generate-agent-restart-case.py')) });
  assert.equal(value.scope, 'One actual replay of the exact original public ZIP. Injected steps are teaching configuration, client traces are received replies/exits, observers are separate fresh processes. No user DB/path, private journal, HTTP, model, external action, full Agent checkpoint, power-loss guarantee or publisher authentication.');
  assert.ok(Array.isArray(value.cases) && value.cases.length === 6);
  for (const [index, row] of value.cases.entries()) {
    keys(row, ['injected_steps', 'schema_version', 'kind', 'scenario', 'python', 'sqlite', 'model_called', 'transport', 'observer_transport', 'client_trace', 'teaching_observer', 'scope']);
    const [name, commands, states, outcomes] = cases[index];
    assert.equal(row.schema_version, 1); assert.equal(row.kind, 'brook-sqlite-restart-teaching'); assert.equal(row.scenario, name);
    assert.match(row.python, /^3\.\d+\.\d+$/); assert.match(row.sqlite, /^3\.\d+\.\d+$/);
    assert.ok(row.python.length < 20 && row.sqlite.length < 20);
    assert.equal(row.python, value.cases[0].python); assert.equal(row.sqlite, value.cases[0].sqlite);
    assert.equal(row.model_called, false); assert.equal(row.transport, 'actual-child-process-and-temporary-sqlite');
    assert.equal(row.observer_transport, 'separate-fresh-child-process');
    assert.equal(row.scope, 'Original owned temporary DB and actual child os._exit/reopen. One DB transaction includes this counter and receipt; no external effect, model, HTTP, private journal, distributed exactly-once or power-loss guarantee.');
    assert.deepEqual(row.injected_steps, commands.map(([action, key, units, interrupt]) => ({ action, key, units, interrupt })));
    assert.ok(Array.isArray(row.client_trace) && row.client_trace.length === commands.length);
    assert.ok(Array.isArray(row.teaching_observer) && row.teaching_observer.length === commands.length);
    for (const [i, event] of row.client_trace.entries()) {
      keys(event, ['action', 'key', 'units', 'process_exit_code', 'reply_received', 'outcome', 'response']);
      const [action, key, units, interrupt] = commands[i];
      assert.equal(event.action, action); assert.equal(event.key, key); assert.equal(event.units, units);
      assert.equal(event.outcome, outcomes[i]); assert.equal(event.process_exit_code, interrupt === 'none' ? 0 : 75);
      assert.equal(event.reply_received, interrupt === 'none');
      if (interrupt !== 'none') assert.equal(event.response, null);
      else {
        keys(event.response, ['status', 'receipt']); assert.equal(event.response.status, event.outcome);
        if (event.outcome === 'conflict') assert.equal(event.response.receipt, null);
        else { receipt(event.response.receipt); assert.equal(event.response.receipt.key, key); assert.equal(event.response.receipt.units, units); }
      }
      const observed = row.teaching_observer[i]; keys(observed, ['value', 'effects', 'receipts']);
      assert.deepEqual([observed.value, observed.effects], states[i]);
      assert.ok(Array.isArray(observed.receipts) && observed.receipts.length === observed.effects);
      let total = 0; const seen = new Set();
      for (const [j, remembered] of observed.receipts.entries()) {
        receipt(remembered); assert.equal(remembered.id, `r-${j + 1}`); assert.ok(!seen.has(remembered.key)); seen.add(remembered.key);
        total += remembered.units; assert.equal(remembered.value_after, total);
      }
      assert.equal(total, observed.value);
      if (event.response?.receipt) assert.deepEqual(event.response.receipt, observed.receipts.find((row) => row.key === key), 'received receipt matches the independently reopened file record');
    }
  }
  assert.equal(value.cases[5].client_trace[2].response.receipt.value_after, 2, 'old receipt must stay historical when current state is3');
  return value;
}
