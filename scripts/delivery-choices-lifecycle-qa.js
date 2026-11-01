async page=>{
 const assert=(value,message)=>{if(!value)throw Error(message);};
 await page.unrouteAll({behavior:'wait'});await page.addInitScript(()=>{window.confirm=()=>true;});await page.setViewportSize({width:1024,height:768});await page.emulateMedia({reducedMotion:'reduce'});
 const posts=[],errors=[];let failRecords=false,lateMedia=0,blocked=false;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/records*',r=>{if(r.request().method()==='POST'){
  const record=r.request().postDataJSON();posts.push(record);assert(record.parameters.length<=500,'oversized metadata');
  if(failRecords)return r.fulfill({status:503,json:{message:'offline test'}});
 }return r.fulfill({json:r.request().method()==='GET'?{epoch:0,records:[],hasMore:false}:r.request().method()==='DELETE'?{epoch:1}:{ok:true}});});
 await page.route('**/*',r=>{if(blocked&&/\.(png|mp3|wav)(\?|$)/.test(r.request().url())){lateMedia++;return r.abort();}return r.fallback();});
 const openLevel=async(level)=>{blocked=false;await page.goto('http://127.0.0.1:5173/game/delivery?step=levels');await page.locator('.dv-level').first().waitFor({timeout:60000});blocked=true;await page.locator('.dv-level').nth(level-1).click();await page.locator('.dv-car-choice').first().waitFor();};
 const settings=async(cargo,stops)=>{
  await page.getByRole('button',{name:'家长面板',exact:true}).click();
  await page.getByRole('button',{name:'轻松找',exact:false}).click();
  for(const [label,target] of [['额外货物',cargo],['额外目的地',stops]]){
   const group=page.getByRole('group',{name:label,exact:true});
   if(target==='auto'){await group.getByRole('button',{name:'按任务',exact:true}).click();assert(await group.getByRole('button',{name:'按任务'}).getAttribute('aria-pressed')==='true','auto selected');continue;}
   let value=1;while(value!==target){await page.getByRole('button',{name:(value<target?'增加':'减少')+label,exact:true}).click();value+=value<target?1:-1;}
  }
  await page.screenshot({path:`output/playwright/delivery-choices-settings-fixed-${page.viewportSize().width}.png`});
  await page.getByRole('button',{name:'关闭家长面板',exact:true}).click();
 };
 const start=async()=>{await page.getByRole('button',{name:'选择消防车',exact:true}).click();if(await page.getByRole('button',{name:'我来试试',exact:true}).count())await page.getByRole('button',{name:'我来试试',exact:true}).click();};
 const load=async()=>{
  const cargo=await page.locator('.dv-order-items small').allTextContents(),stops=await page.locator('.dv-route-stops strong').allTextContents();
  await page.getByRole('button',{name:'记好了',exact:false}).click();
  for(const name of cargo){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(60);}
  await page.getByRole('button',{name:'小车出发',exact:false}).click();return {cargo,stops};
 };
 // Auto defaults and explicitly zero alternatives preserve automatic travel.
 await openLevel(1);await settings('auto','auto');await start();
 await page.getByRole('button',{name:'记好了',exact:false}).click();assert(await page.locator('.dv-item').count()===2,'auto task1 cargo count');
 await page.getByRole('button',{name:'返回',exact:true}).click();await page.locator('.dv-car-choice').first().waitFor();
 await settings(0,0);await start();await load();assert(await page.locator('.dv-game-top h1').innerText()==='小车出发啦','single zero should travel automatically');
 // Native page reload discards the active round without a new record.
 const prior=posts.length;blocked=false;await page.reload();await page.locator('.dv-car-choice').first().waitFor({timeout:60000});blocked=true;assert(posts.length===prior,'reload submitted unfinished record');
 // Mid-round preferences are independent of all three active orders.
 await openLevel(8);await settings(8,6);await start();
 const first=await page.locator('.dv-order-items small').allTextContents();await page.getByRole('button',{name:'记好了',exact:false}).click();
 const candidates=await page.locator('.dv-item').allTextContents();await settings(1,1);await page.getByRole('button',{name:'恢复游戏',exact:true}).click();
 assert(JSON.stringify(await page.locator('.dv-item').allTextContents())===JSON.stringify(candidates),'setting moved active candidates');
 await page.getByRole('button',{name:'给个提示',exact:true}).click();await page.getByRole('button',{name:'给个提示',exact:true}).click();assert(await page.locator('.dv-item.is-hinted').count()===1,'hint target');
 await page.getByRole('button',{name:'再看订单',exact:true}).click();assert(await page.getByRole('dialog',{name:'再看看订单'}).isVisible(),'review');await page.getByRole('button',{name:'记好了，继续',exact:true}).click();
 await page.getByRole('button',{name:'再看订单',exact:true}).click();const stops=await page.locator('.dv-route-stops strong').allTextContents();await page.getByRole('button',{name:'记好了，继续',exact:true}).click();
 for(const name of first){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(60);}await page.getByRole('button',{name:'小车出发',exact:false}).click();
 assert(await page.locator('.dv-stop').count()===8,'active route count changed');
 for(let index=0;index<2;index++){
  await page.locator('.dv-stop').filter({hasText:stops[index]}).click();await page.waitForTimeout(1600);await page.getByRole('button',{name:'把货物送到',exact:false}).click();
  if(index===0){assert(await page.locator('.dv-item').count()===10,'remaining count changed');await page.getByRole('button',{name:first[1],exact:true}).click();}
 }
 await page.getByRole('button',{name:'下一次配送',exact:false}).click();await page.getByRole('button',{name:'记好了',exact:false}).click();assert(await page.locator('.dv-item').count()===10,'second order adopted future settings');
 // Parent restart is the boundary: new preferences, exactly one abandoned record.
 const oldPosts=posts.length;await page.getByRole('button',{name:'家长面板',exact:true}).click();await page.getByRole('button',{name:'重新开始这局',exact:true}).click();
 await page.getByRole('button',{name:'记好了',exact:false}).click();assert(await page.locator('.dv-item').count()===3,'restart must apply latest preferences');
 await page.waitForTimeout(200);assert(posts.length===oldPosts+1&&!posts.at(-1).completed,'restart record duplication');assert(JSON.parse(posts.at(-1).parameters).resolvedChoices.extraCargo===8,'old round record changed settings');
 // Offline finish queues once; parent retry resends the same ID.
 failRecords=true;await page.getByRole('button',{name:'返回',exact:true}).click();await page.locator('.dv-car-choice').first().waitFor();await page.waitForTimeout(200);
 const failed=posts.at(-1);assert(!failed.completed&&JSON.parse(failed.parameters).resolvedChoices.extraCargo===1,'new round metadata');failRecords=false;
 await page.getByRole('button',{name:'家长面板',exact:true}).click();await page.getByRole('button',{name:'陪玩记录',exact:true}).click();await page.getByRole('button',{name:'重试同步',exact:true}).waitFor();await page.waitForTimeout(300);assert(posts.at(-1).id===failed.id,'offline retry changed ID');
 await page.getByRole('button',{name:'清空全部',exact:true}).click();await page.getByRole('button',{name:'确认清空',exact:true}).click();await page.getByText('记录已清空。未完成的局次会从现在重新计数。').waitFor();await page.getByRole('button',{name:'关闭家长面板',exact:true}).click();
 // Two true stops, zero extras: update task automatically travels after remaining.
 await settings(0,0);await start();const order=await load();assert(await page.locator('.dv-stop').count()===2,'zero extras retains both true stops');
 await page.locator('.dv-stop').filter({hasText:order.stops[0]}).click();await page.waitForTimeout(1600);await page.getByRole('button',{name:'把货物送到',exact:false}).click();await page.getByRole('button',{name:order.cargo[1],exact:true}).click();assert(await page.locator('.dv-game-top h1').innerText()==='小车出发啦','zero extras remaining should auto travel');
 await page.getByRole('button',{name:'休息',exact:true}).click();const beforeExit=posts.length;await page.getByRole('button',{name:'返回',exact:true}).click();await page.locator('.dv-car-choice').first().waitFor();await page.waitForTimeout(150);assert(posts.length===beforeExit+1,'paused exit must submit once');
 // Settings persist across refresh; preparation alone never submits a round.
 const beforePreparation=posts.length;blocked=false;await page.reload();await page.locator('.dv-car-choice').first().waitFor({timeout:60000});blocked=true;
 await page.getByRole('button',{name:'家长面板',exact:true}).click();assert((await page.getByLabel('额外货物数量',{exact:true}).innerText()).startsWith('0'),'saved preference not loaded');await page.getByRole('button',{name:'关闭家长面板',exact:true}).click();
 await page.getByRole('button',{name:'返回',exact:true}).click();await page.locator('.dv-level').first().waitFor();await page.waitForTimeout(500);await page.getByRole('button',{name:'返回',exact:true}).click();await page.locator('.hub-game-list').waitFor();assert(posts.length===beforePreparation,'preparation submitted record');
 assert(lateMedia===0,'late media');assert(errors.length===0,errors.join('\n'));await page.unrouteAll({behavior:'wait'});
 return {passed:true,posts:posts.length,uniqueRecords:new Set(posts.map(p=>p.id)).size,metadataMax:Math.max(...posts.map(p=>p.parameters.length)),lateMedia,errors};
}
