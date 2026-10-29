// Run via playwright-cli run-code; only use rendered instructions and controls.
async (page) => {
 page.setDefaultTimeout(15000);
 const posts=[],errors=[];let lateMedia=0,blockMedia=false;
 page.on('pageerror',e=>errors.push(e.message));
 await page.unrouteAll({behavior:'wait'});
 await page.route('**/api/records*',r=>{if(r.request().method()==='POST')posts.push(r.request().postDataJSON());return r.fulfill({json:r.request().method()==='GET'?{epoch:0,records:[],hasMore:false}:{ok:true}});});
 await page.route('**/*',r=>{if(blockMedia&&/\.(png|mp3|wav)(\?|$)/.test(r.request().url())){lateMedia++;return r.abort();}return r.fallback();});
 const cases=[];
 for(const [width,height,car,name,level] of [[1024,768,'fire','消防车','挑战'],[768,1024,'bus','公交车','挑战'],[1024,768,'ambulance','救护车','练习'],[1024,768,'truck','货车','挑战'],[768,1024,'digger','挖掘机','挑战'],[768,1024,'crane','吊车','挑战']]){
  await page.setViewportSize({width,height});
  if(await page.locator('.repair-studio').count())await page.getByRole('button',{name:'换挑战',exact:true}).click();
  await page.getByRole('button',{name:'开始任务',exact:false}).waitFor();
  await page.getByRole('button',{name:`选择${name}`,exact:true}).click();
  await page.getByRole('button',{name:level,exact:false}).first().click();
  await page.waitForTimeout(200);
  await page.screenshot({path:`output/playwright/premium-repair-${car}-selection-${width}.png`});
  blockMedia=true;
  await page.getByRole('button',{name:'开始任务',exact:false}).click();
  await page.locator('.repair-studio').waitFor();
  const identity=await page.locator('.repair-car').getAttribute('data-master');if(identity!==car)throw Error('Selected car identity changed');
  await page.screenshot({path:`output/playwright/premium-repair-${car}-play-${width}.png`});
  let steps=0;
  while(await page.locator('.repair-studio').getAttribute('data-phase')!=='test'){
   if(++steps>5)throw Error('Repair did not advance');
   const instruction=await page.locator('.repair-workbench h2').innerText();
   const tool=instruction.includes('脏了')?'擦布':instruction.includes('车灯')||instruction.includes('机身盖板')?'螺丝刀':'扳手';
   if(steps===1){await page.getByRole('button',{name:tool==='擦布'?'扳手':'擦布',exact:true}).click();await page.screenshot({path:`output/playwright/premium-repair-${car}-error-${width}.png`});}
   await page.getByRole('button',{name:tool,exact:true}).click();
   if(await page.locator('.repair-studio').getAttribute('data-phase')==='part'){
    await page.getByRole('button',{name:car==='digger'?'履带轮 2':'轮胎 2',exact:true}).click();
    await page.getByRole('button',{name:car==='digger'?'履带轮 1':'轮胎 1',exact:true}).click();
   }
   await page.locator('.repair-target-ready').click();
   if(car==='fire'&&steps===1){await page.waitForTimeout(250);await page.getByRole('button',{name:'休息',exact:true}).click();const phase=await page.locator('.repair-studio').getAttribute('data-phase');await page.waitForTimeout(1100);if(await page.locator('.repair-studio').getAttribute('data-phase')!==phase)throw Error('Repair advanced while paused');await page.getByRole('button',{name:'恢复游戏',exact:true}).click();}
   await page.waitForTimeout(1100);
  }
  await page.getByRole('button',{name:'出库试车',exact:true}).click();
  await page.waitForTimeout(650);
  await page.screenshot({path:`output/playwright/premium-repair-${car}-drive-${width}.png`});
  await page.waitForTimeout(2600);
  await page.screenshot({path:`output/playwright/premium-repair-${car}-complete-${width}.png`});
  const measurements=await page.locator('.workshop').evaluate(root=>({overflow:document.documentElement.scrollWidth>innerWidth,small:[...root.querySelectorAll('button span,h1,h2,.repair-checklist span,.ws-outcome p')].filter(e=>e.getBoundingClientRect().width>0&&e.textContent.trim()&&parseFloat(getComputedStyle(e).fontSize)<18).map(e=>[e.textContent,getComputedStyle(e).fontSize]),below:[...root.querySelectorAll('.ws-outcome button')].filter(e=>e.getBoundingClientRect().bottom>innerHeight).map(e=>e.textContent)}));
  if(measurements.overflow||measurements.small.length||measurements.below.length)throw Error(JSON.stringify({car,width,...measurements}));
  cases.push({car,width,steps,...measurements});
 }
 await page.unrouteAll({behavior:'wait'});
 if(new Set(posts.map(p=>p.id)).size!==posts.length)throw Error('Duplicate round submission');
 return {cases,records:posts.map(p=>({id:p.id,completed:p.completed,pauses:p.pauses})),errors,lateMedia};
}
