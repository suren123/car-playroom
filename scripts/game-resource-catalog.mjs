import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {illustrationUrl,vehicleIllustration,cargoIllustration,destinationIllustration} from '../games/illustration-assets.ts';
import {gameIds} from '../games/registry.ts';
import {normalizeSpeechText as normalize} from '../lib/speech-text.ts';

export function buildGameResources(){
 const voices=JSON.parse(readFileSync('lib/audio-manifest.json','utf8'));
 const delivery=JSON.parse(readFileSync('lib/delivery-voice.json','utf8'));
 const byText=new Map(Object.values(voices).map(c=>[normalize(c.text),`/audio/${c.file}`]));
 for(const c of Object.values(delivery))byText.set(normalize(c.text),c.file);
 const common=['continue','continue-here','generic','demo','hint-look','hint-light','hint-demo','help','pause','finished'];
 const extra={traffic:['red-light','green-light','road-error-1','road-error-2'],queue:['road-error-1','road-error-2'],listen:['road-error-1','road-error-2'],detour:['road-error-1','road-error-2'],repair:['retry-repair','garage-finished'],bridge:['retry-bridge','hint-bridge','garage-finished']};
 const pictures={sudoku:['fire','bus','digger','truck'],difference:['fire','ambulance','bus','truck','digger','crane'],delivery:[...Object.values(vehicleIllustration),...Object.values(cargoIllustration),...Object.values(destinationIllustration),'warehouse','roundTree','pineTree','cloud','doubleCloud','roundBush']};
 const assets={},games={};
 for(const game of gameIds){
  const urls=new Set(['/audio/effects.wav',delivery.sound_retry.file]);
  if(game==='delivery')for(const c of Object.values(delivery))urls.add(c.file);
  else for(const id of [...common,...Object.keys(voices).filter(id=>id.startsWith(`${game}-`)),...(extra[game]??[])]){
   if(!voices[id])throw Error(`Unknown voice: ${id}`);
   urls.add(byText.get(normalize(voices[id].text)));
  }
  for(const id of pictures[game]??[])urls.add(illustrationUrl(id));
  games[game]=[...urls].sort();
  for(const url of games[game])if(!assets[url]){
   const data=readFileSync(`public${url}`);
   assets[url]={url,kind:url.endsWith('.png')?'image':url.endsWith('.wav')?'effect':'voice',bytes:data.length,revision:createHash('sha256').update(data).digest('hex')};
  }
 }
 return {assets,games};
}
