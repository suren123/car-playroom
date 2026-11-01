'use client';
import {useEffect,useRef,useState} from 'react';
import {Volume2,Lightbulb,Check,RotateCcw} from 'lucide-react';
import {useGameNavigation} from '../hooks/use-game-navigation';
import {usePauseAnimations} from '../hooks/use-pause-animations';
import {RoundRecorder} from '../lib/records-client';
import {useAudioSettings} from '../lib/use-audio-settings';
import {prepareAudio,playEffect,speakGently,speakWorkshopRoute,stopSpeech} from '../lib/speech';
import {gameNames} from '../games/registry';
import type {CarKind} from '../games/vehicle-catalog';
import {makeWorkshopRound,workshopReducer,workshopProgress,workshopBrief,workshopVersion,levelNames,editableCars,type TrafficRound,type WorkshopGame,type WorkshopRound,type WorkshopAction,type Level} from '../games/workshop/model';
import {readWorkshopPreference,saveWorkshopPreference,automaticWorkshopCar} from '../games/workshop/preferences';
import voices from '../games/workshop/voices.json';
import WorkshopScreen from '../games/workshop/screens';
import {TinyScene} from '../games/workshop/art';
import {VehiclePicker} from './vehicle-picker';
import GameHeader from './game-header';
import ParentPanel from './parent-panel';
import AudioNotice from './audio-notice';
import StorageNotice from './storage-notice';
import '../games/workshop/workshop.css';
import '../games/workshop/junction.css';

export default function WorkshopGameView({account,game}:{account:string;game:WorkshopGame}){
 const root=useRef<HTMLElement>(null),{goHome}=useGameNavigation(account,game);
 const choosesCar=game!=='sort',separateCars=choosesCar&&game!=='repair';
 const [showCars,setShowCars]=useState(false);
 const [level,setLevel]=useState<Level>(1),[car,setCar]=useState<CarKind>('fire'),[ready,setReady]=useState(false);
 const [round,setRound]=useState<WorkshopRound|null>(null),current=useRef<WorkshopRound|null>(null),record=useRef<RoundRecorder|null>(null);
 const [motion,setMotion]=useState<TrafficRound|null>(null),motionRef=useRef(false),motionRemaining=useRef(1200);
 const [paused,setPaused]=useState(false),[parents,setParents]=useState(false),[celebrate,setCelebrate]=useState(false);
 const pausedRef=useRef(false),parentsRef=useRef(false),leaving=useRef(false),transitionUntil=useRef(0),navUntil=useRef(0),lastWrong=useRef(false);
 const {settings,setAudioSettings}=useAudioSettings();
 const seed=useRef(0),beginUntil=useRef(0);usePauseAnimations(root,paused||parents);
 useEffect(()=>{
  if(!motion||paused||parents)return;const started=performance.now();
  const timer=setTimeout(()=>{motionRef.current=false;setMotion(null);},motionRemaining.current);
  return()=>{clearTimeout(timer);motionRemaining.current=Math.max(0,motionRemaining.current-(performance.now()-started));};
 },[motion,paused,parents]);
 const update=(next:WorkshopRound|null)=>{current.current=next;setRound(next);};
 useEffect(()=>{
  // Browser-only preferences load after hydration; the initial server render stays deterministic.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  const saved=readWorkshopPreference(account,game);setCar(saved.car);setLevel(saved.level);setReady(true);leaving.current=false;
  seed.current=(Date.now()+Math.floor(Math.random()*0x7fffffff))>>>0;
  const visibility=()=>{if(document.hidden){stopSpeech();setCelebrate(false);if(current.current?.complete){motionRef.current=false;setMotion(null);}if(current.current&&!current.current.complete){pausedRef.current=true;setPaused(true);}}};
  document.addEventListener('visibilitychange',visibility);
  return()=>{leaving.current=true;record.current?.dispose();record.current=null;current.current=null;stopSpeech();document.removeEventListener('visibilitychange',visibility);};
 },[account,game]);
 function rules(selected=level){prepareAudio();speakGently(voices[`${game}-${selected}` as keyof typeof voices].text);}
 function begin(selected=level,selectedCar=car){
  // eslint-disable-next-line react-hooks/purity -- Event handler only; this clock guards duplicate input, never render.
  const now=performance.now();if(leaving.current||document.hidden||!ready||now<beginUntil.current||now<navUntil.current)return;beginUntil.current=now+450;
  prepareAudio();stopSpeech();if(record.current){if(current.current&&!current.current.complete)void record.current.finish(false);else record.current.dispose();}
  seed.current=(seed.current+0x9e3779b9)>>>0;const roundCar=choosesCar?selectedCar:automaticWorkshopCar(seed.current),next=makeWorkshopRound(game,selected,seed.current,roundCar);
  saveWorkshopPreference(account,game,{level:selected,car:roundCar});setCar(roundCar);setLevel(selected);lastWrong.current=false;
  record.current=new RoundRecorder(game,selected===1?'simple':selected===3?'challenge':'auto',{gameVersion:workshopVersion,levelId:selected,seed:seed.current,parameters:JSON.stringify({version:1,level:selected,car:roundCar,carSelection:choosesCar?'chosen':'automatic',task:workshopBrief[game].levels[selected-1]})});
  motionRef.current=false;setMotion(null);transitionUntil.current=now+350;pausedRef.current=false;parentsRef.current=false;setPaused(false);setParents(false);setCelebrate(false);update(next);if(next.game==='listen')speakWorkshopRoute(next.route);else rules(selected);
 }
 function selection(toCars=false){
  // eslint-disable-next-line react-hooks/purity -- Event handler only; this clock guards duplicate input, never render.
  const now=performance.now();if(leaving.current||now<navUntil.current)return;navUntil.current=now+450;
  if(current.current&&!current.current.complete)void record.current?.finish(false);record.current?.dispose();record.current=null;
  stopSpeech();motionRef.current=false;setMotion(null);setCelebrate(false);pausedRef.current=false;parentsRef.current=false;setPaused(false);setParents(false);setShowCars(toCars&&separateCars);update(null);
 }
 // eslint-disable-next-line react-hooks/purity -- Called only by the header back button.
 function back(){if(current.current){selection(separateCars);return;}if(performance.now()<navUntil.current||leaving.current)return;if(showCars){navUntil.current=performance.now()+450;stopSpeech();setShowCars(false);return;}leaving.current=true;stopSpeech();goHome();}
 function home(){if(leaving.current)return;leaving.current=true;if(current.current&&!current.current.complete)void record.current?.finish(false);record.current?.dispose();stopSpeech();goHome();}
 function act(action:WorkshopAction){
  // eslint-disable-next-line react-hooks/purity -- Input callback; reading the clock does not run during render.
  if(leaving.current||pausedRef.current||parentsRef.current||document.hidden||performance.now()<transitionUntil.current||motionRef.current||!current.current)return;
  const before=current.current,next=workshopReducer(before,action);if(next===before)return;
  prepareAudio();
  if(action.type==='hint')record.current?.note('hints');
  if(action.type==='undo')record.current?.note('retries');
  if(next.wrong>before.wrong){record.current?.note('wrong');lastWrong.current=true;playEffect('help');speakGently('如果任务有点难，没关系，我们一起慢慢来。');}
  else{if(lastWrong.current&&action.type!=='hint'&&action.type!=='undo'){record.current?.note('retries');lastWrong.current=false;}playEffect('select');}
  if(next.game==='traffic'&&before.game==='traffic'&&next.index!==before.index){motionRemaining.current=1200;motionRef.current=true;setMotion(before);if(next.junction||action.type==='traffic'&&action.go)playEffect('drive');}
  update(next);
  if(action.type==='hint')speakGently(voices[`${game}-hint` as keyof typeof voices].text);
  if(next.complete){void record.current?.finish(true);setCelebrate(true);stopSpeech();playEffect('finish');speakGently('这次小任务完成啦。小汽车平安回家了。');}
 }
 function pause(){if(!current.current||current.current.complete)return;stopSpeech();pausedRef.current=true;setPaused(true);record.current?.note('pauses');}
 function parent(){stopSpeech();parentsRef.current=true;setParents(true);setCelebrate(false);}
 function routeAudio(){const r=current.current;if(r?.game==='listen'&&!leaving.current&&!parentsRef.current&&!pausedRef.current){prepareAudio();speakWorkshopRoute(r.route);}}
 const brief=workshopBrief[game],progress=round?workshopProgress(round):[0,0];
 return <main ref={root} data-game={game} className={`workshop game-viewport ${!round?'selection-viewport':''} ${paused||parents?'is-paused':''} ${round?.complete?'ws-complete':''} ${celebrate?'ws-celebrate':''}`}>
  <StorageNotice/><AudioNotice/>
  <GameHeader playing={!!round} title={gameNames[game]} onBack={back} muted={settings.muted} onSound={()=>{prepareAudio();setAudioSettings({muted:!settings.muted});}} onParent={parent} onPause={round&&!round.complete?pause:undefined}/>
  {!round?<section className="ws-preparation"><div className="ws-heading"><div><span className="ws-eyebrow">小汽车探索工坊</span><h1>{brief.subtitle}</h1><p>{game==='repair'?'先选挑战，再点一辆车开始维修。':showCars?'点一辆喜欢的车，直接开始。':choosesCar?'先选挑战，再选一辆喜欢的车。':'点一个挑战，直接开始。'}</p></div><TinyScene car={choosesCar?car:'delivery'}/></div>
   {!showCars&&<div className={`ws-levels ${game!=='repair'?'ws-direct-levels':''}`} aria-label="选择挑战">{([1,2,3] as Level[]).map(value=><button key={value} disabled={!ready} aria-pressed={level===value} className={level===value?'ws-selected':''} onClick={()=>{if(current.current)return;if(choosesCar){if(performance.now()<navUntil.current)return;setLevel(value);saveWorkshopPreference(account,game,{level:value,car});if(separateCars){navUntil.current=performance.now()+350;stopSpeech();setShowCars(true);}}else begin(value);}}><div className="ws-level-symbol" aria-hidden="true">{Array.from({length:value},(_,i)=><span key={i}/>)}</div><strong>{levelNames[value]}</strong><span>{brief.levels[value-1]}</span>{level===value&&<Check className="ws-selection-check"/>}</button>)}</div>}
   {(game==='repair'||showCars)&&<div className="ws-garage"><h2>{game==='repair'?'点一辆车，开始维修':`${levelNames[level]} · 点一辆车，出发！`}</h2><VehiclePicker selected={car} allowed={game==='repair'?editableCars:undefined} disabled={!ready} onSelect={id=>{if(!current.current)begin(level,id);}}/></div>}
   <div className="ws-start-row"><button className="ws-secondary" onClick={()=>rules()}><Volume2/>听玩法</button></div>
  </section>:<><div className="ws-game-heading"><div><span className="ws-eyebrow">{levelNames[round.level]} · {brief.levels[round.level-1]}</span><h1>{brief.subtitle}</h1></div><div className="ws-progress" aria-label={`完成 ${progress[0]} / ${progress[1]}`}><strong>{progress[0]}</strong> / {progress[1]}</div></div>
   <div className="ws-interactive" inert={paused||parents}>
    <WorkshopScreen round={round} act={act} routeAudio={routeAudio} motion={motion} paused={paused||parents} celebrate={celebrate}/>
    <div className="ws-outcome" aria-live="polite">{round.complete?<><div className="ws-completion-heading"><span className="ws-check-medal"><Check/></span><h2>{round.message}</h2></div><div className="ws-controls"><button className="ws-primary" onClick={()=>begin(round.level)}><RotateCcw/>再玩一个新任务</button><button className="ws-secondary" onClick={()=>selection()}>换挑战</button><button className="ws-link" onClick={home}>返回首页</button></div></>:<><p className={round.wrong&&round.message?'ws-feedback':''}>{round.message||(game==='queue'?'把小车拖进车位，拖到另一辆车上可以换位置。':'慢慢观察，也可以撤回再试。')}</p><div className="ws-controls"><button className="ws-secondary" onClick={()=>act({type:'hint'})}><Lightbulb/>看看提示</button><button className="ws-secondary" onClick={()=>rules(round.level)}><Volume2/>听玩法</button><button className="ws-link" onClick={()=>selection()}>换挑战</button></div></>}</div>
   </div>
  </>}
  {parents?<ParentPanel account={account} game={game} difficulty={level===3?'challenge':level===2?'auto':'simple'} onDifficulty={()=>{}} hideDifficulty onClose={()=>{parentsRef.current=false;setParents(false);}} onRestart={round?()=>begin(level):undefined}/>:paused&&<div className="room-overlay pause-overlay"><section className="playroom-modal" role="dialog" aria-modal="false" aria-label="休息一下"><h2>小车等你回来</h2><button className="ws-primary ws-resume" aria-label="恢复游戏" onClick={()=>{pausedRef.current=false;setPaused(false);prepareAudio();}}>▶</button></section></div>}
 </main>;
}
