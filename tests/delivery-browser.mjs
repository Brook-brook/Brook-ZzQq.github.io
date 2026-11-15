import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { createDelivery, sendDelivery, lookupDelivery, deliveryReport } from '../assets/js/atlas/delivery-models.js';

const base = (process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io').replace(/\/$/, '');
const shots = process.env.DELIVERY_SHOT_DIR || 'work/delivery';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'), args: ['--no-sandbox'] });
try {
  for (const width of [390, 768, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const privateAccess = [], requests = [], errors = [];
    await context.exposeFunction('deliveryPrivateAccess', (name) => privateAccess.push(name));
    await context.addInitScript((theme) => {
      localStorage.setItem('atlas-theme', theme);
      localStorage.setItem('brooks-universe.learning.v1', 'SYNTHETIC_DELIVERY_PRIVATE');
      for (const method of ['getItem', 'setItem', 'removeItem']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (name, ...rest) {
          if (['brooks-universe.learning.v1', 'brooks-universe.observatory.v1'].includes(name)) window.deliveryPrivateAccess(method + ':' + name);
          return original.call(this, name, ...rest);
        };
      }
    }, theme);
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
    const send = page.locator('#delivery-send'), lookup = page.locator('#delivery-lookup');
    const reset = page.locator('#delivery-reset');
    await page.goto(base + '/playground/delivery/');
    await send.waitFor({ state: 'visible' }); await page.waitForFunction(() => !document.getElementById('delivery-send').disabled);
    assert.equal(await page.locator('#delivery-value').textContent(), '0');
    assert.ok(await lookup.isDisabled()); assert.ok(await page.locator('#delivery-export').isDisabled());
    assert.equal((await new AxeBuilder({ page }).analyze()).violations.length, 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(await page.locator('.delivery-rules dl > div').evaluateAll((nodes) => nodes.every((node) => node.getBoundingClientRect().width >= Math.min(280, innerWidth - 48))), 'shared definition-list styles do not squeeze the reading rules into tiny columns');
    await page.screenshot({ path: `${shots}/initial-${width}-${theme}.png`, fullPage: true });

    await send.focus(); await page.keyboard.press('Enter');
    assert.match(await page.locator('#delivery-state').textContent(), /结果未知/);
    assert.equal(await page.locator('#delivery-value').textContent(), '2');
    assert.equal(await page.locator('#delivery-writes').textContent(), '1');
    assert.ok(await page.locator('#delivery-confirmed').isHidden());
    assert.ok(await page.locator('#delivery-mode').isDisabled());
    assert.ok(await send.evaluate((node) => node === document.activeElement), 'render preserves the actual send invoker');
    await page.screenshot({ path: `${shots}/unknown-${width}-${theme}.png`, fullPage: true });
    await send.click();
    assert.equal(await page.locator('#delivery-value').textContent(), '4', 'ordinary retry actually applies twice');
    assert.equal(await page.locator('#delivery-writes').textContent(), '2');
    await lookup.click(); assert.match(await page.locator('#delivery-state').textContent(), /没有按key/);
    assert.ok(await page.locator('#delivery-confirmed').isHidden());

    await reset.click(); await page.selectOption('#delivery-mode', 'keyed');
    await send.click(); await lookup.click();
    assert.match(await page.locator('#delivery-state').textContent(), /核对到了原回执/);
    assert.equal(await page.locator('#delivery-value').textContent(), '2');
    assert.match(await page.locator('#delivery-counts').textContent(), /发送尝试1次，核对1次/);
    await send.click();
    assert.match(await page.locator('#delivery-state').textContent(), /同一份回执/);
    assert.equal(await page.locator('#delivery-writes').textContent(), '1', 'same key and payload do not apply again');
    await page.selectOption('#delivery-units', '3'); await send.click();
    assert.match(await page.locator('#delivery-state').textContent(), /参数不匹配/);
    assert.equal(await page.locator('#delivery-value').textContent(), '2');
    assert.ok(await page.locator('#delivery-confirmed').isHidden(), 'a previous receipt is not displayed as the current matched result');
    await page.selectOption('#delivery-key', 'op-2'); await page.selectOption('#delivery-units', '1'); await send.click();
    assert.equal(await page.locator('#delivery-value').textContent(), '3', 'a new key is a new operation');
    await page.selectOption('#delivery-key', 'op-1'); await page.selectOption('#delivery-units', '2'); await lookup.click();
    assert.match(await page.locator('#delivery-confirmed').textContent(), /op-1.*r-1.*增加2，当时累计2/);
    assert.equal(await page.locator('#delivery-value').textContent(), '3', 'a cached receipt is historical, not the current total');
    await page.screenshot({ path: `${shots}/reconciled-${width}-${theme}.png`, fullPage: true });

    // Unsaved draft controls must not silently become executed report events.
    await page.selectOption('#delivery-key', 'op-2'); await page.selectOption('#delivery-units', '3');
    const waiting = page.waitForEvent('download'); await page.locator('#delivery-export').click();
    const download = await waiting, report = JSON.parse(await readFile(await download.path(), 'utf8'));
    assert.equal(download.suggestedFilename(), 'brook-delivery-practice.json');
    assert.equal(report.transport, 'in-memory-js'); assert.equal(report.model_called, false);
    assert.equal(report.receiver.value, 3); assert.equal(report.events.length, 6);
    assert.deepEqual(report.events.at(-1).command, { key: 'op-1', units: 2 });
    let replay = createDelivery(report.config);
    for (const event of report.events) replay = (event.type === 'write' ? sendDelivery : lookupDelivery)(replay, event.command.key, event.command.units);
    assert.deepEqual(report, deliveryReport(replay), 'download is a complete replayable record of actual explicit steps');

    await page.locator('#delivery-observer-jump').focus(); await page.keyboard.press('Enter');
    assert.ok(await page.locator('#delivery-receiver').evaluate((node) => node === document.activeElement));
    await page.locator('#delivery-action-jump').focus(); await page.keyboard.press('Enter');
    assert.ok(await page.locator('#delivery-action-title').evaluate((node) => node === document.activeElement), 'phone and keyboard users can return from the observer without hunting for the controls');
    await reset.click(); await page.selectOption('#delivery-fault', 'before');
    await send.click(); assert.equal(await page.locator('#delivery-value').textContent(), '0');
    assert.match(await page.locator('#delivery-state').textContent(), /未知/);
    await lookup.click(); assert.match(await page.locator('#delivery-state').textContent(), /没有该回执/);
    await send.click(); assert.equal(await page.locator('#delivery-value').textContent(), '3');
    assert.equal(await page.locator('#delivery-writes').textContent(), '1');

    await reset.click(); await page.selectOption('#delivery-fault', 'none');
    await page.selectOption('#delivery-mode', 'plain'); await page.selectOption('#delivery-units', '1');
    for (let i = 0; i < 6; i++) await send.click();
    assert.equal(await page.locator('#delivery-value').textContent(), '6'); assert.ok(await send.isDisabled());
    for (let i = 0; i < 6; i++) await lookup.click();
    assert.ok(await lookup.isDisabled()); assert.match(await page.locator('#delivery-counts').textContent(), /发送尝试6次，核对6次/);
    await reset.click(); assert.ok(await send.isEnabled()); assert.ok(await page.locator('#delivery-mode').isEnabled());
    assert.equal(await page.locator('#delivery-value').textContent(), '0');
    await page.reload(); assert.equal(await page.locator('#delivery-value').textContent(), '0');
    assert.deepEqual(privateAccess, []); assert.deepEqual(errors, []);
    assert.ok(requests.every((request) => request.method === 'GET' && new URL(request.url).origin === new URL(base).origin && !request.url.includes('SYNTHETIC_DELIVERY_PRIVATE')), 'page never sends HTTP writes, fetches an interpreter or reads/uploads journals');
    await context.close();
  }

  const motionContext = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'no-preference' });
  const motionPage = await motionContext.newPage(); await motionPage.goto(base + '/playground/delivery/');
  await motionPage.waitForFunction(() => !document.getElementById('delivery-send').disabled);
  assert.ok(await motionPage.locator('#delivery-send').evaluate((node) => node.getBoundingClientRect().bottom <= innerHeight), 'the primary operation is reachable in the desktop initial viewport');
  await motionPage.locator('#delivery-send').click();
  await motionPage.emulateMedia({ reducedMotion: 'reduce' });
  await motionPage.waitForFunction(() => document.getElementById('delivery-detail').getAnimations().length === 0);
  await motionPage.locator('#delivery-reset').click();
  assert.equal(await motionPage.locator('#delivery-detail').evaluate((node) => node.getAnimations().length), 0);
  await motionPage.selectOption('#delivery-fault', 'none'); await motionPage.selectOption('#delivery-units', '3');
  assert.match(await motionPage.locator('#delivery-detail').textContent(), /当前设置/);
  assert.equal(await motionPage.locator('#delivery-value').textContent(), '0', 'editing an unsent setting has no effect');
  await motionPage.locator('#delivery-send').click(); assert.equal(await motionPage.locator('#delivery-value').textContent(), '3');
  // Explicit DOM fault injection, not an option claimed to exist in the UI.
  await motionPage.locator('#delivery-units').evaluate((node) => { node.value = 'invalid'; });
  await motionPage.locator('#delivery-send').click();
  assert.match(await motionPage.locator('#delivery-state').textContent(), /设置无效/);
  assert.ok(await motionPage.locator('#delivery-confirmed').isHidden());
  assert.equal(await motionPage.locator('#delivery-value').textContent(), '3', 'rejected draft does not undo or repeat an earlier effect');
  await motionPage.selectOption('#delivery-units', '1'); await motionPage.locator('#delivery-send').click();
  assert.equal(await motionPage.locator('#delivery-value').textContent(), '4', 'valid controls remain recoverable after a rejected draft');
  await motionPage.screenshot({ path: `${shots}/short-desktop.png`, fullPage: true });
  await motionContext.close();

  const noJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 640 } });
  const noJsPage = await noJsContext.newPage(); await noJsPage.goto(base + '/playground/delivery/');
  for (const id of ['mode', 'fault', 'key', 'units', 'send', 'lookup', 'reset', 'export']) assert.ok(await noJsPage.locator(`#delivery-${id}`).isDisabled());
  assert.ok(await noJsPage.locator('.delivery-rules').isVisible());
  assert.ok(await noJsPage.getByRole('link', { name: '读懂未知结果与重试', exact: true }).isVisible());
  assert.ok(await noJsPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await noJsPage.screenshot({ path: `${shots}/no-js-320.png`, fullPage: true }); await noJsContext.close();

  const textContext = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'reduce' });
  const textPage = await textContext.newPage(); await textPage.goto(base + '/playground/delivery/');
  await textPage.evaluate(() => { const style = document.createElement('style'); style.textContent = 'html {font-size: 200% !important;}'; document.head.append(style); });
  assert.ok(await textPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'DOM text-size doubling is not full browser zoom');
  await textPage.locator('#delivery-send').click(); assert.equal(await textPage.locator('#delivery-value').textContent(), '2');
  await textPage.screenshot({ path: `${shots}/text-double-320.png`, fullPage: true }); await textContext.close();
  console.log('PASS delivery: real local JS effects, unknown/plain/keyed/conflict/new-key/history/lookup/budgets/reset/download replay; no private storage or HTTP/model call; 390/768/1440×themes, axe/keyboard/live reduced motion/no-JS/short desktop/320 doubled DOM text (not full zoom). Real HTTP tested separately.');
} finally { await browser.close(); }
