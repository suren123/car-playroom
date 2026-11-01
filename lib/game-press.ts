/** Touch buttons activate on release, independently of the browser's synthesized
 * click. Long holds are valid; dragging, cancellation and multi-touch are not. */
const slop=28;
let recentRelease:{x:number;y:number;until:number}|null=null;
let abandonedPointer:number|null=null;
export function installGamePress(root:HTMLElement){
 type Press={button:HTMLButtonElement;pointer:number;x:number;y:number;label:string;cancelled:boolean};
 let press:Press|null=null;
 const clear=()=>{press?.button.removeAttribute('data-game-pressed');press=null;};
 const abandon=()=>{if(press)abandonedPointer=press.pointer;clear();};
 const cancel=()=>{if(press){press.cancelled=true;press.button.removeAttribute('data-game-pressed');}};
 const eligible=(button:HTMLButtonElement)=>!button.disabled&&!button.closest('[inert],[aria-disabled="true"]');
 const down=(event:PointerEvent)=>{
  recentRelease=null;
  if(press){cancel();return;}
  if(!event.isPrimary||event.button!==0||!['touch','pen'].includes(event.pointerType))return;
  abandonedPointer=null;
  const target=event.target;if(!(target instanceof Element)||!root.contains(target))return;
  const button=target.closest<HTMLButtonElement>('button');
  // Queue cars own a separate pointer/drag lifecycle, including tap fallback.
  if(!button||!eligible(button)||button.matches('.ws-car-choice,.ws-parking-slot')||window.visualViewport&&window.visualViewport.scale>1.01)return;
  press={button,pointer:event.pointerId,x:event.clientX,y:event.clientY,label:button.getAttribute('aria-label')??button.textContent??'',cancelled:false};
  button.setAttribute('data-game-pressed','');
 };
 const move=(event:PointerEvent)=>{
  if(!press||event.pointerId!==press.pointer)return;
  if(Math.hypot(event.clientX-press.x,event.clientY-press.y)>slop)cancel();
 };
 const up=(event:PointerEvent)=>{
  if(abandonedPointer===event.pointerId){recentRelease={x:event.clientX,y:event.clientY,until:performance.now()+800};abandonedPointer=null;return;}
  if(!press||event.pointerId!==press.pointer)return;
  const p=press;clear();
  // Suppress the later native click even if a route change replaces the button.
  recentRelease={x:event.clientX,y:event.clientY,until:performance.now()+800};
  const hit=document.elementFromPoint(event.clientX,event.clientY);
  if(p.cancelled||Math.hypot(event.clientX-p.x,event.clientY-p.y)>slop||!p.button.isConnected||!eligible(p.button)||!hit||!p.button.contains(hit)||document.hidden)return;
  if((p.button.getAttribute('aria-label')??p.button.textContent??'')!==p.label)return;
  p.button.click();
 };
 const cancelled=(event:PointerEvent)=>{if(press?.pointer===event.pointerId)clear();if(abandonedPointer===event.pointerId)abandonedPointer=null;};
 const click=(event:MouseEvent)=>{
  if(event.isTrusted&&event.detail>0&&recentRelease&&performance.now()<recentRelease.until&&Math.hypot(event.clientX-recentRelease.x,event.clientY-recentRelease.y)<32){event.preventDefault();event.stopImmediatePropagation();}
 };
 const context=(event:Event)=>{
  const target=event.target;
  if(target instanceof Element&&root.contains(target)&&target.closest('button,a,img')&&!target.closest('input,textarea,[contenteditable="true"]'))event.preventDefault();
 };
 const visibility=()=>{if(document.hidden)abandon();};
 document.addEventListener('pointerdown',down,true);
 document.addEventListener('pointermove',move,true);
 document.addEventListener('pointerup',up,true);
 document.addEventListener('pointercancel',cancelled,true);
 document.addEventListener('click',click,true);
 document.addEventListener('contextmenu',context);
 document.addEventListener('scroll',cancel,true);
 document.addEventListener('visibilitychange',visibility);
 window.addEventListener('blur',abandon);
 return()=>{
  abandon();document.removeEventListener('pointerdown',down,true);document.removeEventListener('pointermove',move,true);document.removeEventListener('pointerup',up,true);document.removeEventListener('pointercancel',cancelled,true);document.removeEventListener('click',click,true);document.removeEventListener('contextmenu',context);document.removeEventListener('scroll',cancel,true);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',abandon);
 };
}
