async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);};await page.unrouteAll({behavior:'wait'});await page.setViewportSize({width:768,height:1024});
 const posts=[],errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/records*',r=>{if(r.request().method()==='POST')posts.push(r.request().postDataJSON());return r.fulfill({json:r.request().method()==='GET'?{epoch:0,records:[],hasMore:false}:{ok:true}});});
 const open=async game=>{await page.goto('http://127.0.0.1:5173/game/'+game);await page.locator('.ws-levels button:enabled').first().waitFor({timeout:60000});};
 const back=async()=>{await page.waitForTimeout(500);await page.getByRole('button',{name:'返回',exact:true}).click();await page.waitForTimeout(500);if(await page.locator('.all-cars').count()&&!await page.locator('.ws-levels').count()){await page.getByRole('button',{name:'返回',exact:true}).click();await page.waitForTimeout(500);}await page.locator('.ws-levels').waitFor();};
 const automatic=[];
 for(const game of ['sort']){
  await open(game);assert(await page.locator('.vehicle-picker').count()===0,'unneeded selector '+game);assert(await page.getByRole('button',{name:'开始任务',exact:true}).count()===0,'extra start');
  for(let level=1;level<=3;level++){
   const before=posts.length;await page.locator('.ws-levels button').nth(level-1).evaluate(b=>{b.click();b.click();});await page.locator('.ws-interactive').waitFor();assert(posts.length===before,'duplicate begin submitted old round');
   await back();assert(posts.length===before+1,'end record count '+game);const record=posts.at(-1),p=JSON.parse(record.parameters);assert(p.level===level&&p.carSelection==='automatic'&&!record.completed,'incorrect automatic selection');automatic.push({game,level,car:p.car});
  }
 }

 const chosen=[];
 for(const game of ['queue','bridge','traffic','listen','detour']){
  await open(game);
  for(let level=1;level<=3;level++){
   const before=posts.length;await page.locator('.ws-levels button').nth(level-1).click();await page.locator('.all-cars').waitFor();await page.waitForTimeout(500);
   assert(await page.locator('.all-cars button').count()===20,'missing cars '+game);assert(posts.length===before,'choice created record');
   for(const [width,height]of [[768,800],[768,1024]]){await page.setViewportSize({width,height});await page.waitForTimeout(150);const box=await page.evaluate(()=>({overflow:document.querySelector('main').scrollHeight-document.querySelector('main').clientHeight,bad:[...document.querySelectorAll('.all-cars button')].some(b=>{const r=b.getBoundingClientRect();return r.bottom>innerHeight||r.height<56||r.right>innerWidth;})}));assert(box.overflow<2&&!box.bad,JSON.stringify({game,box}));}
   if(level===1)await page.screenshot({path:'output/playwright/restored-'+game+'-cars.png'});
   await page.getByRole('button',{name:'选择公交车',exact:true}).evaluate(b=>{b.click();b.click();});await page.locator('.ws-interactive').waitFor();assert(posts.length===before,'double start');
   if(level===1)assert(await page.locator('.ws-interactive [data-illustration="bus"],.ws-interactive [data-car-kind="bus"]').count()>0,'selected bus missing '+game);
   await back();assert(posts.length===before+1,'return record '+game);const p=JSON.parse(posts.at(-1).parameters);assert(p.car==='bus'&&p.carSelection==='chosen'&&p.level===level,'selected car metadata');chosen.push({game,level});
  }
 }
 await open('repair');await page.locator('.ws-levels button').last().click();assert(await page.locator('.repair-studio').count()===0,'repair difficulty started without car');
 for(const [id,name]of [['fire','消防车'],['ambulance','救护车'],['bus','公交车'],['truck','货车'],['digger','挖掘机'],['crane','吊车']]){
  const before=posts.length;await page.getByRole('button',{name:'选择'+name,exact:true}).evaluate(b=>{b.click();b.click();});await page.locator('.repair-car').waitFor();assert(await page.locator('.repair-car').getAttribute('data-master')===id,'stale repair car');await back();assert(posts.length===before+1,'repair double begin');const p=JSON.parse(posts.at(-1).parameters);assert(p.car===id&&p.level===3&&p.carSelection==='chosen','repair record mismatch');
 }
 await page.reload();await page.getByRole('button',{name:'选择吊车',exact:true}).waitFor();assert(await page.getByRole('button',{name:'选择吊车',exact:true}).getAttribute('aria-pressed')==='true','car preference lost');
 await open('queue');await page.locator('.ws-levels button').first().click();await page.waitForTimeout(500);await page.getByRole('button',{name:'选择公交车',exact:true}).click();await page.waitForTimeout(500);
 const order=await page.locator('.ws-ticket [data-illustration]').evaluateAll(es=>es.map(e=>e.dataset.illustration));for(const id of order)await page.locator('.ws-car-choice').filter({has:page.locator(`[data-illustration="${id}"]`)}).click();const beforeComplete=posts.length;await page.getByRole('button',{name:'排好出发',exact:true}).click();await page.locator('.ws-complete').waitFor();await page.waitForTimeout(200);assert(posts.length===beforeComplete+1&&posts.at(-1).completed,'completion once');await back();assert(posts.length===beforeComplete+1,'completion/back duplicate');
 await page.goto('http://127.0.0.1:5173/game?category=rules');await page.waitForFunction(()=>document.body.style.position==='fixed');await page.evaluate(()=>localStorage.setItem('car-playroom-delivery-v1',JSON.stringify({level:1,car:'delivery',tutorialSeen:false})));
 await page.getByRole('button',{name:'汽车快递站',exact:true}).click();await page.locator('.dv-level').first().waitFor({timeout:60000});assert(await page.locator('.dv-welcome').count()===0,'old welcome');await page.locator('.dv-level').nth(4).click();await page.locator('.all-cars').waitFor();assert(await page.locator('.all-cars button').count()===20,'cars missing');const beforeDelivery=posts.length;await page.getByRole('button',{name:'选择公交车',exact:true}).click();await page.locator('.dv-stage-car').waitFor();assert(await page.locator('.dv-stage-car [data-illustration="bus"]').count()===1,'delivery car wrong');assert(await page.locator('.dv-demo').count()===0,'forced demo');assert(posts.length===beforeDelivery,'delivery duplicate begin');
 await page.waitForTimeout(500);await page.getByRole('button',{name:'返回',exact:true}).click();await page.locator('.all-cars').waitFor();await page.waitForTimeout(500);assert(posts.length===beforeDelivery+1&&!posts.at(-1).completed,'delivery return');await page.getByRole('button',{name:'返回',exact:true}).click();await page.locator('.dv-level').first().waitFor();await page.waitForTimeout(500);await page.getByRole('button',{name:'返回',exact:true}).click();await page.waitForURL('**/game?category=rules');
 for(const suffix of ['', '?step=levels','?step=welcome']){await page.goto('http://127.0.0.1:5173/game/delivery'+suffix);await page.locator('.dv-level').first().waitFor({timeout:60000});assert(await page.locator('.dv-welcome').count()===0,'legacy welcome still exists');}
 assert(new Set(posts.map(p=>p.id)).size===posts.length,'duplicate record IDs');assert(errors.length===0,errors.join('\n'));await page.unrouteAll({behavior:'wait'});return {passed:true,automatic,chosen,repairCars:6,records:posts.length,legacyLinks:true,filterRestored:true,forcedDemoRemoved:true,errors};
}
