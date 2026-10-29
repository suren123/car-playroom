// Local browser acceptance: scope cache cleanup to the game's dedicated cache.
async page=>{
 await page.unrouteAll({behavior:'wait'});let posts=0,mode='normal',fetches=0,late=0;
 await page.addInitScript(()=>{
  const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL),live=new Set();
  window.__assetQA={live,created:0,released:0};
  URL.createObjectURL=(blob)=>{const url=create(blob);live.add(url);window.__assetQA.created++;return url;};
  URL.revokeObjectURL=(url)=>{if(live.delete(url))window.__assetQA.released++;revoke(url);};
 });
 await page.route('**/api/records*',r=>{if(r.request().method()==='POST')posts++;return r.fulfill({json:r.request().method()==='GET'?{epoch:0,records:[],hasMore:false}:{ok:true}});});
 await page.route('**/*',async r=>{
  if(/\.(png|mp3|wav)\?v=/.test(r.request().url())){
   fetches++;if(mode==='fail')return r.fulfill({status:404,body:'test missing asset'});
   if(mode==='slow'){await page.waitForTimeout(1600);late++;}
  }return r.fallback();
 });
 await page.goto('http://127.0.0.1:5173/game');await page.locator('.hub-game-list button').first().waitFor();await page.waitForFunction(()=>!!document.querySelector('.hub-game-list button')?.onclick);
 await page.evaluate(()=>caches.delete('car-playroom-resources-v1'));
 mode='fail';await page.getByRole('button',{name:'修车小师傅',exact:true}).click();
 await page.getByRole('heading',{name:'有些资源没有准备好',exact:true}).waitFor({timeout:60000});
 if(await page.locator('.workshop').count()||posts)throw Error('Failed preload mounted game or recorded a round');
 await page.screenshot({path:'output/playwright/premium-preload-failure.png'});
 mode='normal';await page.getByRole('button',{name:'重试',exact:true}).click();await page.getByRole('button',{name:'开始任务',exact:true}).waitFor({timeout:60000});
 const prepared=await page.evaluate(()=>window.__assetQA.live.size);if(prepared===0)throw Error('No prepared media');
 await page.getByRole('button',{name:'返回',exact:true}).click();await page.locator('.hub-game-list button').first().waitFor();
 await page.waitForTimeout(100);if(await page.evaluate(()=>window.__assetQA.live.size))throw Error('Resource retained after return');
 await page.evaluate(()=>caches.delete('car-playroom-resources-v1'));mode='slow';
 await page.getByRole('button',{name:'汽车数独',exact:true}).click();await page.locator('.game-preparation').waitFor();
 await page.getByRole('button',{name:'返回',exact:true}).click();await page.locator('.hub-game-list button').first().waitFor();
 await page.waitForTimeout(1900);if(await page.locator('.sudoku-game').count()||await page.evaluate(()=>window.__assetQA.live.size))throw Error('Cancelled preload reopened or leaked');
 mode='normal';
 const names=['汽车快递站','汽车数独','找不同','小汽车排队','一起修桥','汽车分类','修车小师傅','红绿灯小司机','小汽车听指挥','道路施工改道'],cycles=[];
 for(let cycle=0;cycle<2;cycle++)for(const name of names){
  const before=fetches,started=Date.now();await page.getByRole('button',{name,exact:true}).click();
  await page.locator('.town-header').waitFor({timeout:60000});
  const live=await page.evaluate(()=>window.__assetQA.live.size);
  if(!live)throw Error('Missing prepared resources: '+name);
  await page.getByRole('button',{name:'返回',exact:true}).click();await page.locator('.hub-game-list button').first().waitFor();await page.waitForTimeout(80);
  const state=await page.evaluate(()=>({live:window.__assetQA.live.size,animations:document.querySelector('main')?.getAnimations({subtree:true}).filter(a=>a.playState==='running').length??0,heap:performance.memory?.usedJSHeapSize}));
  if(state.live)throw Error('Resource leak: '+name);
  cycles.push({name,cycle,prepared:live,downloads:fetches-before,elapsedMs:Date.now()-started,...state});
 }
 // Finish loading while hidden: resource gate must wait before mounting a game.
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.getByRole('button',{name:'汽车数独',exact:true}).click();await page.getByText('准备好了，回来就能玩。',{exact:true}).waitFor();
 if(await page.locator('.town-header').count())throw Error('Hidden page entered game');
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.locator('.town-header').waitFor();
 await page.getByRole('button',{name:'返回',exact:true}).click();await page.locator('.hub-game-list button').first().waitFor();
 const totals=await page.evaluate(()=>({created:window.__assetQA.created,released:window.__assetQA.released,live:window.__assetQA.live.size}));
 await page.unrouteAll({behavior:'wait'});if(posts)throw Error('Preparation created records');
 return {failureRetry:true,cancelledLateResponses:late,hiddenGate:true,posts,cycles,totals,userAgent:await page.evaluate(()=>navigator.userAgent)};
}
