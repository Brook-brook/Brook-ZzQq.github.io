import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { resolve, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'),
  headless: true,
  args: ['--no-sandbox']
});
try {
  const context = await browser.newContext();
  if (process.env.PYODIDE_FIXTURE)
    await context.route(
      'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/**',
      (route) =>
        route.fulfill({
          path: resolve(
            process.env.PYODIDE_FIXTURE,
            basename(new URL(route.request().url()).pathname)
          )
        })
    );
  const page = await context.newPage();
  const base =
    process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io';
  await page.goto(base + '/playground/python/');
  await page.click('#python-load');
  await page.locator('#python-run').waitFor();
  await page.waitForFunction(
    () => !document.getElementById('python-run').disabled,
    undefined,
    { timeout: 60000 }
  );
  await page.click('#python-run');
  await page.waitForFunction(() =>
    document.getElementById('python-status').textContent.includes('执行完成')
  );
  assert.match(
    await page.locator('#python-output').innerText(),
    /Keep exploring!/
  );
  await page.selectOption('#python-example', 'loops');
  await page.click('#python-run');
  await page.waitForFunction(() =>
    document.getElementById('python-status').textContent.includes('执行完成')
  );
  assert.match(await page.locator('#python-output').innerText(), /Mean: 18.0/);
  const loopsSource = await page.inputValue('#python-code');
  await page.fill('#python-code', loopsSource.replace('heights = [12, 18, 24]', 'heights = []'));
  await page.click('#python-run');
  await page.waitForFunction(() => document.getElementById('python-status').textContent.includes('执行遇到错误'));
  assert.match(await page.locator('#python-output').innerText(), /ValueError: Need at least one value/);
  await page.selectOption('#python-example', 'dict');
  await page.click('#python-run');
  await page.waitForFunction(() =>
    document.getElementById('python-status').textContent.includes('执行完成')
  );
  assert.match(await page.locator('#python-output').innerText(), /2.000/);
  await page.selectOption('#python-example', 'async');
  await page.click('#python-run');
  await page.waitForFunction(() => document.getElementById('python-status').textContent.includes('执行完成'));
  const asyncValues = (await page.locator('#python-output').innerText()).trim().split('\n').map((row) => JSON.parse(row));
  assert.deepEqual(asyncValues.map((row) => row.case), ['cancel', 'release']);
  assert.deepEqual(asyncValues.map((row) => row.task_cancelled), [true, false]);
  assert.ok(asyncValues.every((row) => row.task_done && row.before_schedule.length === 0));
  assert.ok(!asyncValues[0].events.includes('task:resumed'));
  assert.ok(asyncValues[1].events.includes('task:resumed'));
  assert.ok(await page.locator('#python-output-jump').isVisible());
  await page.locator('#python-output-jump').click();
  assert.ok(await page.locator('#python-output').evaluate((node) => node === document.activeElement));
  await page.selectOption('#python-example', 'json');
  await page.click('#python-run');
  await page.waitForFunction(() => document.getElementById('python-status').textContent.includes('执行完成'));
  const jsonValues = (await page.locator('#python-output').innerText()).trim().split('\n').map((row) => JSON.parse(row));
  assert.equal(jsonValues.length, 4);
  assert.equal(jsonValues[0].result.total, 6);
  assert.deepEqual(jsonValues.map((row) => row.accepted), [true, false, false, false]);
  assert.deepEqual(jsonValues.slice(1).map((row) => row.error), ['number', 'duplicate_name', 'nonstandard_number']);
  const jsonSource = await page.inputValue('#python-code');
  await page.fill('#python-code', jsonSource.replace('"values":[1,true]', '"values":[1,4]'));
  await page.click('#python-run');
  await page.waitForFunction(() => document.getElementById('python-status').textContent.includes('执行完成'));
  const changedJson = (await page.locator('#python-output').innerText()).trim().split('\n').map((row) => JSON.parse(row));
  assert.equal(changedJson[1].accepted, true);
  assert.equal(changedJson[1].result.total, 5);
  await page.selectOption('#python-example', 'neural');
  await page.click('#python-run');
  await page.waitForFunction(() => document.getElementById('python-status').textContent.includes('执行完成'));
  const neuralRows = JSON.parse('[' + (await page.locator('#python-output').innerText()).trim().split('\n').join(',') + ']');
  const local = spawnSync('python3', ['-I', '-S', '-B', '-c', 'import runpy;runpy.run_path("_includes/neural-basics/neural.py")["demo"]()'], { encoding: 'utf8', timeout: 10000 });
  assert.equal(local.status, 0, local.stderr);
  const expectedNeural = local.stdout.trim().split('\n').map((line) => JSON.parse(line));
  function sameCalculation(actual, expected) {
    if (typeof expected === 'number') assert.ok(Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(expected)));
    else if (expected !== null && typeof expected === 'object') { assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort()); for (const key of Object.keys(expected)) sameCalculation(actual[key], expected[key]); }
    else assert.equal(actual, expected);
  }
  sameCalculation(neuralRows, expectedNeural);
  assert.deepEqual(neuralRows.map((row) => row.parameters_updated), [false, false]);
  const neuralSource = await page.inputValue('#python-code'), changedNeuralSource = neuralSource.replace('"v0": 0.8', '"v0": 0.7');
  assert.notEqual(changedNeuralSource, neuralSource);
  await page.fill('#python-code', changedNeuralSource); await page.click('#python-run');
  await page.waitForFunction(() => document.getElementById('python-status').textContent.includes('执行完成'));
  const changedNeural = (await page.locator('#python-output').innerText()).trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(changedNeural[0].parameters.v0, 0.7);
  assert.notEqual(changedNeural[0].mean_binary_cross_entropy, neuralRows[0].mean_binary_cross_entropy);
  await page.click('#python-reset'); await page.click('#python-run');
  await page.waitForFunction(() => document.getElementById('python-status').textContent.includes('执行完成'));
  sameCalculation((await page.locator('#python-output').innerText()).trim().split('\n').map((line) => JSON.parse(line)), expectedNeural);
  await page.selectOption('#python-example', 'vectors');
  const vectorSource = await page.inputValue('#python-code');
  const vectorLocal = spawnSync('python3', ['-I', '-S', '-B', '-c', vectorSource], { encoding: 'utf8', timeout: 10000 });
  assert.equal(vectorLocal.status, 0, vectorLocal.stderr);
  const expectedVectors = vectorLocal.stdout.trim().split('\n').map(line => JSON.parse(line));
  assert.ok(vectorLocal.stdout.length < 20000, 'the real summary fits the existing output cap');
  await page.click('#python-run');
  await page.waitForFunction(() => document.getElementById('python-status').textContent.includes('执行完成'));
  const vectors = (await page.locator('#python-output').innerText()).trim().split('\n').map(line => JSON.parse(line));
  sameCalculation(vectors, expectedVectors);
  assert.deepEqual(vectors[0].ranked.map(row => row.id), ['b-retention-trial', 'c-retention-full']);
  assert.equal(vectors[1].query_vector.norm, 0); assert.equal(vectors[1].query_vector.unit_vector, null);
  assert.deepEqual(vectors[1].ranked, []); assert.equal(vectors[1].literal_baseline.ranked.length, 2);
  assert.deepEqual(vectors[0].index, vectors[1].index, 'a query change never refits the actual index');
  assert.ok(vectors.every(row => row.model_called === false));
  const changedVectorSource = vectorSource.replace('for query in ("保留 空间", "7天"):', 'for query in ("保留 保留 空间", "7天"):');
  assert.notEqual(changedVectorSource, vectorSource);
  await page.fill('#python-code', changedVectorSource); await page.click('#python-run');
  await page.waitForFunction(() => document.getElementById('python-status').textContent.includes('执行完成'));
  const changedVectors = (await page.locator('#python-output').innerText()).trim().split('\n').map(line => JSON.parse(line));
  assert.equal(changedVectors[0].ranked[0].id, 'a-retention-old');
  assert.deepEqual(changedVectors[0].index, vectors[0].index);
  await page.click('#python-reset'); await page.click('#python-run');
  await page.waitForFunction(() => document.getElementById('python-status').textContent.includes('执行完成'));
  sameCalculation((await page.locator('#python-output').innerText()).trim().split('\n').map(line => JSON.parse(line)), expectedVectors);
  await page.fill('#python-code', 'print(1 / 0)');
  await page.click('#python-run');
  await page.waitForFunction(() =>
    document
      .getElementById('python-status')
      .textContent.includes('执行遇到错误')
  );
  assert.match(
    await page.locator('#python-output').innerText(),
    /ZeroDivisionError/
  );
  await page.fill('#python-code', 'print("x" * 30000)');
  await page.click('#python-run');
  await page.waitForFunction(() =>
    document.getElementById('python-status').textContent.includes('执行完成')
  );
  assert.ok((await page.locator('#python-output').innerText()).length < 20100);
  await page.fill('#python-code', 'while True:\n    pass');
  await page.click('#python-run');
  assert.equal(await page.locator('#python-code').isEditable(), false);
  assert.ok(await page.locator('#python-example').isDisabled());
  assert.ok(await page.locator('#python-reset').isDisabled());
  await page.waitForFunction(
    () =>
      document.getElementById('python-status').textContent.includes('执行超时'),
    undefined,
    { timeout: 10000 }
  );
  assert.ok(await page.locator('#python-load').isEnabled());
  await page.click('#python-load');
  await page.waitForFunction(
    () => !document.getElementById('python-run').disabled,
    undefined,
    { timeout: 60000 }
  );
  await page.click('#python-stop');
  assert.match(await page.locator('#python-status').innerText(), /停止并释放/);
  console.log(
    'PASS real Pyodide in Chromium: 7 examples including actual lexical vectors/zero-query/edit/reset and manual neural forward/gradients with CPython parity, JSON contracts/edit and async release/cancel, guarded empty mean, exception, capped output, infinite-loop timeout, reload and stop'
  );
} finally {
  await browser.close();
}
