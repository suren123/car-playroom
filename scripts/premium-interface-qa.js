async page=>{
 await page.unrouteAll({behavior:'wait'});await page.route('**/api/records*',r=>r.fulfill({json:r.request().method()==='GET'?{epoch:0,records:[],hasMore:false}:{ok:true}}));
 const results=[];
 const measure=()=>page.evaluate(()=>{
  const visible=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(s.visibility==='hidden'||s.display==='none'||Number(s.opacity)===0)return false;}return !e.closest('[aria-hidden=true],.parent-panel');};
  const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number),lum=a=>a.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
  const small=[],contrast=[];
  for(const e of document.querySelectorAll('main *')){
   if(!visible(e)||e.closest('button:disabled'))continue;
   const text=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();if(!/[\u4e00-\u9fa5]/.test(text))continue;
   const s=getComputedStyle(e),size=parseFloat(s.fontSize);if(size<18)small.push({text,size,cls:e.className});
   let bg='rgb(250, 248, 239)';for(let p=e;p;p=p.parentElement){const color=getComputedStyle(p).backgroundColor;if(color!=='rgba(0, 0, 0, 0)'&&color!=='transparent'){bg=color;break;}}
   const a=lum(rgb(s.color)),b=lum(rgb(bg)),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),threshold=size>=24||(size>=18.66&&Number(s.fontWeight)>=700)?3:4.5;
   if(ratio<threshold-.05)contrast.push({text,color:s.color,bg,ratio:Math.round(ratio*100)/100,size,cls:e.className});
  }
  const touch=[...document.querySelectorAll('main button')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.width<55.9||r.height<55.9;}).map(e=>e.getAttribute('aria-label')||e.textContent);
  const art=document.querySelector('main .illustration-art,main .vehicle-art'),event=new Event('contextmenu',{bubbles:true,cancelable:true});art?.dispatchEvent(event);
  const outside=new Event('contextmenu',{bubbles:true,cancelable:true});document.body.dispatchEvent(outside);
  return {small,contrast,touch,overflow:document.documentElement.scrollWidth>innerWidth,height:document.documentElement.scrollHeight,gameImageMenuBlocked:event.defaultPrevented,outsideMenuPreserved:!outside.defaultPrevented};
 });
 for(const [width,height] of [[1024,768],[768,1024]]){
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:5173/game');await page.waitForFunction(()=>!!document.querySelector('.hub-game-list button')?.onclick);await page.screenshot({path:`output/playwright/premium-home-${width}.png`,fullPage:true});results.push({game:'home',width,state:'selection',...await measure()});
  for(const game of ['queue','bridge','sort','repair','traffic','listen','detour','sudoku','difference','delivery']){
   await page.goto('http://127.0.0.1:5173/game/'+game+(game==='delivery'?'?step=levels':''));await page.locator('.town-header').waitFor({timeout:60000});
   results.push({game,width,state:'selection',...await measure()});
   if(game==='sudoku')await page.locator('.sudoku-size-cards>button').last().click();
   else if(game==='difference')await page.locator('.spot-level-cards>button').last().click();
   else if(game==='delivery'){await page.locator('.dv-level').last().click();await page.getByRole('button',{name:'选择消防车',exact:true}).click();if(await page.getByRole('button',{name:'我来试试',exact:true}).count())await page.getByRole('button',{name:'我来试试',exact:true}).click();}
   else{await page.locator('.ws-levels>button').last().click();await page.getByRole('button',{name:'开始任务',exact:true}).click();}
   await page.waitForTimeout(200);results.push({game,width,state:'play',...await measure()});
  }
 }
 await page.unrouteAll({behavior:'wait'});return results;
}
