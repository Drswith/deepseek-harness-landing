import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const packageRoot = process.env.LAB_NODE_MODULES;
const require = createRequire(import.meta.url);
const resolvePackage = name => require.resolve(packageRoot ? path.join(path.resolve(packageRoot),name) : name);
const { PNG } = require(resolvePackage('pngjs'));
const { default: pixelmatch } = await import(resolvePackage('pixelmatch'));
const root = new URL('../RECON/',import.meta.url);
const results = [];
for (const width of [1440,768,390]) {
  const a = PNG.sync.read(await readFile(new URL(`screenshots/reference-${width}-static.png`,root)));
  const b = PNG.sync.read(await readFile(new URL(`screenshots/local-${width}-static.png`,root)));
  if(a.width!==b.width || a.height!==b.height) throw new Error(`Dimensions differ at ${width}`);
  const diff = new PNG({width:a.width,height:a.height});
  const changed = pixelmatch(a.data,b.data,diff.data,a.width,a.height,{threshold:0.1});
  await writeFile(new URL(`screenshots/diff-${width}.png`,root),PNG.sync.write(diff));
  results.push({width,height:a.height,changedPixels:changed,totalPixels:a.width*a.height,changedPercent:100*changed/(a.width*a.height),threshold:0.1,scope:'first viewport, canvas and scrollbars hidden on both sites for static-layer comparison; dynamic effects excluded'});
}
await writeFile(new URL('pixel-diff.json',root),JSON.stringify(results,null,2)+'\n');
console.log(results);
