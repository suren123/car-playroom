'use client';
import AudioNotice from './audio-notice';
import StorageNotice from '../components/storage-notice';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import { LittleIcon, Logo } from './car-art';
import { VehicleArt } from './vehicle-art';
import {Illustration} from './illustration';
import LegacyGame from './legacy-game';
import RoadGame from './road-games';
import ParentPanel,{readDifficulty} from './parent-panel';
import { RoundRecorder, type RecordDifficulty } from '../lib/records-client';
import { prepareAudio, speakDelivery, speakGently, stopSpeech } from '../lib/speech';
import {useAudioSettings} from '../lib/use-audio-settings';
import { makeRound, replayReducer, sortTarget, sudokuKinds, vehicleNames, type ReplayMode, type SortRule } from '../lib/replay-games';
import type { RoadMode } from '../lib/road-games';
import {gameNames,gameIds,gameCatalog,type GameId} from '../games/registry';
import {readRound,saveRound,removeRound,trackRound} from '../lib/local-rounds';
import type {Round} from '../lib/replay-games';

const instructions:Record<ReplayMode,string>={sort:'小车停哪里？',difference:'找出不一样的车',sudoku:'空位停哪辆车？'};
const spoken:Record<ReplayMode,string>={sort:'把小车送到对应车站。消防车和救护车去救援站，公交车和货车去运输站，挖掘机和吊车去施工站。',difference:'两边的车有一点不一样。找到以后，点任意一边的小车。',sudoku:'先点空位，再选一辆车。每一排、每一列，还有粗线围起来的小车库，同一种车只能停一次。'};
function Dots({total,done}:{total:number;done:number}){return <div className="round-dots" aria-label={`已完成 ${done}，共 ${total}`} role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>{Array.from({length:total},(_,i)=><span key={i} className={i<done?'filled':''}/>)}</div>;}
function savedProgress(account:string,game:GameId){const saved=readRound<Record<string,unknown>>(account,game);if(!saved)return '';const s=saved.state;if(game==='delivery')return `第 ${Number(s.taskIndex)+1} 次配送`;if(game==='repair'||game==='bridge')return `第 ${Number(s.task)+1} 个任务`;if(game==='queue')return `已出发 ${Number(s.index)} / 3`;if(game==='listen')return `第 ${Number(s.group)+1} 项任务`;if(game==='sort'&&Array.isArray(s.deck)&&Array.isArray(s.parked))return `已停好 ${s.parked.length} / ${s.deck.length}`;if(game==='difference'&&Array.isArray(s.found)&&Array.isArray(s.differences))return `已找到 ${s.found.length} / ${s.differences.length}`;return '任务进行中';}

export default function Playroom({account,initialGame,library=false}:{account:string;initialGame?:GameId;library?:boolean}){
 const router=useRouter(),searchParams=useSearchParams();
 const [round,dispatch]=useReducer(replayReducer,null);
 const [legacy,setLegacy]=useState<'repair'|'bridge'|null>(null),[road,setRoad]=useState<RoadMode|null>(null),[hub,setHub]=useState<'focus'|'rules'|null>(null);
 const {settings,setAudioSettings}=useAudioSettings(),muted=settings.muted;
 const [paused,setPaused]=useState(false),[parents,setParents]=useState(false),[difficulty,setDifficulty]=useState<RecordDifficulty>('auto');
 const difficultyRef=useRef<RecordDifficulty>('auto');
 const roundRef=useRef(round);roundRef.current=round;
 const seed=useRef(0);
 const recorder=useRef<RoundRecorder|null>(null),queueRuns=useRef(0),autoLevels=useRef<Record<ReplayMode,number>>({sort:0,difference:0,sudoku:0}),streaks=useRef<Record<ReplayMode,number>>({sort:0,difference:0,sudoku:0}),sudokuSeen=useRef(false);
 const awaitingRetry=useRef(false);
 const [recent,setRecent]=useState<GameId|null>(null);
 const [savedIds,setSavedIds]=useState<GameId[]>([]);
 const [suggestReplay,setSuggestReplay]=useState(false);
 const [sudokuDemo,setSudokuDemo]=useState(false);
 const sudokuStage=useRef(0);
 const say=useCallback((text:string)=>{
   speakGently(text,!muted);
 },[muted]);
 useEffect(()=>{
  seed.current=(Date.now()+Math.floor(Math.random()*0x7fffffff))>>>0;
  const visibility=()=>{if(document.hidden){stopSpeech();if(roundRef.current&&!roundRef.current.complete)setPaused(true);}};
  document.addEventListener('visibilitychange',visibility);
  return()=>{document.removeEventListener('visibilitychange',visibility);stopSpeech();};
 },[]);
 useEffect(()=>{difficultyRef.current=readDifficulty(account,initialGame);setDifficulty(difficultyRef.current);try{queueRuns.current=Number(localStorage.getItem(`car-playroom-queue:${account}`))||0;for(const kind of ['sort','difference'] as const)autoLevels.current[kind]=Math.max(0,Math.min(kind==='sort'?2:1,Number(localStorage.getItem(`car-playroom-stage:${account}:${kind}`))||0));}catch{/* Use an in-memory sequence. */}const saved=gameIds.map(id=>readRound<unknown>(account,id)).filter(x=>x!==null).sort((a,b)=>b.updatedAt-a.updatedAt);setRecent(saved[0]?.game??null);setSavedIds(saved.map(item=>item.game));if(initialGame){if(initialGame==='repair'||initialGame==='bridge')setLegacy(initialGame);else if(initialGame==='queue'||initialGame==='traffic'||initialGame==='listen'||initialGame==='detour')setRoad(initialGame);else if(initialGame==='sort'||initialGame==='difference'||initialGame==='sudoku')openReplay(initialGame);}},[account,initialGame]);
 useEffect(()=>{if(library){const category=searchParams.get('category');setHub(category==='focus'||category==='rules'?category:null);}},[library,searchParams]);
 useEffect(()=>{if(!paused&&!parents)return;const last=document.activeElement as HTMLElement|null;const modal=document.querySelector('.playroom-modal');const controls=Array.from(modal?.querySelectorAll<HTMLElement>('button')||[]);controls[0]?.focus();const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab'||!controls.length)return;const first=controls[0],end=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}};document.addEventListener('keydown',trap);return()=>{document.removeEventListener('keydown',trap);last?.focus();};},[paused,parents]);
 function start(kind:ReplayMode){
  if(roundRef.current&&!roundRef.current.complete){recorder.current?.note('retries');void recorder.current?.finish(false);}
  seed.current=(seed.current+0x9e3779b9)>>>0;
  const selectedDifficulty=difficultyRef.current;
  const level=selectedDifficulty==='auto'?autoLevels.current[kind]:selectedDifficulty==='challenge'?2:0;
  const rule:SortRule=level>=2?'purpose':level===1?'model':'color';
  if(kind==='sudoku'){try{sudokuStage.current=selectedDifficulty==='challenge'?3:selectedDifficulty==='simple'?0:Math.max(0,Math.min(3,Number(localStorage.getItem(`car-playroom-sudoku-stage:${account}`))||0));}catch{sudokuStage.current=0;}}
  const tutorial=kind==='sudoku'&&sudokuStage.current<2;
  const next=makeRound(kind,seed.current,level>0,rule,tutorial,kind==='sudoku'?sudokuStage.current:undefined);
  setSuggestReplay(false);
  if(kind==='sudoku'&&sudokuStage.current>=2){try{setSudokuDemo(!localStorage.getItem(`car-playroom-sudoku-demo:${account}`));}catch{setSudokuDemo(true);}}else setSudokuDemo(false);
  recorder.current=new RoundRecorder(kind,selectedDifficulty);trackRound(account,kind,recorder.current);awaitingRetry.current=false;roundRef.current=next;dispatch({type:'start',round:next});setPaused(false);say(kind==='sort'?`这次按${rule==='color'?'颜色':rule==='model'?'车型':'用途'}停车。`:kind==='sudoku'&&tutorial?'每一排和每一列，放不一样的小车。':spoken[kind]);
  saveRound(account,kind,next,recorder.current.snapshot(),kind==='sudoku'?{stage:sudokuStage.current}:undefined);
 }
 function openReplay(kind:ReplayMode){const saved=readRound<Round>(account,kind);if(saved&&saved.state.kind===kind&&!saved.state.complete){if(kind==='sudoku')sudokuStage.current=Number(saved.extra?.stage)||0;recorder.current=new RoundRecorder(kind,saved.record.difficulty,{},saved.record);trackRound(account,kind,recorder.current);roundRef.current=saved.state;dispatch({type:'start',round:saved.state});setPaused(true);}else start(kind);}
 function endRound(){const current=roundRef.current;if(current&&!current.complete){void recorder.current?.finish(false);removeRound(account,current.kind);}stopSpeech();router.push('/game');}
 function restartRound(){const current=roundRef.current;if(!current||!window.confirm('重新开始这局？已经完成的步骤会清空。'))return;void recorder.current?.finish(false);removeRound(account,current.kind);roundRef.current=null;start(current.kind);}
 function back(){stopSpeech();roundRef.current=null;dispatch({type:'home'});setPaused(false);router.push('/game/library');}
 function act(action:Parameters<typeof replayReducer>[1]){
  if(paused||parents||sudokuDemo)return;const before=roundRef.current,next=replayReducer(before,action);if(next===before)return;
  if(action.type==='hint')recorder.current?.note('hints');
  if(before&&next&&next.wrong>before.wrong){recorder.current?.note('wrong');awaitingRetry.current=true;}
  if(awaitingRetry.current&&before&&next&&((next.kind==='sort'&&before.kind==='sort'&&next.parked.length>before.parked.length)||(next.kind==='difference'&&before.kind==='difference'&&next.found.length>before.found.length)||(next.kind==='sudoku'&&before.kind==='sudoku'&&next.values.filter(x=>x!==-1).length>before.values.filter(x=>x!==-1).length))){recorder.current?.note('retries');awaitingRetry.current=false;}
  roundRef.current=next;dispatch(action);
  if(next?.complete&&!before?.complete){void recorder.current?.finish(true);if(next.kind==='sudoku'&&next.size===2)sudokuSeen.current=true;
   const mode=next.kind,stage=mode==='sudoku'?sudokuStage.current:autoLevels.current[mode],max=mode==='sudoku'?3:mode==='sort'?2:1;if(recorder.current?.snapshot().difficulty==='auto'&&stage<max){try{const key=`car-playroom-streak:${account}:${mode}:${stage}`,offered=`${key}:offered`,count=next.wrong<=1&&next.hints===0?(Number(localStorage.getItem(key))||0)+1:0;localStorage.setItem(key,String(count));if(count>=2&&!localStorage.getItem(offered)){setSuggestReplay(true);localStorage.setItem(offered,'1');}}catch{/* Continue at the same stage. */}}
   removeRound(account,next.kind);
  }
  else if(next&&recorder.current)saveRound(account,next.kind,next,recorder.current.snapshot(),next.kind==='sudoku'?{stage:sudokuStage.current}:undefined);
  if(next?.message)say(next.message);
 }
 function pause(){stopSpeech();recorder.current?.note('pauses');if(roundRef.current&&recorder.current)saveRound(account,roundRef.current.kind,roundRef.current,recorder.current.snapshot(),roundRef.current.kind==='sudoku'?{stage:sudokuStage.current}:undefined);setPaused(true);}
 function openRoad(kind:RoadMode){prepareAudio();setRoad(kind);}
 function openLegacy(kind:'repair'|'bridge'){say(kind==='repair'?'一起修好消防车。':'你一块，我一块，一起修桥。');setLegacy(kind);}
 if(initialGame&&!round&&!legacy&&!road)return <main className="playroom" aria-busy="true"><p>小汽车准备中……</p></main>;
 if(legacy)return <LegacyGame initialMode={legacy} level={difficulty} account={account} onHome={()=>router.push('/game')} onExit={()=>{stopSpeech();router.push('/game/library');}}/>;
 if(road)return <RoadGame kind={road} level={difficulty} queueIndex={queueRuns.current} onQueueFinish={()=>{queueRuns.current++;try{localStorage.setItem(`car-playroom-queue:${account}`,String(queueRuns.current));}catch{/* Keep the in-memory sequence. */}}} say={say} onHome={()=>router.push('/game')} onExit={()=>{stopSpeech();router.push('/game/library');}} account={account}/>;
 const total=round?.kind==='sort'?round.deck.length:round?.kind==='difference'?round.differences.length:round?.kind==='sudoku'?round.initial.filter(x=>x===-1).length:0;
 const done=round?.kind==='sort'?round.parked.length:round?.kind==='difference'?round.found.length:round?.kind==='sudoku'?total-round.values.filter(x=>x===-1).length:0;
 return <main className="playroom"><StorageNotice/><AudioNotice/>
  <header className="room-header"><div onClick={e=>{if(round){e.preventDefault();pause();}}}><Logo/></div><div className="room-header-buttons"><button aria-label={muted?'打开声音':'关闭声音'} className="room-icon" onClick={()=>{prepareAudio();stopSpeech();setAudioSettings({muted:!muted});}}><LittleIcon kind={muted?'mute':'sound'}/></button><button className="room-parent" onClick={()=>{stopSpeech();if(roundRef.current&&!roundRef.current.complete)setPaused(true);setParents(true);}}>家长</button></div></header>
  {!round?<>
   <section className="room-welcome"><h1>{library?'选一个游戏':'今天玩什么？'}</h1><button className="room-voice" aria-label="听一听怎么玩" onClick={()=>say('选一个喜欢的汽车游戏。')}><LittleIcon kind="sound"/>听一听</button></section>
   {library?<><button className="hub-back" onClick={()=>router.push('/game')}>‹ 返回大厅</button><div className="library-filters"><button onClick={()=>router.push('/game/library')}>全部</button><button onClick={()=>router.push('/game/library?category=focus')}>看一看 · 想一想</button><button onClick={()=>router.push('/game/library?category=rules')}>轮流与合作</button></div><section className="hub-game-list" aria-label="全部游戏">{gameIds.filter(id=>hub===null||gameCatalog[id].category===hub).map(id=><button key={id} onClick={()=>{prepareAudio();router.push(`/game/${id}`);}}><span>{id==='delivery'?<Illustration id="delivery"/>:<VehicleArt kind={id==='queue'?'bus':id==='bridge'?'digger':'fire'}/>}</span><strong>{gameNames[id]}</strong>{savedIds.includes(id)&&<small>可以继续</small>}</button>)}</section></>:<>{recent&&<section className="resume-card"><span className="resume-art"><VehicleArt kind={recent==='queue'?'bus':recent==='bridge'?'digger':'fire'}/></span><div><strong>继续上次 · {gameNames[recent]}</strong><small>{savedProgress(account,recent)}</small></div><button className="room-primary" onClick={()=>router.push(`/game/${recent}`)}>继续玩 →</button></section>}<section className="hub-game-list featured-games" aria-label="精选游戏">{(['delivery','queue','bridge'] as const).map(id=><button key={id} onClick={()=>{prepareAudio();router.push(`/game/${id}`);}}><span>{id==='delivery'?<Illustration id="delivery"/>:<VehicleArt kind={id==='queue'?'bus':'digger'}/>}</span><strong>{gameNames[id]}</strong></button>)}</section><button className="room-primary all-games" onClick={()=>router.push('/game/library')}>全部游戏 →</button></>}
   <div className="room-bottom"><span><LittleIcon kind="retry"/> 每局可以重新玩</span></div>
  </>:<>
   <div className="round-toolbar"><button className="room-back" onClick={back} aria-label="返回游戏列表"><LittleIcon kind="home"/><span>返回</span></button><Dots total={total} done={done}/><button className="room-pause" onClick={pause}><LittleIcon kind="pause"/>休息</button></div>
   {round.complete?<section className="round-finish"><div className="finish-cars"><VehicleArt kind="fire"/><VehicleArt kind="bus"/><VehicleArt kind="digger"/></div><h1>完成啦！</h1><div className="finish-actions"><button className="room-primary" onClick={()=>start(round.kind)}><LittleIcon kind="retry"/>再玩一局</button><button className="room-secondary" onClick={()=>router.push('/game')}><LittleIcon kind="home"/>回大厅</button>{suggestReplay&&<button className="room-secondary" onClick={()=>{const kind=round.kind;if(kind==='sudoku'){sudokuStage.current=Math.min(3,sudokuStage.current+1);try{localStorage.setItem(`car-playroom-sudoku-stage:${account}`,String(sudokuStage.current));}catch{}}else{autoLevels.current[kind]=Math.min(kind==='sort'?2:1,autoLevels.current[kind]+1);try{localStorage.setItem(`car-playroom-stage:${account}:${kind}`,String(autoLevels.current[kind]));}catch{}}start(kind);}}>试试下一步</button>}</div></section>:<>
    <div className="round-title"><h1>{round.kind==='sort'?round.rule==='color'?'按颜色停车':round.rule==='model'?'找同款小车':'按用途停车':round.kind==='sudoku'&&round.size===2?'小车排排看':instructions[round.kind]}</h1><button className="room-icon" aria-label="听游戏规则" onClick={()=>say(round.kind==='sort'?`这次按${round.rule==='color'?'颜色':round.rule==='model'?'车型':'用途'}停车。`:round.kind==='sudoku'&&round.size===2?'每一排和每一列，放不一样的小车。':spoken[round.kind])}><LittleIcon kind="sound"/></button></div>
    {round.kind==='sort'&&<section className="sort-game" aria-label="汽车分类游戏"><div role="img" aria-label={vehicleNames[round.deck[round.index].kind]} className={`sort-current ${round.placed?'is-parked':''}`}><VehicleArt {...round.deck[round.index]}/>{round.placed&&<span className="big-check" aria-hidden="true">✓</span>}</div><div className="sort-bins">{round.bins.map(bin=><button key={bin.id} className={`sort-bin bin-${bin.id} ${round.hintLevel>=2&&sortTarget(round,round.deck[round.index])===bin.id?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''}`} aria-label={`放到${bin.name}站`} disabled={round.placed} onClick={()=>act({type:'bin',bin:bin.id})}><div className="bin-examples">{bin.kind?<VehicleArt kind={bin.kind}/>:bin.color?<span className="color-bin" style={{background:bin.color}}/>:<span className="category-icon">{bin.id==='rescue'?'✚':bin.id==='transport'?'↔':'⚒'}</span>}</div><strong>{bin.name}</strong><div className="parked-cars">{round.parked.filter(v=>sortTarget(round,v)===bin.id).map((v,i)=><VehicleArt key={i} {...v}/>)}</div></button>)}</div></section>}
    {round.kind==='difference'&&<section className="difference-game" aria-label="比较两边的车阵">{[round.left,round.right].map((scene,side)=><div className="difference-scene" key={side} aria-label={side===0?'左边车阵':'右边车阵'}><div className="scene-top" aria-hidden="true"><span/><span/></div><div className="difference-grid">{scene.map((vehicle,i)=><button key={i} aria-label={`${side===0?'左':'右'}边第${i+1}辆，${vehicleNames[vehicle.kind]}`} disabled={round.found.includes(i)} className={`spot-tile ${round.found.includes(i)?'is-found':''} ${round.hintLevel>=2&&round.differences.find(x=>!round.found.includes(x))===i?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''}`} onClick={()=>act({type:'spot',index:i})}><VehicleArt {...vehicle}/>{round.found.includes(i)&&<span aria-hidden="true">✓</span>}</button>)}</div><div className="scene-road" aria-hidden="true"/></div>)}</section>}
    {round.kind==='sudoku'&&<section className="sudoku-game" aria-label={`${round.size}乘${round.size}汽车数独`}><div className={`sudoku-board ${round.size===2?'tutorial-board':''}`} role="group" aria-label="每排每列的小车不重复">{round.values.map((value,i)=><button key={i} aria-label={`第${Math.floor(i/round.size)+1}排第${i%round.size+1}格，${value===-1?'空位':vehicleNames[sudokuKinds[value]]}`} aria-pressed={round.selected===i} disabled={value!==-1} className={`sudoku-cell ${round.size===4&&i%4===1?'block-right':''} ${round.size===4&&Math.floor(i/4)===1?'block-bottom':''} ${round.selected===i?'is-selected':''} ${round.selected!==null&&(Math.floor(i/round.size)===Math.floor(round.selected/round.size)||i%round.size===round.selected%round.size)?'is-related':''} ${round.initial[i]===-1&&value!==-1?'is-filled':''}`} onClick={()=>act({type:'select',index:i})}>{value===-1?<span>?</span>:<VehicleArt kind={sudokuKinds[value]}/>}</button>)}</div><div className="sudoku-choices" aria-label="选一辆车">{sudokuKinds.slice(0,round.size).map((kind,value)=><button key={kind} aria-label={`选择${vehicleNames[kind]}`} className={round.hintLevel>=2&&round.selected!==null&&round.solution[round.selected]===value?round.hintLevel===3?'is-hinted demo-hint':'is-hinted':''} onClick={()=>act({type:'symbol',value})}><VehicleArt kind={kind}/></button>)}</div></section>}
    <div className="round-feedback" role="status" aria-live="polite">{round.message||'慢慢来'}</div>
    <div className="round-actions">{round.kind==='sort'&&round.placed?<button className="room-primary" onClick={()=>act({type:'next'})}>下一辆<span aria-hidden="true">→</span></button>:<><button className="room-secondary" onClick={()=>act({type:'hint'})}><LittleIcon kind="hint"/>提示</button></>}</div>
   </>}
  </>}
  {parents?<ParentPanel account={account} game={initialGame} difficulty={difficulty} onDifficulty={value=>{difficultyRef.current=value;setDifficulty(value);}} onClose={()=>setParents(false)}/>:paused?<div className="room-overlay"><section className="playroom-modal" role="dialog" aria-modal="true" aria-labelledby="room-modal-title"><div className="rest-picture"><LittleIcon kind="pause"/></div><h2 id="room-modal-title">休息一下</h2><button className="room-primary" onClick={()=>{setPaused(false);say('我们继续玩。');}}>继续玩<span aria-hidden="true">▶</span></button><button className="room-secondary" onClick={back}><LittleIcon kind="home"/>换个游戏</button><button className="room-secondary" onClick={endRound}>今天结束</button><button className="room-secondary" onClick={restartRound}>重新开始这局</button></section></div>:sudokuDemo&&<div className="room-overlay"><section className="playroom-modal" role="dialog" aria-modal="true" aria-label="数独示范"><h2>小车停一停</h2><div className="sudoku-demo-grid" aria-hidden="true">{Array.from({length:16},(_,i)=><span key={i} className={`${i<4?'row':''} ${i%4===0?'col':''} ${i<2||i===4||i===5?'box':''}`}>{['🚒','🚌','🚜','🚚'][(Math.floor(i/4)*2+Math.floor(i/8)+i%4)%4]}</span>)}</div><p>每一排、每一列、每个粗线小车库里，小车都不一样。</p><button className="room-secondary" onClick={()=>say(spoken.sudoku)}>听一听</button><button className="room-primary" onClick={()=>{try{localStorage.setItem(`car-playroom-sudoku-demo:${account}`,'1');}catch{}setSudokuDemo(false);}}>我来试试</button></section></div>}
 </main>;
}
