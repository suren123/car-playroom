async page=>{
 const assert=(value,message)=>{if(!value)throw Error(message);};
 await page.unrouteAll({behavior:'wait'});
 const records=Array.from({length:12},(_,i)=>({id:`home-qa-${i}`,game:'sudoku',endedAt:'2026-11-01T00:00:00Z',completed:1,wrong:0,premature:0,hints:0,retries:0,pauses:0}));
 await page.route('**/api/records*',r=>r.fulfill({json:r.request().method()==='GET'?{epoch:0,records,hasMore:false}:{ok:true}}));
 await page.goto('http://127.0.0.1:5173/game');
 const sizes=[[744,900],[768,800],[768,900],[768,1024],[820,1180],[834,1194],[1024,1366],[1024,768]],results=[];
 for(const [width,height]of sizes){
  await page.setViewportSize({width,height});await page.waitForTimeout(150);
  const boxes=await page.locator('.hub-game-list button').evaluateAll(items=>items.map(e=>{const b=e.getBoundingClientRect();return {name:e.textContent,x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom,right:b.right,clipped:e.scrollHeight>e.clientHeight+1};}));
  assert(boxes.length===10,'missing game');assert(boxes.every(b=>b.x>=0&&b.y>=0&&b.bottom<=height&&b.right<=width&&b.height>=56&&!b.clipped),JSON.stringify({width,height,boxes}));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');results.push({width,height,cardHeight:boxes[0].height});
 }
 await page.setViewportSize({width:768,height:1024});await page.screenshot({path:'output/playwright/home-portrait.png'});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
 const swipe=async(x,y,dy)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+dy*i/12}]});await page.waitForTimeout(20);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);};
 const before=await page.locator('.hub-game-list').boundingBox();await swipe(350,750,-300);await swipe(384,750,-300);await page.mouse.wheel(0,500);
 assert(JSON.stringify(before)===JSON.stringify(await page.locator('.hub-game-list').boundingBox()),'home moved');assert(await page.evaluate(()=>scrollY===0),'document scrolled');
 await page.getByRole('button',{name:'家长',exact:true}).click();const panel=page.locator('.parent-panel');await panel.waitFor();
 await page.getByRole('button',{name:'陪玩记录',exact:true}).click();await page.locator('.record-list article').first().waitFor();
 await page.setViewportSize({width:768,height:800});const panelSize=await panel.evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight}));await swipe(450,650,-300);const panelTop=await panel.evaluate(e=>e.scrollTop);assert(panelSize.scroll>panelSize.height&&panelTop>0,'parent panel scroll blocked');
 await panel.evaluate(e=>e.scrollTop=0);
 await page.getByRole('button',{name:'关闭家长面板',exact:true}).click();
 await page.getByRole('button',{name:'看一看 · 想一想',exact:true}).click();await page.waitForURL('**/game?category=focus');await page.getByRole('button',{name:'汽车数独',exact:true}).click();await page.waitForURL('**/game/sudoku');await page.getByRole('button',{name:'返回',exact:true}).waitFor({timeout:60000});
 assert(await page.evaluate(()=>document.body.style.position==='fixed'),'selection scroll lock missing');await page.getByRole('button',{name:'返回',exact:true}).click();await page.waitForURL('**/game?category=focus');assert(await page.evaluate(()=>document.body.style.position==='fixed'),'home lock missing after return');
 await page.reload();await page.waitForFunction(()=>document.body.style.position==='fixed');assert(await page.getByRole('button',{name:'看一看 · 想一想',exact:true}).getAttribute('aria-pressed')==='true','filter lost');
 await page.getByRole('button',{name:'全部',exact:true}).click();await page.waitForURL('**/game');await cdp.detach();await page.unrouteAll({behavior:'wait'});
 return {passed:true,results,homeTouchAndWheelStable:true,parentPanel:{...panelSize,scrollTop:panelTop},filterRestored:true,selectionLocked:true};
}
