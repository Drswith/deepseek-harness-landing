import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../',import.meta.url);
const manifest = JSON.parse(await readFile(new URL('RECON/asset-manifest.json',root),'utf8'));
const local = JSON.parse(await readFile(new URL('RECON/localization.json',root),'utf8'));
const assets = [];
for (const item of manifest) {
  assert.equal(item.error,undefined);
  const bytes = await readFile(new URL(`site/${item.path}`,root));
  const hash = createHash('sha256').update(bytes).digest('hex');
  const patched = `site/${item.path}` === local.artifact;
  assert.equal(hash,patched ? local.localSha256 : item.sha256,item.path);
  const response = await fetch(`http://127.0.0.1:43879/${item.path}`,{method:'HEAD'});
  assert.equal(response.status,200,item.path);
  assert.equal(Number(response.headers.get('content-length')),bytes.length,item.path);
  assets.push({path:item.path,bytes:bytes.length,sha256:hash,patched,status:response.status,mime:response.headers.get('content-type')});
}
const checks = [];
async function probe(path,options,expectedStatus) {
  const r=await fetch(`http://127.0.0.1:43879${path}`,options);
  assert.equal(r.status,expectedStatus,path);
  checks.push({path,method:options.method||'GET',range:options.headers?.Range,status:r.status,contentRange:r.headers.get('content-range')});
  return r;
}
const part=await probe('/harness/videos/demo.mp4',{headers:{Range:'bytes=0-1023'}},206);
assert.equal((await part.arrayBuffer()).byteLength,1024);
assert.equal(part.headers.get('content-type'),'video/mp4');
await probe('/harness/videos/demo.mp4',{method:'HEAD',headers:{Range:'bytes=999999999-'}},416);
await probe('/harness/not-a-file',{method:'HEAD'},404);
await probe('/harness/%2e%2e%2fREADME.md',{method:'HEAD'},404);
await probe('/harness/lab-region.json',{method:'HEAD'},200);
await probe('/',{method:'HEAD',redirect:'manual'},308);
const result={assets:assets.length,unmodified:assets.filter(x=>!x.patched).length,modified:assets.filter(x=>x.patched).length,checks,files:assets};
await writeFile(new URL('RECON/server-audit.json',root),JSON.stringify(result,null,2)+'\n');
console.log({assets:result.assets,unmodified:result.unmodified,modified:result.modified,checks});
