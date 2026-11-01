import {CargoArt,StopArt} from './art';
import {items,stopNames,type StopId,type Drop} from './model';
export function DeliveryRouteCard({stops,deliveries}:{stops:StopId[];deliveries?:Drop[]}){
 return <section className="dv-route-card" aria-label="送货路线">
  <strong className="dv-route-title">送到哪里</strong>
  <ol className="dv-route-stops">{stops.map((stop,i)=><li key={stop}>
   <StopArt stop={stop}/><strong>{stopNames[stop]}</strong>
   {deliveries&&<div className="dv-assigned-cargo" aria-label={`${stopNames[stop]}收到的货物`}>{deliveries[i].cargo.map(id=><span key={id} title={items.find(x=>x.id===id)?.name}><CargoArt id={id}/></span>)}</div>}
   {i<stops.length-1&&<span className="dv-route-arrow" aria-hidden="true">→</span>}
  </li>)}</ol>
 </section>;
}
