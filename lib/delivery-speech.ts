import {items,stopNames,type ItemId,type StopId} from '../games/delivery/model.ts';

export function cargoSpeechKeys(cargo:readonly string[]):string[]{
 if(cargo.length<1||cargo.length>2||cargo.some(id=>!items.some(item=>item.id===id)))return [];
 return ['segment_cargo_intro',...cargo.flatMap((id,i)=>i?['segment_and',`segment_item_${id as ItemId}`]:[`segment_item_${id}`])];
}
export function routeSpeechKeys(stops:readonly string[]):string[]{
 if(stops.length<1||stops.length>2||stops.some(id=>!Object.hasOwn(stopNames,id)))return [];
 return stops.flatMap((id,i)=>[i?'segment_next':'segment_first',`segment_stop_${id as StopId}`]);
}

export function orderSpeechKeys(cargo:readonly string[],stops:readonly string[]):string[]{
 const goods=cargoSpeechKeys(cargo),route=routeSpeechKeys(stops);
 return goods.length&&route.length?[...goods,...route]:[];
}

type PCMClip=Pick<AudioBuffer,'sampleRate'|'length'|'numberOfChannels'|'getChannelData'>;

// Decode once at the entry gate, then assemble one local WAV per utterance.
// One audio.play() preserves the existing iPad gesture-unlock path, without
// asynchronous per-fragment autoplay or requests during a sentence.
export function joinSpeechWav(clips:readonly PCMClip[]):Uint8Array<ArrayBuffer>{
 if(!clips.length)throw Error('Missing speech fragments');
 const rate=clips[0].sampleRate,gap=Math.round(rate*.06),padding=Math.round(rate*.04);
 const segments=clips.map(clip=>{
  if(clip.sampleRate!==rate||!clip.length||!clip.numberOfChannels)throw Error('Invalid speech fragment');
  const mono=new Float32Array(clip.length);
  for(let channel=0;channel<clip.numberOfChannels;channel++){
   const samples=clip.getChannelData(channel);
   for(let i=0;i<clip.length;i++)mono[i]+=samples[i]/clip.numberOfChannels;
  }
  let first=0,last=mono.length-1;
  while(first<mono.length&&Math.abs(mono[first])<.0005)first++;
  while(last>=first&&Math.abs(mono[last])<.0005)last--;
  if(first>last)throw Error('Silent speech fragment');
  return mono.subarray(Math.max(0,first-padding),Math.min(mono.length,last+padding+1));
 });
 const length=segments.reduce((sum,s)=>sum+s.length,0)+gap*(segments.length-1);
 const bytes=new Uint8Array(44+length*2),view=new DataView(bytes.buffer);
 const ascii=(offset:number,value:string)=>{for(let i=0;i<value.length;i++)bytes[offset+i]=value.charCodeAt(i);};
 ascii(0,'RIFF');view.setUint32(4,bytes.length-8,true);ascii(8,'WAVE');ascii(12,'fmt ');
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
 view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);
 ascii(36,'data');view.setUint32(40,length*2,true);
 let cursor=44;
 segments.forEach((samples,index)=>{
  for(const sample of samples){const bounded=Math.max(-1,Math.min(1,sample));view.setInt16(cursor,Math.round(bounded*(bounded<0?32768:32767)),true);cursor+=2;}
  if(index<segments.length-1)cursor+=gap*2;
 });
 return bytes;
}
