import {Illustration} from '../../components/illustration';
import {cargoIllustration,destinationIllustration} from '../illustration-assets';
import type {ItemId,StopId} from './model';

export function CargoArt({id}:{id:ItemId}){
 return <Illustration id={cargoIllustration[id]} className="dv-cargo-art"/>;
}

export function StopArt({stop}:{stop:StopId}){
 return <Illustration id={destinationIllustration[stop]} className="dv-stop-art"/>;
}

export function World({place}:{place:'warehouse'|StopId}){
 return <div className="dv-world" aria-hidden="true">
  <span className="dv-world-sun"/>
  <Illustration id="doubleCloud" className="dv-world-cloud dv-world-cloud-one"/>
  <Illustration id="cloud" className="dv-world-cloud dv-world-cloud-two"/>
  <Illustration id="roundTree" className="dv-world-tree dv-world-tree-one"/>
  <Illustration id="pineTree" className="dv-world-tree dv-world-tree-two"/>
  <Illustration id="warehouse" className="dv-world-building dv-world-warehouse"/>
  {place!=='warehouse'&&<Illustration id={destinationIllustration[place]} className="dv-world-building dv-world-destination"/>}
  <div className="dv-world-road"><span/></div>
 </div>;
}
