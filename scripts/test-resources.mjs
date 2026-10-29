import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ResourceSession,resourceKey} from '../lib/resource-loader.ts';
import {buildGameResources} from './game-resource-catalog.mjs';
import {normalizeSpeechText as normalize} from '../lib/speech-text.ts';
import {makeRoadRound,roadReducer} from '../lib/road-games.ts';
import {gameReducer,initialState,repairTasks,bridgeTasks} from '../lib/game.ts';
import {makeRound,makeDifference,makeSudoku,replayReducer,sudokuSpeech,differenceSpeech} from '../lib/replay-games.ts';

const manifest=buildGameResources();
assert.deepEqual(JSON.parse(readFileSync('lib/game-resources.generated.json','utf8')),manifest);
const general=JSON.parse(readFileSync('lib/audio-manifest.json','utf8')),delivery=JSON.parse(readFileSync('lib/delivery-voice.json','utf8'));
const spoken=new Map(Object.values(general).map(x=>[normalize(x.text),`/audio/${x.file}`]));
for(const x of Object.values(delivery))spoken.set(normalize(x.text),x.file);
const covered=(game,text)=>{if(text){const url=spoken.get(normalize(text));assert.ok(url,`${game}: no recording for ${text}`);assert.ok(manifest.games[game].includes(url),`${game}: omitted ${url}`);}};
const check=(game,state)=>{covered(game,state.message);return state;};
assert.equal(Object.keys(manifest.games).length,10);
for(const [game,urls] of Object.entries(manifest.games)){
 assert.equal(new Set(urls).size,urls.length);assert.ok(urls.includes('/audio/effects.wav'));assert.ok(urls.includes(delivery.sound_retry.file));
 for(const url of urls){assert.match(url,/^\/(audio|assets\/illustrations)\//);assert.ok(manifest.assets[url].bytes>0);}
 if(game!=='delivery'){covered(game,'我们继续玩。');covered(game,'我们从这里继续，慢慢来。');covered(game,'看手指示范，再试试。');}
}
for(const kind of ['repair','bridge']){
 let state=check(kind,gameReducer(initialState,{type:'start',mode:kind}));
 for(let task=0;task<3;task++){
  for(const action of [{type:'hint'},{type:'help'},{type:'retry'}])check(kind,gameReducer(state,action));
  if(kind==='repair'){for(const variant of [1,2])check(kind,gameReducer(state,{type:'choose',variant}));state=check(kind,gameReducer(state,{type:'choose',variant:0}));}
  else for(let i=0;i<4;i++){check(kind,gameReducer(state,{type:'place',actor:state.turn==='child'?'parent':'child',now:i*1000}));state=check(kind,gameReducer(state,{type:'place',actor:state.turn,now:i*1000}));}
  state=check(kind,gameReducer(state,{type:'next'}));
 }
}
for(const x of repairTasks)for(const key of ['instruction','hint','success'])covered('repair',x[key]);
for(const x of bridgeTasks)covered('bridge',x.line+'先轮到小司机。');
for(const kind of ['traffic','queue','listen','detour'])for(const challenge of [false,true])for(let seed=1;seed<=20;seed++){
 let state=makeRoadRound(kind,seed,challenge,seed%3);
 for(let i=0;i<3;i++)state=check(kind,roadReducer(state,{type:'hint'}));
 if(kind==='queue')state=check(kind,roadReducer(state,{type:'own',car:state.cars[0]}));
 if(kind==='detour')state=check(kind,roadReducer(state,{type:'begin'}));
 while(!state.complete){
  if(kind==='listen'&&state.groupDone){state=roadReducer(state,{type:'nextListen'});continue;}
  const wrong=kind==='traffic'?{type:'signal',signal:state.signals[state.index]==='red'?'green':'red'}:kind==='queue'?{type:'depart',car:state.order.at(-1)}:kind==='listen'?{type:'stop',stop:['fuel','fire','garage'].find(s=>s!==state.stops[state.index])}:{type:'road',road:state.blocked};
  for(let i=0;i<3;i++)check(kind,roadReducer(state,wrong));
  if(kind==='listen')covered(kind,`消防车听指挥。${state.stops.map((s,i)=>`${i?'再':'先'}去${{fuel:'加油站',fire:'灭火点',garage:'小车库'}[s]}`).join('，')}。`);
  const correct=kind==='traffic'?{type:'signal',signal:state.signals[state.index]}:kind==='queue'?{type:'depart',car:state.order[state.index]}:kind==='listen'?{type:'stop',stop:state.stops[state.index]}:{type:'road',road:(state.blocked+1)%state.roads};
  state=check(kind,roadReducer(state,correct));
 }
}
for(const [game,texts] of Object.entries({sudoku:Object.values(sudokuSpeech),difference:Object.values(differenceSpeech),sort:['这次按颜色停车。','这次按车型停车。','这次按用途停车。'],traffic:['红灯，停一停。','绿灯，可以出发。'],queue:['先选你的小汽车。','看看队伍，轮到最前面的车出发。'],detour:['准备出发，看看路上有什么变化。','前面施工啦，换一条没有封住的路。']}))for(const text of texts)covered(game,text);
for(const game of ['sort','difference','sudoku']){
 let s=game==='sort'?makeRound('sort',18,false):game==='difference'?makeDifference('challenge',18):makeSudoku(4,18);
 for(let i=0;i<3;i++)s=check(game,replayReducer(s,{type:'hint'}));
}
for(const clip of Object.values(delivery))assert.ok(manifest.games.delivery.includes(clip.file));
assert.equal(manifest.games.sudoku.filter(x=>x.endsWith('.png')).length,20);
assert.equal(manifest.games.difference.filter(x=>x.endsWith('.png')).length,20);

// Injectable fetch/cache/decode boundaries exercise real queue, retry and ownership logic.
const hash=data=>createHash('sha256').update(Buffer.from(data)).digest('hex');
const payload=Buffer.from('a valid test resource');
const item=i=>({url:`/audio/test-${i}.mp3`,kind:'voice',bytes:payload.length,revision:hash(payload)});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const signals=new Set();let active=0,max=0,requests=0,releases=0,prepares=0;
const cached=new Map();
const cache={match:async key=>cached.get(key)?.clone(),put:async(key,value)=>{cached.set(key,value.clone());},delete:async key=>cached.delete(key)};
const deps={
 cache:async()=>cache,verify:async(data,rev)=>hash(data)===rev,
 prepare:async()=>{prepares++;return {src:'blob:test',release:()=>releases++};},
 fetch:async(_url,{signal})=>{requests++;active++;max=Math.max(max,active);signals.add(signal);await sleep(3);active--;if(signal.aborted)throw new DOMException('cancelled','AbortError');return new Response(payload);}
};
const session=new ResourceSession(Array.from({length:11},(_,i)=>item(i)),deps),progress=[];
await Promise.all([session.load(p=>progress.push(p)),session.load(()=>{})]);assert.equal(requests,11);assert.ok(max<=4);assert.equal(progress.at(-1).phase,'ready');assert.equal(progress.at(-1).loaded,11*payload.length);
await session.load(()=>{});assert.equal(requests,11);session.dispose();assert.equal(releases,11);assert.equal(session.prepared.size,0);
const cachedSession=new ResourceSession([item(0),item(1)],deps);await cachedSession.load(()=>{});assert.equal(requests,11);cachedSession.dispose();
const revised={...item(0),revision:hash(Buffer.from('different version'))};assert.notEqual(resourceKey(revised),resourceKey(item(0)));
let fail=true;const retry=new ResourceSession([item(30),item(31)],{...deps,fetch:async url=>{requests++;return url.includes('test-31')&&fail?new Response('missing',{status:404}):new Response(payload);}});
const before=requests;await assert.rejects(retry.load(()=>{}));assert.equal(retry.prepared.size,1);fail=false;await retry.load(()=>{});assert.equal(requests-before,3);retry.dispose();
const unavailable=new ResourceSession([item(40)],{...deps,cache:async()=>{throw Error('denied');}});await unavailable.load(()=>{});unavailable.dispose();
const quota=new ResourceSession([item(41)],{...deps,cache:async()=>({...cache,put:async()=>{throw Error('quota');}})});await quota.load(()=>{});quota.dispose();
cached.set(resourceKey(item(50)),new Response('bad old bytes'));const repaired=new ResourceSession([item(50)],deps);await repaired.load(()=>{});repaired.dispose();
const corrupt=new ResourceSession([item(51)],{...deps,fetch:async()=>new Response(Buffer.alloc(payload.length))});await assert.rejects(corrupt.load(()=>{}));assert.equal(corrupt.prepared.size,0);corrupt.dispose();
const undecodable=new ResourceSession([item(52)],{...deps,prepare:async()=>{throw Error('decode');}});await assert.rejects(undecodable.load(()=>{}));assert.ok(!cached.has(resourceKey(item(52))));undecodable.dispose();
const stalled=new ResourceSession([item(60)],{...deps,timeoutMs:15,fetch:async(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new Error('timeout')),{once:true}))});await assert.rejects(stalled.load(()=>{}));stalled.dispose();
// Each arriving chunk resets the inactivity timeout, even on a slow transfer.
const streaming=new ResourceSession([item(61)],{...deps,timeoutMs:40,fetch:async()=>new Response(new ReadableStream({async start(c){for(const part of [payload.subarray(0,5),payload.subarray(5,10),payload.subarray(10)]){await sleep(15);c.enqueue(part);}c.close();}}))});await streaming.load(()=>{});streaming.dispose();
const cancel=new ResourceSession(Array.from({length:10},(_,i)=>item(70+i)),deps);const pending=cancel.load(()=>{});await sleep(1);cancel.dispose();await assert.rejects(pending,{name:'AbortError'});assert.equal(cancel.prepared.size,0);
let finishDecode;const late=new ResourceSession([item(90)],{...deps,prepare:()=>new Promise(resolve=>{finishDecode=()=>resolve({src:'blob:late',release:()=>releases++});})});const waiting=late.load(()=>{});while(!finishDecode)await sleep(1);const released=releases;late.dispose();finishDecode();await assert.rejects(waiting,{name:'AbortError'});assert.equal(releases,released+1);assert.equal(late.prepared.size,0);
console.log('PASS: ten-game manifest and speech coverage; 4-worker cap, byte progress, reuse, retry, content hashes, corrupt cache, decode failures, storage fallback, inactivity timeout, cancellation and late cleanup.');
