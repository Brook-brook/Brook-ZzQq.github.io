import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (process.env.CI ? chromium.executablePath() : "/usr/bin/chromium"),
  headless: true,
  args: ["--no-sandbox"]
});
const base =
  process.env.ATLAS_BASE_URL || "http://127.0.0.1:4173/Brook-ZzQq.github.io";
try {
  for (const width of [390, 768, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "no-preference"
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/explore/");
    await page.waitForFunction(
      () =>
        document.getElementById("campus-canvas").getAttribute("aria-busy") ===
        "false"
    );
    assert.equal(await page.locator("[data-pin]").count(), 6);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    );
    await page.waitForFunction(
      () => document.getAnimations().every((a) => a.playState !== "running"),
      undefined,
      { timeout: 5000 }
    );
    const a = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      a.violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target).join(";")}`
      ),
      [],
      `campus axe ${width}`
    );
    assert.equal(
      await page
        .locator(".campus-grid")
        .evaluate((e) => getComputedStyle(e).animationName),
      "grid-appear"
    );
    const cta = page.locator(".js-magnetic").first();
    await cta.scrollIntoViewIfNeeded();
    const rect = await cta.boundingBox();
    await page.mouse.move(
      rect.x + rect.width * 0.8,
      rect.y + rect.height * 0.65
    );
    await page.waitForTimeout(35);
    const magnet = await cta.evaluate((e) =>
      parseFloat(e.style.getPropertyValue("--mx"))
    );
    assert.ok(
      Number.isFinite(magnet) && magnet > 0 && magnet <= 4,
      "magnetic displacement is bounded"
    );
    await page.mouse.move(2, 2);
    await page.click('[data-category="dining"]');
    assert.ok(await page.locator("#campus-empty").isVisible());
    assert.match(
      await page.locator("#campus-empty-text").innerText(),
      /尚未收录/
    );
    await page.click("#campus-clear");
    await page.fill("#campus-search", "图书馆");
    assert.equal(await page.locator("[data-place]:visible").count(), 2);
    await page.fill("#campus-search", "");
    await page.click('[data-favorite="main-library"]');
    await page.click("#favorites-only");
    assert.equal(await page.locator("[data-place]:visible").count(), 1);
    await page.reload();
    await page.waitForFunction(
      () =>
        document.getElementById("campus-canvas").getAttribute("aria-busy") ===
        "false"
    );
    assert.equal(await page.locator("[data-place]:visible").count(), 1);
    assert.equal(
      await page
        .locator('[data-favorite="main-library"]')
        .getAttribute("aria-pressed"),
      "true"
    );
    await page.click("#favorites-only");
    await page.click('[data-pin="main-library"]');
    assert.match(await page.locator("#detail-title").innerText(), /主图书馆/);
    assert.equal(
      await page.locator("#detail-source").getAttribute("href"),
      "https://www.openstreetmap.org/way/1208408934"
    );
    await page.keyboard.press("Escape");
    assert.ok(await page.locator("#campus-detail").isHidden());
    assert.equal(
      await page.locator(":focus").getAttribute("data-pin"),
      "main-library"
    );
    await page.click('[data-layer="points"]');
    assert.equal(await page.locator("[data-place-anchor]:visible").count(), 0);
    assert.equal(await page.locator("[data-pin]:visible").count(), 0);
    await page.click('[data-layer="points"]');
    await page.click('[data-layer="grid"]');
    assert.ok(await page.locator("#map-grid-lines").isHidden());
    await page.click('[data-layer="grid"]');
    await page.click('[data-layer="labels"]');
    assert.ok(
      await page
        .locator("#campus-markers")
        .evaluate((e) => e.classList.contains("show-labels"))
    );
    await page.click("#map-zoom-in");
    assert.match(await page.locator("#map-zoom").innerText(), /1.3/);
    const view = await page.locator("#map-world").getAttribute("style");
    await page.goto(base + "/playground/");
    await page.goto(base + "/explore/");
    await page.waitForFunction(
      () =>
        document.getElementById("campus-canvas").getAttribute("aria-busy") ===
        "false"
    );
    assert.equal(
      await page.locator("#map-world").getAttribute("style"),
      view,
      "view survives navigation"
    );
    await page.click("#map-reset");
    await page.locator("#campus-canvas").focus();
    await page.keyboard.press("ArrowRight");
    assert.notEqual(
      await page.locator("#map-world").getAttribute("style"),
      "transform: translate(0px, 0px) scale(1);"
    );
    await page.keyboard.press("Home");
    const bounds = await page.locator("#campus-canvas").boundingBox();
    await page.mouse.move(bounds.x + 45, bounds.y + 45);
    await page.mouse.down();
    await page.mouse.move(bounds.x + 95, bounds.y + 70, { steps: 6 });
    await page.waitForTimeout(30);
    await page.mouse.up();
    assert.ok(
      await page
        .locator("#map-world")
        .evaluate((e) => e.style.transform !== "translate(0px, 0px) scale(1)")
    );
    await page.locator("#campus-canvas").focus();
    await page.keyboard.press("Home");
    assert.match(
      await page.locator("#map-world").getAttribute("style"),
      /translate\(0px, 0px\)/
    );
    await page.click("#map-sidebar-toggle");
    assert.ok(await page.locator("#campus-sidebar").isHidden());
    await page.click("#map-sidebar-toggle");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(30);
    assert.equal(
      await page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.playState === "running")
            .length
      ),
      0,
      "reduced motion cancels running animations"
    );
    await page.click('[data-category="study"]');
    assert.equal(await page.locator("[data-place]:visible").count(), 2);
    await page.click('[data-category="all"]');
    await page.screenshot({
      path: `work/campus-final-${width}.png`,
      fullPage: true
    });
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `PASS campus ${width}: axe, filters, empty state, favorites, marker/detail, layers, view persistence, keyboard, reduced motion`
    );
  }
  const offline = await browser.newContext();
  const page = await offline.newPage();
  await page.route("**/assets/data/campus.json", (r) => r.abort());
  await page.goto(base + "/explore/");
  await page.locator("#campus-retry").waitFor({ state: "visible" });
  assert.equal(await page.locator("[data-place]").count(), 6);
  await offline.close();
  const blocked = await browser.newContext();
  const p = await blocked.newPage();
  await p.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      }
    });
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new Error("blocked");
      }
    });
  });
  await p.goto(base + "/explore/");
  await p.waitForFunction(
    () =>
      document.getElementById("campus-canvas").getAttribute("aria-busy") ===
      "false"
  );
  await p.click('[data-favorite="main-library"]');
  assert.match(await p.locator("#campus-status").innerText(), /本页有效/);
  await blocked.close();
  const touch = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce"
  });
  const t = await touch.newPage();
  await t.goto(base + "/explore/");
  await t.waitForFunction(
    () =>
      document.getElementById("campus-canvas").getAttribute("aria-busy") ===
      "false"
  );
  assert.equal(
    await t.evaluate(() => matchMedia("(pointer: coarse)").matches),
    true
  );
  assert.match(
    await t
      .locator("#campus-canvas")
      .evaluate((e) => getComputedStyle(e).touchAction),
    /pan-y/
  );
  await t.getByRole("button", { name: "放大地图", exact: true }).tap();
  assert.match(await t.locator("#map-zoom").innerText(), /1.3/);
  await t
    .getByRole("button", { name: "查看主图书馆的地点详情", exact: true })
    .tap();
  assert.ok(await t.locator("#campus-detail").isVisible());
  await touch.close();
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const n = await nojs.newPage();
  await n.goto(base + "/explore/");
  assert.equal(await n.locator(".place-source:visible").count(), 6);
  await nojs.close();
  const legacy = await browser.newContext();
  const l = await legacy.newPage();
  await l.goto(base + "/");
  await l.evaluate(() => localStorage.setItem("atlas-theme", "dark"));
  await l.goto(base + "/journal/", { waitUntil: "domcontentloaded" });
  await l.waitForFunction(
    () => document.documentElement.dataset.bsTheme === "dark"
  );
  assert.equal(
    await l.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--main-bg")
        .trim()
    ),
    "#090711"
  );
  await l.goto(base + "/");
  await l.click("#theme-toggle");
  await l.goto(base + "/journal/", { waitUntil: "domcontentloaded" });
  await l.waitForFunction(
    () => document.documentElement.dataset.bsTheme === "light"
  );
  assert.equal(
    await l.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--main-bg")
        .trim()
    ),
    "#f5f3ff"
  );
  await legacy.close();
  console.log(
    "PASS campus touch, no-JS source cards and shared legacy palette"
  );
  console.log("PASS campus network failure and blocked storage fallbacks");
} finally {
  await browser.close();
}
