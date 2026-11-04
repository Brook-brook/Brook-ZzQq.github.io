import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeResearchEntries,
  normalizeResearchUrl,
  ResearchInputError
} from '../assets/js/atlas/research-models.js';

test('URL identity: host/default port/fragment normalize without removing meaningful query', () => {
  assert.equal(normalizeResearchUrl('https://EXAMPLE.test:443/note?id=1#part'), 'https://example.test/note?id=1');
  assert.notEqual(normalizeResearchUrl('https://example.test/note?id=1'), normalizeResearchUrl('https://example.test/note?id=2'));
});

test('tracking removal preserves remaining query order and duplicate parameters', () => {
  assert.equal(
    normalizeResearchUrl('https://example.test/note?b=2&utm_source=lab&a=1&a=2&FbClId=x#top'),
    'https://example.test/note?b=2&a=1&a=2'
  );
});

test('tracking removal can be disabled while fragment removal remains explicit', () => {
  assert.equal(normalizeResearchUrl('https://example.test/note?utm_source=x#top', { removeTracking: false }), 'https://example.test/note?utm_source=x');
});

test('tracker filtering preserves retained query spelling, bare values and encoded keys', () => {
  assert.equal(
    normalizeResearchUrl('https://example.test/a?q=a%20b&utm_source=x&sig=abc%2fdef'),
    'https://example.test/a?q=a%20b&sig=abc%2fdef'
  );
  assert.equal(
    normalizeResearchUrl('https://example.test/a?x=~&%75tm_source=x&empty&n=1&n=2'),
    'https://example.test/a?x=~&empty&n=1&n=2'
  );
  assert.equal(
    normalizeResearchUrl('https://example.test/a?malformed%=value&utm_source=x'),
    'https://example.test/a?malformed%=value'
  );
});

test('non-web, relative, credential-bearing and concealed-control URLs are rejected', () => {
  for (const url of ['file:///tmp/x', 'javascript:alert(1)', '/relative', 'https://name:password@example.test/a', 'https://exam\nple.test/a', 'https://example.test/' + 'a'.repeat(2050)]) {
    assert.throws(() => normalizeResearchUrl(url), ResearchInputError);
  }
});

test('URL dedup keeps the first record and reports invalid entries independently', () => {
  const entries = [
    { title: 'First', url: 'https://example.test/note?id=1&utm_source=demo#top' },
    { title: 'Duplicate title differs', url: 'https://example.test/note?id=1' },
    { title: 'Second', url: 'https://example.test/note?id=2' },
    { title: 'Missing link', url: '' },
    { title: '', url: 'https://example.test/empty-title' }
  ];
  const result = analyzeResearchEntries(entries);
  assert.deepEqual(result.counts, { input: 5, kept: 2, duplicate: 1, invalid: 2 });
  assert.equal(result.rows[1].duplicate_of, 1);
  assert.equal(result.output.records[0].title, 'First');
  assert.equal(result.rows[3].status, 'invalid');
});

test('the tracking option changes dedup rather than silently discarding query identity', () => {
  const entries = [
    { title: 'A', url: 'https://example.test/a?utm_source=x' },
    { title: 'B', url: 'https://example.test/a' }
  ];
  assert.equal(analyzeResearchEntries(entries).counts.kept, 1);
  assert.equal(analyzeResearchEntries(entries, { removeTracking: false }).counts.kept, 2);
});

test('output is deterministic, input is untouched, and no synthetic AI result is assigned', () => {
  const entry = Object.freeze({ title: 'Local exercise', url: 'https://example.test/a' });
  const input = Object.freeze([entry]);
  const result = analyzeResearchEntries(input, { sourceFormat: 'atom' });
  assert.deepEqual(result, analyzeResearchEntries(input, { sourceFormat: 'atom' }));
  assert.equal(result.output.source_format, 'atom');
  assert.deepEqual(result.output.records[0], {
    title: 'Local exercise', url: 'https://example.test/a', source: 'local-input',
    summary: null, score: null, review_status: 'needs_review'
  });
});

test('empty and all-invalid inputs remain explicit and over-limit input fails', () => {
  assert.deepEqual(analyzeResearchEntries([]).counts, { input: 0, kept: 0, duplicate: 0, invalid: 0 });
  assert.equal(analyzeResearchEntries([{ title: 'Unsafe', url: 'data:text/html,test' }]).output.records.length, 0);
  assert.throws(() => analyzeResearchEntries(Array.from({ length: 201 }, () => ({}))), /最多处理 200/);
  assert.throws(() => analyzeResearchEntries(null), ResearchInputError);
});
