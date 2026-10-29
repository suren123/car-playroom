import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {items,stopIds,levels,createDelivery} from '../games/delivery/model.ts';
import {cargoSpeechKeys,routeSpeechKeys,orderSpeechKeys,joinSpeechWav} from '../lib/delivery-speech.ts';
const manifest=JSON.parse(readFileSync('lib/delivery-voice.json','utf8'));
for(const level of levels)for(let seed=0;seed<200;seed++){
 for(const task of createDelivery(level.id,seed).tasks){
  const keys=orderSpeechKeys(task.cargo,task.stops);
  assert.deepEqual(keys,[...cargoSpeechKeys(task.cargo),...routeSpeechKeys(task.stops)],`level ${level.id} order omitted cargo or stops`);
  assert.equal(keys.filter(key=>key.startsWith('segment_item_')).length,level.count);
  assert.equal(keys.filter(key=>key.startsWith('segment_stop_')).length,level.stops);
  assert.ok(keys.every(key=>manifest[key]));
 }
}
assert.deepEqual(orderSpeechKeys(['box'],['unknown']),[]);
assert.deepEqual(orderSpeechKeys(['unknown'],['fire']),[]);
for(const first of items)for(const second of items){
 const ids=first===second?[first.id]:[first.id,second.id],keys=cargoSpeechKeys(ids);
 assert.deepEqual(keys.filter(k=>k.startsWith('segment_item_')),ids.map(id=>`segment_item_${id}`));
 assert.equal(keys.filter(k=>k==='segment_and').length,ids.length-1);
 assert.ok(keys.every(k=>manifest[k]));
}
for(const first of stopIds)for(const second of stopIds){
 const ids=first===second?[first]:[first,second];
 assert.deepEqual(routeSpeechKeys(ids),ids.flatMap((id,i)=>[i?'segment_next':'segment_first',`segment_stop_${id}`]));
 assert.ok(routeSpeechKeys(ids).every(k=>manifest[k]));
}
for(const invalid of [[],['unknown'],['wheel','wheel','wheel']])assert.deepEqual(cargoSpeechKeys(invalid),[]);
assert.deepEqual(routeSpeechKeys(['__proto__']),[]);
const clip=(values,rate=1000)=>({sampleRate:rate,length:values.length,numberOfChannels:1,getChannelData:()=>Float32Array.from(values)});
const a=clip([...Array(100).fill(0),...Array(20).fill(.5),...Array(100).fill(0)]);
const b=clip([...Array(100).fill(0),...Array(20).fill(-.5),...Array(100).fill(0)]);
const wav=joinSpeechWav([a,b]),view=new DataView(wav.buffer);
assert.equal(Buffer.from(wav.subarray(0,4)).toString(),'RIFF');assert.equal(view.getUint32(24,true),1000);
assert.equal(view.getUint16(22,true),1);assert.equal(view.getUint16(34,true),16);
assert.equal(view.getUint32(40,true),260*2,'trimmed 100 + 60ms gap + 100 frames');
assert.equal(wav.length,44+260*2);
assert.equal(view.getInt16(44+40*2,true),16384);assert.equal(view.getInt16(44+200*2,true),-16384);
assert.ok(Array.from(wav.subarray(44+100*2,44+160*2)).every(x=>x===0),'inter-fragment gap not silent');
assert.throws(()=>joinSpeechWav([]));assert.throws(()=>joinSpeechWav([clip([0,0])]));assert.throws(()=>joinSpeechWav([a,clip([1],2000)]));
const clipped=new DataView(joinSpeechWav([clip([-2,2])]).buffer);assert.equal(clipped.getInt16(44,true),-32768);assert.equal(clipped.getInt16(46,true),32767);
console.log('PASS: all cargo/route fragment combinations, ordered narration, missing IDs, trimmed PCM assembly, pause gaps, clipping and invalid fragments.');
