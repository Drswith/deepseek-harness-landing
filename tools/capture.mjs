// Run through ego-browser with LAB_ROOT and a current LAB_SPACE_ID.
const fs = await import('node:fs/promises');
const path = await import('node:path');
const crypto = await import('node:crypto');
const root = path.resolve(process.env.LAB_ROOT || process.cwd());
const spaceId = Number(process.env.LAB_SPACE_ID);
if (!Number.isSafeInteger(spaceId) || spaceId < 1) throw new Error('Set LAB_SPACE_ID to an active ego-browser TaskSpace ID.');
const task = await taskSpace(spaceId);
const page = task.page(process.env.LAB_REFERENCE_PAGE || 'p1');
const urls = new Set();
const manifest = [];
const routes = [];
await fs.mkdir(`${root}/RECON/screenshots`, { recursive: true });
async function collect() {
  const data = await page.evaluate(() => {
    const all = [...performance.getEntriesByType('resource').map(x => x.name)];
    for (const s of document.styleSheets) {
      try { for (const rule of s.cssRules) for (const m of rule.cssText.matchAll(/url\(["']?([^"')]+)["']?\)/g)) all.push(new URL(m[1], s.href || location.href).href); } catch {}
    }
    for (const x of document.querySelectorAll('[src],[poster],link[href]')) {
      for (const k of ['src','poster','href']) if (x.getAttribute(k)) all.push(new URL(x.getAttribute(k), location.href).href);
    }
    const style = el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return { font: s.font, color: s.color, background: s.backgroundColor, border: s.borderColor, top: r.top + scrollY, left: r.left, width: r.width, height: r.height }; };
    return { url: location.href, viewport: [innerWidth, innerHeight], height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth,
      title: document.title, h1: document.querySelector('h1')?.textContent, text: document.body.innerText,
      sections: [...document.querySelectorAll('section')].map((n, index) => ({index, heading: n.querySelector('h1,h2')?.textContent, ...style(n)})),
      headings: [...document.querySelectorAll('h1,h2,h3')].filter(n => n.getBoundingClientRect().height).map(n=>({text:n.textContent,...style(n)})),
      images: [...document.images].map(n => ({src:n.currentSrc,alt:n.alt,width:n.naturalWidth,height:n.naturalHeight})),
      canvasCount: document.querySelectorAll('canvas').length,
      variables: Object.fromEntries([...getComputedStyle(document.documentElement)].filter(k=>k.startsWith('--ds-')).map(k=>[k,getComputedStyle(document.documentElement).getPropertyValue(k)])),
      links: [...document.querySelectorAll('a[href]')].map(n=>({text:n.textContent.trim(),href:n.href})), resources: [...new Set(all)] };
  });
  for(const u of data.resources) if (u.startsWith('https://www.deepseek.com/harness/')) {const n=new URL(u); n.search='';n.hash='';urls.add(n.href);}
  return data;
}
async function scrollReveal() {
  const height=await page.evaluate(()=>document.documentElement.scrollHeight);
  for(let y=0;y<height;y+=650) {
    await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  }
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
}
for(const [width,height] of [[1440,1000],[768,1024],[390,844]]) {
  await page.cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await page.goto('https://www.deepseek.com/harness/');
  await page.waitForFunction(()=>document.fonts.status==='loaded'&&document.querySelectorAll('canvas').length>=3);
  await scrollReveal();
  await page.screenshot({path:`${root}/RECON/screenshots/original-${width}.png`});
  const data=await collect();
  await fs.writeFile(`${root}/RECON/original-${width}.json`,JSON.stringify(data,null,2));
  await page.screenshot({path:`${root}/RECON/screenshots/original-full-${width}.png`,fullPage:true});
  console.log({width,height: data.height,resources:urls.size});
}
await page.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
for(const route of ['/harness/','/harness/en/','/harness/privacy/','/harness/data-processing/']) {
  await page.goto(`https://www.deepseek.com${route}`);
  await page.waitForFunction(()=>document.fonts.status==='loaded');
  await scrollReveal();
  const data=await collect();
  routes.push({path:route,title:data.title,h1:data.h1,links:data.links});
  urls.add(`https://www.deepseek.com${route}`);
  // Next static export's router uses index.txt flight payloads; collect the observed prefetch payloads too.
  await fs.writeFile(`${root}/RECON/route-${route.replace(/\//g,'_')}.json`,JSON.stringify(data,null,2));
  console.log({route,resources:urls.size});
}
await fs.writeFile(`${root}/RECON/routes.json`,JSON.stringify(routes,null,2));
await fs.writeFile(`${root}/RECON/asset-urls.json`,JSON.stringify([...urls],null,2));
// Fetch via the same browser networking stack (system proxy and referrer included).
for(const url of urls) {
  let relative=decodeURIComponent(new URL(url).pathname).replace(/^\//,'');
  if(relative.endsWith('/')) relative+='index.html';
  const dest=path.join(root,'site',relative);
  await fs.mkdir(path.dirname(dest),{recursive:true});
  try {
    const r=await page.fetch(url,{saveAs:dest,timeout:45000});
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const b=await fs.readFile(dest);
    manifest.push({url,path:relative,status:r.status,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});
    console.log('saved',relative,b.length);
  } catch(e) {manifest.push({url,path:relative,error:e.message});console.log('FAILED',url,e.message);}
  await fs.writeFile(`${root}/RECON/asset-manifest.json`,JSON.stringify(manifest,null,2));
}
await page.goto('https://www.deepseek.com/harness/');
console.log({assets:manifest.length,failed:manifest.filter(x=>x.error).length});
