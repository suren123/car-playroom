import assert from 'node:assert/strict';
import {routeMotion,routeHeading} from '../games/workshop/route-motion.ts';
import {makeWorkshopRound,workshopReducer,workshopGames,allCars,bridgeSolution,bridgeFilled,routeSolution,trafficCanGo,trafficFlows,adjacent,visitedWaypoints,workshopArtwork,stations} from '../games/workshop/model.ts';
import {parseWorkshopPreference,workshopPreferenceKey} from '../games/workshop/preferences.ts';
import {readFileSync} from 'node:fs';
import {illustrationUrl} from '../games/illustration-assets.ts';
const manifest=JSON.parse(readFileSync('lib/game-resources.generated.json','utf8'));
const voices=JSON.parse(readFileSync('games/workshop/voices.json','utf8'));
const deliveryVoice=JSON.parse(readFileSync('lib/delivery-voice.json','utf8'));
for(const game of workshopGames){
 for(const id of workshopArtwork(game))assert.ok(manifest.games[game].includes(illustrationUrl(id)),`${game} preloads ${id}`);
 for(const level of [1,2,3]){const clip=voices[`${game}-${level}`];assert.ok(clip.text.length>10);assert.ok(manifest.games[game].includes(clip.file));assert.ok(readFileSync(`public${clip.file}`).length>1000);}
 assert.deepEqual(parseWorkshopPreference({level:99,car:'bogus'},game),{level:1,car:'fire'});
 assert.notEqual(workshopPreferenceKey('alice',game),workshopPreferenceKey('bob',game));
}
for(const s of stations)assert.ok(manifest.games.listen.includes(deliveryVoice[`segment_stop_${s.id}`].file));

const variation=new Map(),seenCars=new Set();
let total=0;
for(const game of workshopGames)for(const level of [1,2,3]){
 const signatures=new Set();
 for(let seed=1;seed<=200;seed++){
  let s=makeWorkshopRound(game,level,seed,allCars[seed%allCars.length]);
  assert.deepEqual(s,makeWorkshopRound(game,level,seed,allCars[seed%allCars.length]),'fixed seed');
  const act=a=>{s=workshopReducer(s,a);};
  const before=s;act({type:'hint'});assert.equal(s.hints,1);assert.equal(before.hints,0);
  if(game==='queue'){
   signatures.add(JSON.stringify(s.order));s.cars.forEach(c=>seenCars.add(c));
   assert.ok(s.order.includes(s.car),'chosen car participates in the queue');assert.equal(new Set(s.order).size,level+2);assert.equal(s.clues.length,s.order.length-1);
   for(const [a,b] of s.clues)assert.equal(s.order.indexOf(a)+1,s.order.indexOf(b));
   const emptyState=s,first=s.order[0],second=s.order[1],lastSlot=s.order.length-1;
   act({type:'queue-place',car:first,slot:lastSlot});assert.equal(s.slots[lastSlot],first);assert.equal(s.slots[0],null);
   act({type:'queue-place',car:second,slot:0});assert.equal(s.slots[0],second);
   act({type:'queue-place',car:first,slot:0});assert.equal(s.slots[0],first);assert.equal(s.slots[lastSlot],second);
   const swapped=s;act({type:'queue-place',car:first,slot:0});assert.equal(s,swapped,'drop same slot is a no-op');
   act({type:'queue-place',car:first,slot:null});assert.equal(s.slots.includes(first),false);
   act({type:'undo'});assert.deepEqual(s.slots,swapped.slots,'undo restores drag, including gaps');
   act({type:'queue-place',car:s.order[2],slot:0});assert.equal(s.slots[0],s.order[2]);assert.equal(s.slots.includes(first),false,'replaced tray car returns to tray');
   const valid=s;act({type:'queue-place',car:first,slot:99});assert.equal(s,valid);
   s=emptyState;
   act({type:'check'});assert.equal(s.complete,false);assert.equal(s.wrong,1);
   for(const car of s.order){act({type:'queue',car});const repeat=s;act({type:'queue',car});assert.equal(s,repeat);}
   const last=s.slots.at(-1);act({type:'undo'});act({type:'queue',car:last});act({type:'check'});
  }else if(game==='bridge'){
   signatures.add(JSON.stringify([s.pieces,s.pattern]));
   const solution=bridgeSolution(s);assert.ok(solution);assert.equal(new Set(solution).size,solution.length);
   assert.ok(s.pieces.length>=3);const inventory=s.pieces.reduce((n,p)=>n+p.length,0);assert.ok(level===1?inventory===s.span:inventory>s.span);
   act({type:'cooperate'});act({type:'bridge',piece:solution[0],actor:'parent'});assert.equal(s.placed.length,0);
   for(const piece of solution){act({type:'bridge',piece,actor:s.turn});const repeated=s;act({type:'bridge',piece,actor:s.turn});assert.equal(s,repeated);}
   assert.equal(bridgeFilled(s),s.span);act({type:'check'});
  }else if(game==='sort'){
   for(const item of [...s.tokens,...s.bins])if(item.art)assert.ok(workshopArtwork(game).includes(item.art),`${game} visible asset ${item.art}`);
   signatures.add(JSON.stringify(s.tokens));assert.equal(new Set(s.tokens.map(t=>t.id)).size,s.tokens.length);
   for(const token of s.tokens){act({type:'select',token:token.id});const wrong=s.bins.find(b=>b.id!==token.bin).id;const count=Object.keys(s.parked).length;act({type:'sort',bin:wrong});assert.equal(Object.keys(s.parked).length,count);act({type:'sort',bin:token.bin});}
  }else if(game==='repair'){
   signatures.add(JSON.stringify([s.vehicle,s.jobs]));assert.equal(new Set(s.jobs.map(j=>j.part)).size,s.jobs.length);
   for(const job of s.jobs){act({type:'part',variant:job.target});assert.equal(s.stage,'tool');const wrongTool=job.tool==='cloth'?'wrench':'cloth';act({type:'tool',tool:wrongTool});assert.equal(s.stage,'tool');act({type:'tool',tool:job.tool});if(job.part==='wheel'){act({type:'part',variant:1});assert.equal(s.stage,'part');act({type:'part',variant:job.target});}assert.equal(s.stage,'service');const before=s.index;act({type:'service',part:job.part==='wheel'?'window':'wheel'});assert.equal(s.index,before);act({type:'service',part:job.part});assert.equal(s.index,before+1);const duplicate=s;act({type:'service',part:job.part});assert.equal(s,duplicate);}
   assert.equal(s.stage,'test');assert.equal(s.complete,false);act({type:'check'});
  }else if(game==='traffic'){
   signatures.add(JSON.stringify(s.junction??s.scenes));
   if(level===1){assert.ok(s.scenes.some(t=>t.light==='red'));assert.ok(s.scenes.some(trafficCanGo));for(const scene of s.scenes){const i=s.index;act({type:'traffic',go:!trafficCanGo(scene)});assert.equal(s.index,i);act({type:'traffic',go:trafficCanGo(scene)});}}
   else{
    assert.ok(s.junction.lanes.flat().includes(allCars[seed%allCars.length]));
    if(level===3)assert.ok(s.junction.lanes.flat().includes('ambulance'));
    while(!s.complete){
     const allowed=trafficFlows(s);assert.ok(allowed.length>0);const j=s.junction,total=j.served[0]+j.served[1];
     if(j.pedestrianAt[j.peopleServed]===total)assert.deepEqual(allowed,['people']);
     else if(level===3&&j.lanes.some((lane,i)=>lane[j.served[i]]==='ambulance'))assert.ok(allowed.every(flow=>j.lanes[flow==='west'?0:1][j.served[flow==='west'?0:1]]==='ambulance'));
     const bad=['west','north','people'].find(f=>!allowed.includes(f));if(bad){const before=s.index;act({type:'flow',flow:bad});assert.equal(s.index,before);}
     act({type:'flow',flow:allowed[seed%allowed.length]});assert.ok(s.index<=8);
    }
    assert.equal(s.arrived.length,level===2?4:6);assert.equal(s.junction.peopleServed,level===2?1:2);
   }
  }else if(game==='listen'){
   signatures.add(JSON.stringify(s.route));assert.equal(s.route.length,level+1);assert.ok(s.route.every(x=>s.options.includes(x)));
   act({type:'station',station:s.route[0]});assert.equal(s.plan.length,0);act({type:'cover'});
   for(const station of s.route)act({type:'station',station});const last=s.plan.at(-1);act({type:'undo'});act({type:'station',station:last});act({type:'check'});
  }else{
   signatures.add(JSON.stringify([s.walls,s.via]));const solution=routeSolution(s);assert.ok(solution);
   assert.equal(solution[0],s.start);assert.equal(solution.at(-1),s.goal);
   const frames=routeMotion(solution,s.size);assert.equal(frames[0].offset,0);assert.equal(frames.at(-1).offset,1);
   assert.equal(frames.at(-1).left,`${(s.goal%s.size+.5)/s.size*100}%`);
   assert.equal(frames.at(-1).top,`${(Math.floor(s.goal/s.size)+.5)/s.size*100}%`);
   for(let f=1;f<frames.length;f++){assert.ok(frames[f].offset>=frames[f-1].offset);const angle=x=>Number(x.transform.match(/rotate\(([-\d.]+)deg/)[1]);assert.ok(Math.abs(angle(frames[f])-angle(frames[f-1]))<=180,'no full-spin corner');}
   for(let i=1;i<solution.length;i++)assert.ok([0,90,180,-90].includes(routeHeading(solution[i-1],solution[i],s.size)),'cardinal drive');
   const pathBefore=s.path;act({type:'step',cell:-1});assert.equal(s.path,pathBefore);act({type:'step',cell:NaN});assert.equal(s.path,pathBefore);
   act({type:'check'});assert.equal(s.complete,false);
   for(let i=1;i<solution.length;i++){assert.ok(adjacent(solution[i-1],solution[i],s.size));assert.ok(!s.walls.includes(solution[i]));act({type:'step',cell:solution[i]});}
   assert.equal(visitedWaypoints(s),s.via.length);act({type:'check'});
  }
  assert.equal(s.complete,true,`${game}/${level}/${seed}`);
  for(const action of [{type:'hint'},{type:'undo'},{type:'check'},{type:'traffic',go:true}])assert.equal(workshopReducer(s,action),s,'completed rounds immutable');
  total++;
 }
 variation.set(`${game}/${level}`,signatures.size);
 assert.ok(signatures.size>=20,`${game}/${level}: enough distinct puzzles, got ${signatures.size}`);
}
assert.equal(seenCars.size,20);
console.log(`PASS ${total} rounds: seven games × three levels × 200 seeds; repeatability, diversity, solvability, wrong input, undo, immutable completion. All 20 vehicles encountered.`);
console.log(Object.fromEntries(variation));
