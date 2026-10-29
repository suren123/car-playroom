import type {CSSProperties,ReactNode} from 'react';
import type {GameId} from '../games/registry';
import type {IllustrationId} from '../games/illustration-assets';
import {Illustration} from './illustration';
import {VehicleArt} from './vehicle-art';
import {RoadTile,SignalArt} from './road-art';
import './unified-art.css';

function Layer({x,y,w,h,children}:{x:number;y:number;w:number;h:number;children:ReactNode}){return <div className="cover-layer" style={{left:`${x}%`,top:`${y}%`,width:`${w}%`,height:`${h}%`} as CSSProperties}>{children}</div>;}
function Sprite({id,x,y,w,h}:{id:IllustrationId;x:number;y:number;w:number;h:number}){return <Layer x={x} y={y} w={w} h={h}><Illustration id={id}/></Layer>;}
function Bridge(){return <svg viewBox="0 0 180 70" aria-hidden="true"><path d="M5 48q40-28 82 0t88 0" fill="none" stroke="#78bed1" strokeWidth="18" strokeLinecap="round"/><path d="M10 36h48m12 0h40" stroke="#27343b" strokeWidth="17" strokeLinecap="round"/><path d="M10 36h48m12 0h40" stroke="#d8a253" strokeWidth="10"/><rect x="122" y="28" width="45" height="16" rx="4" fill="#fff8e4" stroke="#668b6b" strokeWidth="3" strokeDasharray="5 4"/><path d="M22 43v18m77-18v18" stroke="#354644" strokeWidth="8"/></svg>;}
export function GameCoverArt({game}:{game:Exclude<GameId,'sudoku'|'difference'>}){
 return <div className={`game-cover-art cover-${game}`} aria-hidden="true">
  {game==='delivery'&&<><Sprite id="delivery" x={4} y={16} w={83} h={78}/><Sprite id="parcel" x={72} y={58} w={28} h={40}/></>}
  {game==='queue'&&<><div className="cover-road"/><Sprite id="fire" x={0} y={32} w={36} h={48}/><Sprite id="bus" x={32} y={32} w={36} h={48}/><Sprite id="truck" x={64} y={32} w={36} h={48}/></>}
  {game==='bridge'&&<><Layer x={0} y={42} w={100} h={58}><Bridge/></Layer><Sprite id="fire" x={2} y={0} w={62} h={66}/></>}
  {game==='sort'&&<><div className="cover-bay bay-red"/><div className="cover-bay bay-blue"/><Layer x={1} y={10} w={48} h={65}><VehicleArt kind="bus" color="#de6650"/></Layer><Layer x={51} y={10} w={48} h={65}><VehicleArt kind="truck" color="#6e9eaf"/></Layer></>}
  {game==='repair'&&<><Sprite id="fire" x={0} y={4} w={90} h={75}/><Sprite id="wheel" x={6} y={62} w={25} h={37}/><Sprite id="tool-wrench" x={67} y={48} w={32} h={48}/></>}
  {game==='traffic'&&<><Sprite id="fire" x={0} y={22} w={78} h={72}/><Layer x={78} y={3} w={22} h={82}><SignalArt/></Layer></>}
  {game==='listen'&&<><Sprite id="fire" x={0} y={43} w={55} h={55}/><Sprite id="stop-gas" x={29} y={0} w={31} h={45}/><Layer x={58} y={14} w={15} h={20}><svg viewBox="0 0 30 20"><path d="M2 10h23m-8-6 8 6-8 6" stroke="#668b6b" strokeWidth="3" fill="none"/></svg></Layer><Sprite id="fireStation" x={73} y={0} w={27} h={45}/></>}
  {game==='detour'&&<><Layer x={7} y={30} w={86} h={68}><RoadTile detour/></Layer><Sprite id="fire" x={0} y={10} w={53} h={52}/><Sprite id="cargo-barrier" x={63} y={15} w={34} h={45}/></>}
 </div>;
}
