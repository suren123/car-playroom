async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);};await page.unrouteAll({behavior:'wait'});
 await page.setViewportSize({width:768,height:800});
 // Force this browser session's loader to use its supported memory fallback.
 await page.addInitScript(()=>Object.defineProperty(window,'caches',{value:undefined,configurable:true}));
 let fail=true;await page.route('**/assets/illustrations/**',r=>fail?r.abort():r.continue());
 await page.goto('http://127.0.0.1:5173/game/delivery?step=cars');await page.getByRole('heading',{name:'有些资源没有准备好',exact:true}).waitFor({timeout:60000});
 const initial=await page.locator('main').boundingBox();await page.mouse.wheel(0,700);assert(JSON.stringify(initial)===JSON.stringify(await page.locator('main').boundingBox()),'error screen scrolled');
 const retry=await page.getByRole('button',{name:'重试',exact:true}).boundingBox();assert(retry.y>=0&&retry.y+retry.height<=800,'retry clipped');
 fail=false;await page.getByRole('button',{name:'重试',exact:true}).click();await page.locator('.vehicle-picker').waitFor({timeout:60000});assert(await page.evaluate(()=>document.body.style.position==='fixed'),'retry dropped lock');
 await page.evaluate(()=>localStorage.setItem('car-playroom-delivery-choices-v1:local_seedy',JSON.stringify({cargoCount:1,destinationCount:4,extraCargo:8,extraStops:6})));
 await page.reload();await page.locator('.dv-settings-error').waitFor({timeout:60000});const geometry=await page.evaluate(()=>({height:document.querySelector('main').clientHeight,scroll:document.querySelector('main').scrollHeight,minCar:Math.min(...[...document.querySelectorAll('.all-cars button')].map(e=>e.getBoundingClientRect().height)),bottom:document.querySelector('.all-cars').getBoundingClientRect().bottom}));
 assert(geometry.height>=geometry.scroll&&geometry.minCar>=56&&geometry.bottom<=800,JSON.stringify(geometry));
 await page.getByRole('button',{name:'调整配送设置',exact:true}).click();await page.getByRole('group',{name:'要送的货物',exact:true}).getByRole('button',{name:'4 件',exact:true}).click();await page.getByRole('button',{name:'关闭家长面板',exact:true}).click();assert(await page.locator('.all-cars button:enabled').count()>0,'settings repair failed');
 await page.getByRole('button',{name:'返回',exact:true}).click();await page.waitForURL('**/game/delivery?step=levels');assert(await page.evaluate(()=>document.body.style.position==='fixed'),'back dropped lock');
 await page.unrouteAll({behavior:'wait'});return {passed:true,errorRetryFixed:true,invalidConfiguration:geometry,parentSettingsAvailable:true};
}
