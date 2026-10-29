// Pass this function to playwright-cli run-code. Solve only from rendered clues.
async (page) => {
 await page.unrouteAll({behavior:'wait'});page.setDefaultTimeout(12000);
 const prefix=`workshop-${page.viewportSize().width}`;const results=[],posts=[],errors=[],performance=[];let blockMedia=false,lateMedia=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/records*',async route=>{const req=route.request();if(req.method()==='POST')posts.push(req.postDataJSON());await route.fulfill({json:req.method()==='GET'?{epoch:0,records:[],hasMore:false}:{ok:true}});});
 await page.route('**/*',async route=>{const req=route.request();if(blockMedia&&(/\.(png|mp3|wav)(\?|$)/.test(req.url()))){lateMedia++;await route.abort();}else await route.fallback();});
 const solve=async game=>{
  if(game==='queue'){
   const clues=await page.locator('.ws-relations>div').evaluateAll(nodes=>nodes.map(n=>[...n.querySelectorAll('[data-illustration]')].map(x=>x.dataset.illustration)));
   const order=clues.length?[]:await page.locator('.ws-ticket [data-illustration]').evaluateAll(nodes=>nodes.map(x=>x.dataset.illustration));
   if(clues.length){order.push(clues.find(([a])=>!clues.some(([,b])=>b===a))[0]);while(order.length<clues.length+1)order.push(clues.find(([a])=>a===order.at(-1))[1]);}
   for(const car of order)await page.locator('.ws-car-choice').filter({has:page.locator(`[data-illustration="${car}"]`)}).click();
   await page.getByRole('button',{name:'排好出发',exact:true}).click();
  }else if(game==='repair'){
   for(let i=0;i<4;i++){
    if(await page.getByRole('button',{name:'出库试车',exact:true}).count())break;
    const instruction=await page.locator('.repair-workbench h2').innerText();
    const tool=instruction.includes('脏了')?'擦布':instruction.includes('车灯')||instruction.includes('机身盖板')?'螺丝刀':'扳手';
    await page.getByRole('button',{name:tool,exact:true}).click();
    if(await page.locator('.repair-studio').getAttribute('data-phase')==='part')await page.getByRole('button',{name:'轮胎 1',exact:true}).click();
    await page.locator('.repair-target-ready').click();await page.waitForTimeout(1050);
   }
   await page.getByRole('button',{name:'出库试车',exact:true}).click();
  }else if(game==='bridge'){
   const pattern=await page.locator('.ws-support').evaluateAll(nodes=>nodes.map(n=>n.classList.contains('steel')?'steel':'wood'));
   const pieces=await page.locator('.ws-piece-choice').evaluateAll(nodes=>nodes.map((n,i)=>({i,length:Number(n.textContent.match(/\d+/)[0]),material:n.querySelector('.ws-plank').classList.contains('steel')?'steel':'wood'})));
   const constrained=await page.locator('.ws-support.steel').count();
   const search=(chosen,offset)=>{if(offset===pattern.length)return chosen;for(const p of pieces)if(!chosen.includes(p.i)&&offset+p.length<=pattern.length&&(!constrained||pattern.slice(offset,offset+p.length).every(m=>m===p.material))){const next=search([...chosen,p.i],offset+p.length);if(next)return next;}return null;};
   const solution=search([],0);if(!solution)throw Error('Unsolvable bridge');for(const i of solution)await page.locator('.ws-piece-choice').nth(i).click();
   await page.getByRole('button',{name:'小车试桥',exact:true}).click();
  }else if(game==='sort'){
   while(await page.locator('.ws-sort-items button:not(:disabled)').count()){
    const item=page.locator('.ws-sort-items button:not(:disabled)').first();await item.click();
    const art=await item.locator('[data-illustration],[data-vehicle-kind]').evaluate(n=>({id:n.dataset.illustration,kind:n.dataset.vehicleKind,color:n.dataset.bodyColor}));
    const bins=await page.locator('.ws-sort-bin').all();let target;
    for(const bin of bins){const label=await bin.innerText();if(art.kind){const data=await bin.locator('.ws-bin-sign [data-vehicle-kind]').evaluate(n=>({kind:n.dataset.vehicleKind,color:n.dataset.bodyColor}));if(data.kind===art.kind&&data.color===art.color)target=bin;}
     else {const group=['fire','ambulance','police'].includes(art.id)?'救援车':['digger','crane','mixer','roller'].includes(art.id)?'工程车':['truck','bus','delivery'].includes(art.id)?'运输车':['cargo-books','cargo-toys','cargo-backpack','cargo-gift'].includes(art.id)?'学习与玩耍':['toolbox','ladder','hose','wheel','helmet','board'].includes(art.id)?'工具':'食物';if(label.includes(group))target=bin;}}
    if(!target)throw Error('No bin');await target.click();
   }
  }else if(game==='traffic'){
   for(let i=0;i<10;i++){if(await page.locator('.ws-complete').count())break;if(await page.locator('.ws-junction').count()){const walking=await page.locator('.ws-people-present').count();const priority=await page.locator('.ws-lead-car.ws-emergency').count();let control;if(walking)control=page.getByRole('button',{name:'让行人通过',exact:true});else if(priority){const west=await page.locator('.ws-junction-lane.west .ws-lead-car.ws-emergency').count();control=page.getByRole('button',{name:west?'左边亮绿灯':'右边亮绿灯',exact:true});}else{control=page.locator('.ws-junction-controls button:not(:disabled)').filter({hasText:'亮绿灯'}).first();}await control.click();await page.waitForTimeout(1300);continue;}const green=await page.locator('.ws-signal.green').count(),blocked=await page.locator('.ws-pedestrian,.ws-priority').count();await page.getByRole('button',{name:green&&!blocked?'可以走':'停一停',exact:true}).click();await page.waitForTimeout(1300);}
  }else if(game==='listen'){
   const route=await page.locator('.ws-memory-route [data-illustration]').evaluateAll(nodes=>nodes.map(n=>n.dataset.illustration));
   await page.getByRole('button',{name:'记好了，盖起来',exact:true}).click();
   for(const id of route)await page.locator('.ws-station-choices button').filter({has:page.locator(`[data-illustration="${id}"]`)}).click();
   await page.getByRole('button',{name:'按路线出发',exact:true}).click();
  }else{
   const map=await page.locator('.ws-map button').evaluateAll(nodes=>nodes.map(n=>({label:n.getAttribute('aria-label'),wall:n.classList.contains('ws-wall'),start:!!n.querySelector('.detour-start')})));
   const size=Math.sqrt(map.length),start=map.findIndex(n=>n.start),goal=map.findIndex(n=>n.label==='终点'),via=[1,2].map(i=>map.findIndex(n=>n.label===`任务点 ${i}`)).filter(i=>i>=0);let at=start;
   for(const target of [...via,goal]){const queue=[[at]],seen=new Set([at]);let found;while(queue.length){const path=queue.shift(),last=path.at(-1);if(last===target){found=path;break;}for(const next of [last-size,last+1,last+size,last-1])if(next>=0&&next<map.length&&!map[next].wall&&!seen.has(next)&&Math.abs(Math.floor(last/size)-Math.floor(next/size))+Math.abs(last%size-next%size)===1){seen.add(next);queue.push([...path,next]);}}
    if(!found)throw Error('No map route');for(const cell of found.slice(1))await page.locator('.ws-map button').nth(cell).click();at=target;
   }
   await page.getByRole('button',{name:'检查路线',exact:true}).click();
  }
 };
 for(const game of ['queue','bridge','sort','repair','traffic','listen','detour']){
  blockMedia=false;await page.goto('http://127.0.0.1:5173/game/'+game);await page.getByRole('button',{name:'开始任务',exact:true}).waitFor({timeout:60000});
  const setup=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,height:document.documentElement.scrollHeight}));
  for(const level of [1,2,3]){
   await page.locator('.ws-levels button').nth(level-1).click();await page.getByRole('button',{name:'开始任务',exact:true}).click();blockMedia=true;
   await page.getByRole('button',{name:'休息',exact:true}).click();await page.getByRole('button',{name:'恢复游戏',exact:true}).click();
   await page.screenshot({path:`output/playwright/premium-${prefix}-${game}-${level}-play.png`});
   const play=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,height:document.documentElement.scrollHeight,small:[...document.querySelectorAll('main button')].filter(b=>b.getBoundingClientRect().width>0&&(b.getBoundingClientRect().width<55.9||b.getBoundingClientRect().height<55.9)).map(b=>b.getAttribute('aria-label')||b.textContent)}));
   await solve(game);await page.locator('.ws-complete').waitFor();performance.push({game,level,...await page.evaluate(()=>new Promise(resolve=>{const dt=[];let last=performance.now(),start=last;const tick=now=>{dt.push(now-last);last=now;if(now-start<3400)requestAnimationFrame(tick);else{const sorted=dt.slice(1).sort((a,b)=>a-b);resolve({frames:dt.length,p95Ms:sorted[Math.floor(sorted.length*.95)],maxMs:Math.max(...sorted),over50Ms:sorted.filter(x=>x>50).length});}};requestAnimationFrame(tick);}))});
   const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,height:document.documentElement.scrollHeight,buttons:[...document.querySelectorAll('.ws-outcome button')].every(b=>b.getBoundingClientRect().bottom<=innerHeight)}));
   await page.screenshot({path:`output/playwright/premium-${prefix}-${game}-${level}-complete.png`});
   results.push({game,level,setup,play,...layout});await page.getByRole('button',{name:'换挑战',exact:true}).click();
  }
 }
 await page.unrouteAll({behavior:'wait'});const ids=posts.map(p=>p.id);return {results,performance,posts:posts.length,unique:new Set(ids).size,completed:posts.filter(p=>p.completed).length,errors,lateMedia};
}
