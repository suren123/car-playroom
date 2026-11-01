import type {CarKind} from '../vehicle-catalog.ts';
import type {ItemId} from './model.ts';

// Normalized cargo ports on each side-view vehicle. Utility/special vehicles
// use a receiving badge near the rear rather than pretending they have a box.
export const cargoPorts:Record<CarKind,{x:number;y:number}>={
 fire:{x:.30,y:.46},ambulance:{x:.27,y:.46},police:{x:.24,y:.52},
 bus:{x:.24,y:.48},truck:{x:.31,y:.40},delivery:{x:.32,y:.42},
 digger:{x:.25,y:.65},crane:{x:.28,y:.66},mixer:{x:.33,y:.43},roller:{x:.25,y:.48},
 tow:{x:.25,y:.57},garbage:{x:.32,y:.39},dump:{x:.32,y:.41},forklift:{x:.70,y:.66},
 tractor:{x:.23,y:.50},fuelTanker:{x:.34,y:.43},sweeper:{x:.27,y:.45},
 schoolBus:{x:.24,y:.47},iceCream:{x:.29,y:.49},race:{x:.22,y:.53},
};
export type FlightPoint={x:number;y:number;size:number};
export type CargoFlight={id:number;item:ItemId;kind:'load'|'unload';delay?:number;from:FlightPoint;to:FlightPoint};
export function flightFrames(from:FlightPoint,to:FlightPoint){
 const dx=to.x-from.x,dy=to.y-from.y,scale=to.size/from.size;
 return [
  {transform:'translate(0px,0px) scale(1)',opacity:1,offset:0},
  {transform:`translate(${dx*.40}px,${dy*.40-Math.min(64,Math.hypot(dx,dy)*.14)}px) scale(${1+(scale-1)*.35})`,opacity:1,offset:.42},
  {transform:`translate(${dx}px,${dy}px) scale(${scale})`,opacity:1,offset:1},
 ];
}
// Respect contain-fit letterboxing in both the cropped SVG wrappers and PNGs.
export function artworkBox(element:Element){
 const box=element.getBoundingClientRect();let ratio=box.width/Math.max(1,box.height);
 if(element instanceof SVGSVGElement){const v=element.viewBox.baseVal;if(v.width&&v.height)ratio=v.width/v.height;}
 else if(element instanceof HTMLImageElement&&element.naturalHeight)ratio=element.naturalWidth/element.naturalHeight;
 const width=Math.min(box.width,box.height*ratio),height=width/ratio;
 const bottom=getComputedStyle(element).objectPosition.includes('bottom')||element.getAttribute('preserveAspectRatio')?.includes('YMax');
 const left=getComputedStyle(element).objectPosition.startsWith('left')||element.getAttribute('preserveAspectRatio')?.includes('xMin');
 return {x:box.x+(left?0:(box.width-width)/2),y:box.y+(bottom?box.height-height:(box.height-height)/2),width,height};
}
export function cargoPoint(element:Element):FlightPoint{const b=artworkBox(element);return {x:b.x+b.width/2,y:b.y+b.height/2,size:Math.max(b.width,b.height)};}
