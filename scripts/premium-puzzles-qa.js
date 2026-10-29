// Invoke through playwright-cli run-code; solve only the visible board.
async page=>{
 const game='sudoku',width=1024,height=768;
 await page.unrouteAll({behavior:'wait'});await page.setViewportSize({width,height});
 const posts=[],errors=[],results=[];let block=false,lateMedia=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/records*',r=>{if(r.request().method()==='POST')posts.push(r.request().postDataJSON());return r.fulfill({json:r.request().method()==='GET'?{epoch:0,records:[],hasMore:false}:{ok:true}});});
 await page.route('**/*',r=>{if(block&&/\.(png|mp3|wav)(\?|$)/.test(r.request().url())){lateMedia++;return r.abort();}return r.fallback();});
 await page.goto('http://127.0.0.1:5173/game/'+game);
 const base=game==='sudoku'?'sudoku':'spot',cards=game==='sudoku'?'.sudoku-size-cards>button':'.spot-level-cards>button';
 await page.locator(cards).first().waitFor({timeout:60000});block=true;
 for(let level=0;level<3;level++){
  await page.screenshot({path:`output/playwright/premium-${game}-${width}-${level}-selection.png`});
  await page.locator(cards).nth(level).click();await page.locator(`.${base}-stage`).waitFor();
  await page.getByRole('button',{name:'休息',exact:true}).click();await page.getByRole('button',{name:'恢复游戏',exact:true}).click();
  const board=page.locator(game==='sudoku'?'.sudoku-grid':'.spot-boards'),before=await board.boundingBox();
  if(game==='sudoku'){
   const kinds=await page.locator('.sudoku-candidates button [data-illustration]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-illustration'))),size=level+2,initial=await page.locator('.sudoku-tile').evaluateAll(nodes=>nodes.map(n=>n.querySelector('[data-illustration]')?.getAttribute('data-illustration')??null));
   const values=initial.map(id=>kinds.indexOf(id));
   const solve=()=>{const at=values.indexOf(-1);if(at<0)return true;for(let value=0;value<size;value++){let valid=true;for(let i=0;i<size;i++)if(values[Math.floor(at/size)*size+i]===value||values[i*size+at%size]===value)valid=false;if(valid){values[at]=value;if(solve())return true;values[at]=-1;}}return false;};
   if(!solve())throw Error('Visible Sudoku has no solution');
   const empty=initial.map((v,i)=>v===null?i:-1).filter(i=>i>=0);
   await page.locator('.sudoku-candidates button').nth((values[empty[0]]+1)%size).click();
   if(await page.locator('.sudoku-tile').nth(empty[0]).locator('[data-illustration]').count())throw Error('Wrong Sudoku symbol was inserted');
   await page.getByRole('button',{name:'提示',exact:true}).click();await page.getByRole('button',{name:'提示',exact:true}).click();
   await page.screenshot({path:`output/playwright/premium-${game}-${width}-${level}-error.png`});
   await page.locator('.sudoku-tile').nth(empty[1]).click();if(await page.locator('.sudoku-candidates .hinted').count())throw Error('Hint leaked into next cell');
   for(const at of empty){await page.locator('.sudoku-tile').nth(at).click();await page.locator('.sudoku-candidates button').nth(values[at]).click();await page.waitForTimeout(180);}
  }else{
   const sides=await page.locator('.spot-grid').evaluateAll(nodes=>nodes.map(n=>[...n.querySelectorAll('[data-illustration]')].map(i=>i.dataset.illustration)));
   const changed=sides[0].map((id,i)=>id!==sides[1][i]?i:-1).filter(i=>i>=0),same=sides[0].findIndex((id,i)=>id===sides[1][i]);
   await page.locator('.spot-grid').first().locator('button').nth(same).click();await page.getByRole('button',{name:'提示',exact:true}).click();
   await page.screenshot({path:`output/playwright/premium-${game}-${width}-${level}-error.png`});
   for(const at of changed){await page.locator('.spot-grid').first().locator('button').nth(at).click();await page.waitForTimeout(240);}
   if(await page.locator('.spot-car.found').count()!==changed.length*2)throw Error('The two sides were not marked together');
  }
  await page.locator(`.${base}-completion`).waitFor();const after=await board.boundingBox();if(JSON.stringify(before)!==JSON.stringify(after))throw Error(`${game} board moved at completion`);
  await page.waitForTimeout(3400);await page.screenshot({path:`output/playwright/premium-${game}-${width}-${level}-complete.png`});
  const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,height:document.documentElement.scrollHeight,small:[...document.querySelectorAll('main button')].filter(b=>b.getBoundingClientRect().width>0&&(b.getBoundingClientRect().width<55.9||b.getBoundingClientRect().height<55.9)).map(b=>b.textContent),controls:[...document.querySelectorAll('.sudoku-completion button,.spot-completion button')].every(b=>b.getBoundingClientRect().bottom<=innerHeight)}));
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await page.getByRole('button',{name:'家长面板',exact:true}).click();await page.getByRole('button',{name:'关闭家长面板',exact:true}).click();
  if(!await page.locator(`.${base}-completion`).count())throw Error('Completed board disappeared');
  await page.getByRole('button',{name:'再玩一局',exact:true}).click();await page.locator(`.${base}-stage`).waitFor();await page.getByRole('button',{name:'返回',exact:true}).click();
  results.push({level:level+1,stableBoard:true,...layout});
 }
 await page.unrouteAll({behavior:'wait'});return {game,width,results,posts:posts.length,complete:posts.filter(p=>p.completed).length,unique:new Set(posts.map(p=>p.id)).size,lateMedia,errors};
}
