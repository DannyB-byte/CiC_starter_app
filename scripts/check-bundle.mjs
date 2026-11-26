import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : join(dir, entry.name)))).flat();
}
const files = await walk('dist/assets');
for (const [extension, limit] of [['.js', 200000], ['.css', 40000]]) {
  const matching = files.filter(file => file.endsWith(extension));
  const bytes = (await Promise.all(matching.map(async file => (await stat(file)).size))).reduce((a, b) => a + b, 0);
  console.log(`${extension}: ${bytes} / ${limit} bytes`);
  if (!matching.length || bytes > limit) process.exitCode = 1;
}
