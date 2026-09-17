import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const artifact = 'site/harness/_next/static/chunks/app/[locale]/page-f752721b763e9f77.js';
const original = 'https://chat.deepseek.com/api/v0/ip_to_country_code';
const replacement = '/harness/lab-region.json';
const target = new URL(artifact, root);
const input = await readFile(target, 'utf8');
const count = input.split(original).length - 1;
if (count !== 1 && !input.includes(replacement)) throw new Error(`Expected one region request, got ${count}`);
const output = input.replace(original, replacement);
await writeFile(target, output);
await writeFile(new URL('site/harness/lab-region.json', root), JSON.stringify({
  code: 0, msg: '', data: { biz_code: 0, biz_msg: '', biz_data: { code: 'CN' } },
}) + '\n');
const hash = (value) => createHash('sha256').update(value).digest('hex');
if (count) await writeFile(new URL('RECON/localization.json', root), JSON.stringify({
  artifact, original, replacement, originalSha256: hash(input), localSha256: hash(output),
  reason: 'Keep the observed CN variant without an external geolocation request. The original response IP is intentionally not stored.',
}, null, 2) + '\n');
console.log(`Localized region request in ${fileURLToPath(target)}`);
