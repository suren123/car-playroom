import {type VehicleKind,colors} from '../lib/replay-games';
import type {CarKind} from '../games/vehicle-catalog';
import {Illustration} from './illustration';
import {vehicleIllustration} from '../games/illustration-assets';
export {carCatalog} from '../games/vehicle-catalog';
export type {CarKind} from '../games/vehicle-catalog';

// Classification needs genuine body-color variants, so these six vehicles stay
// editable vectors. Outline, blue glazing and proportions follow the PNG family.
export function VehicleArt({kind,color,className=''}:{kind:CarKind;color?:string;className?:string}){
 if(!(kind in colors))return <Illustration id={vehicleIllustration[kind]} className={`vehicle-art ${className}`}/>;
 const fill=color||colors[kind as VehicleKind][0];
 const wheel=(x:number)=><g key={x} className="vehicle-wheel"><circle cx={x} cy="89" r="15" fill="#25313b"/><circle cx={x} cy="89" r="7" fill="#edf2f3" strokeWidth="2"/></g>;
 const glass=(x:number,y:number,w:number,h:number)=><g><rect x={x} y={y} width={w} height={h} rx="3" fill="#22b6ee" strokeWidth="3"/><path d={`M${x+4} ${y+h-5} ${x+w-6} ${y+5}`} stroke="#91e1f8" strokeWidth="4"/></g>;
 return <svg className={`vehicle-art ${className}`} data-vehicle-kind={kind} data-body-color={fill} viewBox="0 0 190 112" fill="none" stroke="#243139" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
  {kind==='digger'?<><rect x="13" y="79" width="106" height="24" rx="12" fill="#37434d"/>{[29,51,73,95].map(x=><circle key={x} cx={x} cy="91" r="6" fill="#8e9ca5" strokeWidth="2"/>)}<path d="M25 60h80v20H25zM48 31h40l16 46H47Z" fill={fill}/>{glass(55,39,27,26)}<path d="m102 65 31-42 37 35" stroke="#243139" strokeWidth="15"/><path d="m102 65 31-42 37 35" stroke={fill} strokeWidth="9"/><circle cx="133" cy="23" r="5" fill="#a67d32"/><path d="m169 57 9 25q-11 13-33 6l9-26Z" fill="#4a5862"/></>
  :kind==='bus'?<><rect x="13" y="27" width="164" height="63" rx="13" fill={fill}/>{[24,53,82,111,140].map(x=><g key={x}>{glass(x,37,23,29)}</g>)}<path d="M17 77h156" stroke="#ffedbe" strokeWidth="6"/><path d="M136 31v55" strokeWidth="2"/>{wheel(44)}{wheel(146)}</>
  :<>
   <path d="M120 39h28l27 33v17H14V50h106Z" fill={fill}/><path d="M131 46h13l20 25h-33Z" fill="#22b6ee"/><path d="m135 65 10-14" stroke="#91e1f8" strokeWidth="4"/>
   {kind==='fire'?<><rect x="14" y="41" width="106" height="42" rx="6" fill={fill}/><rect x="63" y="49" width="47" height="27" rx="3" fill="#b6c2ce"/><path d="M67 57h39m-39 9h39" stroke="#728292" strokeWidth="2"/><path d="M37 49q13 8 7 17 9-6 8-10 8 18-9 19-17-2-6-26Z" fill="#fff9e9" stroke="none"/><path d="M19 26h96v11H19Zm17 0v11m20-11v11m20-11v11m20-11v11" fill="#abb9c4" strokeWidth="3"/><path d="M136 37V27q0-9 13-6 6 2 6 16Z" fill="#f5b72b"/></>
   :kind==='ambulance'?<><rect x="14" y="21" width="107" height="62" rx="8" fill={fill}/><path d="M62 34v32m-16-16h32" stroke="#ed3533" strokeWidth="9"/><path d="M17 76h101" stroke="#ed3533" strokeWidth="6"/><rect x="133" y="28" width="22" height="10" rx="3" fill="#ed3533"/></>
   :kind==='truck'?<><rect x="13" y="22" width="107" height="62" rx="8" fill={fill}/><path d="M30 34v36m22-36v36m22-36v36m22-36v36" stroke="#d8f3ff" opacity=".55" strokeWidth="4"/></>
   :<><path d="m30 49 122-32" stroke="#243139" strokeWidth="14"/><path d="m30 49 122-32" stroke={fill} strokeWidth="8"/><path d="m48 39 5 7m20-13 5 7m20-13 5 7m20-13 5 7" stroke="#38454b" strokeWidth="5"/><path d="M154 20v27q9 8 0 13-9 1-8-6" strokeWidth="4"/><rect x="21" y="54" width="86" height="24" rx="4" fill={fill}/></>}
   <path d="M14 84h160" stroke="#9baab4" strokeWidth="6"/>{wheel(44)}{wheel(146)}
  </>}
 </svg>;
}
