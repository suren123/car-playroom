async page=>{
 await page.unrouteAll({behavior:'wait'});
 await page.route('**/api/records*',r=>r.fulfill({json:r.request().method()==='GET'?{epoch:0,records:[],hasMore:false}:{ok:true}}));
 const results=[];
 for(const [width,height] of [[1024,768],[768,1024]]){
  await page.setViewportSize({width,height});
  for(const game of ['delivery','queue','repair']){
   await page.goto('http://127.0.0.1:5173/game/'+game+(game==='delivery'?'?step=cars':''));
   const cards=page.locator(game==='delivery'?'.dv-car-choice':'.ws-garage-cars button');
   await cards.first().waitFor({timeout:60000});
   const count=await cards.count();if(count!==(game==='repair'?6:20))throw Error(game+' car count '+count);
   if(game!=='repair'){
    await page.getByRole('button',{name:'特色车辆',exact:true}).click();
    if(await cards.count()!==2)throw Error('Special filter');
    await page.getByRole('button',{name:'全部车辆',exact:true}).click();
   }
   await page.screenshot({path:'output/playwright/expansion-'+game+'-cars-'+width+'.png',fullPage:true});
   results.push({game,width,count,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
   if(game==='queue'){
    await cards.filter({hasText:'校车'}).click();await page.getByRole('button',{name:'开始任务',exact:true}).click();
    const car=page.getByRole('button',{name:'安排校车',exact:true}),slot=page.locator('[data-queue-slot="0"]');
    const a=await car.boundingBox(),b=await slot.boundingBox();
    await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:14});await page.mouse.up();
    if(!await slot.locator('[data-illustration="schoolBus"]').count())throw Error('New school bus drag failed');
    await page.screenshot({path:'output/playwright/expansion-queue-drag-'+width+'.png'});
   }
  }
 }
 await page.unrouteAll({behavior:'wait'});return results;
}
