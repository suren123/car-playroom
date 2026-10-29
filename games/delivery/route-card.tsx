import {StopArt} from './art';
import {stopNames,type StopId} from './model';


export function DeliveryRouteCard({stops}:{stops:StopId[]}){
 return <section className="dv-route-card" aria-label="送货路线">
  <strong className="dv-route-title">送到哪里</strong>
  <ol className="dv-route-stops">{stops.map((stop,i)=><li key={stop}>
   <StopArt stop={stop}/><strong>{stopNames[stop]}</strong>
   {i<stops.length-1&&<span className="dv-route-arrow" aria-hidden="true">→</span>}
  </li>)}</ol>
 </section>;
}
