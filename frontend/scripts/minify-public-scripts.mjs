// Minifies hand-written scripts that Astro copies verbatim from public/.
// The source files stay readable (tests read them from public/); only the
// deployed copies in dist/ are rewritten. A failed minify keeps the original.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { minify } from 'vite';

const dist = resolve(process.argv[2] || 'dist');
const scripts = ['js/posthog-analytics.js'];

for (const relativePath of scripts) {
  const file = resolve(dist, relativePath);
  if (!existsSync(file)) {
    console.warn(`[minify-public-scripts] skipped missing ${relativePath}`);
    continue;
  }

  const source = await readFile(file, 'utf8');
  try {
    const result = await minify(relativePath, source, { compress: true, mangle: true });
    if (result.errors?.length) throw new Error(result.errors.map((error) => error.message).join('; '));
    // Parse check: never deploy output the browser would reject.
    new Function(result.code);
    await writeFile(file, result.code);
    console.log(`[minify-public-scripts] ${relativePath}: ${source.length} -> ${result.code.length} bytes`);
  } catch (error) {
    console.warn(`[minify-public-scripts] kept original ${relativePath}: ${error.message}`);
  }
}
