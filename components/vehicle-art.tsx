"use client";
import {useContext,useId} from 'react';
import type {CarKind} from '../games/vehicle-catalog';
import {Illustration} from './illustration';
import {illustrationUrl} from '../games/illustration-assets';
import {GameResourceContext} from './game-resource-context';
export {carCatalog} from '../games/vehicle-catalog';
export type {CarKind} from '../games/vehicle-catalog';

// The color challenge uses these two civilian models. Geometry and all details
// remain the original PNG; only the painted body receives a color blend.
export function VehicleArt({kind,color,className=''}:{kind:CarKind;color?:string;className?:string}){
 const resources=useContext(GameResourceContext),prefix=useId(),url=illustrationUrl(kind),src=resources?.get(url)?.src??url;
 if(!color||(kind!=='bus'&&kind!=='truck'))return <Illustration id={kind} className={`vehicle-art ${className}`}/>;
 const bus=kind==='bus',width=288,height=bus?158:170;
 const rgb=[1,3,5].map(at=>parseInt(color.slice(at,at+2),16)/255),gain=bus?.6:.4;
 const matrix=[...rgb.flatMap(channel=>[channel/gain/3,channel/gain/3,channel/gain/3,0,0]),0,0,0,1,0].join(' ');
 return <svg className={`vehicle-art ${className}`} data-vehicle-kind={kind} data-body-color={color} data-master={kind} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
  <defs><filter id={`${prefix}-paint`} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values={matrix}/></filter>
   <mask id={`${prefix}-body`}><rect width={width} height={height} fill="white"/>
    {bus?<>{[26,77,127,178,228].map(x=><rect key={x} x={x} y="25" width="39" height="49" rx="2" fill="black"/>)}<path d="M12 79h264v8H12z" fill="black"/>{[62,234].map(x=><circle key={x} cx={x} cy="126" r="28" fill="black"/>)}<rect x="8" y="84" width="20" height="29" fill="black"/><rect x="267" y="84" width="20" height="28" fill="black"/></>:<><path d="M206 45h38l20 41h-58z" fill="black"/>{[61,223].map(x=><circle key={x} cx={x} cy="138" r="28" fill="black"/>)}<rect x="263" y="97" width="25" height="28" fill="black"/></>}
   </mask>
  </defs>
  <image href={src} width={width} height={height}/><image href={src} width={width} height={height} mask={`url(#${prefix}-body)`} filter={`url(#${prefix}-paint)`}/>
 </svg>;
}
