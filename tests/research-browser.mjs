import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';

const base = process.env.ATLAS_BASE_URL || 'http://127.0.0.1:4173/Brook-ZzQq.github.io';
const shots = process.env.RESEARCH_SHOT_DIR || 'work/research-browser';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? chromium.executablePath() : '/usr/bin/chromium'),
  headless: true,
  args: ['--no-sandbox']
});

function rss(items) {
  return `<rss version="2.0"><channel>${items}</channel></rss>`;
}

async function result(page) {
  return JSON.parse(await page.locator('#research-json').inputValue());
}

async function run(page, source) {
  if (source !== undefined) await page.locator('#research-xml').fill(source);
  await page.locator('#research-run').focus();
  await page.keyboard.press('Enter');
}

async function assertCleared(page) {
  assert.ok(await page.locator('#research-download').isDisabled());
  assert.ok(await page.locator('#research-results').isHidden());
  assert.equal(await page.locator('#research-json').inputValue(), '');
}

try {
  for (const width of [390, 768, 1440]) {
    for (const theme of ['dark', 'light']) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: 'reduce',
        acceptDownloads: true
      });
      await context.addInitScript((value) => {
        localStorage.setItem('atlas-theme', value);
        localStorage.setItem('theme', value);
      }, theme);
      const page = await context.newPage();
      const pageErrors = [];
      const badResponses = [];
      const externalRequests = [];
      const allRequests = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('response', (response) => {
        if (response.status() >= 400 && new URL(response.url()).origin === new URL(base).origin) {
          badResponses.push(`${response.status()} ${response.url()}`);
        }
      });
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (['http:', 'https:'].includes(url.protocol)) {
          allRequests.push(request.url());
          if (url.origin !== new URL(base).origin) externalRequests.push(request.url());
        }
      });
      const response = await page.goto(`${base}/playground/research/`);
      assert.ok(response.ok());
      await page.waitForFunction(() => !document.getElementById('research-run').disabled);
      await page.waitForLoadState('networkidle');
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
      assert.equal(await page.locator('#primary-nav [aria-current="page"]').count(), 1);
      if (width === 390) {
        for (const selector of ['#research-xml', '#research-example']) {
          const size = await page.locator(selector).evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
          assert.ok(size >= 16, `${selector} avoids sub-16px phone form text`);
        }
      }
      assert.ok(await page.locator('#research-download').isDisabled());
      const storageBefore = await page.evaluate(() => JSON.stringify({ ...localStorage }));
      const requestsBefore = allRequests.length;

      await run(page);
      let output = await result(page);
      assert.equal(output.source_format, 'rss');
      assert.equal(output.records.length, 2);
      assert.equal(await page.locator('#research-kept').innerText(), '2');
      assert.equal(await page.locator('#research-duplicates').innerText(), '1');
      assert.equal(await page.locator('#research-invalid').innerText(), '1');
      assert.equal(await page.locator('#research-rows > [data-result]').count(), 4);
      for (const record of output.records) {
        assert.equal(record.summary, null);
        assert.equal(record.score, null);
        assert.equal(record.review_status, 'needs_review');
        assert.equal(record.source, 'local-input');
        assert.ok(record.url.startsWith('https://example.test/'));
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(accessibility.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target).join(';')}`), []);
      await page.screenshot({ path: `${shots}/lab-${width}-${theme}.png`, fullPage: true });

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('#research-download').click()
      ]);
      assert.equal(download.suggestedFilename(), 'research-records.json');
      const downloaded = JSON.parse(await readFile(await download.path(), 'utf8'));
      assert.deepEqual(downloaded, output);

      await page.locator('#research-tracking').uncheck();
      await assertCleared(page);
      assert.match(await page.locator('#research-status').innerText(), /重新运行/);
      await run(page);
      output = await result(page);
      assert.equal(output.records.length, 3);
      assert.equal(output.normalization.remove_tracking_parameters, false);

      await page.locator('#research-example').selectOption('atom');
      await page.locator('#research-load').click();
      await assertCleared(page);
      await page.locator('#research-tracking').check();
      await run(page);
      output = await result(page);
      assert.equal(output.source_format, 'atom');
      assert.equal(output.records.length, 2);

      await run(page, '<a:feed xmlns:a="http://www.w3.org/2005/Atom"><a:entry><a:title>Prefixed Atom exercise</a:title><a:link rel="self" href="https://example.test/feed"/><a:link rel="alternate" href="https://example.test/note?id=3&amp;utm_source=lab"/></a:entry></a:feed>');
      output = await result(page);
      assert.equal(output.source_format, 'atom');
      assert.equal(output.records.length, 1);
      assert.equal(output.records[0].url, 'https://example.test/note?id=3');

      await run(page, rss('<item><title><![CDATA[<img src=x onerror="window.__researchXss=true">]]></title><link>https://example.test/safe</link></item>'));
      output = await result(page);
      assert.equal(output.records.length, 1);
      assert.match(output.records[0].title, /<img src=x/);
      assert.match(await page.locator('#research-rows h3').innerText(), /<img src=x/);
      assert.equal(await page.locator('#research-rows img').count(), 0);
      assert.equal(await page.evaluate(() => typeof window.__researchXss), 'undefined');

      await page.locator('#research-xml').fill('<rss>');
      await assertCleared(page);
      await run(page);
      assert.match(await page.locator('#research-status').innerText(), /XML 无法解析/);
      assert.equal(await page.locator('#research-xml').getAttribute('aria-invalid'), 'true');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'research-xml');
      await assertCleared(page);

      await run(page, '<!DOCTYPE rss [<!ENTITY external SYSTEM "https://example.test/should-not-load">]><rss version="2.0"><channel/></rss>');
      assert.match(await page.locator('#research-status').innerText(), /DTD 或实体/);
      await assertCleared(page);

      await run(page, 'x'.repeat(50_001));
      assert.match(await page.locator('#research-status').innerText(), /50 KB/);
      await assertCleared(page);

      await run(page, rss('<item><title>A</title><link>https://example.test/a</link></item>'.repeat(201)));
      assert.match(await page.locator('#research-status').innerText(), /200 条/);
      await assertCleared(page);

      await run(page, rss('<item><title>&lt;img src=x onerror=alert(1)&gt;</title><link>javascript:alert(1)</link></item>'));
      assert.equal((await result(page)).records.length, 0);
      assert.equal(await page.locator('#research-invalid').innerText(), '1');
      assert.equal(await page.locator('#research-rows img').count(), 0);
      assert.equal(await page.locator('#research-rows a').count(), 0);
      assert.ok(await page.locator('#research-download').isDisabled());

      await run(page, rss(''));
      assert.match(await page.locator('#research-status').innerText(), /没有找到/);
      assert.ok(await page.locator('#research-download').isDisabled());

      await page.locator('#research-example').selectOption('rss');
      await page.locator('#research-load').click();
      await run(page);
      assert.equal((await result(page)).records.length, 2);
      assert.equal(await page.locator('#research-xml').getAttribute('aria-invalid'), null);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.equal(await page.evaluate(() => JSON.stringify({ ...localStorage })), storageBefore);
      assert.equal(allRequests.length, requestsBefore, 'processing and export must not make HTTP requests');
      assert.deepEqual(externalRequests, []);
      assert.deepEqual(pageErrors, []);
      assert.deepEqual(badResponses, []);
      console.log(`PASS research ${width} ${theme}: RSS/Atom, keyboard, current export, stale/error/empty states, unsafe XML/URL, no network/storage, axe`);
      await context.close();
    }
  }
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const page = await noJs.newPage();
  await page.goto(`${base}/playground/research/`);
  assert.ok(await page.locator('.research-nojs').isVisible());
  assert.match(await page.locator('#research-xml').inputValue(), /<rss version="2.0">/);
  assert.ok(await page.locator('#research-run').isDisabled());
  assert.ok(await page.locator('#research-download').isDisabled());
  for (const link of await page.locator('.research-next a, .research-intro a').evaluateAll((nodes) => nodes.map((node) => node.href))) {
    assert.ok((await page.request.get(link)).ok(), link);
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  console.log('PASS research no-JavaScript: readable fixture, explicit limitation, disabled execution/export and actual learning links');
  await noJs.close();
} finally {
  await browser.close();
}
