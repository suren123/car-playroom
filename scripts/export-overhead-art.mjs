import sharp from 'sharp';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const generated='C:/Users/Haoran/.codex/generated_images/01a17d9a-eef2-7312-abb5-11118fdfdc49';
const source='assets/illustrations/overhead-v4',output='public/assets/illustrations/overhead-v4';
const files={fire:'3fc263fb-77b1-422d-9e87-e554283af723',bus:'be3d3b8e-1128-4418-9bc4-dff8a4fedc2c',digger:'791475b2-e91b-4285-a308-9f92c62c4320',ambulance:'a8d58e5b-4dd1-4c9a-b3a5-8144593fb8bc',truck:'8574840c-0552-40f0-92c9-c4885d4ae773',crane:'c2526fe1-c9d6-4c73-b843-5f7a54d8046e',police:'8bbd8f69-31f6-418c-b694-500771f37893',delivery:'60250dfa-ab29-4fc4-a65f-cded6909813a',mixer:'4d981e3e-b2d3-4cae-b5fb-3cc36d2f1bed',roller:'705ed229-2871-4f52-a4f5-88ed354904cc',tow:'45544c93-a14e-41da-8faa-123350d1e934',garbage:'395cbe96-4f13-4b8e-a22b-e6bbf9e5ccc7'};
await mkdir(source,{recursive:true});await mkdir(output,{recursive:true});const entries=[];
for(const [name,file] of Object.entries(files)){
 await copyFile(join(generated,`exec-${file}.png`),join(source,`${name}-source.png`));
 const image=sharp(join(source,`${name}-source.png`)),meta=await image.metadata();
 if(!meta.hasAlpha)throw Error(`${name}: missing transparency`);
 const {data,info}=await image.ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(data[3]!==0||data[(info.width-1)*4+3]!==0)throw Error(`${name}: opaque image corners`);
 const result=await sharp(join(source,`${name}-source.png`)).resize({width:384,height:256,fit:'inside',withoutEnlargement:true}).png({compressionLevel:9}).toFile(join(output,`${name}.png`));
 entries.push({id:`overhead-${name}`,vehicle:name,source:`${source}/${name}-source.png`,runtime:`${output}/${name}.png`,width:result.width,height:result.height,bytes:result.size,view:'overhead, front right',generator:'built-in imagegen'});
}
await writeFile(join(source,'manifest.json'),JSON.stringify(entries,null,2)+'\n');
console.log(`Exported ${entries.length} transparent views, ${entries.reduce((n,e)=>n+e.bytes,0)} runtime bytes.`);
