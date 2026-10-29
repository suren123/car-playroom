import {Illustration} from '../../components/illustration';
import {cargoIllustration,destinationIllustration} from '../illustration-assets';
import type {ItemId,StopId} from './model';

export const TRAVEL_MS=2200;
export type Place='warehouse'|StopId;

export function CargoArt({id}:{id:ItemId}){
 return <Illustration id={cargoIllustration[id]} className="dv-cargo-art" priority/>;
}

export function StopArt({stop}:{stop:StopId}){
 return <Illustration id={destinationIllustration[stop]} className="dv-stop-art" priority/>;
}

export function World({place}:{place:Place|'road'}){
 return <div className={`dv-world dv-place-${place}`} aria-hidden="true">
  <span className="dv-world-sun"/>
  <Illustration id="doubleCloud" className="dv-world-cloud dv-world-cloud-one" priority/>
  <Illustration id="cloud" className="dv-world-cloud dv-world-cloud-two" priority/>
  <Illustration id="roundTree" className="dv-world-tree dv-world-tree-one" priority/>
  <Illustration id="pineTree" className="dv-world-tree dv-world-tree-two" priority/>
  <Illustration id="roundBush" className="dv-world-bush" priority/>
  {place!=='road'&&<Illustration id={place==='warehouse'?'warehouse':destinationIllustration[place]} className="dv-world-building" align="bottom-left" priority/>}
  <div className="dv-world-road"><span/></div>
 </div>;
}

// Keep this strip mounted through arrival: its last animation frame is the stop scene.
export function JourneyWorld({from,to,travelling,arrived}:{from:Place;to:StopId;travelling:boolean;arrived:boolean}){
 return <div className={`dv-journey ${travelling?'is-travelling':''} ${arrived?'is-at-destination':''}`}>
  <div className="dv-journey-strip">
   <div className="dv-journey-panel"><World place={from}/></div>
   <div className="dv-journey-panel"><World place="road"/></div>
   <div className="dv-journey-panel"><World place={to}/></div>
  </div>
 </div>;
}
