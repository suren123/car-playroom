'use client';
import {VehiclePicker} from '../../components/vehicle-picker';
import GameHeader from '../../components/game-header';
import {useGameNavigation} from '../../hooks/use-game-navigation';
import {gameBackTarget} from '../../lib/game-navigation';
import AudioNotice from '../../components/audio-notice';
import StorageNotice from '../../components/storage-notice';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {carCatalog,type CarKind} from '../../components/vehicle-art';
import {Illustration} from '../../components/illustration';
import {vehicleIllustration} from '../illustration-assets';
import {LittleIcon} from '../../components/car-art';
import {RoundRecorder} from '../../lib/records-client';
import {playEffect,prepareAudio,speakOrder,speakRoute,speakDelivery,stopSpeech} from '../../lib/speech';
import {useAudioSettings} from '../../lib/use-audio-settings';
import {items,levels,remainingCargo,createDelivery,deliveryReducer,taskSignature,stopNames,type Action,type ItemId,type State,type Level} from './model';
import {CargoArt,StopArt,World,JourneyWorld,TRAVEL_MS} from './art';
import {preloadIllustrations,levelAssets,carAssets,taskAssets} from './assets';
import './delivery.css';
import './illustrations.css';
import './choices.css';
import './transport.css';
import {CargoFlights} from './cargo-flight';
import {DeliveryVehicle} from './delivery-vehicle';
import {artworkBox,cargoPoint,type CargoFlight,type FlightPoint} from './transport';
import {deliveryRecordParameters,encodeDeliveryHistory,decodeDeliveryHistory} from './record-metadata';
import {DeliveryChoiceSettings} from './choice-settings';
import {resolveChoices,defaultChoiceOptions,readChoiceOptions,saveChoiceOptions,type ChoiceOptions} from './options';
import ParentPanel from '../../components/parent-panel';
import {DeliveryRouteCard} from './route-card';
import {DeliveryLevelArt} from './level-art';
import {deliveryArrival,type DeliveryArrival} from './feedback';
import {DeliveryArrivalEffect,DeliveryVictoryScene} from './celebration';

const itemName=(id:ItemId)=>items.find(x=>x.id===id)?.name||id;
function taskTitle(level:Level,options:ChoiceOptions){const c=resolveChoices(level,options);if(c.cargoCount===level.count&&c.destinationCount===level.stops)return level.title;return level.mode==='update'?'还剩什么':level.mode==='route-visible'?'认识送货路线':level.id===2?'一起送货':level.title;}
const preferenceKey='car-playroom-delivery-v1';
type ArrivalPresentation=DeliveryArrival&{left?:number;bottom?:number};
type Preferences={level:number;car:CarKind;tutorialSeen:boolean;streaks:Record<string,number>;offered:Record<string,boolean>;recent:string[]};
const defaultPreferences:Preferences={level:1,car:'delivery',tutorialSeen:false,streaks:{},offered:{},recent:[]};
function readPreferences():Preferences{try{const saved=JSON.parse(localStorage.getItem(preferenceKey)||'{}');return {level:levels.some(x=>x.id===saved.level)?saved.level:1,car:carCatalog.some(x=>x.id===saved.car)?saved.car:'delivery',tutorialSeen:!!saved.tutorialSeen,streaks:saved.streaks&&typeof saved.streaks==='object'?saved.streaks:{},offered:saved.offered&&typeof saved.offered==='object'?saved.offered:{},recent:Array.isArray(saved.recent)?saved.recent.filter((x:unknown)=>typeof x==='string').slice(-5):[]};}catch{return defaultPreferences;}}
function savePreferences(value:Preferences){try{localStorage.setItem(preferenceKey,JSON.stringify(value));}catch{/* Play remains possible without storage. */}}

export default function DeliveryGame({account}:{account:string}){
 const router=useRouter(),searchParams=useSearchParams(),{settings,setAudioSettings}=useAudioSettings();
 const {goHome}=useGameNavigation(account,'delivery');
 const step=searchParams.get('step');
 const [screen,setScreen]=useState<'levels'|'cars'|'game'>('levels');
 const [prefs,setPrefs]=useState(defaultPreferences),[state,setState]=useState<State|null>(null),[paused,setPaused]=useState(false),[settingsOpen,setSettingsOpen]=useState(false),[demo,setDemo]=useState(false),[suggestNext,setSuggestNext]=useState(false);
 const [startingCar,setStartingCar]=useState<CarKind|null>(null),[assetError,setAssetError]=useState(false),[retryingAssets,setRetryingAssets]=useState(false);
 const [choiceOptions,setChoiceOptions]=useState<ChoiceOptions>(defaultChoiceOptions),[choiceSaveFailed,setChoiceSaveFailed]=useState(false);
 const [parentPanel,setParentPanel]=useState(false),[ready,setReady]=useState(false);
 const [arrival,setArrival]=useState<(ArrivalPresentation&{id:number})|null>(null),arrivalSequence=useRef(0);
 const current=useRef<State|null>(null),recorder=useRef<RoundRecorder|null>(null),finished=useRef(false),awaitingRetry=useRef(false),usedSupport=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null),travelRemaining=useRef(TRAVEL_MS),startToken=useRef(0);
 const root=useRef<HTMLElement>(null),flightSequence=useRef(0),flightsRef=useRef<CargoFlight[]>([]),pendingArrival=useRef<ArrivalPresentation|null>(null);
 const [flights,setFlights]=useState<CargoFlight[]>([]),[landed,setLanded]=useState<ItemId[]>([]),[landing,setLanding]=useState(0),[wrongChoice,setWrongChoice]=useState<string|null>(null);
 const [cue,setCue]=useState<{kind:'order'|'route';stop?:string}|null>(null),cueRef=useRef(false),cueRemaining=useRef(220);
 const startingBusy=useRef(false),startUntil=useRef(0);
 // Account settings are browser storage, hydrated after server render.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{setPrefs(readPreferences());try{setChoiceOptions(readChoiceOptions(localStorage,account));}catch{setChoiceOptions({...defaultChoiceOptions});}setReady(true);return()=>{startToken.current++;recorder.current?.dispose();recorder.current=null;current.current=null;stopSpeech();if(timer.current)clearTimeout(timer.current);};},[account]);
 // Synchronize the explicit preparation route and cancel its old in-memory round.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{clearSession(false);setScreen(step==='cars'?'cars':'levels');},[step]);
 // Reset the readiness notice when the externally prepared asset scope changes.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{let active=true;const assets=screen==='levels'?levelAssets:screen==='cars'?carAssets:state?taskAssets(state.tasks[state.taskIndex],prefs.car):[];setAssetError(false);void preloadIllustrations(assets).then(()=>{if(!active)return;const next=state?.tasks[state.taskIndex+1];if(screen==='game'&&next)void preloadIllustrations(taskAssets(next,prefs.car)).catch(()=>{});},()=>{if(active)setAssetError(true);});return()=>{active=false;};},[screen,state?.taskIndex,state?.seed,prefs.car]);
 useEffect(()=>{const visibility=()=>{if(document.hidden&&current.current){stopSpeech();if(current.current.phase!=='finished')setPaused(true);}};document.addEventListener('visibilitychange',visibility);return()=>document.removeEventListener('visibilitychange',visibility);},[]);
 // Resizing invalidates captured coordinates. Finish the already accepted
 // presentation, without re-running the game action or submitting any record.
 const settleRef=useRef<()=>void>(()=>{});
 useEffect(()=>{settleRef.current=()=>{for(const flight of [...flightsRef.current])landFlight(flight.id);};});
 useEffect(()=>{const resize=()=>settleRef.current();window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);return()=>{window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);};},[]);
 useEffect(()=>{if(!paused&&!parentPanel&&!settingsOpen&&!demo&&!state?.review)return;const previous=document.activeElement as HTMLElement|null;const dialog=document.querySelector<HTMLElement>('.parent-panel, .dv-overlay:last-of-type .dv-modal');const buttons=Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled])')||[]);buttons[0]?.focus();const trap=(event:KeyboardEvent)=>{if(event.key!=='Tab'||buttons.length===0||(!parentPanel&&!settingsOpen&&!demo&&!state?.review))return;const first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}};document.addEventListener('keydown',trap);return()=>{document.removeEventListener('keydown',trap);if(previous?.isConnected)previous.focus();};},[paused,parentPanel,settingsOpen,demo,state?.review]);
 useEffect(()=>{if(!state||state.phase!=='travel'||paused||parentPanel||settingsOpen||demo||state.review)return;playEffect('drive');const started=Date.now();timer.current=setTimeout(()=>act({type:'arrive'}),travelRemaining.current);return()=>{if(timer.current)clearTimeout(timer.current);travelRemaining.current=Math.max(0,travelRemaining.current-(Date.now()-started));};},[state?.phase,state?.taskIndex,state?.stopIndex,paused,parentPanel,settingsOpen,demo,state?.review]);
 useEffect(()=>{
  if(!cue||paused||parentPanel||settingsOpen||demo||state?.review)return;
  const began=performance.now(),id=setTimeout(()=>{if(document.hidden)return;cueRef.current=false;setCue(null);const next=current.current;if(!next)return;setState(next);if(cue.kind==='route'){playEffect('start');speakDelivery('depart');}else speakDelivery('load');},cueRemaining.current);
  return()=>{clearTimeout(id);cueRemaining.current=Math.max(0,cueRemaining.current-(performance.now()-began));};
 },[cue,paused,parentPanel,settingsOpen,demo,state?.review]);
 const updateChoiceOptions=(value:ChoiceOptions)=>{setChoiceOptions(value);try{setChoiceSaveFailed(!saveChoiceOptions(localStorage,account,value));}catch{setChoiceSaveFailed(true);}};
 const updatePrefs=(change:Partial<Preferences>)=>{const next={...prefs,...change};setPrefs(next);savePreferences(next);};
 const task=state?.tasks[state.taskIndex];
 function sayOrder(s:State){const t=s.tasks[s.taskIndex];speakOrder(t.cargo,t.stops,t.deliveries);}
 function repeatPrompt(s:State){prepareAudio();if(s.phase==='look')sayOrder(s);else if(s.phase==='load')speakDelivery('load');else if(s.phase==='depart')speakDelivery('loaded');else if(s.phase==='route')speakDelivery('which_stop');else if(s.phase==='travel')speakDelivery('depart');else if(s.phase==='unload')speakDelivery('unload');else if(s.phase==='remaining')speakDelivery('remaining');else if(s.phase==='taskDone')speakDelivery('delivered');else speakDelivery('finished');}
 function chooseLevel(level:number){if(!ready||startingBusy.current)return;updatePrefs({level});showPreparation('cars');playEffect('select');speakDelivery('choose_car');}
 async function start(car:CarKind){
  if(!ready||document.hidden||startingBusy.current||performance.now()<startUntil.current)return;if(resolveChoices(levels.find(x=>x.id===prefs.level)??levels[0],choiceOptions).error){setParentPanel(true);return;}startingBusy.current=true;startUntil.current=performance.now()+450;stopSpeech();setArrival(null);prepareAudio();const token=++startToken.current;setStartingCar(car);setAssetError(false);
  const seed=(Date.now()+Math.floor(Math.random()*0xffffffff))>>>0,recent=decodeDeliveryHistory(encodeDeliveryHistory(prefs.recent)),next=createDelivery(prefs.level,seed,recent,choiceOptions);
  try{await preloadIllustrations(taskAssets(next.tasks[0],car));}catch{if(token===startToken.current){startingBusy.current=false;setStartingCar(null);setAssetError(true);}return;}
  if(token!==startToken.current)return;startingBusy.current=false;if(document.hidden){setStartingCar(null);return;}if(current.current&&current.current.phase!=='finished')void recorder.current?.finish(false);setParentPanel(false);setStartingCar(null);setPaused(false);playEffect('start');updatePrefs({car,recent:[...recent,...next.tasks.map(taskSignature)].slice(-5)});current.current=next;setState(next);setScreen('game');finished.current=false;awaitingRetry.current=false;usedSupport.current=false;cancelTransfers();setLanded([]);setSuggestNext(false);recorder.current=new RoundRecorder('delivery',next.level.id>=5?'challenge':'simple',{gameVersion:'delivery-routes-v6',levelId:next.level.id,seed,parameters:deliveryRecordParameters(next,recent)});
  sayOrder(next);
 }
 function finishDemo(){setDemo(false);updatePrefs({tutorialSeen:true});if(current.current)sayOrder(current.current);}
 function cancelTransfers(){cueRef.current=false;setCue(null);flightsRef.current=[];pendingArrival.current=null;setFlights([]);setWrongChoice(null);setLanding(0);}
 function vehiclePort():FlightPoint|null{const el=root.current?.querySelector('.dv-car-port');if(!el)return null;const b=el.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2,size:b.width};}
 function queueFlights(next:CargoFlight[]){flightsRef.current=[...flightsRef.current,...next];setFlights(flightsRef.current);}
 function landFlight(id:number){
  const flight=flightsRef.current.find(f=>f.id===id);if(!flight||!current.current)return;
  flightsRef.current=flightsRef.current.filter(f=>f.id!==id);setFlights(flightsRef.current);
  if(flight.kind==='load'){setLanded(previous=>previous.includes(flight.item)?previous:[...previous,flight.item]);setLanding(id);if(!document.hidden&&!paused&&!parentPanel&&!settingsOpen)playEffect('load');}
  if(flightsRef.current.length)return;
  const next=current.current;setState(next);
  const feedback=pendingArrival.current;pendingArrival.current=null;
  if(feedback)setArrival({...feedback,id:++arrivalSequence.current});
  if(document.hidden||paused||parentPanel||settingsOpen||demo)return;
  if(feedback)speakDelivery(next.phase==='remaining'?'remaining':next.phase==='route'?'next_stop':'delivered');
  else if(next.phase==='depart')speakDelivery('loaded');
 }
 function act(action:Action,source?:Element){
  const before=current.current;if(cueRef.current||document.hidden||performance.now()<startUntil.current||!before||paused||parentPanel||settingsOpen||demo||flightsRef.current.length>0&&(action.type!=='load'||flightsRef.current[0].kind==='unload'))return;const next=deliveryReducer(before,action);if(next===before)return;
  const feedback=deliveryArrival(before,next);
  if(feedback)pendingArrival.current=feedback;
  else if(next.phase==='travel'||action.type==='next')setArrival(null);
  if(action.type==='hint'){usedSupport.current=true;recorder.current?.note('hints');recorder.current?.noteSupport(next.hintLevel>=3?'demo':'hint');}
  if(action.type==='review'){usedSupport.current=true;recorder.current?.note('hints');recorder.current?.noteSupport('review');}
  if(next.wrong>before.wrong){recorder.current?.note('wrong');awaitingRetry.current=true;}
  else if(awaitingRetry.current&&(['load','route','confirmRemaining'] as string[]).includes(action.type)){recorder.current?.note('retries');awaitingRetry.current=false;}
  if(next.phase==='travel'&&before.phase!=='travel')travelRemaining.current=TRAVEL_MS;
  const transfers:CargoFlight[]=[];
  if(action.type==='load'&&next.loaded.length>before.loaded.length){const art=source?.querySelector('.dv-cargo-art'),to=vehiclePort();if(art&&to)transfers.push({id:++flightSequence.current,item:action.item,kind:'load',from:cargoPoint(art),to});}
  if(feedback){const from=vehiclePort(),buildings=root.current?.querySelectorAll('.dv-world-building'),building=buildings?.[buildings.length-1],stage=root.current?.querySelector('.dv-stage')?.getBoundingClientRect();if(from&&building&&stage){const box=artworkBox(building),x=box.x+box.width*.65,y=box.y+box.height;pendingArrival.current={...feedback,left:(x-stage.x)/stage.width*100,bottom:(stage.bottom-y)/stage.height*100};feedback.cargo.forEach((item,i)=>transfers.push({id:++flightSequence.current,item,kind:'unload',delay:i*90,from:{...from,size:34},to:{x:x+17+i*36,y:y-17,size:34}}));}}
  current.current=next;
  if(transfers.length)queueFlights(transfers);
  const nextCue=action.type==='ready'?{kind:'order' as const}:action.type==='route'&&next.phase==='travel'?{kind:'route' as const,stop:action.stop}:null;
  if(nextCue){cueRef.current=true;cueRemaining.current=220;setCue(nextCue);}
  setState(nextCue||feedback&&transfers.length?before:next.phase==='depart'&&flightsRef.current.length?{...next,phase:'load'}:next);
  if(feedback&&!transfers.length){pendingArrival.current=null;setArrival({...feedback,id:++arrivalSequence.current});}
  setWrongChoice(next.wrong>before.wrong?('item'in action?action.item:'stop'in action?action.stop:null):null);

  if(next.wrong>before.wrong){if(next.hintLevel>=2){usedSupport.current=true;recorder.current?.note('hints');recorder.current?.noteSupport(next.hintLevel>=3?'demo':'hint');}if(next.hintLevel===3&&before.hintLevel<3)setDemo(true);speakDelivery(next.hintLevel===1?(action.type==='route'?'wrong_route':'wrong'):next.hintLevel===2?'hint_two':'hint_demo');return;}
  if(action.type==='hint'){if(next.hintLevel>=3)setDemo(true);speakDelivery(next.hintLevel===1?'hint_one':next.hintLevel===2?'hint_two':'hint_demo');return;}
  if(action.type==='review'){sayOrder(next);return;}
  if(action.type==='ready'){playEffect('select');}
  else if(action.type==='load'){playEffect('pickup');if(!transfers.length){setLanded(previous=>[...previous,action.item]);setLanding(++flightSequence.current);if(next.phase==='depart'&&!flightsRef.current.length)speakDelivery('loaded');}}
  else if(action.type==='depart'||action.type==='route'||action.type==='remaining'||action.type==='confirmRemaining'){if(!nextCue){playEffect(next.phase==='travel'?'start':'door');if(next.phase==='travel')speakDelivery('depart');}else if(next.phase==='route')speakDelivery('which_stop');}
  else if(action.type==='arrive'){playEffect('arrive');speakDelivery('unload');}
  else if(action.type==='unload'){playEffect('unload');if(!transfers.length)speakDelivery(next.phase==='remaining'?'remaining':next.phase==='route'?'next_stop':'delivered');}
  else if(action.type==='next'){setLanded([]);setLanding(0);if(next.phase==='finished'){playEffect('finish');speakDelivery('finished');if(!finished.current){finished.current=true;const count=next.wrong<=1&&!usedSupport.current?(Number(prefs.streaks[next.level.id])||0)+1:0,offer=count>=2&&next.level.id<levels.length&&!prefs.offered[next.level.id];setSuggestNext(offer);updatePrefs({streaks:{...prefs.streaks,[next.level.id]:count},offered:{...prefs.offered,...(offer?{[next.level.id]:true}:{})}});void recorder.current?.finish(true);}}else sayOrder(next);}
 }
 function pause(){if(!state||state.phase==='finished')return;stopSpeech();recorder.current?.note('pauses');setPaused(true);}
 function clearSession(submit:boolean){
  startToken.current++;startingBusy.current=false;
  if(submit&&current.current&&current.current.phase!=='finished')void recorder.current?.finish(false);else recorder.current?.dispose();
  recorder.current=null;current.current=null;if(timer.current)clearTimeout(timer.current);timer.current=null;
  stopSpeech();cancelTransfers();setLanded([]);setArrival(null);setState(null);setStartingCar(null);setPaused(false);setDemo(false);setParentPanel(false);setSettingsOpen(false);setRetryingAssets(false);setAssetError(false);setSuggestNext(false);
 }
 function showPreparation(target:'levels'|'cars',submit=false){
  clearSession(submit);
  const url=`/game/delivery?step=${target}`;
  // Preparation pages share this game's browser entry; back never pushes a loop.
  if(target!==step)router.replace(url);else setScreen(target);
 }
 function back(){const target=gameBackTarget('delivery',screen==='game'?'play':screen);if(target==='home'){clearSession(true);goHome();}else if(target==='levels'||target==='cars')showPreparation(target,true);}
 function home(){clearSession(true);goHome();}
 function restartRound(){if(!window.confirm('重新开始这局？已经完成的步骤会清空。'))return;void start(prefs.car);}
 async function retryImages(){const token=startToken.current;setRetryingAssets(true);const assets=screen==='game'&&state?taskAssets(state.tasks[state.taskIndex],prefs.car):screen==='cars'?carAssets:levelAssets;try{await preloadIllustrations(assets);if(token!==startToken.current)return;document.querySelectorAll<HTMLImageElement>('.dv-app img').forEach(image=>{if(!image.complete||image.naturalWidth===0)image.src=image.currentSrc||image.src;});setAssetError(false);}catch{if(token===startToken.current)setAssetError(true);}finally{if(token===startToken.current)setRetryingAssets(false);}}
 const showOrder=!!state&&(state.phase==='look'||state.review||state.level.mode==='visible'||state.level.mode==='route-visible');
 const targetItem=state&&task&&(state.phase==='remaining'?(remainingCargo(state).find(id=>!state.remainingSelection.includes(id))??remainingCargo(state)[0]):task.cargo.find(x=>!state.loaded.includes(x)));
 const sourcePlace=state&&task&&state.stopIndex>0?task.stops[state.stopIndex-1]:'warehouse';
 const isJourney=!!state&&['travel','unload','taskDone'].includes(state.phase);
 const delivered=state&&task&&['remaining','route','taskDone'].includes(state.phase)&&state.unloaded.length?task.deliveries[state.phase==='taskDone'?state.stopIndex:Math.max(0,state.stopIndex-1)].cargo:[];
 const carried=landed.filter(id=>!state?.unloaded.includes(id)),visibleManifest=state?.level.mode==='visible'||state?.level.mode==='route-visible';
 return <main ref={root} className={`dv-app game-viewport ${cue?'dv-cue-'+cue.kind:''} ${screen!=='game'?'selection-viewport':''} ${state&&task&&['load','remaining','route'].includes(state.phase)?'dv-choosing':''} ${paused||parentPanel||settingsOpen||demo||state?.review?'is-paused':''}`} style={{'--dv-travel-duration':`${TRAVEL_MS}ms`} as CSSProperties}><StorageNotice/><AudioNotice/>
  <GameHeader playing={screen==='game'&&!!state} title="汽车快递站" onBack={back} muted={settings.muted} onSound={()=>{prepareAudio();setAudioSettings({muted:!settings.muted});if(settings.muted)speakDelivery('sound_retry');}} onSettings={()=>{stopSpeech();setSettingsOpen(true);}} onParent={()=>{stopSpeech();if(current.current&&current.current.phase!=='finished')setPaused(true);setParentPanel(true);}} onPause={screen==='game'&&state&&state.phase!=='finished'?pause:undefined}/>
  {assetError&&<button className="dv-audio-note" onClick={retryImages} disabled={retryingAssets} role="status">{retryingAssets?'正在准备图片……':'有图片没准备好，点这里重试'}{screen==='cars'&&!retryingAssets?'，再选一次车':''}</button>}
  {screen==='levels'&&<section className="dv-select"><div className="dv-section-head"><div><span className="dv-kicker">一起装货，一起出发</span><h1>今天送什么？</h1></div><button className="dv-secondary" onClick={()=>{setDemo(true);prepareAudio();speakDelivery('demo');}}>看一遍示范</button></div><div className="dv-levels">{levels.map(level=><button key={level.id} className={`dv-level ${prefs.level===level.id?'is-selected':''}`} disabled={!ready} onClick={()=>chooseLevel(level.id)}><span className="dv-level-number">{level.id}</span><DeliveryLevelArt level={level}/><strong>{taskTitle(level,choiceOptions)}</strong><small>{level.id===8?'更多货物中找剩余':level.mode==='visible'?'看看订单':level.mode==='visual'?'记住货物':level.mode==='update'?'想想还剩什么':'按顺序送'}</small><small>{resolveChoices(level,choiceOptions).cargoCount} 件 · {resolveChoices(level,choiceOptions).destinationCount} 站</small></button>)}</div></section>}
  {screen==='cars'&&<section className="dv-select" aria-busy={!!startingCar}><div className="dv-section-head"><div><span className="dv-kicker">小司机来选</span><h1>{startingCar?'小车准备中……':'点一辆车，出发！'}</h1></div></div>{resolveChoices(levels.find(x=>x.id===prefs.level)??levels[0],choiceOptions).error&&<div className="dv-settings-error" role="alert">{resolveChoices(levels.find(x=>x.id===prefs.level)??levels[0],choiceOptions).error}<button className="dv-secondary" onClick={()=>setParentPanel(true)}>调整配送设置</button></div>}<p className="dv-preparation-summary">{resolveChoices(levels.find(x=>x.id===prefs.level)??levels[0],choiceOptions).cargoCount} 件货物 · {resolveChoices(levels.find(x=>x.id===prefs.level)??levels[0],choiceOptions).destinationCount} 个站点 · 一局三份订单</p><VehiclePicker delivery selected={prefs.car} starting={startingCar} disabled={!ready||!!startingCar||!!resolveChoices(levels.find(x=>x.id===prefs.level)??levels[0],choiceOptions).error} onSelect={id=>void start(id)}/></section>}
  {screen==='game'&&state&&task&&<>
   <div className="dv-game-top"><div><span className="dv-kicker">{taskTitle(state.level,state.choiceOptions)}</span><h1>{state.phase==='look'?'看看订单':state.phase==='load'?'把货物装上车':state.phase==='depart'?'准备出发':state.phase==='route'?'去哪个站？':state.phase==='travel'?'小车出发啦':state.phase==='unload'?'货物到站啦':state.phase==='remaining'?'还剩什么？':state.phase==='taskDone'?'送到了！':'小车回库啦！'}</h1><button className="dv-header-button" aria-label="听任务" onClick={()=>repeatPrompt(state)}><LittleIcon kind="sound"/></button></div><div className="dv-progress-wrap"><strong>第 {state.taskIndex+1}/3 单 · 第 {state.stopIndex+1}/{task.stops.length} 站</strong><div className="dv-progress" aria-label={`第 ${Math.min(state.taskIndex+1,3)} 次配送，共三次`}>{[0,1,2].map(i=><span key={i} className={i<state.taskIndex||state.phase==='finished'?'done':i===state.taskIndex?'current':''}/>)}</div></div></div>
   {state.phase==='finished'?<section className="dv-finished"><DeliveryVictoryScene state={state} car={prefs.car} interrupted={parentPanel||settingsOpen||demo}/><h2>全部送好啦！</h2><p>小车回到车库，休息一下。</p>{suggestNext&&<p>和大人一起看看下一关？</p>}<div className="dv-actions"><button className="dv-primary" onClick={()=>void start(prefs.car)}>再玩一局</button>{suggestNext&&<button className="dv-secondary" onClick={()=>{updatePrefs({level:Math.min(state.level.id+1,levels.length)});showPreparation('cars');}}>看看下一关</button>}<button className="dv-secondary" onClick={home}>返回首页</button></div></section>:<>
    <section className={`dv-stage ${state.phase==='unload'?'is-arrived':''} ${flights[0]?.kind==='unload'?'is-unloading':''} ${state.phase==='depart'?'is-loading-complete':''}`} aria-label="小汽车镇">
     {isJourney?<JourneyWorld key={`${state.taskIndex}-${state.stopIndex}`} from={sourcePlace} to={task.stops[state.stopIndex]} travelling={state.phase==='travel'} arrived={state.phase!=='travel'}/>:<World place={sourcePlace}/>}
     <DeliveryVehicle car={prefs.car} carried={carried} visibleManifest={!!visibleManifest} delivered={state.unloaded.length>0} driving={state.phase==='travel'} landing={landing} onSettled={()=>setLanding(0)}/>
     {arrival?<DeliveryArrivalEffect key={arrival.id} event={arrival}/>:delivered.length>0&&<div className="dv-delivered-goods">{delivered.map(id=><CargoArt key={id} id={id}/>)}</div>}
    </section>
    <section className="dv-workspace">
     {showOrder&&<div className="dv-order-group"><section className="dv-order" aria-label="货物订单"><strong className="dv-order-title">要带什么</strong><div className="dv-order-items">{task.cargo.map(id=><span key={id}><CargoArt id={id}/><small>{itemName(id)}</small></span>)}</div></section><DeliveryRouteCard stops={task.stops} deliveries={task.deliveries}/></div>}
     {state.phase==='look'&&<div className="dv-step"><p>和大人一起看看，再点这里。</p><button className="dv-primary" disabled={!!cue} onClick={()=>act({type:'ready'})}>记好了 <span>→</span></button></div>}
     {(state.phase==='load'||state.phase==='remaining')&&<div className="dv-shelf"><div className="dv-shelf-title"><strong>{state.phase==='remaining'?'选出还剩的货物':'选一件货物'}</strong><span>可请大人帮忙</span></div><div className="dv-item-grid" style={{'--choice-columns':Math.min(4,task.choices.length)} as CSSProperties}>{task.choices.map(id=><button key={id} className={`dv-item ${flights.some(f=>f.item===id)?'is-in-flight':''} ${wrongChoice===id?'is-wrong':''} ${state.phase==='load'&&state.loaded.includes(id)?'is-loaded':''} ${state.hintLevel>=2&&targetItem===id?'is-hinted':''} ${state.phase==='remaining'&&state.remainingSelection.includes(id)?'is-selected':''}`} disabled={state.phase==='load'&&state.loaded.includes(id)} aria-pressed={state.phase==='remaining'?state.remainingSelection.includes(id):undefined} aria-label={itemName(id)} onClick={event=>act({type:state.phase==='load'?'load':'remaining',item:id},event.currentTarget)}><CargoArt id={id}/><span>{itemName(id)}</span>{state.phase==='load'&&state.loaded.includes(id)&&<b>✓</b>}</button>)}</div></div>}
     {state.phase==='remaining'&&remainingCargo(state).length>1&&<button className="dv-primary dv-confirm-remaining" disabled={!state.remainingSelection.length} onClick={()=>act({type:'confirmRemaining'})}>选好了</button>}
     {state.phase==='depart'&&<div className="dv-step"><p>货物装好了！</p><button className="dv-primary" disabled={flights.length>0} onClick={()=>act({type:'depart'})}>小车出发 <span>→</span></button></div>}
     {state.phase==='route'&&<div className="dv-step dv-route-options"><div className="dv-stop-grid" style={{'--choice-columns':Math.min(4,task.stopChoices.length)} as CSSProperties}>{task.stopChoices.map(stop=>{const visited=task.stops.slice(0,state.stopIndex).includes(stop);return <button key={stop} disabled={visited||!!cue} className={`dv-stop ${cue?.stop===stop?'is-confirming':''} ${wrongChoice===stop?'is-wrong':''} ${visited?'is-visited':''} ${state.hintLevel>=2&&task.stops[state.stopIndex]===stop?'is-hinted':''}`} onClick={()=>act({type:'route',stop})}><StopArt stop={stop}/><strong>{stopNames[stop]}</strong><span className="dv-stop-status">{visited?'✓ 已送到':''}</span></button>;})}</div></div>}
     {state.phase==='travel'&&<div className="dv-step"><p>小车正在路上……</p></div>}
     {state.phase==='unload'&&<div className="dv-step"><p>到{stopNames[task.stops[state.stopIndex]]}啦！</p><button className="dv-primary" disabled={flights.length>0} onClick={()=>act({type:'unload'})}>把货物送到 <span>↓</span></button></div>}
     {state.phase==='taskDone'&&<div className="dv-step"><p>这一单送好啦！</p><button className="dv-primary" onClick={()=>act({type:'next'})}>{state.taskIndex===2?'小车回库':'下一次配送'} <span>→</span></button></div>}
    </section>
    <div className="dv-feedback" role="status">{state.message}</div><div className="dv-actions">{['load','route','remaining'].includes(state.phase)&&<><button className="dv-secondary" disabled={flights.length>0||!!cue} onClick={()=>act({type:'hint'})}><LittleIcon kind="hint"/>给个提示</button><button className="dv-secondary" disabled={flights.length>0||!!cue} onClick={()=>{playEffect('help');recorder.current?.noteSupport('help');act({type:'review'});}}><LittleIcon kind="help"/>请大人帮忙</button><button className="dv-secondary" disabled={flights.length>0||!!cue} onClick={()=>act({type:'review'})}><LittleIcon kind="sound"/>再看订单</button>{state.phase==='route'&&<button className="dv-secondary" onClick={()=>{usedSupport.current=true;recorder.current?.note('hints');recorder.current?.noteSupport('review');prepareAudio();speakRoute(task.stops);}}><LittleIcon kind="sound"/>再听路线</button>}</>}</div>
   </>}
  </>}
  <CargoFlights flights={flights} paused={paused||parentPanel||settingsOpen||demo||!!state?.review} onLand={landFlight}/>
  {state?.review&&task&&<div className="dv-overlay"><section className="dv-modal" role="dialog" aria-modal="true" aria-label="再看看订单"><h2>我们一起看看</h2><div className="dv-order-group dv-review-group"><section className="dv-order" aria-label="货物订单"><strong className="dv-order-title">要带什么</strong><div className="dv-review">{task.cargo.map(id=><span key={id}><CargoArt id={id}/><small>{itemName(id)}</small></span>)}</div></section><DeliveryRouteCard stops={task.stops} deliveries={task.deliveries}/></div><button className="dv-primary" onClick={()=>act({type:'closeReview'})}>记好了，继续</button></section></div>}
  {demo&&<div className="dv-overlay"><section className="dv-modal dv-demo" role="dialog" aria-modal="true" aria-label="游戏示范"><h2>{state?.phase==='route'?'小车去哪里？':state?.phase==='remaining'?'看看还剩什么':'小车怎么送货？'}</h2><div className="dv-demo-scene">{state?.phase==='route'&&task?<><Illustration id={vehicleIllustration[prefs.car]}/><span className="dv-demo-arrow">→</span><StopArt stop={task.stops[state.stopIndex]}/></>:<><span className="dv-demo-cargo"><CargoArt id={targetItem||'parcel'}/></span><span className="dv-demo-arrow">→</span><Illustration id={vehicleIllustration[prefs.car]}/><span className="dv-demo-arrow">→</span><StopArt stop={task?.stops[state?.stopIndex??0]??'fire'}/></>}</div><p>{state?.phase==='route'?'看一看小车去的站。':state?.phase==='remaining'?'看看剩下的货物。':'看看订单，装上车，送到站。'}</p><button className="dv-primary" onClick={finishDemo}>我来试试</button></section></div>}
  {parentPanel?<ParentPanel account={account} game="delivery" settingsContent={<><DeliveryChoiceSettings value={choiceOptions} level={state?.level??levels.find(level=>level.id===prefs.level)??levels[0]} inRound={!!state&&state.phase!=='finished'} onChange={updateChoiceOptions}/>{choiceSaveFailed&&<p role="status">设置暂时未保存，本次仍可使用。重新进入后请再检查。</p>}</>} difficulty="auto" onDifficulty={()=>{}} onClose={()=>setParentPanel(false)} onRestart={screen==='game'&&state&&state.phase!=='finished'?restartRound:undefined}/>:paused&&screen==='game'&&<div className="dv-overlay pause-overlay"><section className="dv-modal" role="dialog" aria-modal="false" aria-label="休息一下"><div className="dv-rest-icon"><LittleIcon kind="pause"/></div><h2>小车也休息一下</h2><p>想继续的时候，再出发。</p><button className="dv-primary resume-play" aria-label="恢复游戏" onClick={()=>{setPaused(false);prepareAudio();speakDelivery('resume');}}>▶</button></section></div>}
  {settingsOpen&&<div className="dv-overlay"><section className="dv-modal" role="dialog" aria-modal="true" aria-label="声音设置"><h2>声音设置</h2><p>和大人一起选择舒服的声音。</p><div className="dv-settings"><button onClick={()=>setAudioSettings({voice:settings.muted?true:!settings.voice,muted:false})}>语音 {settings.voice&&!settings.muted?'开':'关'}</button><button onClick={()=>{prepareAudio();setAudioSettings({effects:settings.muted?true:!settings.effects,muted:false});}}>音效 {settings.effects&&!settings.muted?'开':'关'}</button></div><button className="dv-primary" onClick={()=>setSettingsOpen(false)}>好了</button></section></div>}
 </main>;
}
