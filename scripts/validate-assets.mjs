import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {sudokuSpeech,sudokuKinds,differenceSpeech,differenceKinds} from '../lib/replay-games.ts';
import {illustrationUrl,cargoIllustration,destinationIllustration,redrawnIllustrations} from '../games/illustration-assets.ts';
import {createHash} from 'node:crypto';
import {deliveryIllustrationFrames} from '../games/delivery/illustration-frames.ts';
import {items,stopIds,stopNames} from '../games/delivery/model.ts';
import {cargoSpeechKeys,routeSpeechKeys} from '../lib/delivery-speech.ts';
import {carCatalog} from '../games/vehicle-catalog.ts';
import sharp from 'sharp';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const old=read('lib/audio-manifest.json'),voices=read('lib/delivery-voice.json'),effects=read('lib/effects-manifest.json');
assert.deepEqual(old,read('public/audio/manifest.json'));
for(const text of [...Object.values(sudokuSpeech),...Object.values(differenceSpeech)])assert.ok(Object.values(old).some(clip=>clip.text===text),`missing game speech: ${text}`);
assert.equal(old['sudoku-rules'],undefined);
for(const kind of new Set([...sudokuKinds,...differenceKinds]))assert.ok(statSync(join('public',illustrationUrl(kind).slice(1))).size>0,kind);
for(const clip of Object.values(old))assert.ok(statSync(join('public','audio',clip.file)).size>0,clip.file);
for(const clip of Object.values(voices))assert.ok(statSync(join('public',clip.file.slice(1))).size>0,clip.file);
assert.ok(Object.keys(voices).length>=24);assert.equal(Object.keys(effects).length,12);
assert.equal(carCatalog.length,12);assert.equal(new Set(carCatalog.map(car=>car.id)).size,12);assert.ok(carCatalog.every(car=>car.states.includes('idle')&&car.states.includes('drive')));
for(const first of items)for(const second of items){for(const key of cargoSpeechKeys(first===second?[first.id]:[first.id,second.id]))assert.ok(voices[key],key);}
for(const first of stopIds)for(const second of stopIds){for(const key of routeSpeechKeys(first===second?[first]:[first,second]))assert.ok(voices[key],key);}
assert.ok(!Object.keys(voices).some(key=>key.startsWith('cargo_')||key.startsWith('route_')),'legacy combination recordings retained');
for(const item of items)assert.equal(voices[`segment_item_${item.id}`].text,item.name,`cargo voice label: ${item.id}`);
for(const stop of stopIds)assert.equal(voices[`segment_stop_${stop}`].text,stopNames[stop],`station voice label: ${stop}`);
const additions=read('assets/illustrations/delivery-expansion/manifest.json');
assert.equal(additions.length,66);assert.equal(additions.filter(x=>x.enabled).length,27);
const resourceManifest=read('lib/game-resources.generated.json');
const redraw=read('assets/illustrations/unified-v3/manifest.json');
assert.deepEqual(redraw.map(x=>x.id).sort(),[...redrawnIllustrations].sort());
for(const asset of redraw){
 const original=readFileSync(asset.source),runtime=readFileSync(join('public',asset.url));
 assert.equal(createHash('sha256').update(original).digest('hex'),asset.sourceSha256,`original: ${asset.id}`);
 assert.equal(createHash('sha256').update(runtime).digest('hex'),asset.sha256,`runtime: ${asset.id}`);
 assert.equal(runtime.length,asset.bytes);assert.equal(illustrationUrl(asset.id),asset.url);
 const {data,info}=await sharp(runtime).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.deepEqual([info.width,info.height],asset.size);
 assert.ok(Math.max(...asset.size)<=Math.max(...asset.sourceSize),'do not upscale originals');
 let transparent=0,solid=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const alpha=data[(y*info.width+x)*4+3];if(alpha===0)transparent++;if(alpha>240)solid++;
  if(x===0||y===0||x===info.width-1||y===info.height-1)assert.ok(alpha<=2,`clipped edge: ${asset.id}`);
 }
 assert.ok(transparent>info.width*info.height*.05&&solid>info.width*info.height*.2,`transparent sprite with solid subject: ${asset.id}`);
 assert.equal(resourceManifest.assets[asset.url].revision,asset.sha256);
 assert.ok(!Object.keys(resourceManifest.assets).some(url=>url.includes('/originals/')));
}
for(const [game,ids] of Object.entries({repair:['fire'],bridge:['fire'],traffic:['fire','bus'],queue:['fire','bus','digger'],listen:['fire','bus','stop-gas','fireStation','warehouse'],detour:['fire','bus','cargo-barrier']}))for(const id of ids)assert.ok(resourceManifest.games[game].includes(illustrationUrl(id)),`${game}: unprepared ${id}`);
assert.ok(resourceManifest.games.delivery.reduce((n,url)=>n+resourceManifest.assets[url].bytes,0)<=6*1024*1024,'delivery preload budget');
for(const id of [...Object.values(cargoIllustration),...Object.values(destinationIllustration)])assert.ok(resourceManifest.games.delivery.includes(illustrationUrl(id)),`unprepared delivery asset: ${id}`);
for(const item of additions){
 const original=readFileSync(join('assets/illustrations/delivery-expansion/originals',item.file));
 assert.equal(createHash('sha256').update(original).digest('hex'),item.sha256,`original changed: ${item.file}`);
 const url=`/assets/illustrations/delivery-v2/${item.file}`;
 if(item.enabled){
  assert.deepEqual(readFileSync(join('public',url.slice(1))),original);
  assert.equal(resourceManifest.games.delivery.includes(url),!redrawnIllustrations.includes(item.file.slice(0,-4)),'only current artwork should preload');
  const frame=deliveryIllustrationFrames[item.file.slice(0,-4)],bounds=item.visibleBounds;
  assert.deepEqual([frame.width,frame.height],item.size);
  const [left,top,width,height]=frame.viewBox.split(' ').map(Number);
  assert.ok(left>=0&&top>=0&&left<=bounds[0]&&top<=bounds[1]&&left+width>=bounds[2]&&top+height>=bounds[3]&&left+width<=frame.width&&top+height<=frame.height,`clipped visible artwork: ${item.file}`);
 }
 else assert.ok(!resourceManifest.games.delivery.includes(url),'reserve art should not preload');
}

const wav=readFileSync('public/audio/effects.wav');assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.toString('ascii',8,12),'WAVE');
const duration=(wav.length-44)/(24000*2);let last=0;
for(const [name,clip] of Object.entries(effects)){assert.ok(clip.start>=last&&clip.duration>0&&clip.start+clip.duration<=duration,name);last=clip.start+clip.duration;}
console.log(`PASS: ${Object.keys(old).length} existing and ${Object.keys(voices).length} delivery voices; 12 indexed effects.`);
