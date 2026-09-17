import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publishRoot = path.join(projectRoot, 'site');
const requiredFiles = [
  'index.html',
  'harness/index.html',
  'harness/en/index.html',
  'harness/privacy/index.html',
  'harness/data-processing/index.html',
  'harness/en/privacy/index.html',
  'harness/en/data-processing/index.html',
  'harness/_next/static/css/6f322bb0cffe2c36.css',
  'harness/videos/demo.mp4',
  'harness/lab-region.json',
];

for (const relativePath of requiredFiles) {
  const filePath = path.join(publishRoot, relativePath);
  const stats = await fs.stat(filePath);
  if (!stats.isFile() || stats.size === 0) {
    throw new Error(`Netlify publish input is empty or not a file: ${relativePath}`);
  }
}

const rootEntries = await fs.readdir(publishRoot, { withFileTypes: true });
const publishBytes = await sumFiles(publishRoot);
console.log(`Netlify static publish check passed: ${rootEntries.length} root entries, ${publishBytes} bytes in ${publishRoot}`);

async function sumFiles(directory) {
  let total = 0;
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      total += await sumFiles(entryPath);
    } else if (entry.isFile()) {
      total += (await fs.stat(entryPath)).size;
    } else {
      throw new Error(`Unsupported entry in Netlify publish directory: ${entryPath}`);
    }
  }
  return total;
}
