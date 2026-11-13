import test from 'node:test';
import assert from 'node:assert/strict';
import { runtimeDefaults, runtimeScenarios, createRuntimeRun, advanceRuntime,
  cancelRuntime, isRuntimeTerminal, acceptRuntimeReceipt, createRuntimeReport } from '../assets/js/atlas/runtime-models.js';

// Original synthetic unit fixture, not real campus coordinates or source evidence.
const catalog = { version: 1, checked: '2026-11-02', coordinateSystem: 'WGS84', license: 'ODbL-1.0',
  attribution: 'Synthetic fixture only', note: 'Not campus data', places: [
    { id: 'a', name: '甲图书馆', english: 'Alpha Library', category: 'library', tags: ['library', 'study'], coordinates: [120.07, 30.30], osm: 'way/1', source: 'https://mapcarta.com/W1' },
    { id: 'b', name: '乙图书馆', english: 'Beta Library', category: 'library', tags: ['library'], coordinates: [120.07, 30.31], osm: 'way/2', source: 'https://mapcarta.com/W2' },
    { id: 'c', name: '教学点', english: 'Teaching Point', category: 'teaching', tags: ['teaching'], coordinates: [120.07, 30.301], osm: 'way/3', source: 'https://mapcarta.com/W3' }
  ] };
const start = (patch = {}) => createRuntimeRun({ ...runtimeDefaults, ...patch }, catalog);
function finish(run) {
  for (let step = 0; step < 64 && !isRuntimeTerminal(run); step++) run = advanceRuntime(run);
  assert.equal(isRuntimeTerminal(run), true, 'every declared scenario has a bounded terminal result');
  return run;
}
function toObservation(run) { return advanceRuntime(advanceRuntime(advanceRuntime(run))); }

test('proposal, validation, dispatch and accepted observation are separate immutable events', () => {
  const original = start(), before = structuredClone(original);
  const proposed = advanceRuntime(original);
  assert.deepEqual(original, before); assert.equal(proposed.phase, 'validation');
  assert.equal(proposed.counters.decisions, 1); assert.equal(proposed.counters.dispatch_attempts, 0);
  const validated = advanceRuntime(proposed);
  assert.equal(validated.phase, 'execution'); assert.equal(validated.counters.dispatch_attempts, 0);
  const executed = advanceRuntime(validated);
  assert.equal(executed.phase, 'observation'); assert.equal(executed.execution.output.result.count, 2);
  assert.equal(executed.observations.length, 0, 'executed result has not reached the next proposal context');
  const returned = advanceRuntime(executed);
  assert.equal(returned.phase, 'decision'); assert.equal(returned.observations.length, 1);
  assert.equal(returned.counters.receipts_accepted, 1);
});

test('normal script uses observed IDs and an actual distance before its fixed-template completion', () => {
  const r = finish(start());
  assert.equal(r.status, 'completed');
  assert.deepEqual(r.counters, { decisions: 3, dispatch_attempts: 2, dispatch_succeeded: 2, receipts_accepted: 2, receipts_rejected: 0 });
  const distance = r.observations[1];
  assert.deepEqual(distance.call.arguments, { from: 'a', to: 'b' });
  assert.ok(Math.abs(distance.output.result.distance_m - 6371008.8 * Math.PI / 18000) < 1e-8);
  assert.match(r.answer, /球面距离约 1112\.0 米/); assert.match(r.answer, /不是完整校园覆盖/);
  assert.throws(() => advanceRuntime(r), /本次已停止/);
});

test('one batched proposal can dispatch two calls while a later proposal finishes', () => {
  const r = finish(start({ scenario: 'batch' }));
  assert.equal(r.status, 'completed'); assert.equal(r.counters.decisions, 2);
  assert.equal(r.counters.dispatch_attempts, 2); assert.equal(r.observations.length, 2);
  assert.deepEqual(r.observations.map((o) => o.tool), ['measure_distance', 'nearby_places']);
  assert.deepEqual(r.observations[1].output.result.places.map((p) => p.id), ['c']);
});

test('budget exhaustion retains partial read-only work without claiming completion or rollback', () => {
  const r = finish(start({ scenario: 'batch', max_dispatches: 1 }));
  assert.equal(r.status, 'budget_exhausted'); assert.equal(r.terminal_reason, 'dispatch_budget');
  assert.equal(r.counters.dispatch_attempts, 1); assert.equal(r.observations.length, 1);
  assert.equal(r.pending_index, 1); assert.equal(r.pending.length, 2); assert.equal(r.answer, null);
  assert.equal(r.trace.filter((e) => e.event === 'executed').length, 1);
});

test('simulation failure is labelled, correlated and distinct from a successful native dispatch', () => {
  const r = finish(start({ scenario: 'failed-once' }));
  assert.equal(r.status, 'completed'); assert.equal(r.counters.decisions, 4);
  assert.equal(r.counters.dispatch_attempts, 3); assert.equal(r.counters.dispatch_succeeded, 2);
  assert.equal(r.observations[0].status, 'error'); assert.equal(r.observations[0].error.code, 'simulated-transient');
  assert.equal(Object.hasOwn(r.observations[0], 'output'), false);
  assert.equal(r.observations[1].status, 'ok'); assert.equal(r.observations[2].tool, 'measure_distance');
});

test('old-run receipt is rejected then redelivered without another dispatch', () => {
  const waiting = toObservation(start({ scenario: 'receipt' }));
  const rejected = advanceRuntime(waiting);
  assert.equal(rejected.phase, 'observation'); assert.equal(rejected.observations.length, 0);
  assert.equal(rejected.counters.receipts_rejected, 1); assert.equal(rejected.counters.dispatch_attempts, 1);
  const accepted = advanceRuntime(rejected);
  assert.equal(accepted.counters.dispatch_attempts, 1); assert.equal(accepted.counters.receipts_accepted, 1);
  assert.equal(finish(accepted).status, 'completed');
});

test('receipt validation rejects wrong run, call, tool, type, extra fields and changed computation', () => {
  const run = toObservation(start());
  const call = run.pending[0];
  const right = { run_id: run.run_id, call_id: call.call_id, tool: call.name, status: 'ok', output: run.execution.output };
  assert.deepEqual(acceptRuntimeReceipt(run, right), right);
  for (const patch of [{ run_id: 'run-2' }, { call_id: 'call-999' }, { tool: 'measure_distance' },
    { status: 'error' }, { auth: 'not-permission' }, { output: { changed: true } }])
    assert.throws(() => acceptRuntimeReceipt(run, { ...right, ...patch }));
  assert.throws(() => acceptRuntimeReceipt(run, null));
  assert.equal(run.counters.receipts_accepted, 0, 'validation itself does not commit an observation');
});

test('unknown tools and invalid second batch call fail before any dispatch', () => {
  const forbidden = finish(start({ scenario: 'forbidden' }));
  assert.equal(forbidden.status, 'failed'); assert.equal(forbidden.terminal_reason, 'contract_rejected');
  assert.equal(forbidden.counters.dispatch_attempts, 0);
  const batch = advanceRuntime(start({ scenario: 'batch' }));
  batch.proposal.calls[1] = { name: 'publish_notes', arguments: {} };
  const rejected = advanceRuntime(batch);
  assert.equal(rejected.status, 'failed'); assert.equal(rejected.counters.dispatch_attempts, 0);
});

test('decision and dispatch limits stop repeat loops independently at their actual boundary', () => {
  for (const [max_decisions, max_dispatches, reason] of [[1, 8, 'decision_budget'], [8, 1, 'dispatch_budget']]) {
    const r = finish(start({ scenario: 'repeat', max_decisions, max_dispatches }));
    assert.equal(r.status, 'budget_exhausted'); assert.equal(r.terminal_reason, reason); assert.equal(r.answer, null);
    assert.ok(r.counters.decisions <= max_decisions); assert.ok(r.counters.dispatch_attempts <= max_dispatches);
  }
});

test('all scenarios and budget combinations stay finite and counters agree with committed events', () => {
  for (const s of runtimeScenarios) for (const decisions of [1, 2, 4, 8]) for (const dispatches of [1, 3, 8]) {
    const r = finish(start({ scenario: s.id, max_decisions: decisions, max_dispatches: dispatches }));
    assert.ok(r.trace.length <= 64); assert.ok(r.counters.decisions <= decisions); assert.ok(r.counters.dispatch_attempts <= dispatches);
    assert.equal(r.counters.receipts_accepted, r.observations.length);
    assert.equal(r.counters.dispatch_succeeded, r.trace.filter((e) => e.event === 'executed').length);
    assert.equal(r.counters.dispatch_attempts, r.trace.filter((e) => ['executed', 'simulated_failure', 'execution_failed'].includes(e.event)).length);
    assert.deepEqual(r.trace.map((e) => e.seq), Array.from({ length: r.trace.length }, (_, i) => i + 1));
    if (r.status !== 'completed') assert.equal(r.answer, null);
  }
});

test('cancel stops future steps, preserves performed work and is idempotent', () => {
  const pending = toObservation(start()); const stopped = cancelRuntime(pending);
  assert.equal(stopped.status, 'cancelled'); assert.equal(stopped.counters.dispatch_succeeded, 1);
  assert.equal(stopped.counters.receipts_accepted, 0); assert.ok(stopped.execution.output);
  assert.equal(stopped.answer, null); assert.throws(() => advanceRuntime(stopped));
  assert.deepEqual(cancelRuntime(stopped), stopped);
});

test('unexpected local rejection becomes a stopped failed run with an honest attempt count', () => {
  const validated = advanceRuntime(advanceRuntime(start()));
  validated.pending[0].arguments.category = 'not-allowed';
  const r = advanceRuntime(validated);
  assert.equal(r.status, 'failed'); assert.equal(r.terminal_reason, 'local_execution_failed');
  assert.equal(r.counters.dispatch_attempts, 1); assert.equal(r.counters.dispatch_succeeded, 0);
  assert.equal(r.trace.at(-1).event, 'execution_failed'); assert.equal(r.observations.length, 0);
});

test('catalog coverage shortfall is explicit and the run owns a complete source snapshot', () => {
  const source = structuredClone(catalog); source.places[1].tags = ['teaching']; source.places[1].category = 'teaching';
  const r = finish(createRuntimeRun(runtimeDefaults, source));
  assert.equal(r.status, 'insufficient'); assert.equal(r.answer, null);
  const owned = createRuntimeRun(runtimeDefaults, catalog); const before = structuredClone(owned.catalog);
  const outside = structuredClone(catalog), frozen = createRuntimeRun(runtimeDefaults, outside);
  outside.places[0].coordinates[0] = 90;
  assert.deepEqual(frozen.catalog, before);
});

test('explicit reports replay every public event and source without model or grading claims', () => {
  const completed = finish(start({ scenario: 'receipt' })), report = createRuntimeReport(completed);
  assert.equal(report.model_called, false); assert.match(report.protocol, /not MCP/); assert.match(report.counter_scope, /not a new dispatch/);
  const source = report.snapshot.catalog;
  assert.equal(source.license, 'ODbL-1.0'); assert.equal(source.places[0].english, 'Alpha Library');
  let replay = createRuntimeRun(report.snapshot.settings, source, report.snapshot.run_id);
  for (let i = 0; i < report.snapshot.trace.length; i++) replay = advanceRuntime(replay);
  assert.deepEqual(replay, report.snapshot);
  completed.catalog.places[0].name = 'Changed after export';
  assert.equal(source.places[0].name, '甲图书馆');
});

test('invalid settings, IDs and catalog provenance fail before a run is created', () => {
  for (const patch of [{ scenario: 'invented-agent' }, { max_decisions: '4' }, { max_dispatches: 0 },
    { max_decisions: 9 }, { max_dispatches: 2.5 }, { max_decisions: true }, { endpoint: 'https://not-used.test' }])
    assert.throws(() => start(patch));
  for (const id of ['run-0', 'call-1', 'run-100000', 'run-1\n']) assert.throws(() => createRuntimeRun(runtimeDefaults, catalog, id));
  assert.throws(() => createRuntimeRun(runtimeDefaults, { ...catalog, license: 'unknown' }));
});
