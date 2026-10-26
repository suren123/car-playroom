'use client';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { LittleIcon, Logo } from './car-art';
import { VehicleArt } from './vehicle-art';
import LegacyGame from './legacy-game';
import { categories, categoryFor, makeRound, replayReducer, sudokuKinds, vehicleNames, type ReplayMode } from '../lib/replay-games';

const names:Record<ReplayMode,string>={sort:'汽车分类',difference:'找不同',sudoku:'汽车数独'};
const instructions:Record<ReplayMode,string>={sort:'小车停哪里？',difference:'找出不一样的车',sudoku:'空位停哪辆车？'};
const spoken:Record<ReplayMode,string>={sort:'把小车送到对应车站。消防车和救护车去救援站，公交车和货车去运输站，挖掘机和吊车去施工站。',difference:'两边的车有一点不一样。找到以后，点任意一边的小车。',sudoku:'先点空位，再选一辆车。每一排、每一列，还有粗线围起来的小车库，同一种车只能停一次。'};
function Dots({total,done}:{total:number;done:number}){return <div className="round-dots" aria-label={`已完成 ${done}，共 ${total}`} role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>{Array.from({length:total},(_,i)=><span key={i} className={i<done?'filled':''}/>)}</div>;}

export default function Playroom(){
 const [round,dispatch]=useReducer(replayReducer,null);
 const [legacy,setLegacy]=useState(false),[muted,setMuted]=useState(false),[paused,setPaused]=useState(false),[parents,setParents]=useState(false),[challenge,setChallenge]=useState(false),[network,setNetwork]=useState('');
 const roundRef=useRef(round);roundRef.current=round;
 const seed=useRef(0);
 const say=useCallback((text:string)=>{
   if(muted||typeof window==='undefined'||!('speechSynthesis'in window))return;
   try{window.speechSynthesis.cancel();const voice=new SpeechSynthesisUtterance(text);voice.lang='zh-CN';voice.rate=.84;const chinese=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('zh'));if(chinese)voice.voice=chinese;window.speechSynthesis.speak(voice);}catch{/* All instructions remain available as pictures and short text. */}
 },[muted]);
 useEffect(()=>{
  seed.current=(Date.now()+Math.floor(Math.random()*0x7fffffff))>>>0;
  async function check(){try{const r=await fetch('/api/session',{cache:'no-store'});if(r.status===401)window.location.replace('/');else setNetwork(r.ok?'':'网络没连上，请大人看看');}catch{setNetwork('网络没连上，请大人看看');}}
  void check();
  const visibility=()=>{if(document.hidden){window.speechSynthesis?.cancel();if(roundRef.current&&!roundRef.current.complete)setPaused(true);}else void check();};
  document.addEventListener('visibilitychange',visibility);window.addEventListener('online',check);
  return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('online',check);window.speechSynthesis?.cancel();};
 },[]);
 useEffect(()=>{if(!paused&&!parents)return;const last=document.activeElement as HTMLElement|null;const modal=document.querySelector('.playroom-modal');const controls=Array.from(modal?.querySelectorAll<HTMLElement>('button')||[]);controls[0]?.focus();const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab'||!controls.length)return;const first=controls[0],end=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}};document.addEventListener('keydown',trap);return()=>{document.removeEventListener('keydown',trap);last?.focus();};},[paused,parents]);
 function start(kind:ReplayMode){seed.current=(seed.current+0x9e3779b9)>>>0;const next=makeRound(kind,seed.current,challenge);roundRef.current=next;dispatch({type:'start',round:next});setPaused(false);say(spoken[kind]);}
 function back(){window.speechSynthesis?.cancel();roundRef.current=null;dispatch({type:'home'});setPaused(false);}
 function act(action:Parameters<typeof replayReducer>[1]){if(paused||parents)return;const next=replayReducer(roundRef.current,action);roundRef.current=next;dispatch(action);if(next?.message)say(next.message);}
 function pause(){window.speechSynthesis?.cancel();setPaused(true);}
 async function logout(){try{const r=await fetch('/api/logout',{method:'POST'});if(r.ok)window.location.replace('/');else setNetwork('请大人稍后再试');}catch{setNetwork('请大人检查网络');}}
 if(legacy)return <LegacyGame onExit={()=>{window.speechSynthesis?.cancel();setLegacy(false);}}/>;
 const total=round?.kind==='sort'?round.deck.length:round?.kind==='difference'?round.differences.length:round?.kind==='sudoku'?round.initial.filter(x=>x===-1).length:0;
 const done=round?.kind==='sort'?round.parked.length:round?.kind==='difference'?round.found.length:round?.kind==='sudoku'?total-round.values.filter(x=>x===-1).length:0;
 return <main className="playroom">
  <header className="room-header"><div onClick={e=>{if(round){e.preventDefault();pause();}}}><Logo/></div><div className="room-header-buttons"><button aria-label={muted?'打开声音':'关闭声音'} className="room-icon" onClick={()=>{window.speechSynthesis?.cancel();setMuted(!muted);}}><LittleIcon kind={muted?'mute':'sound'}/></button><button className="room-parent" onClick={()=>{window.speechSynthesis?.cancel();setParents(true);}}>家长</button></div></header>
  {network&&<p className="room-network" role="status">{network}</p>}
  {!round?<>
   <section className="room-welcome"><h1>今天玩什么？</h1><button className="room-voice" aria-label="听一听怎么玩" onClick={()=>say('选一个游戏。分一分，找不同，或者汽车数独。')}><LittleIcon kind="sound"/>听一听</button></section>
   <section className="replay-menu" aria-label="选择游戏">
    <button className="replay-card sort-card" onClick={()=>start('sort')} aria-label="玩汽车分类"><div className="replay-card-art sort-preview"><VehicleArt kind="fire"/><div className="preview-bins"><span>✚</span><span>↔</span><span>⚒</span></div></div><h2>汽车分类</h2><span className="card-play" aria-hidden="true">▶</span></button>
    <button className="replay-card diff-card" onClick={()=>start('difference')} aria-label="玩找不同"><div className="replay-card-art diff-preview"><span><VehicleArt kind="bus"/></span><span><VehicleArt kind="fire"/></span><i aria-hidden="true">?</i></div><h2>找不同</h2><span className="card-play" aria-hidden="true">▶</span></button>
    <button className="replay-card sudoku-card" onClick={()=>start('sudoku')} aria-label="玩汽车数独"><div className="replay-card-art sudoku-preview">{sudokuKinds.map((kind,i)=><span key={kind}>{i===3?<b>?</b>:<VehicleArt kind={kind}/>}</span>)}</div><h2>汽车数独</h2><span className="card-play" aria-hidden="true">▶</span></button>
   </section>
   <div className="room-bottom"><span><LittleIcon kind="retry"/> 每局换新题</span><button onClick={()=>setLegacy(true)}><LittleIcon kind="hands"/>修车、搭桥<span aria-hidden="true">→</span></button></div>
  </>:<>
   <div className="round-toolbar"><button className="room-back" onClick={pause} aria-label="暂停并返回车库"><LittleIcon kind="home"/><span>车库</span></button><Dots total={total} done={done}/><button className="room-pause" onClick={pause}><LittleIcon kind="pause"/>休息</button></div>
   {round.complete?<section className="round-finish"><div className="finish-cars"><VehicleArt kind="fire"/><VehicleArt kind="bus"/><VehicleArt kind="digger"/></div><h1>完成啦！</h1><div className="finish-actions"><button className="room-primary" onClick={()=>start(round.kind)}><LittleIcon kind="retry"/>再玩一局</button><button className="room-secondary" onClick={back}><LittleIcon kind="home"/>回车库</button></div></section>:<>
    <div className="round-title"><h1>{instructions[round.kind]}</h1><button className="room-icon" aria-label="听游戏规则" onClick={()=>say(spoken[round.kind])}><LittleIcon kind="sound"/></button></div>
    {round.kind==='sort'&&<section className="sort-game" aria-label="汽车分类游戏"><div role="img" aria-label={vehicleNames[round.deck[round.index].kind]} className={`sort-current ${round.placed?'is-parked':''}`}><VehicleArt {...round.deck[round.index]}/>{round.placed&&<span className="big-check" aria-hidden="true">✓</span>}</div><div className="sort-bins">{categories.map(category=><button key={category.id} className={`sort-bin bin-${category.id} ${round.hint&&categoryFor[round.deck[round.index].kind]===category.id?'is-hinted':''}`} aria-label={`放到${category.name}站`} disabled={round.placed} onClick={()=>act({type:'category',category:category.id})}><div className="bin-examples">{category.kinds.map(kind=><VehicleArt key={kind} kind={kind}/>)}</div><strong>{category.name}</strong><div className="parked-cars">{round.parked.filter(v=>categoryFor[v.kind]===category.id).map((v,i)=><VehicleArt key={i} {...v}/>)}</div></button>)}</div></section>}
    {round.kind==='difference'&&<section className="difference-game" aria-label="比较两边的车阵">{[round.left,round.right].map((scene,side)=><div className="difference-scene" key={side} aria-label={side===0?'左边车阵':'右边车阵'}><div className="scene-top" aria-hidden="true"><span/><span/></div><div className="difference-grid">{scene.map((vehicle,i)=><button key={i} aria-label={`${side===0?'左':'右'}边第${i+1}辆，${vehicleNames[vehicle.kind]}`} disabled={round.found.includes(i)} className={`spot-tile ${round.found.includes(i)?'is-found':''} ${round.hint&&round.differences.find(x=>!round.found.includes(x))===i?'is-hinted':''}`} onClick={()=>act({type:'spot',index:i})}><VehicleArt {...vehicle}/>{round.found.includes(i)&&<span aria-hidden="true">✓</span>}</button>)}</div><div className="scene-road" aria-hidden="true"/></div>)}</section>}
    {round.kind==='sudoku'&&<section className="sudoku-game" aria-label="四乘四汽车数独"><div className="sudoku-board" role="group" aria-label="每排每列和每个小车库不重复">{round.values.map((value,i)=><button key={i} aria-label={`第${Math.floor(i/4)+1}排第${i%4+1}格，${value===-1?'空位':vehicleNames[sudokuKinds[value]]}`} aria-pressed={round.selected===i} disabled={value!==-1} className={`sudoku-cell ${i%4===1?'block-right':''} ${Math.floor(i/4)===1?'block-bottom':''} ${round.selected===i?'is-selected':''} ${round.initial[i]===-1&&value!==-1?'is-filled':''}`} onClick={()=>act({type:'select',index:i})}>{value===-1?<span>?</span>:<VehicleArt kind={sudokuKinds[value]}/>}</button>)}</div><div className="sudoku-choices" aria-label="选一辆车">{sudokuKinds.map((kind,value)=><button key={kind} aria-label={`选择${vehicleNames[kind]}`} className={round.hint&&round.selected!==null&&round.solution[round.selected]===value?'is-hinted':''} onClick={()=>act({type:'symbol',value})}><VehicleArt kind={kind}/></button>)}</div></section>}
    <div className="round-feedback" role="status" aria-live="polite">{round.message||'慢慢来'}</div>
    <div className="round-actions">{round.kind==='sort'&&round.placed?<button className="room-primary" onClick={()=>act({type:'next'})}>下一辆<span aria-hidden="true">→</span></button>:<><button className="room-secondary" onClick={()=>act({type:'hint'})}><LittleIcon kind="hint"/>提示</button><button className="room-secondary" onClick={()=>start(round.kind)}><LittleIcon kind="retry"/>换一题</button></>}</div>
   </>}
  </>}
  {(paused||parents)&&<div className="room-overlay"><section className="playroom-modal" role="dialog" aria-modal="true" aria-labelledby="room-modal-title">{parents?<><h2 id="room-modal-title">家长小车站</h2><div className="room-parent-copy"><p><b>分类</b>：救援、运输、施工，先陪孩子认识车站。</p><p><b>找不同</b>：点任意一边；简单找两处，挑战找三处。</p><p><b>数独</b>：每排、每列、每个粗线小车库不重复。简单缺三格，挑战缺六格。</p><p>可随时暂停。完成后手动再玩，不计时、不排名。</p></div><div className="difficulty-controls" aria-label="下一局难度"><button className={!challenge?'active':''} aria-pressed={!challenge} onClick={()=>setChallenge(false)}>简单</button><button className={challenge?'active':''} aria-pressed={challenge} onClick={()=>setChallenge(true)}>挑战</button></div><p className="difficulty-note">难度从下一局生效</p><button className="room-primary" onClick={()=>setParents(false)}>开始陪玩</button><button className="room-logout" onClick={logout}>退出账号</button></>:<><div className="rest-picture"><LittleIcon kind="pause"/></div><h2 id="room-modal-title">休息一下</h2><button className="room-primary" onClick={()=>{setPaused(false);say('我们继续玩。');}}>继续玩<span aria-hidden="true">▶</span></button><button className="room-secondary" onClick={back}><LittleIcon kind="home"/>回车库</button></>}</section></div>}
 </main>;
}
