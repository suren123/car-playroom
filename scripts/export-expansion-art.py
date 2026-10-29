"""Export generated alpha sprites at runtime sizes; never synthesize artwork.

Built-in image_gen supplies sources. This utility only trims transparent margins,
resizes proportionally, compresses PNGs, and produces inspection contact sheets.
"""
from pathlib import Path
import hashlib,json,subprocess,sys
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'assets/illustrations/expansion-v5'
OUT=ROOT/'public/assets/illustrations/expansion-v5'
ids=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {expansionArtIds} from './games/expansion-catalog.ts';console.log(JSON.stringify(expansionArtIds))"],cwd=ROOT,text=True))
partial='--partial' in sys.argv
OUT.mkdir(parents=True,exist_ok=True)
manifest=[]
for id in ids:
    src=BASE/'sources'/f'{id}.png'
    if not src.exists():
        if partial:continue
        raise RuntimeError(f'Missing generated source {id}')
    original=Image.open(src)
    assert original.mode=='RGBA',(id,'true alpha required',original.mode)
    alpha=original.getchannel('A')
    low,high=alpha.getextrema()
    assert low==0 and high>=250,(id,'missing transparent or solid subject pixels')
    bbox=alpha.point(lambda p:255 if p>8 else 0).getbbox()
    assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<original.width and bbox[3]<original.height,(id,'subject touches source edge')
    cropped=original.crop(bbox)
    limit=384 if id.startswith('overhead-') else 320 if id.startswith('cargo-') else 512
    cropped.thumbnail((limit-16,limit-16),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(cropped.width+16,cropped.height+16));canvas.alpha_composite(cropped,(8,8))
    # Compact indexed PNG retains an alpha palette; original RGBA stays lossless.
    target=OUT/f'{id}.png';canvas.quantize(colors=256,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(target,optimize=True)
    data=target.read_bytes()
    manifest.append({'id':id,'source':f'sources/{id}.png','url':f'/assets/illustrations/expansion-v5/{id}.png','width':canvas.width,'height':canvas.height,'sourceSize':list(original.size),'sourceBounds':bbox,'bytes':len(data),'revision':hashlib.sha256(data).hexdigest()})
(BASE/'manifest.json').write_text(json.dumps({'generator':'built-in image_gen','version':'expansion-v5','assets':manifest},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
try:font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)
except OSError:font=ImageFont.load_default()
for start in range(0,len(manifest),14):
    batch=manifest[start:start+14];sheet=Image.new('RGB',(1000,((len(batch)+3)//4)*190),(250,248,239));draw=ImageDraw.Draw(sheet)
    for i,item in enumerate(batch):
        x=(i%4)*250;y=(i//4)*190
        bg=[(250,248,239),(225,238,218),(37,55,63)][i%3]
        draw.rectangle((x,y,x+249,y+158),fill=bg)
        im=Image.open(OUT/(item['id']+'.png')).convert('RGBA');im.thumbnail((225,140),Image.Resampling.LANCZOS)
        sheet.paste(im,(x+(250-im.width)//2,y+(158-im.height)//2),im)
        draw.text((x+8,y+165),item['id'],fill=(40,60,50),font=font)
    sheet.save(BASE/f'contact-sheet-{start//14+1}.jpg',quality=92)
print(json.dumps({'exported':len(manifest),'expected':len(ids),'runtimeBytes':sum(x['bytes'] for x in manifest)}))
