import {Illustration} from './illustration';
import {differenceLevels,type DifferenceDifficulty,type VehicleKind} from '../lib/replay-games';
import type {CSSProperties} from 'react';

const differenceKinds:VehicleKind[]=['fire','ambulance','bus','truck','digger','crane'];
export function DifferencePreview({home=false,difficulty='beginner'}:{home?:boolean;difficulty?:DifferenceDifficulty}){
 const level=differenceLevels[difficulty];
 const left:VehicleKind[]=home?['fire','bus']:Array.from({length:level.count},(_,i)=>differenceKinds[i%6]);
 const changed=home?[1]:Array.from({length:level.differences},(_,i)=>left.length-1-i);
 return <div className={`difference-preview ${home?'difference-home-icon':''}`} aria-hidden="true" style={{'--columns':home?1:level.columns} as CSSProperties}>
  {[0,1].map(side=><div key={side}>{left.map((kind,index)=><span className={changed.includes(index)?'preview-circled':''} key={index}><Illustration id={side===1&&changed.includes(index)?home?'truck':differenceKinds[(differenceKinds.indexOf(kind)+1)%6]:kind} priority/></span>)}</div>)}
 </div>;
}
