import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {carCatalog} from '../games/vehicle-catalog.ts';
import {expandedCars,expandedItems,expandedStops,expansionArtIds} from '../games/expansion-catalog.ts';
import {items,stopIds,levels,createDelivery} from '../games/delivery/model.ts';
import {makeSudoku,makeDifference,countSolutions,sudokuSolvesByElimination,seeded,shuffle} from '../lib/replay-games.ts';
import {makeWorkshopRound,editableCars,workshopArtwork,stations} from '../games/workshop/model.ts';
import {parseWorkshopPreference} from '../games/workshop/preferences.ts';
import {illustrationUrl,cargoIllustration,destinationIllustration} from '../games/illustration-assets.ts';

assert.deepEqual([carCatalog.length,items.length,stopIds.length],[20,50,20]);
assert.equal(new Set(carCatalog.map(c=>c.id)).size,20);assert.equal(new Set(items.map(i=>i.id)).size,50);assert.equal(new Set(stopIds).size,20);
assert.equal(expansionArtIds.length,42);assert.equal(new Set(expansionArtIds).size,42);
const seenSudoku=new Set(),seenDifference=new Set(),seenCargo=new Set(),seenStops=new Set(),seenListen=new Set(),seenDetour=new Set();
for(let n=1;n<=240;n++){
 const seed=Math.imul(n,2654435761)>>>0;
 for(const size of [2,3,4]){
  const round=makeSudoku(size,seed);assert.equal(round.vehicles.length,size);assert.equal(new Set(round.vehicles).size,size);
  round.vehicles.forEach(c=>seenSudoku.add(c));assert.deepEqual(round,makeSudoku(size,seed));assert.equal(countSolutions(round.initial),1);assert.ok(sudokuSolvesByElimination(round.initial));
 }
 for(const difficulty of ['beginner','practice','challenge']){
  const r=makeDifference(difficulty,seed);assert.deepEqual(r,makeDifference(difficulty,seed));assert.equal(r.vehicles.length,difficulty==='beginner'?4:6);
  assert.deepEqual(new Set(r.left.map(v=>v.kind)),new Set(r.vehicles));
  r.vehicles.forEach(c=>seenDifference.add(c));
  r.right.forEach((v,i)=>{assert.ok(r.vehicles.includes(v.kind));if(!r.differences.includes(i))assert.deepEqual(v,r.left[i]);else assert.notEqual(v.kind,r.left[i].kind);});
 }
 for(const level of levels)for(const task of createDelivery(level.id,seed).tasks){task.cargo.forEach(i=>seenCargo.add(i));task.stops.forEach(s=>seenStops.add(s));}
 for(const level of [1,2,3]){
  const listen=makeWorkshopRound('listen',level,seed);listen.route.forEach(id=>seenListen.add(id));assert.equal(listen.route.length,level+1);assert.equal(listen.options.length,level+3);
  const detour=makeWorkshopRound('detour',level,seed);detour.destinations.forEach(id=>seenDetour.add(id));assert.equal(detour.destinations.length,detour.via.length+1);assert.equal(new Set(detour.destinations).size,detour.destinations.length);
 }
}
for(const seen of [seenSudoku,seenDifference])assert.deepEqual([...seen].sort(),carCatalog.map(c=>c.id).sort());
assert.deepEqual([...seenCargo].sort(),items.map(i=>i.id).sort());
for(const seen of [seenStops,seenListen,seenDetour])assert.deepEqual([...seen].sort(),[...stopIds].sort());
assert.equal(stations.length,20);assert.equal(stations.find(s=>s.id==='greenhouse').name,'温室');
assert.equal(editableCars.length,6);
for(const c of carCatalog){const pref=parseWorkshopPreference({car:c.id,level:2},'repair');assert.ok(editableCars.includes(pref.car));assert.equal(makeWorkshopRound('repair',2,1,pref.car).vehicle,pref.car);}
for(const id of expandedCars){assert.ok(!workshopArtwork('repair').includes(id));assert.ok(workshopArtwork('detour').includes(`overhead-${id}`));}
const voices=JSON.parse(readFileSync('lib/delivery-voice.json','utf8'));
for(const item of expandedItems)assert.equal(voices[`segment_item_${item.id}`].text,item.name);
for(const [id,name] of Object.entries(expandedStops))assert.equal(voices[`segment_stop_${id}`].text,name);
if(!process.argv.includes('--rules-only')){
 const manifest=JSON.parse(readFileSync('lib/game-resources.generated.json','utf8'));
 const art=JSON.parse(readFileSync('assets/illustrations/expansion-v5/manifest.json','utf8'));
 assert.equal(art.assets.length,42);
 for(const id of expansionArtIds){const url=illustrationUrl(id);assert.ok(manifest.assets[url],id);assert.equal(manifest.assets[url].bytes,readFileSync('public'+url).length);assert.ok(!url.includes('/sources/'));}
 for(const game of ['delivery','sudoku','difference','queue','bridge','traffic','listen','detour'])for(const c of carCatalog)assert.ok(manifest.games[game].includes(illustrationUrl(c.id)),`${game}: ${c.id}`);
 for(const item of items)assert.ok(manifest.games.delivery.includes(illustrationUrl(cargoIllustration[item.id])));
 for(const id of stopIds)for(const game of ['delivery','listen','detour','traffic'])assert.ok(manifest.games[game].includes(illustrationUrl(destinationIllustration[id])));
 for(const id of expandedCars)assert.ok(!manifest.games.repair.includes(illustrationUrl(id)));
}
console.log('PASS expansion: 20/50/20 active IDs; 42 sprites; 240 seeds per puzzle level; all vehicles/cargo/stops reachable; repair remains six supported cars; reusable voice coverage.');
