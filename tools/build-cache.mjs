import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

// Python teaching downloads are intentional; local interpreter artifacts are not.
export function assertNoPythonCache(root, relative = '') {
  for (const entry of readdirSync(join(root, relative), { withFileTypes: true })) {
    const path = join(relative, entry.name);
    assert.ok(!['__pycache__', '.venv'].includes(entry.name) && !entry.name.endsWith('.pyc'),
      `Generated Python development files must not be published: ${path}`);
    if (entry.isDirectory()) assertNoPythonCache(root, path);
  }
}
