import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';

// Observe the browser's native response from Node, including with page JS off.
// Do not set scrollLeft or dispatch a synthetic scroll event to satisfy a check.
export async function expectNativeHorizontalScroll(page, region) {
  await page.bringToFront(); await region.scrollIntoViewIfNeeded(); await region.focus();
  const before = await region.evaluate((node) => ({ active: node === document.activeElement,
    left: node.scrollLeft, width: node.clientWidth, full: node.scrollWidth }));
  assert.ok(before.active && before.full > before.width && before.left < before.full - before.width);
  await page.keyboard.press('ArrowRight');
  const deadline = performance.now() + 2500;
  while (performance.now() < deadline) {
    const left = await region.evaluate((node) => node.scrollLeft);
    if (left > before.left) return { before, after: left };
    await setTimeout(35);
  }
  const diagnostic = await region.evaluate((node) => ({ active: node === document.activeElement,
    focused: document.hasFocus(), left: node.scrollLeft, width: node.clientWidth, full: node.scrollWidth,
    bounds: node.getBoundingClientRect().toJSON() }));
  assert.fail('Native ArrowRight did not scroll the focused overflow region: ' + JSON.stringify(diagnostic));
}
