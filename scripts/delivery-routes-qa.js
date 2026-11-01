async page=>{
 const assert=(value,message)=>{if(!value)throw Error(message);};
 await page.unrouteAll({behavior:'wait'});await page.emulateMedia({reducedMotion:'reduce'});
 const posts=[],errors=[],checks=[];let blocked=false,lateMedia=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/records*',r=>{if(r.request().method()==='POST')posts.push(r.request().postDataJSON());return r.fulfill({json:r.request().method()==='GET'?{epoch:0,records:[],hasMore:false}:{ok:true}});});
 await page.route('**/*',r=>{if(blocked&&/\.(png|mp3|wav)(\?|$)/.test(r.request().url())){lateMedia++;return r.abort();}return r.fallback();});
 const screen=async(name)=>{await page.screenshot({path:`output/playwright/delivery-choices-${name}.png`});};
 const metrics=async(name)=>{
  const value=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...document.querySelectorAll('.dv-workspace button,.dv-actions button')].map(el=>{const r=el.getBoundingClientRect();return {label:el.textContent,width:r.width,height:r.height,bottom:r.bottom};})}));
  assert(!value.overflow,name+' horizontal overflow');
  assert(value.buttons.every(b=>b.width>=56&&b.height>=56),name+' small touch targets '+JSON.stringify(value));
  assert(value.buttons.every(b=>b.bottom<=page.viewportSize().height),name+' buttons below viewport '+JSON.stringify(value));checks.push({name,...value});
 };
 const configure=async(cargo,stops)=>{
  await page.getByRole('button',{name:'家长面板',exact:true}).click();
  await page.getByRole('button',{name:'小挑战',exact:false}).click();
  for(const [label,target] of [['额外货物',cargo],['额外目的地',stops]]){
   let value=Number((await page.getByLabel(label+'数量',{exact:true}).innerText()).replace(/\D/g,''));
   while(value!==target){await page.getByRole('button',{name:(value<target?'增加':'减少')+label,exact:true}).click();value+=value<target?1:-1;}
   assert(Number((await page.getByLabel(label+'数量',{exact:true}).innerText()).replace(/\D/g,''))===target,'stepper value');
  }
  await screen(`settings-${page.viewportSize().width}-${cargo}-${stops}`);
  await page.getByRole('button',{name:'关闭家长面板',exact:true}).click();
 };
 // Complete every task at maximum alternatives in both screen orientations.
 for(const width of [744])for(let level=1;level<=8;level++){
  const height=900;await page.setViewportSize({width,height});blocked=false;
  await page.goto('http://127.0.0.1:5173/game/delivery?step=levels');await page.locator('.dv-level').first().waitFor({timeout:60000});blocked=true;
  await page.locator('.dv-level').nth(level-1).click();await page.locator('.dv-car-choice').first().waitFor();await configure(8,6);await page.getByRole('button',{name:'家长面板',exact:true}).click();await page.getByRole('group',{name:'要送的货物',exact:true}).getByRole('button',{name:'4 件',exact:true}).click();await page.getByRole('group',{name:'要去的目的地',exact:true}).getByRole('button',{name:(level%2?'4':'3')+' 站',exact:true}).click();await page.getByRole('button',{name:'关闭家长面板',exact:true}).click();
  const before=posts.length;
  await page.getByRole('button',{name:'选择消防车',exact:true}).click();
  if(await page.getByRole('button',{name:'我来试试',exact:true}).count())await page.getByRole('button',{name:'我来试试',exact:true}).click();
  let cargo=[],stops=[],allocation=[],index=0,orders=0,wrongCargo=false,wrongStop=false,paused=false,originalOptions=[];
  for(let guard=0;guard<160;guard++){
   const phase=await page.locator('.dv-game-top h1').innerText();
   if(await page.locator('.dv-finished').count())break;
   if(phase==='看看订单'){
    cargo=await page.locator('.dv-order-items small').allTextContents();stops=await page.locator('.dv-route-stops strong').allTextContents();allocation=await page.locator('.dv-route-stops li').evaluateAll(nodes=>nodes.map(n=>[...n.querySelectorAll('.dv-assigned-cargo span[title]')].map(s=>s.title)));index=0;orders++;
    assert(stops.length===(level%2?4:3),'destination must be disclosed before memorizing');
    if(orders===1)await screen(`${width}-task${level}-order`);
    await page.getByRole('button',{name:'记好了',exact:false}).click();
   }else if(phase==='把货物装上车'){
    assert(await page.locator('.dv-item').count()===12,'max cargo count');
    if([3,4,6,7,8].includes(level))assert(await page.locator('.dv-order-group').count()===0,'memory answer leaked');
    await metrics(`${width}-task${level}-cargo`);if(orders===1)await screen(`${width}-task${level}-cargo`);
    if(!wrongCargo){const options=await page.locator('.dv-item').allTextContents(),bad=options.findIndex(name=>!cargo.includes(name.trim()));await page.locator('.dv-item').nth(bad).click();wrongCargo=true;}
    for(const name of cargo){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(60);}
   }else if(phase==='准备出发')await page.getByRole('button',{name:'小车出发',exact:false}).click();
   else if(phase==='去哪个站？'){
    assert(await page.locator('.dv-stop').count()===(level%2?10:9),'max destination count');
    const options=await page.locator('.dv-stop strong').allTextContents();
    if(index===0)originalOptions=options;else{assert(JSON.stringify(options)===JSON.stringify(originalOptions),'route options moved');assert(await page.locator('.dv-stop').filter({hasText:stops[0]}).isDisabled(),'visited stop still enabled');}
    if(!wrongStop){const bad=options.findIndex(name=>!stops.includes(name));await page.locator('.dv-stop').nth(bad).click();wrongStop=true;}
    await metrics(`${width}-task${level}-route${index}`);if(orders===1)await screen(`${width}-task${level}-route${index}`);
    await page.locator('.dv-stop').filter({hasText:stops[index]}).click();
   }else if(phase==='小车出发啦'){
    if(!paused){await page.getByRole('button',{name:'休息',exact:true}).click();await page.waitForTimeout(1700);assert(await page.locator('.dv-game-top h1').innerText()==='小车出发啦','travel advanced while paused');await page.getByRole('button',{name:'恢复游戏',exact:true}).click();paused=true;}
    await page.waitForTimeout(1550);
   }else if(phase==='货物到站啦'){await page.getByRole('button',{name:'把货物送到',exact:false}).click();index++;}
   else if(phase==='还剩什么？'){
    await metrics(`${width}-task${level}-remaining`);assert(await page.locator('.dv-item').count()===12,'remaining candidates changed');const remaining=allocation.slice(index).flat();for(const name of remaining)await page.getByRole('button',{name,exact:true}).click();if(remaining.length>1)await page.getByRole('button',{name:'选好了',exact:true}).click();
   }else if(phase==='送到了！')await page.getByRole('button',{name:orders===3?'小车回库':'下一次配送',exact:false}).click();
   else throw Error('Unexpected phase '+phase);
  }
  await page.locator('.dv-finished').waitFor();await page.waitForTimeout(100);await screen(`${width}-task${level}-complete`);await metrics(`${width}-task${level}-complete`);for(const [w,h] of [[744,900],[768,900],[768,1024],[820,1180],[834,1194],[1024,1366]]){await page.setViewportSize({width:w,height:h});await metrics(`${w}x${h}-task${level}-complete`);const clipped=await page.locator('.dv-victory-order .dv-cargo-art').evaluateAll(nodes=>nodes.some(e=>{const r=e.getBoundingClientRect(),p=e.closest('.dv-victory-order').getBoundingClientRect();return r.bottom>p.bottom||r.right>p.right||r.x<p.x||r.y<p.y;}));assert(!clipped,'completed cargo cropped');}await page.setViewportSize({width,height});
  assert(orders===3,'all three orders completed');
  await page.getByRole('button',{name:'返回',exact:true}).click();await page.locator('.dv-car-choice').first().waitFor();await page.waitForTimeout(200);
  const records=posts.slice(before);assert(records.length===1&&records[0].completed,'exactly one completed round record');
  const p=JSON.parse(records[0].parameters);assert(p.resolvedChoices.extraCargo===8&&p.resolvedChoices.extraStops===6,'record effective settings');
  console.log(JSON.stringify({width,level,orders,records:records.length,lateMedia}));
 }
 assert(lateMedia===0,'media requested after preparation');assert(errors.length===0,errors.join('\n'));
 await page.unrouteAll({behavior:'wait'});
 return {complete:true,rounds:posts.length,completed:posts.filter(p=>p.completed).length,unique:new Set(posts.map(p=>p.id)).size,lateMedia,errors,checks:checks.length};
}
