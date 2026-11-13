import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { assertNoPythonCache } from './build-cache.mjs';

// A successful file upload is not proof that Jekyll ran. Guard the exact artifact
// directory that upload-pages-artifact will receive, including project base paths.
const directory = process.argv[2];
assert.ok(directory, 'Usage: node tools/check-pages-build.mjs <built-site-directory>');
const root = resolve(directory);
const home = readFileSync(join(root, 'index.html'), 'utf8');
assert.match(home, /^<!doctype html>/i, 'Homepage must be rendered through the HTML layout');
assert.ok(!/^---\s*$/m.test(home), 'Raw YAML front matter must not be published');
assert.ok(!home.includes('{{') && !home.includes('{%'), 'Unprocessed Liquid must not be published');
assert.match(home, /<header\b/, 'Shared navigation layout is missing');
assertNoPythonCache(root);
const canonical = home.match(/<link rel="canonical" href="([^"]+)"/);
assert.ok(canonical, 'Built homepage must have a canonical URL');
const publicHome = new URL(canonical[1]);
const prefix = publicHome.pathname.replace(/\/$/, '');
let assets = 0;
for (const match of home.matchAll(/<(?:script|img|link)\b[^>]*\b(?:src|href)="([^"]+)"[^>]*>/g)) {
  const url = new URL(match[1], publicHome);
  if (url.origin !== publicHome.origin) continue;
  assert.ok(url.pathname.startsWith(prefix + '/'), `Asset escapes the site base path: ${url.pathname}`);
  const relative = decodeURIComponent(url.pathname.slice(prefix.length + 1));
  assert.ok(existsSync(join(root, relative)), `Built asset missing: ${relative}`);
  if (relative) assets++;
}
assert.ok(assets >= 4, 'Expected local stylesheet, scripts and globe/favicon assets');
for (const route of ['explore', 'explore/geo', 'explore/ai', 'explore/code', 'projects', 'knowledge', 'about', 'playground', 'playground/python', 'playground/nash', 'journal']) {
  assert.ok(existsSync(join(root, route, 'index.html')), `Built route missing: ${route}`);
}
for (const asset of ['assets/css/atlas.css', 'assets/img/atlas/globe.svg', 'assets/js/atlas/site.js', 'assets/js/atlas/python-worker.js', 'assets/js/dist/commons.min.js', 'assets/js/dist/home.min.js']) {
  assert.ok(readFileSync(join(root, asset)).length > 0, `Built runtime asset missing: ${asset}`);
}
for (const excluded of ['work', 'tests', 'AGENTS.md', '_layouts']) {
  assert.ok(!existsSync(join(root, excluded)), `Source/private build files must not be published: ${excluded}`);
}
console.log(`PASS Pages artifact: rendered layout, ${assets} homepage assets, main routes and legacy bundles (${prefix || '/'})`);
