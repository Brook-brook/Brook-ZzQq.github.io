import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import test from 'node:test';
import { createDelivery, sendDelivery, lookupDelivery, deliveryView, deliveryReport,
  newReceiver, applyEffect, lookupEffect, validateDelivery } from '../assets/js/atlas/delivery-models.js';

test('receipt loss and actual in-memory effects stay separate across modes, fault positions and units', () => {
  for (const mode of ['plain', 'keyed']) for (const first_fault of ['before', 'after', 'none']) for (const units of [1, 2, 3]) {
    const original = createDelivery({ mode, first_fault });
    let state = sendDelivery(original, 'op-1', units);
    assert.equal(original.receiver.value, 0); assert.deepEqual(original.events, []);
    assert.equal(state.receiver.value, first_fault === 'before' ? 0 : units);
    assert.equal(deliveryView(state).current_status, first_fault === 'none' ? 'confirmed' : 'unknown');
    if (first_fault !== 'none') assert.equal(deliveryView(state).receipt, null);
    state = sendDelivery(state, 'op-1', units);
    const effects = mode === 'keyed' || first_fault === 'before' ? 1 : 2;
    assert.equal(state.receiver.value, units * effects); assert.equal(state.receiver.writes, effects);
    const view = deliveryView(state);
    assert.equal(view.write_attempts, 2); assert.equal(view.responses_received, first_fault === 'none' ? 2 : 1);
    assert.equal(view.current_status, 'confirmed'); assert.equal(view.effects_applied, effects);
  }
});

test('same key with changed payload rejects without applying another effect', () => {
  let state = createDelivery({ mode: 'keyed', first_fault: 'after' });
  state = sendDelivery(state, 'op-1', 2); state = sendDelivery(state, 'op-1', 3);
  assert.equal(state.receiver.value, 2); assert.equal(state.receiver.writes, 1);
  assert.equal(deliveryView(state).current_status, 'conflict'); assert.equal(deliveryView(state).receipt, null);
  assert.equal(deliveryView(state).accepted_observations, 0);
});

test('a new key describes a new operation; an old receipt describes its historical value', () => {
  let state = createDelivery({ mode: 'keyed', first_fault: 'none' });
  state = sendDelivery(state, 'op-1', 2); state = sendDelivery(state, 'op-2', 1);
  assert.equal(state.receiver.value, 3); assert.equal(state.receiver.writes, 2);
  state = lookupDelivery(state, 'op-1', 2);
  assert.equal(deliveryView(state).receipt.value_after, 2); assert.equal(state.receiver.value, 3);
  const returned = deliveryView(state); returned.receipt.units = 3;
  assert.equal(state.receiver.receipts[0].units, 2, 'returned observations cannot mutate remembered payloads');
});

test('reconciliation can recover a known receipt without another write, but missing/unsupported is not fabricated success', () => {
  let state = createDelivery({ mode: 'keyed', first_fault: 'after' });
  state = sendDelivery(state, 'op-1', 2); state = lookupDelivery(state, 'op-1', 2);
  assert.equal(deliveryView(state).current_status, 'confirmed'); assert.equal(deliveryView(state).write_attempts, 1);
  assert.equal(deliveryView(state).lookup_attempts, 1); assert.equal(state.receiver.writes, 1);
  let before = sendDelivery(createDelivery({ mode: 'keyed', first_fault: 'before' }), 'op-1', 2);
  before = lookupDelivery(before, 'op-1', 2);
  assert.equal(deliveryView(before).current_status, 'not_found'); assert.equal(deliveryView(before).receipt, null);
  let plain = sendDelivery(createDelivery({ mode: 'plain', first_fault: 'after' }), 'op-1', 2);
  plain = lookupDelivery(plain, 'op-1', 2);
  assert.equal(deliveryView(plain).current_status, 'lookup_unavailable'); assert.equal(plain.receiver.value, 2);
});

test('attempt budgets stop further work and queries never add effects', () => {
  let state = createDelivery({ mode: 'plain', first_fault: 'none' });
  for (let i = 0; i < 6; i++) state = sendDelivery(state, 'op-1', 1);
  const stable = structuredClone(state);
  assert.throws(() => sendDelivery(state, 'op-1', 1), /write_attempt_budget/); assert.deepEqual(state, stable);
  for (let i = 0; i < 6; i++) state = lookupDelivery(state, 'op-1', 1);
  assert.equal(state.receiver.value, 6); assert.equal(state.events.length, 12);
  assert.throws(() => lookupDelivery(state, 'op-1', 1), /lookup_attempt_budget/);
  const bounded = applyEffect(state.receiver, 'op-1', 1); assert.equal(bounded.response.status, 'write_limit');
  assert.equal(bounded.receiver.value, 6);
});

test('typed bounded inputs, record fields, event roles and dense histories fail closed', () => {
  for (const settings of [null, true, [], { mode: 'plain', first_fault: 'invalid' }, { mode: 'plain', first_fault: 'after', private: 'SYNTHETIC' }]) assert.throws(() => createDelivery(settings));
  for (const units of [0, 4, true, '2', NaN, Infinity, null]) assert.throws(() => sendDelivery(createDelivery(), 'op-1', units));
  for (const key of ['', 'op-3', 'https://example.invalid', true]) assert.throws(() => sendDelivery(createDelivery(), key, 1));
  for (const edit of [
    (state) => state.private = 'SYNTHETIC_PRIVATE_FIELD',
    (state) => state.receiver.value = 999,
    (state) => state.receiver.receipts[0].private = 'SYNTHETIC_PRIVATE_FIELD',
    (state) => state.events[0].command.private = 'SYNTHETIC_PRIVATE_FIELD',
    (state) => state.events[0].response.status = 'found',
    (state) => state.events = new Array(1)
  ]) {
    const state = sendDelivery(createDelivery({ mode: 'keyed', first_fault: 'none' }), 'op-1', 2); edit(state);
    assert.throws(() => validateDelivery(state)); assert.throws(() => deliveryReport(state));
  }
});

test('export includes complete executed inputs and replayable outcomes without assigning unsent draft edits', () => {
  let state = createDelivery({ mode: 'keyed', first_fault: 'after' });
  state = sendDelivery(state, 'op-1', 2); state = sendDelivery(state, 'op-1', 3); state = lookupDelivery(state, 'op-1', 2);
  const report = JSON.parse(JSON.stringify(deliveryReport(state)));
  let replay = createDelivery(report.config);
  for (const event of report.events) replay = (event.type === 'write' ? sendDelivery : lookupDelivery)(replay, event.command.key, event.command.units);
  assert.deepEqual(replay.receiver, report.receiver); assert.deepEqual(deliveryView(replay), report.summary);
  assert.match(report.scope, /scripted receipt loss/); assert.match(report.scope, /Unsent draft/);
  report.receiver.receipts[0].units = 3; assert.equal(state.receiver.receipts[0].units, 2);
});

test('Python and JavaScript execute the same126 original integer receiver steps without SDKs or a network', () => {
  const samples = [];
  for (const mode of ['plain', 'keyed']) for (const a of [1, 2, 3]) for (const b of [1, 2, 3]) {
    samples.push({ mode, actions: [['write', 'op-1', a], ['lookup', 'op-1', a], ['write', 'op-1', a], ['write', 'op-1', b], ['write', 'op-2', b], ['lookup', 'op-1', b], ['lookup', 'op-1', a]] });
  }
  const actual = samples.map(({ mode, actions }) => {
    let receiver = newReceiver(mode); return actions.map(([kind, key, units]) => {
      let response;
      if (kind === 'write') ({ receiver, response } = applyEffect(receiver, key, units)); else response = lookupEffect(receiver, key, units);
      return structuredClone({ receiver, response });
    });
  });
  const source = 'import sys,json;sys.path.insert(0,sys.argv[1]);from effect_model import new_receiver,apply_effect,lookup_effect\nfrom copy import deepcopy\nout=[]\nfor sample in json.load(sys.stdin):\n receiver=new_receiver(sample["mode"]);frames=[]\n for kind,key,units in sample["actions"]:\n  if kind=="write": receiver,response=apply_effect(receiver,key,units)\n  else: response=lookup_effect(receiver,key,units)\n  frames.append(deepcopy({"receiver":receiver,"response":response}))\n out.append(frames)\nprint(json.dumps(out,allow_nan=False))';
  const result = spawnSync('python3', ['-I', '-S', '-B', '-c', source, resolve('_includes/api-foundations')], { encoding: 'utf8', input: JSON.stringify(samples), timeout: 10000 });
  assert.equal(result.status, 0, result.stdout + result.stderr); assert.deepEqual(JSON.parse(result.stdout), actual);
  assert.equal(samples.reduce((n, row) => n + row.actions.length, 0), 126);
});
