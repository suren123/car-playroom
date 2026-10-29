'use client';
import {Pause,SlidersHorizontal,UsersRound,Volume2,VolumeX} from 'lucide-react';
import GameBackButton from './game-back-button';
import {useGameArtworkGestures} from '../hooks/use-game-artwork-gestures';
import '../app/game-design.css';

/** The same control positions and meanings in every town game. */
export default function GameHeader({title,muted,onBack,onSound,onParent,onPause,onSettings}:{title:string;muted:boolean;onBack:()=>void;onSound:()=>void;onParent:()=>void;onPause?:()=>void;onSettings?:()=>void}){
 useGameArtworkGestures();
 return <header className="town-header"><GameBackButton onBack={onBack}/><strong className="town-header-title">{title}</strong><nav className="town-header-actions" aria-label="游戏控制">
  <button aria-label={muted?'打开声音':'静音'} onClick={onSound}>{muted?<VolumeX/>:<Volume2/>}</button>
  {onSettings&&<button aria-label="声音设置" onClick={onSettings}><SlidersHorizontal/></button>}
  <button aria-label="家长面板" onClick={onParent}><UsersRound/></button>
  {onPause&&<button aria-label="休息" onClick={onPause}><Pause/></button>}
 </nav></header>;
}
