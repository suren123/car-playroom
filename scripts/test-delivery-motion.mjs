import assert from 'node:assert/strict';
import {cargoPorts,flightFrames} from '../games/delivery/transport.ts';
import {carCatalog} from '../games/vehicle-catalog.ts';
assert.deepEqual(Object.keys(cargoPorts).sort(),carCatalog.map(c=>c.id).sort());
for(const port of Object.values(cargoPorts))assert.ok(port.x>.1&&port.x<.9&&port.y>.2&&port.y<.8);
for(let i=0;i<500;i++){
 const from={x:i%768,y:200+i%600,size:40+i%30},to={x:400+i%150,y:150+i%100,size:24};
 const frames=flightFrames(from,to);assert.deepEqual(frames.map(f=>f.offset),[0,.42,1]);
 assert.equal(frames[0].transform,'translate(0px,0px) scale(1)');
 assert.equal(frames[2].transform,`translate(${to.x-from.x}px,${to.y-from.y}px) scale(${to.size/from.size})`);
 assert.ok(frames.every(f=>!f.transform.includes('NaN')&&!f.transform.includes('Infinity')));
}
console.log('PASS: 20 vehicle ports and 500 actual-position flight trajectories, finite geometry and exact endpoints.');
