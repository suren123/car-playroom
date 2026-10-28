export type GameResource={url:string;kind:'image'|'voice'|'effect';bytes:number;revision:string};
export type ResourceProgress={loaded:number;total:number;ready:number;count:number;phase:'download'|'prepare'|'ready'|'failed'};
export type PreparedResource={src:string;image?:HTMLImageElement;audio?:AudioBuffer;release:()=>void};
type ResourceCache={match:(key:string)=>Promise<Response|undefined>;put:(key:string,response:Response)=>Promise<unknown>;delete:(key:string)=>Promise<unknown>};
export type ResourceDependencies={
 fetch:typeof fetch;
 cache:()=>Promise<ResourceCache|null>;
 verify:(data:ArrayBuffer,revision:string)=>Promise<boolean>;
 prepare:(item:GameResource,blob:Blob,signal:AbortSignal)=>Promise<PreparedResource>;
 timeoutMs?:number;
};
const aborted=()=>new DOMException('Resource preparation cancelled','AbortError');
export const resourceKey=(item:GameResource)=>`${item.url}?v=${item.revision}`;

// One owner per game entry. Successful items survive retries, but not disposal.
export class ResourceSession{
 readonly prepared=new Map<string,PreparedResource>();
 readonly items:GameResource[];
 private progress=new Map<string,number>();
 private controller:AbortController|null=null;
 private running:Promise<void>|null=null;
 private disposed=false;
 private deps:ResourceDependencies;
 constructor(items:GameResource[],deps:ResourceDependencies){this.items=[...new Map(items.map(x=>[x.url,x])).values()];this.deps=deps;}
 async load(report:(progress:ResourceProgress)=>void):Promise<void>{
  if(this.disposed)throw aborted();
  if(this.running)return this.running;
  const controller=new AbortController();this.controller=controller;
  const total=this.items.reduce((sum,x)=>sum+x.bytes,0);
  for(const item of this.items)this.progress.set(item.url,this.prepared.has(item.url)?item.bytes:0);
  const emit=(phase?:ResourceProgress['phase'])=>{
   if(controller.signal.aborted||this.disposed)return;
   const loaded=[...this.progress.values()].reduce((a,b)=>a+b,0);
   report({loaded,total,ready:this.prepared.size,count:this.items.length,phase:phase??(loaded>=total?'prepare':'download')});
  };
  const run=async()=>{
   emit();let cache:ResourceCache|null=null;
   try{cache=await this.deps.cache();}catch{/* Storage is optional. */}
   const queue=this.items.filter(item=>!this.prepared.has(item.url));let cursor=0;const errors:unknown[]=[];
   const worker=async()=>{
    while(cursor<queue.length&&!controller.signal.aborted){
     const item=queue[cursor++];
     try{
      const result=await this.loadItem(item,cache,controller.signal,bytes=>{this.progress.set(item.url,Math.min(bytes,item.bytes));emit();});
      if(controller.signal.aborted||this.disposed){result.release();throw aborted();}
      this.prepared.set(item.url,result);emit();
     }catch(error){errors.push(error);}
    }
   };
   await Promise.all(Array.from({length:Math.min(4,queue.length)},worker));
   if(controller.signal.aborted||this.disposed)throw aborted();
   if(errors.length){emit('failed');throw new Error('Some game resources could not be prepared');}
   emit('ready');
  };
  this.running=run();
  try{await this.running;}finally{this.running=null;if(this.controller===controller)this.controller=null;}
 }
 private async loadItem(item:GameResource,cache:ResourceCache|null,signal:AbortSignal,progress:(bytes:number)=>void){
  const key=resourceKey(item);let cached:Response|undefined;
  try{cached=await cache?.match(key);}catch{/* Continue without persistent cache. */}
  if(signal.aborted)throw aborted();
  if(cached){
   try{
    const data=await cached.arrayBuffer();
    if(data.byteLength!==item.bytes||!await this.deps.verify(data,item.revision))throw Error('Stale resource');
    if(signal.aborted)throw aborted();progress(item.bytes);
    return await this.deps.prepare(item,new Blob([data],{type:this.mime(item)}),signal);
   }catch(error){
    if(signal.aborted)throw error;
    try{await cache?.delete(key);}catch{}
    progress(0);
   }
  }
  const data=await this.download(item,signal,progress);
  if(data.byteLength!==item.bytes||!await this.deps.verify(data,item.revision))throw Error('Resource content does not match this version');
  if(signal.aborted)throw aborted();
  const blob=new Blob([data],{type:this.mime(item)}),prepared=await this.deps.prepare(item,blob,signal);
  if(signal.aborted){prepared.release();throw aborted();}
  // Cache only verified, decodable data. Cache failures never block entry.
  try{await cache?.put(key,new Response(blob));}catch{}
  return prepared;
 }
 private mime(item:GameResource){return item.kind==='image'?'image/png':item.kind==='effect'?'audio/wav':'audio/mpeg';}
 private async download(item:GameResource,signal:AbortSignal,progress:(bytes:number)=>void):Promise<ArrayBuffer>{
  const controller=new AbortController(),cancel=()=>controller.abort();signal.addEventListener('abort',cancel,{once:true});
  if(signal.aborted)cancel();
  let timer:ReturnType<typeof setTimeout>;
  const tick=()=>{clearTimeout(timer);timer=setTimeout(()=>controller.abort(),this.deps.timeoutMs??20000);};tick();
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  try{
   const response=await this.deps.fetch(resourceKey(item),{signal:controller.signal,cache:'no-cache',credentials:'same-origin'});
   if(!response.ok)throw Error(`Resource HTTP ${response.status}`);
   tick();reader=response.body?.getReader();
   if(!reader){const data=await response.arrayBuffer();progress(data.byteLength);return data;}
   const chunks:Uint8Array[]=[];let size=0;
   while(true){const {done,value}=await reader.read();if(done)break;if(value.length){chunks.push(value);size+=value.length;progress(size);tick();}if(size>item.bytes)throw Error('Unexpected resource size');}
   const data=new Uint8Array(size);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}return data.buffer;
  }finally{clearTimeout(timer!);signal.removeEventListener('abort',cancel);try{await reader?.cancel();}catch{}controller.abort();}
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.controller?.abort();for(const resource of this.prepared.values())resource.release();this.prepared.clear();this.progress.clear();}
}
