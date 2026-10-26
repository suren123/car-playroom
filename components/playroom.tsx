'use client';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { LittleIcon, Logo } from './car-art';
import { VehicleArt } from './vehicle-art';
import LegacyGame from './legacy-game';
import RoadGame from './road-games';
import ParentRecords from './parent-records';
import { RoundRecorder, type RecordDifficulty } from '../lib/records-client';
import { speakGently } from '../lib/speech';
import { makeRound, replayReducer, sortTarget, sudokuKinds, vehicleNames, type ReplayMode, type SortRule } from '../lib/replay-games';
import type { RoadMode } from '../lib/road-games';

const names:Record<ReplayMode,string>={sort:'汽车分类',difference:'找不同',sudoku:'汽车数独'};
const instructions:Record<ReplayMode,string>={sort:'小车停哪里？',difference:'找出不一样的车',sudoku:'空位停哪辆车？'};
const spoken:Record<ReplayMode,string>={sort:'把小车送到对应车站。消防车和救护车去救援站，公交车和货车去运输站，挖掘机和吊车去施工站。',difference:'两边的车有一点不一样。找到以后，点任意一边的小车。',sudoku:'先点空位，再选一辆车。每一排、每一列，还有粗线围起来的小车库，同一种车只能停一次。'};
function Dots({total,done}:{total:number;done:number}){return <div className="round-dots" aria-label={`已完成 ${done}，共 ${total}`} role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>{Array.from({length:total},(_,i)=><span key={i} className={i<done?'filled':''}/>)}</div>;}

export default function Playroom(){
 const [round,dispatch]=useReducer(replayReducer,null);
 const [legacy,setLegacy]=useState<'repair'|'bridge'|null>(null),[road,setRoad]=useState<RoadMode|null>(null),[hub,setHub]=useState<'focus'|'rules'|null>(null);
 const [muted,setMuted]=useState(false),[paused,setPaused]=useState(false),[parents,setParents]=useState(false),[difficulty,setDifficulty]=useState<RecordDifficulty>('auto');
 const roundRef=useRef(round);roundRef.current=round;
 const seed=useRef(0);
 const recorder=useRef<RoundRecorder|null>(null),queueRuns=useRef(0),autoLevels=useRef<Record<ReplayMode,number>>({sort:0,difference:0,sudoku:0}),streaks=useRef<Record<ReplayMode,number>>({sort:0,difference:0,sudoku:0}),sudokuSeen=useRef(false);
 const awaitingRetry=useRef(false);
 const say=useCallback((text:string)=>{
   speakGently(text,!muted);
 },[muted]);
 useEffect(()=>{
  seed.current=(Date.now()+Math.floor(Math.random()*0x7fffffff))>>>0;
  const visibility=()=>{if(document.hidden){window.speechSynthesis?.cancel();if(roundRef.current&&!roundRef.current.complete)setPaused(true);}};
  document.addEventListener('visibilitychange',visibility);
  return()=>{document.removeEventListener('visibilitychange',visibility);window.speechSynthesis?.cancel();};
 },[]);
 useEffect(()=>{if(!paused&&!parents)return;const last=document.activeElement as HTMLElement|null;const modal=document.querySelector('.playroom-modal');const controls=Array.from(modal?.querySelectorAll<HTMLElement>('button')||[]);controls[0]?.focus();const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab'||!controls.length)return;const first=controls[0],end=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}};document.addEventListener('keydown',trap);return()=>{document.removeEventListener('keydown',trap);last?.focus();};},[paused,parents]);
 function start(kind:ReplayMode){
  if(roundRef.current&&!roundRef.current.complete){recorder.current?.note('retries');void recorder.current?.finish(false);}
  seed.current=(seed.current+0x9e3779b9)>>>0;
  const level=difficulty==='auto'?autoLevels.current[kind]:difficulty==='challenge'?2:0;
  const rule:SortRule=level>=2?'purpose':level===1?'model':'color';
  const tutorial=kind==='sudoku'&&!sudokuSeen.current&&level===0;
  const next=makeRound(kind,seed.current,level>0,rule,tutorial);
  recorder.current=new RoundRecorder(kind,difficulty);awaitingRetry.current=false;roundRef.current=next;dispatch({type:'start',round:next});setPaused(false);say(kind==='sort'?`这次按${rule==='color'?'颜色':rule==='model'?'车型':'用途'}停车。`:kind==='sudoku'&&tutorial?'每一排和每一列，放不一样的小车。':spoken[kind]);
 }
 function back(){window.speechSynthesis?.cancel();if(roundRef.current&&!roundRef.current.complete)void recorder.current?.finish(false);roundRef.current=null;dispatch({type:'home'});setPaused(false);}
 function act(action:Parameters<typeof replayReducer>[1]){
  if(paused||parents)return;const before=roundRef.current,next=replayReducer(before,action);if(next===before)return;
  if(action.type==='hint')recorder.current?.note('hints');
  if(before&&next&&next.wrong>before.wrong){recorder.current?.note('wrong');awaitingRetry.current=true;}
  if(awaitingRetry.current&&before&&next&&((next.kind==='sort'&&before.kind==='sort'&&next.parked.length>before.parked.length)||(next.kind==='difference'&&before.kind==='difference'&&next.found.length>before.found.length)||(next.kind==='sudoku'&&before.kind==='sudoku'&&next.values.filter(x=>x!==-1).length>before.values.filter(x=>x!==-1).length))){recorder.current?.note('retries');awaitingRetry.current=false;}
  roundRef.current=next;dispatch(action);
  if(next?.complete&&!before?.complete){void recorder.current?.finish(true);if(next.kind==='sudoku'&&next.size===2)sudokuSeen.current=true;
   const mode=next.kind;if(difficulty==='auto'){if(next.wrong>=2||next.hints>=2){autoLevels.current[mode]=Math.max(0,autoLevels.current[mode]-1);streaks.current[mode]=0;}else if(next.wrong<=1&&next.hints===0){streaks.current[mode]++;if(streaks.current[mode]>=2){autoLevels.current[mode]=Math.min(mode==='sort'?2:1,autoLevels.current[mode]+1);streaks.current[mode]=0;}}}
  }
  if(next?.message)say(next.message);
 }
 function pause(){window.speechSynthesis?.cancel();recorder.current?.note('pauses');setPaused(true);}
 function openRoad(kind:RoadMode){say(kind==='queue'?'选一辆你的车，排队轮流出发。':kind==='traffic'?'红灯停，绿灯走。':kind==='listen'?'听听消防车要去哪里。':'路上施工啦，换一条路。');setRoad(kind);}
 function openLegacy(kind:'repair'|'bridge'){say(kind==='repair'?'一起修好消防车。':'你一块，我一块，一起修桥。');setLegacy(kind);}
 if(legacy)return <LegacyGame initialMode={legacy} level={difficulty} onExit={()=>{window.speechSynthesis?.cancel();setLegacy(null);}}/>;
 if(road)return <RoadGame kind={road} level={difficulty} queueIndex={queueRuns.current} onQueueFinish={()=>{queueRuns.current++;}} say={say} onExit={()=>{window.speechSynthesis?.cancel();setRoad(null);}}/>;
 const total=round?.kind==='sort'?round.deck.length:round?.kind==='difference'?round.differences.length:round?.kind==='sudoku'?round.initial.filter(x=>x===-1).length:0;
 const done=round?.kind==='sort'?round.parked.length:round?.kind==='difference'?round.found.length:round?.kind==='sudoku'?total-round.values.filter(x=>x===-1).length:0;
 return <main className="playroom">
  <header className="room-header"><div onClick={e=>{if(round){e.preventDefault();pause();}}}><Logo/></div><div className="room-header-buttons"><button aria-label={muted?'打开声音':'关闭声音'} className="room-icon" onClick={()=>{window.speechSynthesis?.cancel();setMuted(!muted);}}><LittleIcon kind={muted?'mute':'sound'}/></button><button className="room-parent" onClick={()=>{window.speechSynthesis?.cancel();setParents(true);}}>家长</button></div></header>
  {!round?<>
   <section className="room-welcome"><h1>{hub===null?'今天玩什么？':hub==='focus'?'专注力小任务':'规则与情绪小任务'}</h1><button className="room-voice" aria-label="听一听怎么玩" onClick={()=>say(hub===null?'选一类汽车游戏。':hub==='focus'?'选一个：汽车分类、找不同、汽车数独，或者消防车听指挥。':'选一个：小汽车排队、红绿灯、道路改道、修车，或者搭桥。')}><LittleIcon kind="sound"/>听一听</button></section>
   {hub===null?<section className="hub-menu" aria-label="选择游戏类别"><button className="hub-card" onClick={()=>setHub('focus')}><span className="hub-art">🔎 🚗</span><strong>专注力小任务</strong><span>看一看 · 想一想</span></button><button className="hub-card rules-hub" onClick={()=>setHub('rules')}><span className="hub-art">🚦 🚒</span><strong>规则与情绪小任务</strong><span>等一等 · 再出发</span></button></section>:<><button className="hub-back" onClick={()=>setHub(null)}>‹ 返回两类游戏</button><section className="hub-game-list" aria-label="选择游戏">{hub==='focus'?<>
    <button onClick={()=>start('sort')}><span>🚗</span><strong>汽车分类</strong></button><button onClick={()=>start('difference')}><span>🔎</span><strong>找不同</strong></button><button onClick={()=>start('sudoku')}><span>▦</span><strong>汽车数独</strong></button><button onClick={()=>openRoad('listen')}><span>🚒</span><strong>消防车听指挥</strong></button>
   </>:<><button onClick={()=>openRoad('queue')}><span>🚙🚗</span><strong>小汽车排队</strong></button><button onClick={()=>openRoad('traffic')}><span>🚦</span><strong>红绿灯小司机</strong></button><button onClick={()=>openRoad('detour')}><span>🚧</span><strong>道路施工改道</strong></button><button onClick={()=>openLegacy('repair')}><span>🔧</span><strong>修车小师傅</strong></button><button onClick={()=>openLegacy('bridge')}><span>🌉</span><strong>一起修桥</strong></button></>}</section></>}
   <div className="room-bottom"><span><LittleIcon kind="retry"/> 每局可以重新玩</span></div>
  </>:<>
   <div className="round-toolbar"><button className="room-back" onClick={pause} aria-label="暂停并返回车库"><LittleIcon kind="home"/><span>车库</span></button><Dots total={total} done={done}/><button className="room-pause" onClick={pause}><LittleIcon kind="pause"/>休息</button></div>
   {round.complete?<section className="round-finish"><div className="finish-cars"><VehicleArt kind="fire"/><VehicleArt kind="bus"/><VehicleArt kind="digger"/></div><h1>完成啦！</h1><div className="finish-actions"><button className="room-primary" onClick={()=>start(round.kind)}><LittleIcon kind="retry"/>再玩一局</button><button className="room-secondary" onClick={back}><LittleIcon kind="home"/>回车库</button></div></section>:<>
    <div className="round-title"><h1>{round.kind==='sort'?round.rule==='color'?'按颜色停车':round.rule==='model'?'找同款小车':'按用途停车':round.kind==='sudoku'&&round.size===2?'小车排排看':instructions[round.kind]}</h1><button className="room-icon" aria-label="听游戏规则" onClick={()=>say(round.kind==='sort'?`这次按${round.rule==='color'?'颜色':round.rule==='model'?'车型':'用途'}停车。`:round.kind==='sudoku'&&round.size===2?'每一排和每一列，放不一样的小车。':spoken[round.kind])}><LittleIcon kind="sound"/></button></div>
    {round.kind==='sort'&&<section className="sort-game" aria-label="汽车分类游戏"><div role="img" aria-label={vehicleNames[round.deck[round.index].kind]} className={`sort-current ${round.placed?'is-parked':''}`}><VehicleArt {...round.deck[round.index]}/>{round.placed&&<span className="big-check" aria-hidden="true">✓</span>}</div><div className="sort-bins">{round.bins.map(bin=><button key={bin.id} className={`sort-bin bin-${bin.id} ${round.hintLevel>=2&&sortTarget(round,round.deck[round.index])===bin.id?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''}`} aria-label={`放到${bin.name}站`} disabled={round.placed} onClick={()=>act({type:'bin',bin:bin.id})}><div className="bin-examples">{bin.kind?<VehicleArt kind={bin.kind}/>:bin.color?<span className="color-bin" style={{background:bin.color}}/>:<span className="category-icon">{bin.id==='rescue'?'✚':bin.id==='transport'?'↔':'⚒'}</span>}</div><strong>{bin.name}</strong><div className="parked-cars">{round.parked.filter(v=>sortTarget(round,v)===bin.id).map((v,i)=><VehicleArt key={i} {...v}/>)}</div></button>)}</div></section>}
    {round.kind==='difference'&&<section className="difference-game" aria-label="比较两边的车阵">{[round.left,round.right].map((scene,side)=><div className="difference-scene" key={side} aria-label={side===0?'左边车阵':'右边车阵'}><div className="scene-top" aria-hidden="true"><span/><span/></div><div className="difference-grid">{scene.map((vehicle,i)=><button key={i} aria-label={`${side===0?'左':'右'}边第${i+1}辆，${vehicleNames[vehicle.kind]}`} disabled={round.found.includes(i)} className={`spot-tile ${round.found.includes(i)?'is-found':''} ${round.hintLevel>=2&&round.differences.find(x=>!round.found.includes(x))===i?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''}`} onClick={()=>act({type:'spot',index:i})}><VehicleArt {...vehicle}/>{round.found.includes(i)&&<span aria-hidden="true">✓</span>}</button>)}</div><div className="scene-road" aria-hidden="true"/></div>)}</section>}
    {round.kind==='sudoku'&&<section className="sudoku-game" aria-label={`${round.size}乘${round.size}汽车数独`}><div className={`sudoku-board ${round.size===2?'tutorial-board':''}`} role="group" aria-label="每排每列的小车不重复">{round.values.map((value,i)=><button key={i} aria-label={`第${Math.floor(i/round.size)+1}排第${i%round.size+1}格，${value===-1?'空位':vehicleNames[sudokuKinds[value]]}`} aria-pressed={round.selected===i} disabled={value!==-1} className={`sudoku-cell ${round.size===4&&i%4===1?'block-right':''} ${round.size===4&&Math.floor(i/4)===1?'block-bottom':''} ${round.selected===i?'is-selected':''} ${round.initial[i]===-1&&value!==-1?'is-filled':''}`} onClick={()=>act({type:'select',index:i})}>{value===-1?<span>?</span>:<VehicleArt kind={sudokuKinds[value]}/>}</button>)}</div><div className="sudoku-choices" aria-label="选一辆车">{sudokuKinds.slice(0,round.size).map((kind,value)=><button key={kind} aria-label={`选择${vehicleNames[kind]}`} className={round.hintLevel>=2&&round.selected!==null&&round.solution[round.selected]===value?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''} onClick={()=>act({type:'symbol',value})}><VehicleArt kind={kind}/></button>)}</div></section>}
    <div className="round-feedback" role="status" aria-live="polite">{round.message||'慢慢来'}</div>
    <div className="round-actions">{round.kind==='sort'&&round.placed?<button className="room-primary" onClick={()=>act({type:'next'})}>下一辆<span aria-hidden="true">→</span></button>:<><button className="room-secondary" onClick={()=>act({type:'hint'})}><LittleIcon kind="hint"/>提示</button><button className="room-secondary" onClick={()=>start(round.kind)}><LittleIcon kind="retry"/>换一题</button></>}</div>
   </>}
  </>}
  {(paused||parents)&&<div className="room-overlay"><section className="playroom-modal" role="dialog" aria-modal="true" aria-labelledby="room-modal-title">{parents?<><h2 id="room-modal-title">家长小车站</h2><p className="difficulty-note">陪孩子一起玩；卡住时可以提示、求助或休息。</p><div className="difficulty-controls" aria-label="下一局难度">{(['simple','auto','challenge'] as const).map(level=><button key={level} className={difficulty===level?'active':''} aria-pressed={difficulty===level} onClick={()=>setDifficulty(level)}>{level==='simple'?'简单':level==='auto'?'自动':'挑战'}</button>)}</div><p className="difficulty-note">难度从下一局生效</p><ParentRecords/><p className="difficulty-note">访问权限由 OpenAI 账户管理。</p><button className="room-primary" onClick={()=>setParents(false)}>继续陪玩</button></>:<><div className="rest-picture"><LittleIcon kind="pause"/></div><h2 id="room-modal-title">休息一下</h2><button className="room-primary" onClick={()=>{setPaused(false);say('我们继续玩。');}}>继续玩<span aria-hidden="true">▶</span></button><button className="room-secondary" onClick={back}><LittleIcon kind="home"/>回车库</button></>}</section></div>}
 </main>;
}
