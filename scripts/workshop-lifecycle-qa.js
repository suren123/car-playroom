async page => {
 await page.unrouteAll({behavior:'wait'});const posts=[];
 await page.route('**/api/records*',async route=>{if(route.request().method()==='POST')posts.push(route.request().postDataJSON());await route.fulfill({json:route.request().method()==='GET'?{epoch:0,records:[],hasMore:false}:{ok:true}});});
 await page.goto('http://127.0.0.1:5173/game?category=rules');await page.waitForFunction(()=>!!document.querySelector('.hub-game-list button')?.onclick);await page.getByRole('button',{name:'小汽车排队',exact:true}).click();await page.getByRole('button',{name:'开始任务',exact:true}).waitFor();
 await page.locator('.ws-levels button').first().click();await page.getByRole('button',{name:'开始任务',exact:true}).click();
 await page.locator('.ws-car-choice').first().evaluate(b=>{b.click();b.click();});
 if(await page.locator('.ws-lineup [data-illustration]').count()!==1)throw Error('duplicate car placement');
 await page.getByRole('button',{name:'休息',exact:true}).click();const before=await page.locator('.ws-lineup').innerHTML();
 await page.locator('.ws-car-choice:not(:disabled)').first().evaluate(b=>b.click());
 if(await page.locator('.ws-lineup').innerHTML()!==before)throw Error('paused input changed board');
 await page.getByRole('button',{name:'返回',exact:true}).click();await page.getByRole('button',{name:'开始任务',exact:true}).waitFor();
 await page.waitForTimeout(500);if(posts.length!==1||posts[0].completed)throw Error('pause return record');
 await page.getByRole('button',{name:'返回',exact:true}).click();await page.waitForURL('**/game?category=rules');
 await page.getByRole('button',{name:'小汽车排队',exact:true}).click();await page.getByRole('button',{name:'开始任务',exact:true}).click();
 await page.getByRole('button',{name:'家长面板',exact:true}).click();await page.getByRole('button',{name:'重新开始这局',exact:true}).click();
 await page.waitForTimeout(300);if(posts.length!==2||posts[1].completed)throw Error('restart record');
 await page.reload();await page.getByRole('button',{name:'开始任务',exact:true}).waitFor();if(posts.length!==2)throw Error('refresh submitted record');
 await page.getByRole('button',{name:'开始任务',exact:true}).click();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await page.getByRole('button',{name:'恢复游戏',exact:true}).waitFor();await page.getByRole('button',{name:'恢复游戏',exact:true}).click();
 const order=await page.locator('.ws-ticket [data-illustration]').evaluateAll(nodes=>nodes.map(n=>n.dataset.illustration));for(const car of order)await page.locator('.ws-car-choice').filter({has:page.locator(`[data-illustration="${car}"]`)}).click();
 await page.getByRole('button',{name:'排好出发',exact:true}).evaluate(b=>{b.click();b.click();});await page.locator('.ws-complete').waitFor();const completedBoard=await page.locator('.ws-lineup').innerHTML();
 await page.waitForTimeout(3300);if(await page.locator('.ws-lineup').innerHTML()!==completedBoard)throw Error('completion moved on');
 await page.getByRole('button',{name:'家长面板',exact:true}).click();await page.getByRole('button',{name:'关闭家长面板',exact:true}).click();
 if(await page.locator('.ws-lineup').innerHTML()!==completedBoard)throw Error('parent modal lost result');
 await page.getByRole('button',{name:'返回',exact:true}).click();await page.waitForTimeout(500);
 if(posts.length!==3||posts.filter(p=>p.completed).length!==1||new Set(posts.map(p=>p.id)).size!==3)throw Error('record duplication');
 await page.getByRole('button',{name:'开始任务',exact:true}).click();await page.goBack();await page.waitForTimeout(400);if(posts.length!==3)throw Error('browser back submitted');
 return {pauseGuard:true,duplicateClickGuard:true,filterRestored:true,restart:true,refreshDiscard:true,simulatedVisibilityPause:true,finalBoardRetained:true,browserBackDiscard:true,posts:3,completed:1,unique:3};
}
