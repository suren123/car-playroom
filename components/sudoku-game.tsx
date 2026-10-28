'use client';
import {useCallback,useEffect,useRef,useState,type CSSProperties} from 'react';
import GameBackButton from './game-back-button';
import {useGameNavigation} from '../hooks/use-game-navigation';
import {gameBackTarget} from '../lib/game-navigation';
import {Illustration} from './illustration';
import {SudokuPreview} from './sudoku-art';
import ParentPanel from './parent-panel';
import AudioNotice from './audio-notice';
import StorageNotice from './storage-notice';
import {LittleIcon} from './car-art';
import {usePauseAnimations} from '../hooks/use-pause-animations';
import {useAudioSettings} from '../lib/use-audio-settings';
import {prepareAudio,speakGently,stopSpeech} from '../lib/speech';
import {RoundRecorder,type RecordDifficulty} from '../lib/records-client';
import {preloadIllustrations} from '../games/delivery/assets';
import {makeSudoku,replayReducer,sudokuBlanks,sudokuKinds,sudokuSpeech,vehicleNames,type SudokuRound,type SudokuSize,type ReplayAction} from '../lib/replay-games';
import {readSudokuSize,sudokuSizeKey} from '../lib/sudoku-preferences';
import {sudokuFeedback,type SudokuFeedback} from '../lib/sudoku-feedback';
import {SudokuCelebration,SudokuVictoryParade} from './sudoku-celebration';

const sizes:SudokuSize[]=[2,3,4];
const labels={2:'入门',3:'练习',4:'挑战'};
const recordDifficulty:Record<SudokuSize,RecordDifficulty>={2:'simple',3:'auto',4:'challenge'};
export default function SudokuGame({account}:{account:string}){
 const {goHome}=useGameNavigation(account,'sudoku'),root=useRef<HTMLElement>(null);
 const {settings,setAudioSettings}=useAudioSettings();
 const [preferred,setPreferred]=useState<SudokuSize>(2),[ready,setReady]=useState(false);
 const [round,setRound]=useState<SudokuRound|null>(null),roundRef=useRef<SudokuRound|null>(null);
 const [loading,setLoading]=useState<SudokuSize|null>(null),[failed,setFailed]=useState(false);
 const [paused,setPaused]=useState(false),[parents,setParents]=useState(false);
 const [feedback,setFeedback]=useState<(SudokuFeedback&{id:number})|null>(null),[celebrating,setCelebrating]=useState(false);
 const feedbackId=useRef(0);
 const settleCelebration=useCallback(()=>{setCelebrating(false);setFeedback(null);},[]);
 const recorder=useRef<RoundRecorder|null>(null),request=useRef(0),busy=useRef(false),blocked=useRef(false),retry=useRef(false);
 blocked.current=paused||parents;
 usePauseAnimations(root,paused||parents);
 const say=(text:string)=>speakGently(text,!settings.muted);
 useEffect(()=>{
  try{setPreferred(readSudokuSize(localStorage,account));}catch{setPreferred(2);}setReady(true);
  const visibility=()=>{if(document.hidden){stopSpeech();if(roundRef.current?.complete)settleCelebration();else if(roundRef.current){blocked.current=true;setPaused(true);}}};
  document.addEventListener('visibilitychange',visibility);
  return()=>{request.current++;recorder.current?.dispose();recorder.current=null;roundRef.current=null;stopSpeech();document.removeEventListener('visibilitychange',visibility);};
 },[account,settleCelebration]);
 function end(){setFeedback(null);setCelebrating(false);if(roundRef.current&&!roundRef.current.complete)void recorder.current?.finish(false);recorder.current=null;roundRef.current=null;}
 function choose(){request.current++;busy.current=false;end();setRound(null);setLoading(null);setFailed(false);setParents(false);setPaused(false);stopSpeech();}
 function back(){const target=gameBackTarget('sudoku',roundRef.current?'play':loading?'loading':'difficulty');choose();if(target==='home')goHome();}
 async function start(size:SudokuSize){
  if(busy.current)return;
  busy.current=true;const ticket=++request.current;
  end();setRound(null);setParents(false);setPaused(false);setLoading(size);setFailed(false);prepareAudio();stopSpeech();
  try{
   await preloadIllustrations(sudokuKinds.slice(0,size));
   if(ticket!==request.current)return;
   const seed=crypto.getRandomValues(new Uint32Array(1))[0],next=makeSudoku(size,seed);
   setPreferred(size);
   try{localStorage.setItem(sudokuSizeKey(account),String(size));}catch{window.dispatchEvent(new Event('car-storage-unavailable'));}
   recorder.current=new RoundRecorder('sudoku',recordDifficulty[size],{gameVersion:'sudoku-row-column-v2',seed,parameters:JSON.stringify({size,blanks:sudokuBlanks[size],rules:'row-column',version:2})});
   retry.current=false;roundRef.current=next;setRound(next);setLoading(null);setPaused(document.hidden);say(sudokuSpeech.rules);
  }catch{if(ticket===request.current)setFailed(true);}
  finally{if(ticket===request.current)busy.current=false;}
 }
 function act(action:ReplayAction,expected:number|null){
  const before=roundRef.current;
  if(!before||before.complete||blocked.current||expected!==before.selected)return;
  const next=replayReducer(before,action) as SudokuRound;
  if(next===before)return;
  if(action.type==='hint')recorder.current?.note('hints');
  if(next.wrong>before.wrong){recorder.current?.note('wrong');retry.current=true;}
  if(action.type==='symbol'&&next.wrong===before.wrong&&retry.current){recorder.current?.note('retries');retry.current=false;}
  roundRef.current=next;setRound(next);
  const visual=sudokuFeedback(before,next);
  if(visual)setFeedback({...visual,id:++feedbackId.current});
  if(next.complete){setCelebrating(!document.hidden&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches);void recorder.current?.finish(true);}
  if(next.message)say(next.message);else stopSpeech();
 }
 function pause(){if(!roundRef.current||roundRef.current.complete)return;blocked.current=true;recorder.current?.note('pauses');stopSpeech();setPaused(true);}
 const disabled=paused||parents;
 return <main ref={root} className={`playroom sudoku-room ${disabled?'is-paused':''}`}>
  <StorageNotice/><AudioNotice/>
  <header className="sudoku-header">
   <GameBackButton onBack={back}/>
   <strong>汽车数独{round?` · ${round.size}×${round.size}`:''}</strong>
   <div><button className="room-icon" aria-label={settings.muted?'打开声音':'关闭声音'} onClick={()=>{prepareAudio();stopSpeech();setAudioSettings({muted:!settings.muted});}}><LittleIcon kind={settings.muted?'mute':'sound'}/></button><button className="room-parent" onClick={()=>{stopSpeech();if(roundRef.current?.complete)settleCelebration();blocked.current=true;setParents(true);}}>家长</button></div>
  </header>
  {!round&&!loading&&<section className="sudoku-selection" aria-labelledby="sudoku-select-title">
   <h1 id="sudoku-select-title">选一个小车棋盘</h1><p>每一排、每一列，小车不重复</p>
   <div className="sudoku-size-cards">{sizes.map(size=><button key={size} disabled={!ready} aria-label={`${size}×${size} · ${labels[size]}`} aria-pressed={ready&&preferred===size} onClick={()=>void start(size)}>
    <SudokuPreview size={size}/><strong>{size}×{size} · {labels[size]}</strong><span>{ready&&preferred===size?'上次选择':'点一下开始'}</span>
   </button>)}</div>
  </section>}
  {loading&&<section className="sudoku-loading" aria-busy={!failed}><h1>{failed?'小车图片还没准备好':'小车准备中……'}</h1><p role="status">{failed?'检查网络后，再试一次。':'准备好就可以停车啦'}</p>{failed&&<button className="room-primary" onClick={()=>void start(loading)}>重试加载</button>}<button className="room-secondary" onClick={choose}>换难度</button></section>}
  {round&&<>
   <div className="sudoku-toolbar"><button className="room-secondary" disabled={disabled} onClick={choose}>换难度</button><span>{round.complete?'每一排、每一列，小车都不重复':'先点空位，再选一辆车'}</span>{!round.complete&&<button className="room-pause" disabled={disabled} onClick={pause}><LittleIcon kind="pause"/>休息</button>}</div>
   <section className="sudoku-stage" aria-label={`${round.size}乘${round.size}汽车数独`}>
    <div className={`sudoku-board-frame ${round.complete?'is-complete':''}`}>
    <div className="sudoku-grid" style={{'--size':round.size} as CSSProperties} role="group" aria-label="每排每列的小车不重复">
     {round.values.map((value,i)=>{
      const related=round.hintLevel>0&&round.selected!==null&&(Math.floor(i/round.size)===Math.floor(round.selected/round.size)||i%round.size===round.selected%round.size);
      const lit=feedback&&(feedback.rows.includes(Math.floor(i/round.size))||feedback.columns.includes(i%round.size));
      return <button key={i} className={`sudoku-tile ${round.selected===i?'selected':''} ${related?'related':''} ${round.conflicts.includes(i)?'conflict':''} ${round.initial[i]===-1&&value!==-1?'filled':''}`} aria-label={`第${Math.floor(i/round.size)+1}排第${i%round.size+1}格，${value===-1?'空位':vehicleNames[sudokuKinds[value]]}${round.conflicts.includes(i)?'，重复车辆':''}`} aria-pressed={round.selected===i} disabled={disabled||value!==-1||round.complete} onClick={()=>act({type:'select',index:i},round.selected)}>{value===-1?<span>?</span>:<span className={`sudoku-vehicle ${feedback?.cell===i?'is-arriving':''} ${round.complete?'final-arrival':''}`}><Illustration id={sudokuKinds[value]} priority/></span>}{lit&&<span key={feedback.id} className="sudoku-line-glow" aria-hidden="true"/>}{round.conflicts.includes(i)&&<b aria-hidden="true">!</b>}</button>;
     })}
    </div>
    {round.complete&&<SudokuCelebration running={celebrating} onSettled={settleCelebration}/>}
    </div>
    <div className="sudoku-vehicle-area">
    {round.complete?<SudokuVictoryParade size={round.size} running={celebrating}/>:<div className="sudoku-candidates" aria-label="选一辆车">{sudokuKinds.slice(0,round.size).map((kind,value)=>{
     const hinted=round.hintLevel===2&&round.selected!==null&&round.solution[round.selected]===value;
     return <button key={kind} disabled={disabled} aria-label={`选择${vehicleNames[kind]}`} className={hinted?'hinted':''} onClick={()=>act({type:'symbol',value},round.selected)}><Illustration id={kind} priority/><span>{vehicleNames[kind]}</span>{hinted&&<b className="sudoku-finger" aria-hidden="true">👆</b>}</button>;
    })}</div>}
    </div>
    {round.complete?<div className="sudoku-completion" role="status"><h1>全部停好啦！</h1><div><button className="room-primary" onClick={()=>void start(round.size)}>再玩一局</button><button className="room-secondary" onClick={choose}>换难度</button></div></div>:<div className="sudoku-support"><p role="status">{round.message||'慢慢来，看看这一排和这一列'}</p><div><button className="room-secondary" disabled={disabled} onClick={()=>act({type:'hint'},round.selected)}><LittleIcon kind="hint"/>提示</button><button className="room-secondary" disabled={disabled} onClick={()=>say(sudokuSpeech.rules)}><LittleIcon kind="sound"/>听规则</button></div></div>}
   </section>
  </>}
  {parents?<ParentPanel account={account} game="sudoku" difficulty={recordDifficulty[preferred]} onDifficulty={()=>{}} onClose={()=>setParents(false)} onRestart={round&&!round.complete?()=>{recorder.current?.note('retries');void start(round.size);}:undefined}/>:paused&&round&&!round.complete?<div className="room-overlay pause-overlay"><section className="playroom-modal" role="dialog" aria-modal="false" aria-label="休息一下"><button className="room-primary resume-play" aria-label="恢复游戏" onClick={()=>setPaused(false)}>▶</button></section></div>:null}
 </main>;
}
