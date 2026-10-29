'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import GameHeader from './game-header';
import DifferenceFinish from './difference-finish';
import {useGameNavigation} from '../hooks/use-game-navigation';
import {gameBackTarget} from '../lib/game-navigation';
import {Illustration} from './illustration';
import {DifferencePreview} from './difference-art';
import ParentPanel from './parent-panel';
import AudioNotice from './audio-notice';
import StorageNotice from './storage-notice';
import {LittleIcon} from './car-art';
import {usePauseAnimations} from '../hooks/use-pause-animations';
import {useAudioSettings} from '../lib/use-audio-settings';
import {prepareAudio,speakGently,stopSpeech} from '../lib/speech';
import {RoundRecorder,type RecordDifficulty} from '../lib/records-client';
import {preloadIllustrations} from '../games/delivery/assets';
import {makeDifference,replayReducer,differenceLevels,differenceSpeech,vehicleNames,type DifferenceRound,type DifferenceDifficulty} from '../lib/replay-games';
import {readDifferenceDifficulty,differenceDifficultyKey} from '../lib/difference-preferences';

const levels:DifferenceDifficulty[]=['beginner','practice','challenge'];
const recordDifficulty:Record<DifferenceDifficulty,RecordDifficulty>={beginner:'simple',practice:'auto',challenge:'challenge'};
export default function DifferenceGame({account}:{account:string}){
 const {goHome}=useGameNavigation(account,'difference'),root=useRef<HTMLElement>(null);
 const {settings,setAudioSettings}=useAudioSettings();
 const [preferred,setPreferred]=useState<DifferenceDifficulty>('beginner'),[ready,setReady]=useState(false);
 const [round,setRound]=useState<DifferenceRound|null>(null),roundRef=useRef<DifferenceRound|null>(null);
 const [loading,setLoading]=useState<DifferenceDifficulty|null>(null),[failed,setFailed]=useState(false);
 const [celebrate,setCelebrate]=useState(false);
 const [paused,setPaused]=useState(false),[parents,setParents]=useState(false);
 const recorder=useRef<RoundRecorder|null>(null),request=useRef(0),busy=useRef(false),blocked=useRef(false),retry=useRef(false);
 useEffect(()=>{blocked.current=paused||parents;},[paused,parents]);
 usePauseAnimations(root,paused||parents);
 const say=(text:string)=>speakGently(text,!settings.muted);
 useEffect(()=>{
  // Hydrate account preferences after the deterministic server render.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  try{setPreferred(readDifferenceDifficulty(localStorage,account));}catch{setPreferred('beginner');}setReady(true);
  const visibility=()=>{if(document.hidden){stopSpeech();setCelebrate(false);if(roundRef.current&&!roundRef.current.complete){blocked.current=true;setPaused(true);}}};
  document.addEventListener('visibilitychange',visibility);
  return()=>{request.current++;recorder.current?.dispose();recorder.current=null;roundRef.current=null;stopSpeech();document.removeEventListener('visibilitychange',visibility);};
 },[account]);
 function end(){if(roundRef.current&&!roundRef.current.complete)void recorder.current?.finish(false);recorder.current?.dispose();recorder.current=null;roundRef.current=null;}
 function choose(){setCelebrate(false);request.current++;busy.current=false;end();setRound(null);setLoading(null);setFailed(false);setParents(false);setPaused(false);stopSpeech();}
 function back(){const target=gameBackTarget('difference',roundRef.current?'play':loading?'loading':'difficulty');choose();if(target==='home')goHome();}
 async function start(difficulty:DifferenceDifficulty){
  if(busy.current)return;
  busy.current=true;const ticket=++request.current;
  end();setCelebrate(false);setRound(null);setParents(false);setPaused(false);setLoading(difficulty);setFailed(false);prepareAudio();stopSpeech();
  try{
   const seed=crypto.getRandomValues(new Uint32Array(1))[0],next=makeDifference(difficulty,seed);
   await preloadIllustrations([...next.left,...next.right].map(vehicle=>vehicle.kind));
   if(ticket!==request.current)return;
   setPreferred(difficulty);
   try{localStorage.setItem(differenceDifficultyKey(account),difficulty);}catch{window.dispatchEvent(new Event('car-storage-unavailable'));}
   recorder.current=new RoundRecorder('difference',recordDifficulty[difficulty],{gameVersion:'difference-png-v3',seed,parameters:JSON.stringify({difficulty,vehicles:differenceLevels[difficulty].count,differences:differenceLevels[difficulty].differences,version:3,assetVersion:'expansion-v5',vehicleIds:next.vehicles})});
   retry.current=false;roundRef.current=next;setRound(next);setLoading(null);setPaused(document.hidden);say(differenceSpeech.rules);
  }catch{if(ticket===request.current)setFailed(true);}
  finally{if(ticket===request.current)busy.current=false;}
 }
 function act(action:{type:'spot';index:number}|{type:'hint'},expectedSeed:number){
  const before=roundRef.current;
  if(!before||before.complete||blocked.current||expectedSeed!==before.seed)return;
  const next=replayReducer(before,action) as DifferenceRound;
  if(next===before)return;
  if(action.type==='hint')recorder.current?.note('hints');
  if(next.wrong>before.wrong){recorder.current?.note('wrong');retry.current=true;}
  if(action.type==='spot'&&next.wrong===before.wrong&&retry.current){recorder.current?.note('retries');retry.current=false;}
  roundRef.current=next;setRound(next);
  if(next.complete){void recorder.current?.finish(true);setCelebrate(true);}
  if(next.message)say(next.message);else stopSpeech();
 }
 function pause(){if(!roundRef.current||roundRef.current.complete)return;blocked.current=true;recorder.current?.note('pauses');stopSpeech();setPaused(true);}
 const disabled=paused||parents;
 const level=round?differenceLevels[round.difficulty]:null;
 const hintIndex=round&&!round.complete&&round.hintLevel>=2?round.differences.find(i=>!round.found.includes(i)):undefined;
 return <main ref={root} className={`playroom spot-room ${disabled?'is-paused':''} ${round?.complete?'spot-finished':''} ${celebrate?'spot-celebrating':''}`}>
  <StorageNotice/><AudioNotice/>
  <GameHeader title={`找不同${level?` · ${level.label}`:''}`} onBack={back} muted={settings.muted} onSound={()=>{prepareAudio();stopSpeech();setAudioSettings({muted:!settings.muted});}} onParent={()=>{stopSpeech();setCelebrate(false);blocked.current=true;setParents(true);}} onPause={round&&!round.complete?pause:undefined}/>
  {!round&&!loading&&<section className="spot-selection" aria-labelledby="spot-select-title">
   <h1 id="spot-select-title">找找哪里不一样</h1><p>选一个小车阵，一起仔细看看</p>
   <div className="spot-level-cards">{levels.map(difficulty=>{const config=differenceLevels[difficulty];return <button key={difficulty} disabled={!ready} aria-label={`${config.label} · 找 ${config.differences} 处不同`} aria-pressed={ready&&preferred===difficulty} onClick={()=>void start(difficulty)}>
    <DifferencePreview difficulty={difficulty}/><strong>{config.label} · 找 {config.differences} 处</strong><span>每边 {config.count} 辆车</span><small>{ready&&preferred===difficulty?'上次选择':'点一下开始'}</small>
   </button>;})}</div>
  </section>}
  {loading&&<section className="spot-loading" aria-busy={!failed}><h1>{failed?'小车图片还没准备好':'小车准备中……'}</h1><p role="status">{failed?'检查网络后，再试一次。':'准备好就可以找不同啦'}</p>{failed&&<button className="room-primary" onClick={()=>void start(loading)}>重试加载</button>}<button className="room-secondary" onClick={choose}>换难度</button></section>}
  {round&&level&&<>
   <div className="spot-toolbar"><button className="room-secondary" disabled={disabled} onClick={choose}>换难度</button><span role="progressbar" aria-label="寻找进度" aria-valuemin={0} aria-valuemax={level.differences} aria-valuenow={round.found.length}>找到 {round.found.length} / {level.differences} 处</span></div>
   <section className="spot-stage" aria-label="比较两边的车阵">
    <div className="spot-boards" style={{'--columns':level.columns,'--rows':level.count/level.columns} as CSSProperties}>
     {[round.left,round.right].map((scene,side)=><div className="spot-board" key={side} role="group" aria-label={side===0?'左边车阵':'右边车阵'}>
      <div className="spot-board-label">{side===0?'左边':'右边'}</div>
      <div className="spot-grid">{scene.map((vehicle,i)=>{
       const found=round.found.includes(i),hinted=hintIndex===i;
       return <button key={i} aria-label={`${side===0?'左':'右'}边第${i+1}辆，${vehicleNames[vehicle.kind]}${found?'，已找到':''}`} disabled={disabled||found||round.complete} className={`spot-car ${found?'found':''} ${hinted?'hinted':''}`} onClick={()=>act({type:'spot',index:i},round.seed)}><Illustration id={vehicle.kind} priority/>{found&&<b className="spot-check" aria-hidden="true">✓</b>}{hinted&&round.hintLevel===3&&<b className="spot-finger" aria-hidden="true">👆</b>}</button>;
      })}</div>
     </div>)}
    </div>
    {round.complete?<div className="spot-completion" role="status"><DifferenceFinish round={round}/><h1>全部找到啦！</h1><div><button className="room-primary" disabled={disabled} onClick={()=>void start(round.difficulty)}>再玩一局</button><button className="room-secondary" disabled={disabled} onClick={choose}>换难度</button></div></div>:<div className="spot-support"><p role="status">{round.message||'两边比一比，点出不一样的小车'}</p><div><button className="room-secondary" disabled={disabled} onClick={()=>act({type:'hint'},round.seed)}><LittleIcon kind="hint"/>提示</button><button className="room-secondary" disabled={disabled} onClick={()=>say(differenceSpeech.rules)}><LittleIcon kind="sound"/>听规则</button></div></div>}
   </section>
  </>}
  {parents?<ParentPanel account={account} game="difference" difficulty={recordDifficulty[preferred]} onDifficulty={()=>{}} onClose={()=>setParents(false)} onRestart={round&&!round.complete?()=>{recorder.current?.note('retries');void start(round.difficulty);}:undefined}/>:paused&&round&&!round.complete?<div className="room-overlay pause-overlay"><section className="playroom-modal" role="dialog" aria-modal="false" aria-label="休息一下"><button className="room-primary resume-play" aria-label="恢复游戏" onClick={()=>setPaused(false)}>▶</button></section></div>:null}
 </main>;
}
