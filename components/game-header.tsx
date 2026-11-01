'use client';
import {Pause,SlidersHorizontal,UsersRound,Volume2,VolumeX} from 'lucide-react';
import GameBackButton from './game-back-button';
import {useGameArtworkGestures} from '../hooks/use-game-artwork-gestures';
import '../app/game-design.css';
import '../app/game-viewport.css';
import '../app/game-selection.css';
import {useRef} from 'react';
import {useGameViewport} from '../hooks/use-game-viewport';

/** The same control positions and meanings in every town game. */
export default function GameHeader({title,muted,onBack,onSound,onParent,onPause,onSettings,playing=false,onViewportPause}:{title:string;muted:boolean;onBack:()=>void;onSound:()=>void;onParent:()=>void;onPause?:()=>void;onSettings?:()=>void;playing?:boolean;onViewportPause?:()=>void}){
 useGameArtworkGestures();
 const header=useRef<HTMLElement>(null),blocked=useGameViewport(header,true,onViewportPause??onPause,playing);
 return <><header ref={header} className="town-header"><GameBackButton onBack={onBack}/><strong className="town-header-title">{title}</strong><nav className="town-header-actions" aria-label="游戏控制">
  <button aria-label={muted?'打开声音':'静音'} onClick={onSound}>{muted?<VolumeX/>:<Volume2/>}</button>
  {onSettings&&<button aria-label="声音设置" onClick={onSettings}><SlidersHorizontal/></button>}
  <button aria-label="家长面板" onClick={onParent}><UsersRound/></button>
  {onPause&&<button aria-label="休息" onClick={onPause}><Pause/></button>}
 </nav></header>{blocked&&<div className="game-orientation-notice" role="dialog" aria-modal="true" aria-label="调整游戏画面"><div><strong>{blocked==='landscape'?'请把 iPad 竖起来':'请扩大游戏窗口'}</strong><p>小车在这里等你，当前任务会保留。</p><GameBackButton onBack={onBack}/></div></div>}</>;
}
