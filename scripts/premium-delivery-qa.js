async page=>{
 const width=1024,height=768,level=8;
 await page.unrouteAll({behavior:'wait'});await page.setViewportSize({width,height});
 const posts=[],errors=[],states=[];let blockedMedia=false,lateMedia=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/records*',r=>{if(r.request().method()==='POST')posts.push(r.request().postDataJSON());return r.fulfill({json:r.request().method()==='GET'?{epoch:0,records:[],hasMore:false}:{ok:true}});});
 await page.route('**/*',r=>{if(blockedMedia&&/\.(png|mp3|wav)(\?|$)/.test(r.request().url())){lateMedia++;return r.abort();}return r.fallback();});
 await page.goto('http://127.0.0.1:5173/game/delivery?step=levels');await page.locator('.dv-level').first().waitFor({timeout:60000});blockedMedia=true;
 await page.screenshot({path:`output/playwright/premium-delivery-${width}-${level}-selection.png`});await page.locator('.dv-level').nth(level-1).click();await page.getByRole('button',{name:'选择消防车',exact:true}).click();
 if(await page.getByRole('button',{name:'我来试试',exact:true}).count())await page.getByRole('button',{name:'我来试试',exact:true}).click();
 let cargo=[],stops=[],stopIndex=0,orders=0,wrong=false,paused=false;
 for(let guard=0;guard<100;guard++){
  const phase=await page.locator('.dv-game-top h1').innerText();
  const metrics=await page.evaluate(()=>({h:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth,buttonBottom:Math.max(...[...document.querySelectorAll('.dv-workspace button,.dv-actions button')].map(b=>b.getBoundingClientRect().bottom),0)}));states.push({phase,...metrics});
  if(await page.locator('.dv-finished').count())break;
  if(phase==='看看订单'){
   cargo=await page.locator('.dv-order-items small').allTextContents();stops=await page.locator('.dv-route-stops strong').allTextContents();stopIndex=0;orders++;
   await page.screenshot({path:`output/playwright/premium-delivery-${width}-${level}-order.png`});await page.getByRole('button',{name:'记好了',exact:false}).click();
  }else if(phase==='把货物装上车'){
   if(!cargo.length)cargo=await page.locator('.dv-order-items small').allTextContents();
   if([3,4,6,7,8].includes(level)&&await page.locator('.dv-order-group').count())throw Error('Memory task exposed order while loading');
   if(!wrong){const options=await page.locator('.dv-item').allTextContents(),bad=options.findIndex(s=>!cargo.some(c=>s.trim()===c));if(bad>=0){await page.locator('.dv-item').nth(bad).click();await page.screenshot({path:`output/playwright/premium-delivery-${width}-${level}-error.png`});wrong=true;}}
   for(const name of cargo){const button=page.getByRole('button',{name,exact:true});if(await button.count()&&!await button.isDisabled()){await button.click();await page.waitForTimeout(650);}}
  }else if(phase==='准备出发')await page.getByRole('button',{name:'小车出发',exact:false}).click();
  else if(phase==='去哪个站？'){await page.locator('.dv-stop').filter({hasText:stops[stopIndex++]}).click();}
  else if(phase==='小车出发啦'){
   if(!paused){await page.getByRole('button',{name:'休息',exact:true}).click();await page.waitForTimeout(450);await page.getByRole('button',{name:'恢复游戏',exact:true}).click();paused=true;}
   await page.waitForTimeout(1600);
  }else if(phase==='货物到站啦'){await page.getByRole('button',{name:'把货物送到',exact:false}).click();await page.waitForTimeout(900);await page.screenshot({path:`output/playwright/premium-delivery-${width}-${level}-arrived.png`});}
  else if(phase==='还剩哪一件？')await page.getByRole('button',{name:cargo[1],exact:true}).click();
  else if(phase==='送到了！'){await page.getByRole('button',{name:orders===3?'小车回库':'下一次配送',exact:false}).click();cargo=[];}
  else throw Error('Unexpected delivery phase: '+phase);
 }
 await page.locator('.dv-finished').waitFor();await page.waitForTimeout(3200);
 await page.screenshot({path:`output/playwright/premium-delivery-${width}-${level}-complete.png`});
 const final=await page.evaluate(()=>({height:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...document.querySelectorAll('.dv-finished button')].every(b=>b.getBoundingClientRect().bottom<=innerHeight)}));
 await page.getByRole('button',{name:'家长面板',exact:true}).click();await page.getByRole('button',{name:'关闭家长面板',exact:true}).click();if(!await page.locator('.dv-finished').count())throw Error('Delivery result lost');
 await page.getByRole('button',{name:'返回',exact:true}).click();await page.locator('.dv-car-choice').first().waitFor();await page.waitForTimeout(600);
 await page.unrouteAll({behavior:'wait'});return {width,level,orders,wrong,paused,states,final,posts:posts.length,completed:posts.filter(p=>p.completed).length,unique:new Set(posts.map(p=>p.id)).size,lateMedia,errors};
}
