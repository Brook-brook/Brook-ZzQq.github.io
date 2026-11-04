import { readdir, readFile } from 'node:fs/promises';

// Test discovery for this project's simple top-level publication scalars.
// Jekyll itself parses/validates YAML; actual pruning is tested with real builds.
export async function expectedPublicNotes() {
  const names = (await readdir('_atlas_notes')).filter((name) => name.endsWith('.md'));
  const notes = await Promise.all(names.map(async (name) => {
    const source = await readFile(`_atlas_notes/${name}`, 'utf8');
    const front = source.split(/^---\s*$/m)[1] || '';
    const field = (key) => {
      const value = front.match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, 'm'))?.[1] || '';
      return value.replace(/\s+#.*$/, '').replace(/^(['"])(.*)\1$/, '$2');
    };
    const excluded = field('published') === 'false' || field('draft') === 'true' ||
      (field('kind') === 'research' && field('review_status') !== 'source_checked');
    return excluded ? null : name.replace(/\.md$/, '');
  }));
  return notes.filter(Boolean);
}
