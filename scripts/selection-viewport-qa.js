async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);};await page.unrouteAll({behavior:'wait'});
 await page.route('**/api/records*',r=>r.fulfill({json:r.request().method()==='GET'?{epoch:0,records:[],hasMore:false}:{ok:true}}));
 const routes=['/game','/game/delivery','/game/delivery?step=levels','/game/delivery?step=cars',...['queue','repair','bridge','sort','traffic','listen','detour','sudoku','difference'].map(id=>'/game/'+id)];
 const sizes=[[744,900],[768,800],[768,1024],[1024,1366]],results=[];
 for(const route of routes){
  await page.setViewportSize({width:768,height:1024});await page.goto('http://127.0.0.1:5173'+route);
  await page.waitForFunction(()=>!document.querySelector('.game-preparation')&&document.body.style.position==='fixed',{},{timeout:60000});
  for(const [width,height]of sizes){await page.setViewportSize({width,height});await page.waitForFunction(h=>Math.abs(document.querySelector('main').getBoundingClientRect().height-h)<2,height);await page.waitForTimeout(100);
   const state=await page.evaluate(()=>{const root=document.querySelector('main');return {overflow:root.scrollHeight-root.clientHeight,width:document.documentElement.scrollWidth,buttons:[...root.querySelectorAll('button')].filter(e=>e.getClientRects().length&&!e.closest('.parent-panel,.game-orientation-notice')).map(e=>{const r=e.getBoundingClientRect();return {name:e.getAttribute('aria-label')||e.textContent,x:r.x,y:r.y,bottom:r.bottom,right:r.right,height:r.height,clipped:e.scrollHeight-e.clientHeight};})};});
   assert(state.overflow<=1&&state.width<=width&&state.buttons.every(b=>b.x>=0&&b.y>=0&&b.bottom<=height&&b.right<=width&&b.height>=56&&b.clipped<=1),JSON.stringify({route,width,height,state}));results.push({route,width,height,buttons:state.buttons.length});
  }
  if(route.endsWith('cars')||route.endsWith('queue')){
   const names=new Set(await page.locator('.paged-cars button').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label'))));
   // Visit every page, even when the remembered vehicle starts on a later page.
   while(await page.getByRole('button',{name:'上一页车辆',exact:true}).isEnabled())await page.getByRole('button',{name:'上一页车辆',exact:true}).click();
   for(;;){for(const name of await page.locator('.paged-cars button').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label'))))names.add(name);if(await page.getByRole('button',{name:'下一页车辆',exact:true}).isDisabled())break;await page.getByRole('button',{name:'下一页车辆',exact:true}).click();}
   assert(names.size===20,route+' missing paged vehicle');
   await page.getByRole('button',{name:'特色车辆',exact:true}).click();assert(await page.locator('.paged-cars button').count()===2,'filter count');
   await page.getByRole('button',{name:'全部车辆',exact:true}).click();assert(await page.locator('.paged-cars button').count()<=8,'page size');
   await page.setViewportSize({width:768,height:1024});await page.screenshot({path:'output/playwright/'+(route.endsWith('cars')?'delivery-cars-fixed':'queue-selection-fixed')+'.png'});
  }
 }
 await page.unrouteAll({behavior:'wait'});return {passed:true,screens:results.length,results};
}
