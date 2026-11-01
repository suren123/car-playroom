async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);};await page.unrouteAll({behavior:'wait'});
 const posts=[];await page.route('**/api/records*',r=>{if(r.request().method()==='POST')posts.push(r.request().postDataJSON());return r.fulfill({json:r.request().method()==='GET'?{epoch:0,records:[],hasMore:false}:{ok:true}});});
 await page.setViewportSize({width:768,height:1024});await page.goto('http://127.0.0.1:5173/game/repair');await page.locator('.vehicle-picker').waitFor({timeout:60000});
 await page.evaluate(()=>{window.testClicks=[];document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b)window.testClicks.push(b.getAttribute('aria-label')||b.textContent);});});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
 const send=(type,points=[])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 const touch=async(button,{hold=100,drift=0,cancel=false,multi=false,blur=false}={})=>{
  const b=await button.boundingBox(),x=b.x+b.width/2,y=b.y+b.height/2;await send('touchStart',[{x,y,id:0}]);
  await page.waitForTimeout(hold);if(multi)await send('touchStart',[{x,y,id:0},{x:x+40,y:y+30,id:1}]);
  if(blur)await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  if(drift)for(let i=1;i<=4;i++){await send('touchMove',[{x:x+drift*i/4,y,id:0}]);await page.waitForTimeout(25);}
  await send(cancel?'touchCancel':'touchEnd');await page.waitForTimeout(100);
 };
 const button=page.locator('.ws-levels button').nth(1);
 const trials=[];
 for(const hold of [100,800,2000])for(const drift of [0,12,22]){
  await page.evaluate(()=>window.testClicks=[]);await touch(button,{hold,drift});const clicks=await page.evaluate(()=>window.testClicks);assert(clicks.length===1&&clicks[0].includes('练习'),JSON.stringify({hold,drift,clicks}));trials.push({hold,drift,count:clicks.length});
 }
 for(const args of [{drift:45},{drift:190},{cancel:true},{multi:true},{blur:true}]){await page.evaluate(()=>window.testClicks=[]);await touch(button,args);assert((await page.evaluate(()=>window.testClicks)).length===0,'cancelled gesture activated '+JSON.stringify(args));}
 await page.evaluate(()=>window.testClicks=[]);await touch(button);await touch(button);assert((await page.evaluate(()=>window.testClicks)).length===2,'distinct taps suppressed');
 await page.evaluate(()=>window.testClicks=[]);await button.click();assert((await page.evaluate(()=>window.testClicks)).length===1,'mouse broken');await button.focus();await page.keyboard.press('Enter');assert((await page.evaluate(()=>window.testClicks)).length===2,'keyboard broken');
 const before=await page.locator('.vehicle-picker').boundingBox();const b=await page.locator('.all-cars button').first().boundingBox();await send('touchStart',[{x:b.x+30,y:b.y+30}]);await send('touchMove',[{x:b.x+30,y:b.y+230}]);await send('touchEnd');await page.mouse.wheel(0,600);assert(JSON.stringify(before)===JSON.stringify(await page.locator('.vehicle-picker').boundingBox()),'selection scrolled');
 assert(posts.length===0,'selection created record');
 await page.goto('http://127.0.0.1:5173/game/delivery?step=cars');await page.locator('.vehicle-picker').waitFor({timeout:60000});
 await touch(page.getByRole('button',{name:'选择消防车',exact:true}),{hold:1500,drift:22});await page.locator('.dv-stage-car').waitFor();assert(await page.locator('.dv-stage-car [data-illustration="fire"]').count()===1,'wrong car started');
 await cdp.detach();await page.unrouteAll({behavior:'wait'});return {passed:true,trials,cancelledGestures:5,mouseAndKeyboard:true,selectionNoScroll:true,preparationRecords:posts.length,deliveryLongPressStarted:true};
}
