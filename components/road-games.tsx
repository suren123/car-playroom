'use client';
import GameBackButton from './game-back-button';
import {gameBackTarget} from '../lib/game-navigation';
import AudioNotice from './audio-notice';
import StorageNotice from '../components/storage-notice';
import { useEffect, useReducer, useRef, useState } from 'react';
import { LittleIcon } from './car-art';
import {Illustration} from './illustration';
import {vehicleIllustration,type IllustrationId} from '../games/illustration-assets';
import {RoadTile,StopHand} from './road-art';
import './unified-art.css';
import { makeRoadRound, roadReducer, type RoadAction, type RoadMode, type RoadRound, type Stop } from '../lib/road-games';
import { vehicleNames,type VehicleKind } from '../lib/replay-games';
import { RoundRecorder, type RecordDifficulty } from '../lib/records-client';
import { stopSpeech } from '../lib/speech';
import {gameNames} from '../games/registry';
import ParentPanel from './parent-panel';
import {usePauseAnimations} from '../hooks/use-pause-animations';
import {useAudioSettings} from '../lib/use-audio-settings';

const titles:Record<RoadMode,string>={traffic:gameNames.traffic,queue:gameNames.queue,listen:gameNames.listen,detour:gameNames.detour};
const places:Record<Stop,{name:string;art:IllustrationId}>={fuel:{name:'加油站',art:'stop-gas'},fire:{name:'灭火点',art:'fireStation'},garage:{name:'小车库',art:'warehouse'}};
const signals={red:{name:'红灯停',symbol:'●'},green:{name:'绿灯走',symbol:'●'}} as const;
function prompt(round:RoadRound){
 if(round.kind==='traffic')return round.signals[round.index]==='red'?'红灯，停一停。':'绿灯，可以出发。';
 if(round.kind==='queue')return round.own===null?'先选你的小汽车。':'看看队伍，轮到最前面的车出发。';
 if(round.kind==='listen')return `消防车听指挥。${round.stops.map((x,i)=>`${i===0?'先':'再'}去${places[x].name}`).join('，')}。`;
 return round.started?'前面施工啦，换一条没有封住的路。':'准备出发，看看路上有什么变化。';
}
function progress(round:RoadRound){return round.kind==='traffic'?round.index:round.kind==='queue'?round.index:round.kind==='listen'?round.group+(round.groupDone?1:0):round.complete?1:0;}
export default function RoadGame({kind,level,onBack,say,queueIndex,onQueueFinish,account,onHome}:{kind:RoadMode;level:RecordDifficulty;onBack:()=>void;say:(text:string)=>void;queueIndex:number;onQueueFinish:()=>void;account:string;onHome:()=>void}){
 const root=useRef<HTMLElement>(null),leaving=useRef(false);
 const [lastCar,setLastCar]=useState<VehicleKind|null>(null);
 const [serial,setSerial]=useState(0),[paused,setPaused]=useState(false),[transitioning,setTransitioning]=useState(false);
 const [parentPanel,setParentPanel]=useState(false),[nextLevel,setNextLevel]=useState(level);
 const [suggestNext,setSuggestNext]=useState(false),autoStage=useRef(0);
 const {settings,setAudioSettings}=useAudioSettings();
 usePauseAnimations(root,paused||parentPanel);
 const transitionRemaining=useRef(450);
 const transitionLock=useRef(false),transitionTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const seed=useRef((Date.now()+Math.floor(Math.random()*1000000))>>>0);
 const queueCounter=useRef(queueIndex);
 const [round,dispatch]=useReducer(roadReducer,makeRoadRound(kind,seed.current,level==='challenge',queueIndex));
 const roundRef=useRef(round);roundRef.current=round;
 const awaitingRetry=useRef(false);
 const recorder=useRef<RoundRecorder|null>(null);
 useEffect(()=>{
  recorder.current=kind==='queue'?null:new RoundRecorder(kind,level);
  try{autoStage.current=Number(localStorage.getItem(`car-playroom-stage:${account}:${kind}`))===1?1:0;}catch{/* Use the simple stage. */}
  const initial=makeRoadRound(kind,seed.current,level==='challenge'||level==='auto'&&autoStage.current>0,queueIndex);
  if(initial.kind==='queue')try{const saved=localStorage.getItem(`car-playroom-queue-car:${account}`) as VehicleKind;if(initial.cars.includes(saved))setLastCar(saved);}catch{}
  roundRef.current=initial;dispatch({type:'reset',round:initial});say(prompt(initial));
  return()=>{recorder.current?.dispose();recorder.current=null;};
 },[account,kind]);
 useEffect(()=>{if(serial>0)say(prompt(roundRef.current));},[serial,kind]);
 useEffect(()=>{const visibility=()=>{if(document.hidden&&!roundRef.current.complete){setPaused(true);stopSpeech();}};document.addEventListener('visibilitychange',visibility);return()=>document.removeEventListener('visibilitychange',visibility);},[]);
 useEffect(()=>{
  if(!transitioning||paused||parentPanel)return;
  const started=Date.now();
  transitionTimer.current=setTimeout(()=>{transitionLock.current=false;setTransitioning(false);},transitionRemaining.current);
  return()=>{if(transitionTimer.current)clearTimeout(transitionTimer.current);transitionRemaining.current=Math.max(0,transitionRemaining.current-(Date.now()-started));};
 },[transitioning,paused,parentPanel]);
 function act(action:RoadAction){
  if(leaving.current||paused||parentPanel||transitionLock.current)return;const before=roundRef.current;let next=roadReducer(before,action);if(next===before)return;
  if(action.type==='own'&&before.kind==='queue'&&before.own===null&&next.kind==='queue'&&next.own!==null){next={...next,challenge:nextLevel==='challenge'||nextLevel==='auto'&&autoStage.current>0,hintLevel:0,hints:0,wrong:0,premature:0};recorder.current=new RoundRecorder(kind,nextLevel);setLastCar(action.car);try{localStorage.setItem(`car-playroom-queue-car:${account}`,action.car);}catch{}}
  if(before.kind==='traffic'&&next.kind==='traffic'&&next.index>before.index&&!next.complete){transitionRemaining.current=450;transitionLock.current=true;setTransitioning(true);}
  if(action.type==='hint')recorder.current?.note('hints');
  if(next.wrong>before.wrong){recorder.current?.note('wrong');awaitingRetry.current=true;}
  if(next.premature>before.premature)recorder.current?.note('premature');
  if(awaitingRetry.current&&progress(next)>progress(before)){recorder.current?.note('retries');awaitingRetry.current=false;}
  roundRef.current=next;dispatch({type:'reset',round:next});
  if(next.complete&&!before.complete){void recorder.current?.finish(true);if(kind==='queue'){queueCounter.current++;onQueueFinish();}
   if(recorder.current?.snapshot().difficulty==='auto'&&!next.challenge){try{const key=`car-playroom-streak:${account}:${kind}:0`,offered=`${key}:offered`,count=next.wrong<=1&&next.premature===0&&next.hints===0?(Number(localStorage.getItem(key))||0)+1:0;localStorage.setItem(key,String(count));if(count>=2&&!localStorage.getItem(offered)){setSuggestNext(true);localStorage.setItem(offered,'1');}}catch{/* Continue at the same stage. */}}
   say(next.message);}
  else if(action.type==='nextListen')say(prompt(next));
  else if(next.message) say(next.message);
  else say(prompt(next));
 }
 function restart(){
  if(transitionTimer.current)clearTimeout(transitionTimer.current);transitionLock.current=false;setTransitioning(false);
  if(!roundRef.current.complete)void recorder.current?.finish(false);
  seed.current=(seed.current+0x9e3779b9)>>>0;const next=makeRoadRound(kind,seed.current,nextLevel==='challenge'||nextLevel==='auto'&&autoStage.current>0,queueCounter.current);setSuggestNext(false);
  if(next.kind==='queue'&&lastCar&&!next.cars.includes(lastCar))next.cars=[lastCar,...next.cars.slice(1)];
  roundRef.current=next;awaitingRetry.current=false;recorder.current=kind==='queue'?null:new RoundRecorder(kind,nextLevel);dispatch({type:'reset',round:next});
  setSerial(x=>x+1);
 }
 function exit(){
  if(leaving.current)return;
  const before=roundRef.current,target=gameBackTarget(kind,before.kind==='queue'&&before.own===null?'cars':'play');
  if(!before.complete)void recorder.current?.finish(false);recorder.current=null;stopSpeech();
  if(transitionTimer.current)clearTimeout(transitionTimer.current);transitionLock.current=false;setTransitioning(false);
  if(target==='cars'&&before.kind==='queue'){
   seed.current=(seed.current+0x9e3779b9)>>>0;
   const next=makeRoadRound('queue',seed.current,nextLevel==='challenge'||nextLevel==='auto'&&autoStage.current>0,queueCounter.current);
   if(next.kind==='queue')next.cars=[...before.cars];
   roundRef.current=next;dispatch({type:'reset',round:next});awaitingRetry.current=false;setPaused(false);setParentPanel(false);setSuggestNext(false);
  }else{leaving.current=true;setPaused(true);onBack();}
 }
 function restartPaused(){if(!window.confirm('重新开始这局？已经完成的步骤会清空。'))return;setPaused(false);setParentPanel(false);restart();}
 function pause(){stopSpeech();recorder.current?.note('pauses');setPaused(true);}
 const total=round.kind==='traffic'?round.signals.length:round.kind==='queue'?3:round.kind==='listen'?round.groups.length:1;
 const done=progress(round);
 return <main ref={root} className={`road-game ${paused||parentPanel?'is-paused':''}`}><StorageNotice/><AudioNotice/>
  <div className="round-toolbar"><GameBackButton onBack={exit}/><span className="road-progress">{done} / {total}</span><button className="room-pause" onClick={()=>{stopSpeech();setPaused(true);setParentPanel(true);}}>家长</button><button className="room-pause" onClick={()=>setAudioSettings({muted:!settings.muted})}>{settings.muted?'开声':'静音'}</button><button className="room-pause" onClick={pause}><LittleIcon kind="pause"/>休息</button></div>
  <div className="round-title"><h1>{titles[kind]}</h1><button className="room-icon" aria-label="听任务" onClick={()=>say(prompt(round))}><LittleIcon kind="sound"/></button></div>
  {round.complete?<section className="round-finish road-finish"><div className="road-celebrate"><Illustration id="fire"/><span aria-hidden="true">✦</span><Illustration id="bus"/></div><h1>完成啦！</h1><div className="finish-actions"><button className="room-primary" onClick={restart}>再玩一局</button><button className="room-secondary" onClick={onHome}>返回首页</button>{suggestNext&&<button className="room-secondary" onClick={()=>{autoStage.current=1;try{localStorage.setItem(`car-playroom-stage:${account}:${kind}`,'1');}catch{}restart();}}>试试下一步</button>}</div></section>:<>
   {round.kind==='traffic'&&<section className="road-panel"><div className={`traffic-lamp ${round.signals[round.index]}`} role="img" aria-label={signals[round.signals[round.index]].name}><span className="red-light"/><span className="green-light"/></div><div className={`road-car ${transitioning?'is-moving':''}`}><Illustration id="fire"/></div><div className="road-choices"><button className={`road-choice road-stop ${round.hintLevel>=2&&round.signals[round.index]==='red'?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''}`} onClick={()=>act({type:'signal',signal:'red'})}><StopHand/><span>停</span></button><button className={`road-choice road-go ${round.hintLevel>=2&&round.signals[round.index]==='green'?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''}`} onClick={()=>act({type:'signal',signal:'green'})}><Illustration id="fire"/><span>走</span></button></div></section>}
   {round.kind==='queue'&&<section className="road-panel"><p className="road-short">{round.own===null?'选你的车':'按队伍顺序出发'}</p>{round.own!==null&&round.index>0&&<div className="queue-arrived" aria-label="已出发的车"><span>已出发</span>{round.order.slice(0,round.index).map(car=><div key={car}><Illustration id={vehicleIllustration[car]}/><small>{car===round.own?'我的车':'大人的车'}</small></div>)}</div>}<div className="queue-cars">{(round.own===null?round.cars:round.order.slice(round.index)).map((car,i)=><button key={car} className={`queue-car ${round.own===null&&lastCar===car?'last-choice':''} ${round.own!==null&&i===0&&!round.challenge?'queue-active':''} ${round.hintLevel>=2&&round.own!==null&&i===0?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''}`} aria-pressed={round.own===null?lastCar===car:undefined} onClick={()=>act(round.own===null?{type:'own',car}:{type:'depart',car})}><span className="queue-owner">{round.own===null?'选我':car===round.own?'我的车':'大人的车'}</span><Illustration id={vehicleIllustration[car]}/><strong>{round.own===null?vehicleNames[car]:`${round.index+i+1}号`}</strong></button>)}</div><p className="road-short">{round.own===null?'':round.order.indexOf(round.own)<round.index?'你的车出发啦，陪其他车一起完成':round.order[round.index]===round.own?'轮到我的车啦':'等前面的车走'}</p></section>}
   {round.kind==='listen'&&<section className="road-panel">{round.groupDone?<button className="room-primary" onClick={()=>act({type:'nextListen'})}>下一项任务 →</button>:<><div className="listen-sequence" aria-label="任务顺序">{round.stops.map((stop,i)=><span key={i} className={i<round.index?'is-done':i===round.index?'is-current':''}><Illustration id={places[stop].art}/></span>)}</div><div className="road-car"><Illustration id="fire"/></div><div className="road-choices">{(Object.keys(places) as Stop[]).map(stop=><button key={stop} className={`road-choice ${round.hintLevel>=2&&round.stops[round.index]===stop?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''}`} onClick={()=>act({type:'stop',stop})}><span className="road-choice-art"><Illustration id={places[stop].art}/></span><span>{places[stop].name}</span></button>)}</div></>}</section>}
   {round.kind==='detour'&&<section className="road-panel"><div className="road-car"><Illustration id="fire"/></div>{!round.started?<><div className="familiar-route"><Illustration id="fire"/><span aria-hidden="true">→</span><RoadTile/><span>常走的路</span></div><button className="room-primary road-begin" onClick={()=>act({type:'begin'})}>出发看看 <span>→</span></button></>:<div className="road-choices">{Array.from({length:round.roads},(_,road)=><button key={road} className={`road-choice detour-choice ${road===round.blocked?'is-blocked':''} ${round.hintLevel>=2&&road!==round.blocked?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''}`} onClick={()=>act({type:'road',road})}><span className="road-choice-art">{road===round.blocked?<Illustration id="cargo-barrier"/>:<RoadTile/>}</span><span>{road===round.blocked?'施工中':`${road+1}号路`}</span></button>)}</div>}</section>}
   <div className="round-feedback" role="status" aria-live="polite">{round.message||prompt(round)}</div><div className="round-actions"><button className="room-secondary" onClick={()=>act({type:'hint'})}><LittleIcon kind="hint"/>提示</button></div>
  </>}
  {parentPanel?<ParentPanel account={account} game={kind} difficulty={nextLevel} onDifficulty={setNextLevel} onClose={()=>setParentPanel(false)} onRestart={!round.complete&&(round.kind!=='queue'||round.own!==null)?restartPaused:undefined}/>:paused&&<div className="room-overlay pause-overlay"><section className="playroom-modal" role="dialog" aria-modal="false" aria-labelledby="road-pause-title"><div className="rest-picture"><LittleIcon kind="pause"/></div><h2 id="road-pause-title">休息一下</h2><button className="room-primary resume-play" aria-label="恢复游戏" onClick={()=>{setPaused(false);say(prompt(roundRef.current));}}>▶</button></section></div>}
 </main>;
}




