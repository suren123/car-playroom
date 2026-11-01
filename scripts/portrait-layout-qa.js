async page=>{
 await page.unrouteAll({behavior:'wait'});await page.route('**/api/records*',r=>r.fulfill({json:r.request().method()==='GET'?{epoch:0,records:[],hasMore:false}:{ok:true}}));
 const results=[];await page.goto('http://127.0.0.1:5173/game');await page.evaluate(()=>{localStorage.setItem('car-playroom-delivery-v1',JSON.stringify({level:5,car:'delivery',tutorialSeen:true}));localStorage.setItem('car-playroom-delivery-choices-v1:local_seedy',JSON.stringify({cargoCount:4,destinationCount:4,extraCargo:8,extraStops:6}));});
 for(const [width,height] of [[744,900],[768,900],[768,1024],[820,1180],[834,1194],[1024,1366]]){
  await page.setViewportSize({width,height});
  for(const game of ['queue','bridge','sort','repair','traffic','listen','detour','sudoku','difference','delivery']){
   await page.goto('http://127.0.0.1:5173/game/'+game+(game==='delivery'?'?step=cars':''));await page.locator('.town-header').waitFor({timeout:60000});
   if(game==='sudoku')await page.locator('.sudoku-size-cards>button').last().click();
   else if(game==='difference')await page.locator('.spot-level-cards>button').last().click();
   else if(game==='delivery')await page.getByRole('button',{name:'选择消防车',exact:true}).click();
   else {await page.locator('.ws-levels>button').last().click();await page.getByRole('button',{name:'开始任务',exact:true}).click();}
   await page.waitForTimeout(100);
   const measure=await page.evaluate(()=>{
    const root=document.querySelector('main'),visible=e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[aria-hidden=true]');};
    const bad=[...root.querySelectorAll('button')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.x<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5||r.top<-.5||r.width<55.9||r.height<55.9;}).map(e=>({name:e.getAttribute('aria-label')||e.textContent,r:e.getBoundingClientRect().toJSON()}));
    return {fixed:root.classList.contains('game-viewport'),height:root.scrollHeight,client:root.clientHeight,bad,board:[...root.querySelectorAll('.ws-board,.sudoku-grid,.spot-boards')].map(e=>({cls:e.className,r:e.getBoundingClientRect().toJSON()}))};
   });
   results.push({game,width,height,...measure});if(width===744)await page.screenshot({path:`output/playwright/portrait-${game}-744.png`});
  }
 }
 return results;
}
