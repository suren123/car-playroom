async page=>{
 await page.unrouteAll({behavior:'wait'});
 await page.route('**/api/records*',r=>r.fulfill({json:r.request().method()==='GET'?{epoch:0,records:[],hasMore:false}:{ok:true}}));
 const results=[];
 for(const [width,height] of [[768,800],[768,1024]]){
  await page.setViewportSize({width,height});
  for(const game of ['delivery','repair']){
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

  }
 }
 await page.unrouteAll({behavior:'wait'});return results;
}
