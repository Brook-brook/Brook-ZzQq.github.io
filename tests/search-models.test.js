import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSearchIndex, searchEntries } from '../assets/js/atlas/search-models.js';

const base = '/Brook-ZzQq.github.io';
const entry = (extra = {}) => ({ id: 'note-0123456789abcdef', kind: 'note', title: 'C++ 对象复制', summary: '比较浅拷贝与深拷贝', keywords: 'memory ownership', detail: '实验室教程', url: base + '/knowledge/cpp-copy/', featured: false, ...extra });
const data = (entries) => ({ schema_version: 1, entries });

test('search intersects literal normalized tokens and kind, ranks title above summary', () => {
  const rows = [entry({ title: '内存', summary: 'C++ 对象复制' }), entry({ id: 'lab-0123456789abcdef', kind: 'lab' })];
  assert.equal(searchEntries(rows, 'Ｃ＋＋ 复制')[0].kind, 'lab');
  assert.equal(searchEntries(rows, 'C++ 复制', 'note').length, 1);
  assert.equal(searchEntries(rows, 'C++ 不存在').length, 0);
  assert.equal(searchEntries(rows, '.*').length, 0);
});
test('empty query uses explicit featured entries and stable order', () => {
  const rows = [entry(), entry({ id: 'path-0123456789abcdef', kind: 'path', featured: true })];
  assert.equal(searchEntries(rows)[0].kind, 'path');
  assert.equal(searchEntries(rows, '', 'note').length, 1);
});
test('search validates bounded metadata and does not interpret markup', () => {
  const text = '<img src=x onerror=alert(1)>';
  assert.equal(validateSearchIndex(data([entry({ title: text })]), base)[0].title, text);
  for (const change of [{ title: 'x'.repeat(241) }, { featured: 'true' }, { kind: 'private' }, { summary: '' }])
    assert.throws(() => validateSearchIndex(data([entry(change)]), base));
  assert.throws(() => validateSearchIndex(data([entry(), entry()]), base));
  assert.throws(() => validateSearchIndex({ schema_version: 2, entries: [] }, base));
  assert.throws(() => validateSearchIndex(data(Array(1001).fill(entry())), base));
});
test('search URLs cannot escape project path, inject schemes or normalized traversal', () => {
  for (const url of ['https://evil.test/', '//evil.test/', '/outside/', base + '-evil/', base + '/../outside/', base + '/%2e%2e/x', base + '/%2f/x', base + '/\\evil', base + '/a\nb'])
    assert.throws(() => validateSearchIndex(data([entry({ url })]), base), url);
  assert.ok(validateSearchIndex(data([entry({ url: base + '/study/paths/#cpp-ownership' })]), base));
  assert.ok(validateSearchIndex(data([entry({ url: '/study/paths/#cpp-ownership' })]), ''));
});
