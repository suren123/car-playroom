import sharp from 'sharp';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const generated='C:/Users/Haoran/.codex/generated_images/01a17d9a-eef2-7312-abb5-11118fdfdc49';
const source='assets/illustrations/workshop-v4',output='public/assets/illustrations/workshop-v4';
const files={pedestrian:'exec-1aaf427b-e539-4443-8062-e05ac29da3ce.png',wrench:'exec-33c2812c-3d3e-4f3d-9f2c-46f1aa33e760.png',cloth:'exec-ec8957be-9044-4ee5-a6dc-e6ee6cad29ae.png',screwdriver:'exec-fb7ef7da-e05a-4b70-ba44-304ad069631f.png'};
await mkdir(source,{recursive:true});await mkdir(output,{recursive:true});
const entries=[];
for(const [name,file] of Object.entries(files)){
 await copyFile(join(generated,file),join(source,`${name}-source.png`));
 const info=await sharp(join(source,`${name}-source.png`)).metadata();
 if(!info.hasAlpha)throw Error(`${name}: missing alpha`);
 await sharp(join(source,`${name}-source.png`)).resize({width:384,height:384,fit:'inside',withoutEnlargement:true}).png({compressionLevel:9}).toFile(join(output,`${name}.png`));
 entries.push({id:name==='pedestrian'?name:`tool-${name}`,source:`${source}/${name}-source.png`,runtime:`${output}/${name}.png`,generator:'built-in imagegen',reference:'public/assets/illustrations/unified-v3/fire.png',export:'Resize only; preserve generated alpha; no redraw or background replacement'});
}
await writeFile(join(source,'manifest.json'),JSON.stringify(entries,null,2)+'\n');
