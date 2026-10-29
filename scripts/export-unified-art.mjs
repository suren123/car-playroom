import {mkdir,readFile,writeFile,copyFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const source='assets/illustrations/unified-v3',out='public/assets/illustrations/unified-v3';
const {assets}=JSON.parse(await readFile(`${source}/generation.json`,'utf8'));
await mkdir(`${source}/originals`,{recursive:true});await mkdir(out,{recursive:true});
const manifest=[];
for(const asset of assets){
 const file=`${asset.id}.png`,original=`${source}/originals/${file}`;
 try{await stat(original);}catch{await copyFile(asset.generatedFile,original);}
 const bytes=await readFile(original),{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,top=info.height,right=0,bottom=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>2){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
 if(right<=left||bottom<=top)throw Error(`Empty artwork: ${file}`);
 const pad=8;left=Math.max(0,left-pad);top=Math.max(0,top-pad);right=Math.min(info.width,right+pad);bottom=Math.min(info.height,bottom+pad);
 const limit=asset.id.startsWith('cargo-')?384:768;
 const output=await sharp(bytes).extract({left,top,width:right-left,height:bottom-top}).resize({width:limit-8,height:limit-8,fit:'inside',withoutEnlargement:true}).extend({top:4,bottom:4,left:4,right:4,background:{r:0,g:0,b:0,alpha:0}}).png({compressionLevel:9,palette:true,colours:256,dither:0}).toBuffer();
 await writeFile(`${out}/${file}`,output);const metadata=await sharp(output).metadata();
 manifest.push({id:asset.id,file,url:`/assets/illustrations/unified-v3/${file}`,source:`${source}/originals/${file}`,sourceSize:[info.width,info.height],crop:[left,top,right,bottom],size:[metadata.width,metadata.height],bytes:output.length,sourceSha256:createHash('sha256').update(bytes).digest('hex'),sha256:createHash('sha256').update(output).digest('hex')});
}
await writeFile(`${source}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
console.log(`Exported ${manifest.length} sprites: ${manifest.reduce((n,a)=>n+a.bytes,0)} bytes; originals retained.`);
