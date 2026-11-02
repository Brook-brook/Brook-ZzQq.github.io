import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { resolve, basename } from 'node:path';
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
  await page.selectOption('#python-example', 'dict');
  await page.click('#python-run');
  await page.waitForFunction(() =>
    document.getElementById('python-status').textContent.includes('执行完成')
  );
  assert.match(await page.locator('#python-output').innerText(), /2.000/);
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
    'PASS real Pyodide in Chromium: 3 examples, exception, capped output, infinite-loop timeout, reload and stop'
  );
} finally {
  await browser.close();
}
