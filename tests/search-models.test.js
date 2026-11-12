import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSearchIndex, searchEntries, highlightSearch, keywordContext, searchAliasHint } from '../assets/js/atlas/search-models.js';

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
test('explicit spellings match across titles and metadata with AND semantics', () => {
  const rows = [entry(), entry({ id: 'lab-0123456789abcdef', kind: 'lab', title: '墨卡托尺度', keywords: 'GIS' })];
  assert.equal(searchEntries(rows, 'CPP 深复制')[0].kind, 'note');
  assert.equal(searchEntries(rows, 'cplusplus', 'note').length, 1);
  assert.equal(searchEntries(rows, '地理信息系统 mercator', 'lab').length, 1);
  assert.equal(searchEntries(rows, 'GIS CPP').length, 0);
  assert.equal(searchEntries(rows, '机器学习').length, 0, 'no inferred related topics');
  assert.match(searchAliasHint('ＣＰＰ cpp'), /C\+\+ \/ CPP \/ CPLUSPLUS/);
  assert.equal(searchAliasHint('pyhton'), '', 'no guessed spelling correction');
});
test('short Latin terms and abbreviations do not match inside unrelated words', () => {
  const rows = [entry({ title: 'chair', summary: 'details', keywords: 'JSON GIScience NashvillE' })];
  for (const query of ['AI', 'JS', 'GIS', 'nash']) assert.equal(searchEntries(rows, query).length, 0, query);
  assert.equal(searchEntries([entry({ title: 'AI 人工智能', keywords: 'JavaScript GIS C++17' })], 'ai js GIS cpp').length, 1);
});
test('literal full title outranks alias/keywords and stable ties do not imply popularity', () => {
  const rows = [entry({ title: '别名示例', keywords: 'C++' }), entry({ id: 'lab-0123456789abcdef', kind: 'lab', title: 'CPP' })];
  assert.equal(searchEntries(rows, 'cpp')[0].kind, 'lab');
  assert.equal(searchEntries([entry(), entry({ id: 'note-1123456789abcdef' })], 'CPP')[0].id, entry().id);
});
test('highlight preserves original Unicode and literal markup, merging overlaps safely', () => {
  for (const [text, query, expected] of [
    ['用 Ｃ＋＋ 学习深拷贝', 'cpp 深复制', ['Ｃ＋＋', '深拷贝']],
    ['ＡＩ / 人工智能', 'ai', ['ＡＩ', '人工智能']],
    ['cafe\u0301 与 ﬃ', 'café ffi', ['cafe\u0301', 'ﬃ']],
    ['<img src=x onerror=alert(1)>', '<img', ['<img']],
    ['深拷贝', '深 深拷贝', ['深拷贝']]
  ]) {
    const parts = highlightSearch(text, query);
    assert.equal(parts.map((part) => part.text).join(''), text);
    assert.deepEqual(parts.filter((part) => part.matched).map((part) => part.text), expected);
  }
  assert.ok(highlightSearch('chair JSON', 'AI JS').every((part) => !part.matched));
  assert.equal(highlightSearch('C++', '').map((part) => part.text).join(''), 'C++');
});
test('keyword context includes a remote hit and stays bounded without altering source', () => {
  const text = '前文'.repeat(400) + ' RAII ' + '后文'.repeat(400);
  const context = keywordContext(text, 'raii');
  assert.match(context, /RAII/);
  assert.ok(Array.from(context).length <= 162);
  assert.ok(context.startsWith('…') && context.endsWith('…'));
  assert.equal(keywordContext(text, 'not-found'), '');
  assert.ok(text.length > 1600);
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
