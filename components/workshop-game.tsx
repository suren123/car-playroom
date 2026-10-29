'use client';
import {useEffect,useRef,useState} from 'react';
import {Volume2,Lightbulb,Play,ArrowRight,Check,RotateCcw} from 'lucide-react';
import {useGameNavigation} from '../hooks/use-game-navigation';
import {usePauseAnimations} from '../hooks/use-pause-animations';
import {RoundRecorder} from '../lib/records-client';
import {useAudioSettings} from '../lib/use-audio-settings';
import {prepareAudio,playEffect,speakGently,speakWorkshopRoute,stopSpeech} from '../lib/speech';
import {gameNames} from '../games/registry';
import {carCatalog,type CarKind} from '../games/vehicle-catalog';
import {makeWorkshopRound,workshopReducer,workshopProgress,workshopBrief,workshopVersion,levelNames,editableCars,type TrafficRound,type WorkshopGame,type WorkshopRound,type WorkshopAction,type Level} from '../games/workshop/model';
import {readWorkshopPreference,saveWorkshopPreference} from '../games/workshop/preferences';
import voices from '../games/workshop/voices.json';
import WorkshopScreen from '../games/workshop/screens';
import {TinyScene} from '../games/workshop/art';
import {Illustration} from './illustration';
import {VehicleFilter,type VehicleFilterValue} from './vehicle-filter';
import GameHeader from './game-header';
import ParentPanel from './parent-panel';
import AudioNotice from './audio-notice';
import StorageNotice from './storage-notice';
import '../games/workshop/workshop.css';
import '../games/workshop/junction.css';

export default function WorkshopGameView({account,game}:{account:string;game:WorkshopGame}){
 const [vehicleGroup,setVehicleGroup]=useState<VehicleFilterValue>('all');
 const root=useRef<HTMLElement>(null),{goHome}=useGameNavigation(account,game);
 const [level,setLevel]=useState<Level>(1),[car,setCar]=useState<CarKind>('fire'),[ready,setReady]=useState(false);
 const [round,setRound]=useState<WorkshopRound|null>(null),current=useRef<WorkshopRound|null>(null),record=useRef<RoundRecorder|null>(null);
 const [motion,setMotion]=useState<TrafficRound|null>(null),motionRef=useRef(false),motionRemaining=useRef(1200);
 const [paused,setPaused]=useState(false),[parents,setParents]=useState(false),[celebrate,setCelebrate]=useState(false);
 const pausedRef=useRef(false),parentsRef=useRef(false),leaving=useRef(false),transitionUntil=useRef(0),navUntil=useRef(0),lastWrong=useRef(false);
 const {settings,setAudioSettings}=useAudioSettings();
 const seed=useRef(0);usePauseAnimations(root,paused||parents);
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
 function begin(selected=level){
  if(leaving.current||document.hidden||!ready)return;
  prepareAudio();stopSpeech();if(record.current){if(current.current&&!current.current.complete)void record.current.finish(false);else record.current.dispose();}
  seed.current=(seed.current+0x9e3779b9)>>>0;const next=makeWorkshopRound(game,selected,seed.current,car);
  saveWorkshopPreference(account,game,{level:selected,car});setLevel(selected);lastWrong.current=false;
  record.current=new RoundRecorder(game,selected===1?'simple':selected===3?'challenge':'auto',{gameVersion:workshopVersion,levelId:selected,seed:seed.current,parameters:JSON.stringify({version:1,level:selected,car,task:workshopBrief[game].levels[selected-1]})});
  motionRef.current=false;setMotion(null);transitionUntil.current=0;pausedRef.current=false;parentsRef.current=false;setPaused(false);setParents(false);setCelebrate(false);update(next);if(next.game==='listen')speakWorkshopRoute(next.route);else rules(selected);
 }
 function selection(){
  const now=performance.now();if(leaving.current||now<navUntil.current)return;navUntil.current=now+450;
  if(current.current&&!current.current.complete)void record.current?.finish(false);record.current?.dispose();record.current=null;
  stopSpeech();motionRef.current=false;setMotion(null);setCelebrate(false);pausedRef.current=false;parentsRef.current=false;setPaused(false);setParents(false);update(null);
 }
 function back(){if(current.current){selection();return;}if(performance.now()<navUntil.current||leaving.current)return;leaving.current=true;stopSpeech();goHome();}
 function home(){if(leaving.current)return;leaving.current=true;if(current.current&&!current.current.complete)void record.current?.finish(false);record.current?.dispose();stopSpeech();goHome();}
 function act(action:WorkshopAction){
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
 return <main ref={root} data-game={game} className={`workshop ${paused||parents?'is-paused':''} ${round?.complete?'ws-complete':''} ${celebrate?'ws-celebrate':''}`}>
  <StorageNotice/><AudioNotice/>
  <GameHeader title={gameNames[game]} onBack={back} muted={settings.muted} onSound={()=>{prepareAudio();setAudioSettings({muted:!settings.muted});}} onParent={parent} onPause={round&&!round.complete?pause:undefined}/>
  {!round?<section className="ws-preparation"><div className="ws-heading"><div><span className="ws-eyebrow">小汽车探索工坊</span><h1>{brief.subtitle}</h1><p>选一个挑战，每次都有新任务。</p></div><TinyScene car={game==='sort'?'delivery':car}/></div>
   <div className="ws-levels" aria-label="选择挑战">{([1,2,3] as Level[]).map(value=><button key={value} aria-pressed={level===value} className={level===value?'ws-selected':''} onClick={()=>{setLevel(value);saveWorkshopPreference(account,game,{level:value,car});}}><div className="ws-level-symbol" aria-hidden="true">{Array.from({length:value},(_,i)=><span key={i}/>)}</div><strong>{levelNames[value]}</strong><span>{brief.levels[value-1]}</span>{level===value&&<Check className="ws-selection-check"/>}</button>)}</div>
   {game!=='sort'&&<div className="ws-garage"><h2>{game==='repair'?'谁来修车？':'选一辆陪你完成任务的小车'}</h2>{game!=='repair'&&<VehicleFilter value={vehicleGroup} onChange={setVehicleGroup}/>}<div className="ws-garage-cars">{carCatalog.filter(c=>game==='repair'?editableCars.includes(c.id as never):vehicleGroup==='all'||c.group===vehicleGroup).map(c=><button className={car===c.id?'ws-selected':''} aria-pressed={car===c.id} aria-label={`选择${c.name}`} key={c.id} onClick={()=>{setCar(c.id);saveWorkshopPreference(account,game,{level,car:c.id});}}><Illustration id={c.id}/><span>{c.name}</span></button>)}</div></div>}
   <div className="ws-start-row"><button className="ws-secondary" onClick={()=>rules()}><Volume2/>听玩法</button><button className="ws-primary" disabled={!ready} onClick={()=>begin()}><Play/>开始任务<ArrowRight/></button></div>
  </section>:<><div className="ws-game-heading"><div><span className="ws-eyebrow">{levelNames[round.level]} · {brief.levels[round.level-1]}</span><h1>{brief.subtitle}</h1></div><div className="ws-progress" aria-label={`完成 ${progress[0]} / ${progress[1]}`}><strong>{progress[0]}</strong> / {progress[1]}</div></div>
   <div className="ws-interactive" inert={paused||parents}>
    <WorkshopScreen round={round} act={act} routeAudio={routeAudio} motion={motion} paused={paused||parents} celebrate={celebrate}/>
    <div className="ws-outcome" aria-live="polite">{round.complete?<><div className="ws-completion-heading"><span className="ws-check-medal"><Check/></span><h2>{round.message}</h2></div><div className="ws-controls"><button className="ws-primary" onClick={()=>begin(round.level)}><RotateCcw/>再玩一个新任务</button><button className="ws-secondary" onClick={selection}>换挑战</button><button className="ws-link" onClick={home}>返回首页</button></div></>:<><p className={round.wrong&&round.message?'ws-feedback':''}>{round.message||(game==='queue'?'把小车拖进车位，拖到另一辆车上可以换位置。':'慢慢观察，也可以撤回再试。')}</p><div className="ws-controls"><button className="ws-secondary" onClick={()=>act({type:'hint'})}><Lightbulb/>看看提示</button><button className="ws-secondary" onClick={()=>rules(round.level)}><Volume2/>听玩法</button><button className="ws-link" onClick={selection}>换挑战</button></div></>}</div>
   </div>
  </>}
  {parents?<ParentPanel account={account} game={game} difficulty={level===3?'challenge':level===2?'auto':'simple'} onDifficulty={()=>{}} hideDifficulty onClose={()=>{parentsRef.current=false;setParents(false);}} onRestart={round?()=>begin(level):undefined}/>:paused&&<div className="room-overlay pause-overlay"><section className="playroom-modal" role="dialog" aria-modal="false" aria-label="休息一下"><h2>小车等你回来</h2><button className="ws-primary ws-resume" aria-label="恢复游戏" onClick={()=>{pausedRef.current=false;setPaused(false);prepareAudio();}}>▶</button></section></div>}
 </main>;
}
