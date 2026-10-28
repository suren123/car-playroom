'use client';
import GameBackButton from './game-back-button';
import {useGameNavigation} from '../hooks/use-game-navigation';
import {rememberGameEntry,gameBackTarget} from '../lib/game-navigation';
import AudioNotice from './audio-notice';
import StorageNotice from '../components/storage-notice';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import { LittleIcon, Logo } from './car-art';
import { VehicleArt } from './vehicle-art';
import {Illustration} from './illustration';
import {DifferencePreview} from './difference-art';
import {SudokuPreview} from './sudoku-art';
import LegacyGame from './legacy-game';
import RoadGame from './road-games';
import ParentPanel,{readDifficulty} from './parent-panel';
import { RoundRecorder, type RecordDifficulty } from '../lib/records-client';
import { prepareAudio, speakDelivery, speakGently, stopSpeech } from '../lib/speech';
import {useAudioSettings} from '../lib/use-audio-settings';
import { makeRound, replayReducer, sortTarget, vehicleNames, type Round, type ReplayAction, type SortRule } from '../lib/replay-games';
import type { RoadMode } from '../lib/road-games';
import {gameNames,gameIds,gameCatalog,type GameId} from '../games/registry';
import {useGameSession} from '../hooks/use-game-session';
import {usePauseAnimations} from '../hooks/use-pause-animations';

type RoomRound=Extract<Round,{kind:'sort'}>;
type RoomMode=RoomRound['kind'];
function roomReducer(state:RoomRound|null,action:ReplayAction):RoomRound|null{const next=replayReducer(state,action);return next&&next.kind!=='sort'?state:next;}
const instructions:Record<RoomMode,string>={sort:'小车停哪里？'};
const spoken:Record<RoomMode,string>={sort:'把小车送到对应车站。消防车和救护车去救援站，公交车和货车去运输站，挖掘机和吊车去施工站。'};
function Dots({total,done}:{total:number;done:number}){return <div className="round-dots" aria-label={`已完成 ${done}，共 ${total}`} role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>{Array.from({length:total},(_,i)=><span key={i} className={i<done?'filled':''}/>)}</div>;}

const firstGames:GameId[]=['delivery','queue','bridge'];
const homeGames=[...firstGames,...gameIds.filter(id=>!firstGames.includes(id))];

export default function Playroom({account,initialGame}:{account:string;initialGame?:GameId}){
 const root=useRef<HTMLElement>(null),leaving=useRef(false);
 const {goHome}=useGameNavigation(account,initialGame);
 const router=useRouter(),searchParams=useSearchParams();
 const category=searchParams.get('category'),hub=category==='focus'||category==='rules'?category:null;
 useGameSession(account,!initialGame);
 const [round,dispatch]=useReducer(roomReducer,null);
 const [legacy,setLegacy]=useState<'repair'|'bridge'|null>(null),[road,setRoad]=useState<RoadMode|null>(null);
 const {settings,setAudioSettings}=useAudioSettings(),muted=settings.muted;
 const [paused,setPaused]=useState(false),[parents,setParents]=useState(false),[difficulty,setDifficulty]=useState<RecordDifficulty>('auto');
 const difficultyRef=useRef<RecordDifficulty>('auto');
 const roundRef=useRef(round);roundRef.current=round;
 const seed=useRef(0);
 const recorder=useRef<RoundRecorder|null>(null),queueRuns=useRef(0),autoLevels=useRef<Record<RoomMode,number>>({sort:0});
 const awaitingRetry=useRef(false);
 const [suggestReplay,setSuggestReplay]=useState(false);
 usePauseAnimations(root,paused||parents);
 const say=useCallback((text:string)=>{
   speakGently(text,!muted);
 },[muted]);
 useEffect(()=>{
  seed.current=(Date.now()+Math.floor(Math.random()*0x7fffffff))>>>0;
  const visibility=()=>{if(document.hidden){stopSpeech();if(roundRef.current&&!roundRef.current.complete)setPaused(true);}};
  document.addEventListener('visibilitychange',visibility);
  return()=>{document.removeEventListener('visibilitychange',visibility);stopSpeech();};
 },[]);
 useEffect(()=>{difficultyRef.current=readDifficulty(account,initialGame);setDifficulty(difficultyRef.current);try{queueRuns.current=Number(localStorage.getItem(`car-playroom-queue:${account}`))||0;for(const kind of ['sort'] as const)autoLevels.current[kind]=Math.max(0,Math.min(kind==='sort'?2:1,Number(localStorage.getItem(`car-playroom-stage:${account}:${kind}`))||0));}catch{/* Use an in-memory sequence. */}if(initialGame){if(initialGame==='repair'||initialGame==='bridge')setLegacy(initialGame);else if(initialGame==='queue'||initialGame==='traffic'||initialGame==='listen'||initialGame==='detour')setRoad(initialGame);else if(initialGame==='sort')start(initialGame);}return()=>{recorder.current?.dispose();recorder.current=null;roundRef.current=null;};},[account,initialGame]);
 useEffect(()=>{if(!paused&&!parents)return;const last=document.activeElement as HTMLElement|null;const modal=document.querySelector('.playroom-modal');const controls=Array.from(modal?.querySelectorAll<HTMLElement>('button')||[]);controls[0]?.focus();const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab'||!controls.length||!parents)return;const first=controls[0],end=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}};document.addEventListener('keydown',trap);return()=>{document.removeEventListener('keydown',trap);last?.focus();};},[paused,parents]);
 function start(kind:RoomMode){
  if(roundRef.current&&!roundRef.current.complete){recorder.current?.note('retries');void recorder.current?.finish(false);}
  seed.current=(seed.current+0x9e3779b9)>>>0;
  const selectedDifficulty=difficultyRef.current;
  const level=selectedDifficulty==='auto'?autoLevels.current[kind]:selectedDifficulty==='challenge'?2:0;
  const rule:SortRule=level>=2?'purpose':level===1?'model':'color';
  const next=makeRound(kind,seed.current,level>0,rule);
  if(next.kind!=='sort')return;
  setSuggestReplay(false);
  recorder.current=new RoundRecorder(kind,selectedDifficulty);awaitingRetry.current=false;roundRef.current=next;dispatch({type:'start',round:next});setPaused(false);say(kind==='sort'?`这次按${rule==='color'?'颜色':rule==='model'?'车型':'用途'}停车。`:spoken[kind]);
 }
 function restartRound(){const current=roundRef.current;if(!current||!window.confirm('重新开始这局？已经完成的步骤会清空。'))return;void recorder.current?.finish(false);roundRef.current=null;start(current.kind);setParents(false);}
 function back(){if(leaving.current)return;leaving.current=true;if(roundRef.current&&!roundRef.current.complete)void recorder.current?.finish(false);stopSpeech();setPaused(true);if(initialGame&&gameBackTarget(initialGame,'play')==='home')goHome();}
 function act(action:Parameters<typeof replayReducer>[1]){
  if(leaving.current||paused||parents)return;const before=roundRef.current,next=roomReducer(before,action);if(next===before)return;
  if(action.type==='hint')recorder.current?.note('hints');
  if(before&&next&&next.wrong>before.wrong){recorder.current?.note('wrong');awaitingRetry.current=true;}
  if(awaitingRetry.current&&before&&next&&((next.kind==='sort'&&before.kind==='sort'&&next.parked.length>before.parked.length))){recorder.current?.note('retries');awaitingRetry.current=false;}
  roundRef.current=next;dispatch(action);
  if(next?.complete&&!before?.complete){void recorder.current?.finish(true);
   const mode=next.kind,stage=autoLevels.current[mode],max=mode==='sort'?2:1;if(recorder.current?.snapshot().difficulty==='auto'&&stage<max){try{const key=`car-playroom-streak:${account}:${mode}:${stage}`,offered=`${key}:offered`,count=next.wrong<=1&&next.hints===0?(Number(localStorage.getItem(key))||0)+1:0;localStorage.setItem(key,String(count));if(count>=2&&!localStorage.getItem(offered)){setSuggestReplay(true);localStorage.setItem(offered,'1');}}catch{/* Continue at the same stage. */}}
  }
  if(next?.message)say(next.message);
 }
 function pause(){stopSpeech();recorder.current?.note('pauses');setPaused(true);}
 function openRoad(kind:RoadMode){prepareAudio();setRoad(kind);}
 function openLegacy(kind:'repair'|'bridge'){say(kind==='repair'?'一起修好消防车。':'你一块，我一块，一起修桥。');setLegacy(kind);}
 if(initialGame&&!round&&!legacy&&!road)return <main className="playroom" aria-busy="true"><p>小汽车准备中……</p></main>;
 if(legacy)return <LegacyGame initialMode={legacy} level={difficulty} account={account} onHome={goHome} onBack={()=>{stopSpeech();goHome();}}/>;
 if(road)return <RoadGame kind={road} level={difficulty} queueIndex={queueRuns.current} onQueueFinish={()=>{queueRuns.current++;try{localStorage.setItem(`car-playroom-queue:${account}`,String(queueRuns.current));}catch{/* Keep the in-memory sequence. */}}} say={say} onHome={goHome} onBack={()=>{stopSpeech();goHome();}} account={account}/>;
 const total=round?.kind==='sort'?round.deck.length:0;
 const done=round?.kind==='sort'?round.parked.length:0;
 return <main ref={root} className={`playroom ${paused||parents?'is-paused':''}`}><StorageNotice/><AudioNotice/>
  <header className="room-header"><div onClick={e=>{if(round){e.preventDefault();back();}}}><Logo/></div><div className="room-header-buttons"><button aria-label={muted?'打开声音':'关闭声音'} className="room-icon" onClick={()=>{prepareAudio();stopSpeech();setAudioSettings({muted:!muted});}}><LittleIcon kind={muted?'mute':'sound'}/></button><button className="room-parent" onClick={()=>{stopSpeech();if(roundRef.current&&!roundRef.current.complete)setPaused(true);setParents(true);}}>家长</button></div></header>
  {!round?<>
   <section className="room-welcome"><h1>选一个游戏</h1><button className="room-voice" aria-label="听一听怎么玩" onClick={()=>say('选一个喜欢的汽车游戏。')}><LittleIcon kind="sound"/>听一听</button></section>
   <div className="library-filters" aria-label="游戏分类">
    <button aria-pressed={hub===null} onClick={()=>router.push('/game')}>全部</button>
    <button aria-pressed={hub==='focus'} onClick={()=>router.push('/game?category=focus')}>看一看 · 想一想</button>
    <button aria-pressed={hub==='rules'} onClick={()=>router.push('/game?category=rules')}>轮流与合作</button>
   </div>
   <section className="hub-game-list" aria-label="游戏列表">{homeGames.filter(id=>hub===null||gameCatalog[id].category===hub).map(id=><button key={id} onClick={()=>{if(leaving.current)return;leaving.current=true;prepareAudio();rememberGameEntry(account,id,hub);router.push(`/game/${id}`);}}><span>{id==='delivery'?<Illustration id="delivery"/>:id==='sudoku'?<SudokuPreview home/>:id==='difference'?<DifferencePreview home/>:<VehicleArt kind={id==='queue'?'bus':id==='bridge'?'digger':'fire'}/>}</span><strong>{gameNames[id]}</strong></button>)}</section>
   <div className="room-bottom"><span><LittleIcon kind="retry"/> 每局可以重新玩</span></div>
  </>:<>
   <div className="round-toolbar"><GameBackButton onBack={back}/><Dots total={total} done={done}/><button className="room-pause" onClick={pause}><LittleIcon kind="pause"/>休息</button></div>
   {round.complete?<section className="round-finish"><div className="finish-cars"><VehicleArt kind="fire"/><VehicleArt kind="bus"/><VehicleArt kind="digger"/></div><h1>完成啦！</h1><div className="finish-actions"><button className="room-primary" onClick={()=>start(round.kind)}><LittleIcon kind="retry"/>再玩一局</button><button className="room-secondary" onClick={goHome}><LittleIcon kind="home"/>返回首页</button>{suggestReplay&&<button className="room-secondary" onClick={()=>{const kind=round.kind;autoLevels.current[kind]=Math.min(kind==='sort'?2:1,autoLevels.current[kind]+1);try{localStorage.setItem(`car-playroom-stage:${account}:${kind}`,String(autoLevels.current[kind]));}catch{}start(kind);}}>试试下一步</button>}</div></section>:<>
    <div className="round-title"><h1>{round.kind==='sort'?round.rule==='color'?'按颜色停车':round.rule==='model'?'找同款小车':'按用途停车':instructions[round.kind]}</h1><button className="room-icon" aria-label="听游戏规则" onClick={()=>say(round.kind==='sort'?`这次按${round.rule==='color'?'颜色':round.rule==='model'?'车型':'用途'}停车。`:spoken[round.kind])}><LittleIcon kind="sound"/></button></div>
    {round.kind==='sort'&&<section className="sort-game" aria-label="汽车分类游戏"><div role="img" aria-label={vehicleNames[round.deck[round.index].kind]} className={`sort-current ${round.placed?'is-parked':''}`}><VehicleArt {...round.deck[round.index]}/>{round.placed&&<span className="big-check" aria-hidden="true">✓</span>}</div><div className="sort-bins">{round.bins.map(bin=><button key={bin.id} className={`sort-bin bin-${bin.id} ${round.hintLevel>=2&&sortTarget(round,round.deck[round.index])===bin.id?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''}`} aria-label={`放到${bin.name}站`} disabled={round.placed} onClick={()=>act({type:'bin',bin:bin.id})}><div className="bin-examples">{bin.kind?<VehicleArt kind={bin.kind}/>:bin.color?<span className="color-bin" style={{background:bin.color}}/>:<span className="category-icon">{bin.id==='rescue'?'✚':bin.id==='transport'?'↔':'⚒'}</span>}</div><strong>{bin.name}</strong><div className="parked-cars">{round.parked.filter(v=>sortTarget(round,v)===bin.id).map((v,i)=><VehicleArt key={i} {...v}/>)}</div></button>)}</div></section>}
    <div className="round-feedback" role="status" aria-live="polite">{round.message||'慢慢来'}</div>
    <div className="round-actions">{round.kind==='sort'&&round.placed?<button className="room-primary" onClick={()=>act({type:'next'})}>下一辆<span aria-hidden="true">→</span></button>:<><button className="room-secondary" onClick={()=>act({type:'hint'})}><LittleIcon kind="hint"/>提示</button></>}</div>
   </>}
  </>}
  {parents?<ParentPanel account={account} game={initialGame} difficulty={difficulty} onDifficulty={value=>{difficultyRef.current=value;setDifficulty(value);}} onClose={()=>setParents(false)} onRestart={round&&!round.complete?restartRound:undefined}/>:paused?<div className="room-overlay pause-overlay"><section className="playroom-modal" role="dialog" aria-modal="false" aria-labelledby="room-modal-title"><div className="rest-picture"><LittleIcon kind="pause"/></div><h2 id="room-modal-title">休息一下</h2><button className="room-primary resume-play" aria-label="恢复游戏" onClick={()=>{setPaused(false);say('我们继续玩。');}}>▶</button></section></div>:null}
 </main>;
}
