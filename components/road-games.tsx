'use client';
import { useEffect, useReducer, useRef, useState } from 'react';
import { LittleIcon } from './car-art';
import { VehicleArt } from './vehicle-art';
import { makeRoadRound, roadReducer, type RoadAction, type RoadMode, type RoadRound, type Stop } from '../lib/road-games';
import { vehicleNames } from '../lib/replay-games';
import { RoundRecorder, type RecordDifficulty } from '../lib/records-client';
import { stopSpeech } from '../lib/speech';

const titles:Record<RoadMode,string>={traffic:'红绿灯小司机',queue:'小汽车排队',listen:'消防车听指挥',detour:'道路施工改道'};
const places:Record<Stop,{name:string;symbol:string}>={fuel:{name:'加油站',symbol:'⛽'},fire:{name:'灭火点',symbol:'🚒'},garage:{name:'小车库',symbol:'⌂'}};
const signals={red:{name:'红灯停',symbol:'●'},green:{name:'绿灯走',symbol:'●'}} as const;
function prompt(round:RoadRound){
 if(round.kind==='traffic')return round.signals[round.index]==='red'?'红灯，停一停。':'绿灯，可以出发。';
 if(round.kind==='queue')return round.own===null?'先选你的小汽车。':'看看队伍，轮到最前面的车出发。';
 if(round.kind==='listen')return `消防车听指挥。${round.stops.map((x,i)=>`${i===0?'先':'再'}去${places[x].name}`).join('，')}。`;
 return round.started?'前面施工啦，换一条没有封住的路。':'准备出发，看看路上有什么变化。';
}
function progress(round:RoadRound){return round.kind==='traffic'?round.index:round.kind==='queue'?round.index:round.kind==='listen'?round.index:round.complete?1:0;}
export default function RoadGame({kind,level,onExit,say,queueIndex,onQueueFinish}:{kind:RoadMode;level:RecordDifficulty;onExit:()=>void;say:(text:string)=>void;queueIndex:number;onQueueFinish:()=>void}){
 const [serial,setSerial]=useState(0),[paused,setPaused]=useState(false);
 const seed=useRef((Date.now()+Math.floor(Math.random()*1000000))>>>0);
 const autoLevel=useRef(0),streak=useRef(0);
 const [round,dispatch]=useReducer(roadReducer,makeRoadRound(kind,seed.current,level==='challenge',queueIndex));
 const roundRef=useRef(round);roundRef.current=round;
 const awaitingRetry=useRef(false);
 const recorder=useRef<RoundRecorder|null>(null);if(!recorder.current)recorder.current=new RoundRecorder(kind,level);
 useEffect(()=>{say(prompt(roundRef.current));},[serial,kind]);
 useEffect(()=>{const visibility=()=>{if(document.hidden&&!roundRef.current.complete){setPaused(true);stopSpeech();}};document.addEventListener('visibilitychange',visibility);return()=>document.removeEventListener('visibilitychange',visibility);},[]);
 function act(action:RoadAction){
  if(paused)return;const before=roundRef.current,next=roadReducer(before,action);if(next===before)return;
  if(action.type==='hint')recorder.current?.note('hints');
  if(next.wrong>before.wrong){recorder.current?.note('wrong');awaitingRetry.current=true;}
  if(next.premature>before.premature)recorder.current?.note('premature');
  if(awaitingRetry.current&&progress(next)>progress(before)){recorder.current?.note('retries');awaitingRetry.current=false;}
  roundRef.current=next;dispatch(action);
  if(next.complete&&!before.complete){void recorder.current?.finish(true);if(kind==='queue')onQueueFinish();
   if(level==='auto'){if(next.wrong>=2||next.hints>=2){autoLevel.current=0;streak.current=0;}else if(next.wrong<=1&&next.hints===0){streak.current++;if(streak.current>=2){autoLevel.current=1;streak.current=0;}}}
   say(next.message);}
  else if(next.message) say(next.message);
  else say(prompt(next));
 }
 function restart(){
  if(!roundRef.current.complete)void recorder.current?.finish(false);
  seed.current=(seed.current+0x9e3779b9)>>>0;const next=makeRoadRound(kind,seed.current,level==='challenge'||level==='auto'&&autoLevel.current>0,queueIndex+(kind==='queue'?serial+1:0));
  roundRef.current=next;awaitingRetry.current=false;recorder.current=new RoundRecorder(kind,level);dispatch({type:'reset',round:next});
  setSerial(x=>x+1);
 }
 function exit(){if(!roundRef.current.complete)void recorder.current?.finish(false);stopSpeech();onExit();}
 const total=round.kind==='traffic'?round.signals.length:round.kind==='queue'?3:round.kind==='listen'?round.stops.length:1;
 const done=progress(round);
 return <main className="road-game">
  <div className="round-toolbar"><button className="room-back" onClick={()=>{recorder.current?.note('pauses');setPaused(true);}}><LittleIcon kind="home"/>大厅</button><span className="road-progress">{done} / {total}</span><button className="room-pause" onClick={()=>{recorder.current?.note('pauses');setPaused(true);}}><LittleIcon kind="pause"/>休息</button></div>
  <div className="round-title"><h1>{titles[kind]}</h1><button className="room-icon" aria-label="听任务" onClick={()=>say(prompt(round))}><LittleIcon kind="sound"/></button></div>
  {round.complete?<section className="round-finish road-finish"><div className="road-celebrate">🚒 ✨ 🚗</div><h1>完成啦！</h1><div className="finish-actions"><button className="room-primary" onClick={restart}>再玩一局</button><button className="room-secondary" onClick={exit}>回大厅</button></div></section>:<>
   {round.kind==='traffic'&&<section className="road-panel"><div className={`traffic-lamp ${round.signals[round.index]}`} role="img" aria-label={signals[round.signals[round.index]].name}><span className="red-light"/><span className="green-light"/></div><div className="road-car"><VehicleArt kind="fire"/></div><div className="road-choices"><button className={`road-choice road-stop ${round.hintLevel>=2&&round.signals[round.index]==='red'?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''}`} onClick={()=>act({type:'signal',signal:'red'})}>✋ <span>停</span></button><button className={`road-choice road-go ${round.hintLevel>=2&&round.signals[round.index]==='green'?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''}`} onClick={()=>act({type:'signal',signal:'green'})}>🚗 <span>走</span></button></div></section>}
   {round.kind==='queue'&&<section className="road-panel"><p className="road-short">{round.own===null?'选你的车':'按队伍顺序出发'}</p><div className="queue-cars">{(round.own===null?round.cars:round.order).map((car,i)=><button key={car} className={`queue-car ${round.own!==null&&round.index===i&&!round.challenge?'queue-active':''} ${round.hintLevel>=2&&round.own!==null&&round.index===i?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''}`} onClick={()=>act(round.own===null?{type:'own',car}:{type:'depart',car})}><span className="queue-owner">{round.own===null?'选我':car===round.own?'👦 我的车':'🧑 大人的车'}</span><VehicleArt kind={car}/><strong>{round.own===null?vehicleNames[car]:`${i+1}号`}</strong></button>)}</div><p className="road-short">{round.own===null?'':round.order[round.index]===round.own?'轮到我的车啦':'等前面的车走'}</p></section>}
   {round.kind==='listen'&&<section className="road-panel"><div className="listen-sequence" aria-label="任务顺序">{round.stops.map((stop,i)=><span key={i} className={i<round.index?'is-done':i===round.index?'is-current':''}>{places[stop].symbol}</span>)}</div><div className="road-car"><VehicleArt kind="fire"/></div><div className="road-choices">{(Object.keys(places) as Stop[]).map(stop=><button key={stop} className={`road-choice ${round.hintLevel>=2&&round.stops[round.index]===stop?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''}`} onClick={()=>act({type:'stop',stop})}><span className="road-emoji">{places[stop].symbol}</span><span>{places[stop].name}</span></button>)}</div><button className="room-secondary" onClick={()=>say(prompt(round))}><LittleIcon kind="sound"/>再听一遍</button></section>}
   {round.kind==='detour'&&<section className="road-panel"><div className="road-car"><VehicleArt kind="fire"/></div>{!round.started?<><div className="familiar-route">🚗 → 🛣️ 常走的路</div><button className="room-primary road-begin" onClick={()=>act({type:'begin'})}>出发看看 <span>→</span></button></>:<div className="road-choices">{Array.from({length:round.roads},(_,road)=><button key={road} className={`road-choice detour-choice ${road===round.blocked?'is-blocked':''} ${round.hintLevel>=2&&road!==round.blocked?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''}`} onClick={()=>act({type:'road',road})}><span className="road-emoji">{road===round.blocked?'🚧':'🛣️'}</span><span>{road===round.blocked?'施工中':`${road+1}号路`}</span></button>)}</div>}</section>}
   <div className="round-feedback" role="status" aria-live="polite">{round.message||prompt(round)}</div><div className="round-actions"><button className="room-secondary" onClick={()=>act({type:'hint'})}><LittleIcon kind="hint"/>提示</button></div>
  </>}
  {paused&&<div className="room-overlay"><section className="playroom-modal" role="dialog" aria-modal="true" aria-labelledby="road-pause-title"><div className="rest-picture"><LittleIcon kind="pause"/></div><h2 id="road-pause-title">休息一下</h2><button className="room-primary" onClick={()=>{setPaused(false);say(prompt(roundRef.current));}}>继续玩</button><button className="room-secondary" onClick={exit}>结束这局</button></section></div>}
 </main>;
}




