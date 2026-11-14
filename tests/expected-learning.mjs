import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Discover this repository's simple ID scalars as an independent browser oracle.
// Real Jekyll builds parse/validate the YAML. Historical backup fixtures remain
// explicit ID lists; never derive a legacy fixture from the current model.
export async function expectedLearningIds() {
  const source = await readFile('_data/learning_paths.yml', 'utf8');
  const paths = [...source.matchAll(/^- id: ([a-z][a-z0-9-]*)\s*$/gm)].map((row) => row[1]);
  const steps = [...source.matchAll(/^ {4}- id: ([a-z][a-z0-9-]*)\s*$/gm)].map((row) => row[1]);
  assert.ok(paths.length > 0 && steps.length > 0);
  assert.equal(new Set([...paths, ...steps]).size, paths.length + steps.length);
  return { paths, steps };
}
