import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {items} from '../games/delivery/model.ts';
import {carCatalog} from '../games/vehicle-catalog.ts';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const old=read('lib/audio-manifest.json'),voices=read('lib/delivery-voice.json'),effects=read('lib/effects-manifest.json');
for(const clip of Object.values(old))assert.ok(statSync(join('public','audio',clip.file)).size>0,clip.file);
for(const clip of Object.values(voices))assert.ok(statSync(join('public',clip.file.slice(1))).size>0,clip.file);
assert.ok(Object.keys(voices).length>=24);assert.equal(Object.keys(effects).length,12);
assert.equal(carCatalog.length,12);assert.equal(new Set(carCatalog.map(car=>car.id)).size,12);assert.ok(carCatalog.every(car=>car.states.includes('idle')&&car.states.includes('drive')));
for(let i=0;i<items.length;i++){assert.ok(voices[`cargo_${items[i].id}`],items[i].id);for(let j=i+1;j<items.length;j++){const key=`cargo_${[items[i].id,items[j].id].sort().join('_')}`;assert.ok(voices[key],key);}}
const wav=readFileSync('public/audio/effects.wav');assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.toString('ascii',8,12),'WAVE');
const duration=(wav.length-44)/(24000*2);let last=0;
for(const [name,clip] of Object.entries(effects)){assert.ok(clip.start>=last&&clip.duration>0&&clip.start+clip.duration<=duration,name);last=clip.start+clip.duration;}
console.log(`PASS: ${Object.keys(old).length} existing and ${Object.keys(voices).length} delivery voices; 12 indexed effects.`);
