import test from 'node:test';
import assert from 'node:assert/strict';
import { filterPracticeQuestions, nextPracticeQuestion } from '../assets/js/atlas/practice-models.js';
const rows = [
  { id: 'first', path: 'ai', title: 'AI 召回率', question: 'Recall 的分母', note: '待核对 <img onerror=x>' },
  { id: 'second', path: 'gis', title: '空间留出', question: '训练邻居', note: '自己的 Recall 问题' },
  { id: 'third', path: 'ai', title: '版本', question: '比较条件', note: '' }
];
test('local literal AND filtering handles public questions and optional notes without mutation', () => {
  const before = structuredClone(rows);
  assert.deepEqual(filterPracticeQuestions(rows), ['first', 'second', 'third']);
  assert.deepEqual(filterPracticeQuestions(rows, 'ＲＥＣＡＬＬ'), ['first', 'second']);
  assert.deepEqual(filterPracticeQuestions(rows, 'recall 分母'), ['first']);
  assert.deepEqual(filterPracticeQuestions(rows, '', 'ai'), ['first', 'third']);
  assert.deepEqual(filterPracticeQuestions(rows, 'recall', 'gis'), ['second']);
  assert.deepEqual(filterPracticeQuestions(rows, '<img'), ['first']);
  assert.deepEqual(filterPracticeQuestions(rows, 'not-in-this-journal'), []);
  assert.deepEqual(rows, before);
});
test('next cycles only through actual matches, with stable current/empty behavior', () => {
  assert.equal(nextPracticeQuestion(['a', 'b'], 'a'), 'b');
  assert.equal(nextPracticeQuestion(['a', 'b'], 'b'), 'a');
  assert.equal(nextPracticeQuestion(['a', 'b'], 'elsewhere'), 'a');
  assert.equal(nextPracticeQuestion(['a'], 'a'), 'a');
  assert.equal(nextPracticeQuestion([], 'a'), null);
});
test('bounds and malformed/duplicate questions fail rather than search an unbounded private object', () => {
  assert.throws(() => filterPracticeQuestions(rows, 'x'.repeat(201)));
  assert.throws(() => filterPracticeQuestions([...rows, rows[0]]));
  assert.throws(() => filterPracticeQuestions([{ ...rows[0], note: 'x'.repeat(2001) }]));
  assert.throws(() => filterPracticeQuestions([{ ...rows[0], id: '__proto__' }]));
  assert.throws(() => filterPracticeQuestions(Array(1001).fill(rows[0])));
});
