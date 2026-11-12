import { readFile, readdir, lstat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { parseStreamJson, validateStreamIndex, validateStreamStatus, validateStreamArchive } from '../../assets/js/atlas/stream-models.js';

const root = resolve(process.argv[2] || 'work/observatory/feed');
async function read(path) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Unsafe metadata path');
  return parseStreamJson(await readFile(path, 'utf8'));
}
const index = validateStreamIndex(await read(join(root, 'index.json')));
const status = validateStreamStatus(await read(join(root, 'status.json')));
if (status.digest !== createHash('sha256').update(JSON.stringify(index)).digest('hex') || status.total !== index.total || status.attempted_at !== index.attempted_at) throw new Error('Snapshot/status mismatch');
const manifest = JSON.parse(await readFile('_data/observatory_feeds.json', 'utf8'));
for (const source of index.sources) {
  const trusted = manifest.sources.find((item) => item.id === source.id);
  if (!trusted || source.feed_url !== trusted.url || source.publisher !== trusted.publisher ||
      JSON.stringify(source.article_hosts) !== JSON.stringify(trusted.article_hosts)) throw new Error('Unexpected source registration');
}
let count = 0;
for (const item of index.archives) {
  validateStreamArchive(await read(join(root, item.path)), index); count++;
}
for (const entry of await readdir(root, { recursive: true, withFileTypes: true })) if (entry.isSymbolicLink()) throw new Error('No symlinks in data output');
console.log(`PASS metadata archive: ${index.total} records, ${count} days; status hash, safe source links and archive counts agree.`);
