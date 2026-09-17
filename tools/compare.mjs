// Execute through ego-browser nodejs; both pages stay in the existing TaskSpace.
const fs = await import('node:fs/promises');
const path = await import('node:path');
const root = path.resolve(process.env.LAB_ROOT || process.cwd());
const spaceId = Number(process.env.LAB_SPACE_ID);
if (!Number.isSafeInteger(spaceId) || spaceId < 1) throw new Error('Set LAB_SPACE_ID to an active ego-browser TaskSpace ID.');
const task = await taskSpace(spaceId);
const referencePage = process.env.LAB_REFERENCE_PAGE || 'p1';
const localPage = process.env.LAB_LOCAL_PAGE || 'p2';
const results = [];
async function settled(page) {
  await page.waitForFunction(() => {
    if (document.fonts.status !== 'loaded') return false;
    const ancestors = new Set();
    for (const heading of document.querySelectorAll('main h1,main h2')) {
      const r = heading.getBoundingClientRect();
      if (!r.width || !r.height || r.top >= innerHeight || r.bottom <= 0) continue;
      let n = heading;
      while (n && n.tagName !== 'MAIN') { ancestors.add(n); n = n.parentElement; }
    }
    return [...ancestors].every(n => { const s = getComputedStyle(n); return ['none','blur(0px)'].includes(s.filter) && s.opacity === '1'; });
  }, undefined, { timeout: 15000 });
}
for (const [width,height] of [[1440,1000],[768,1024],[390,844]]) {
  const pair = {};
  for (const [kind,label,origin] of [['reference',referencePage,'https://www.deepseek.com'],['local',localPage,'http://127.0.0.1:43879']]) {
    const page = task.page(label);
    await page.cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await page.goto(`${origin}/harness/`);
    await page.waitForFunction(() => document.querySelectorAll('canvas').length >= 3);
    await settled(page);
    await page.screenshot({path:`${root}/RECON/screenshots/${kind}-${width}-live.png`});
    await page.evaluate(() => {
      const style = document.createElement('style'); style.id = 'lab-screenshot-mask';
      style.textContent = 'canvas{visibility:hidden!important} ::-webkit-scrollbar{display:none!important}';
      document.head.append(style);
    });
    await page.screenshot({path:`${root}/RECON/screenshots/${kind}-${width}-static.png`});
    await page.evaluate(() => document.getElementById('lab-screenshot-mask').remove());
    // Trigger every viewport-entry animation, waiting for its visible elements to settle.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y=0;y<total;y+=height*0.8) {
      await page.evaluate(y => scrollTo({top:y,behavior:'instant'}),y);
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      await settled(page);
    }
    await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
    await settled(page);
    await page.screenshot({path:`${root}/RECON/screenshots/${kind}-${width}-full.png`,fullPage:true});
    const data = await page.evaluate(() => {
      const describe = el => {const s=getComputedStyle(el),r=el.getBoundingClientRect();return {text:el.querySelector('h1,h2')?.textContent,font:s.font,color:s.color,width:r.width,height:r.height,left:r.left};};
      return {title:document.title,h1:document.querySelector('h1').textContent,viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth,
        sections:[...document.querySelectorAll('section')].map(describe),fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family).sort(),
        images:[...document.images].map(i=>({path:new URL(i.currentSrc).pathname,w:i.naturalWidth,h:i.naturalHeight})),
        canvasCount:document.querySelectorAll('canvas').length,
        failures:performance.getEntriesByType('resource').filter(r=>r.responseStatus>=400).map(r=>({url:r.name,status:r.responseStatus})),
        external:performance.getEntriesByType('resource').filter(r=>new URL(r.name).origin!==location.origin).map(r=>r.name)};
    });
    pair[kind]=data;
    await fs.writeFile(`${root}/RECON/${kind}-${width}-verified.json`,JSON.stringify(data,null,2)+'\n');
    console.log({kind,width,sections:data.sections.length,canvases:data.canvasCount,failures:data.failures,external:data.external,overflow:data.overflow});
  }
  results.push({width,geometryEqual:JSON.stringify(pair.reference.sections)===JSON.stringify(pair.local.sections),fontsEqual:JSON.stringify(pair.reference.fonts)===JSON.stringify(pair.local.fonts),imagesEqual:JSON.stringify(pair.reference.images)===JSON.stringify(pair.local.images),...pair});
  await fs.writeFile(`${root}/RECON/comparison.json`,JSON.stringify(results,null,2)+'\n');
}
console.log(results.map(({width,geometryEqual,fontsEqual,imagesEqual})=>({width,geometryEqual,fontsEqual,imagesEqual})));
