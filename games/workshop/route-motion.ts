/** Overhead sprite faces right at 0 degrees. Unwrap turns to avoid full spins. */
export function routeHeading(from:number,to:number,size:number){
 return Math.atan2(Math.floor(to/size)-Math.floor(from/size),to%size-from%size)*180/Math.PI;
}
export function routeMotion(path:readonly number[],size:number){
 let angle=path.length>1?routeHeading(path[0],path[1],size):0;
 const position=(cell:number,rotation:number,offset:number)=>({left:`${(cell%size+.5)/size*100}%`,top:`${(Math.floor(cell/size)+.5)/size*100}%`,transform:`translate(-50%,-50%) rotate(${rotation}deg)`,offset});
 const frames=[position(path[0],angle,0)];
 for(let i=1;i<path.length;i++){
  frames.push(position(path[i],angle,(i-.14)/(path.length-1)));
  if(i<path.length-1){let next=routeHeading(path[i],path[i+1],size);while(next-angle>180)next-=360;while(next-angle< -180)next+=360;angle=next;}
  frames.push(position(path[i],angle,i/(path.length-1)));
 }
 return frames;
}
