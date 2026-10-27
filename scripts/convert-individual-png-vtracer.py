from pathlib import Path
from PIL import Image
import shutil, zipfile, json, html, re
import cv2, numpy as np, vtracer

ROOT=Path.cwd(); BASE=ROOT/'assets'/'illustrations'/'individual'; PNG=BASE/'png'; CLEAN=BASE/'cleaned'; SVG=BASE/'svg'; SMOOTH=BASE/'svg-smooth'; TMP=Path.home()/'AppData'/'Local'/'Temp'
ZIP=Path.home()/'Downloads'/'儿童游戏_60款PNG透明素材_6列10行'/'individual_png.zip'
PNG.mkdir(parents=True,exist_ok=True); CLEAN.mkdir(parents=True,exist_ok=True); SVG.mkdir(parents=True,exist_ok=True); SMOOTH.mkdir(parents=True,exist_ok=True)
if not ZIP.exists(): raise FileNotFoundError(ZIP)
with zipfile.ZipFile(ZIP) as z:
  for n in z.namelist():
    if n.lower().endswith('.png'):
      dest=PNG/Path(n).name
      if not dest.exists(): dest.write_bytes(z.read(n))
files=sorted(PNG.glob('*.png'))
if len(files)!=60: raise RuntimeError(f'Expected 60 PNGs, found {len(files)}')

def category(n):
  i=int(n.split('_',1)[0])
  if i<=18:return '车辆'
  if i<=30:return '货物与施工道具'
  if i<=36:return '建筑地点'
  if i<=48:return '植物天气'
  if i<=54:return '道路'
  return '道路与施工道具'

def human_name(stem):
  return re.sub(r'^\d+_','',stem).replace('-',' ').replace('_',' ')
cn_names={
 '01_fire-truck.png':'消防车','02_ambulance.png':'救护车','03_police-car.png':'警车','04_bus.png':'公交车','05_cargo-truck.png':'货车','06_delivery-truck.png':'快递车','07_excavator.png':'挖掘机','08_crane-truck.png':'吊车','09_cement-mixer.png':'搅拌车','10_road-roller.png':'压路机','11_tow-truck.png':'拖车','12_garbage-truck.png':'垃圾车','13_dump-truck.png':'自卸车','14_tipper-truck.png':'翻斗车','15_forklift.png':'叉车','16_tractor.png':'拖拉机','17_fuel-tanker.png':'油罐车','18_street-sweeper.png':'清扫车',
 '19_wheel.png':'轮胎','20_toolbox.png':'工具箱','21_hose.png':'水管','22_bucket.png':'水桶','23_hard-hat.png':'安全帽','24_traffic-cone.png':'路锥','25_wood-planks.png':'木板','26_wooden-crate.png':'木箱','27_parcel.png':'包裹','28_fuel-can.png':'燃料桶','29_ladder.png':'梯子','30_construction-barrier.png':'施工栏',
 '31_warehouse.png':'仓库','32_fire-station.png':'消防站','33_construction-site.png':'工地','34_shop.png':'商店','35_hospital.png':'医院','36_factory.png':'工厂','37_round-tree.png':'圆树','38_tall-tree.png':'高树','39_pine-tree.png':'松树','40_round-bush.png':'圆灌木','41_flower-bush.png':'花丛','42_small-hill-bush.png':'小山和灌木','43_cloud.png':'云朵','44_double-cloud.png':'双朵云','45_layered-cloud.png':'层叠云','46_grass-hill.png':'草坡','47_green-hills.png':'绿色山丘','48_rocks.png':'岩石',
 '49_straight-road.png':'直路','50_curve-road.png':'弯路','51_t-junction.png':'丁字路口','52_crossroads.png':'十字路口','53_roundabout.png':'环岛','54_parking-lot.png':'停车标识（已去字）','55_white-fence.png':'白色栅栏','56_wood-fence.png':'木栅栏','57_green-mesh-fence.png':'绿色网格围栏','58_road-barrier.png':'道路护栏','59_chevron-sign.png':'箭头指示牌','60_streetlamp.png':'路灯'
}
assets=[]
for n,src in enumerate(files,1):
  img=Image.open(src).convert('RGBA')
  if img.size!=(320,220): print(f'Note: {src.name} size {img.size}')
  # Remove the visible P in the parking sign by inpainting only its glyph. Original PNG is retained untouched.
  working=img.copy()
  if src.name.startswith('54_'):
    rgba=np.array(working); rgb=cv2.cvtColor(rgba[:,:,:3],cv2.COLOR_RGB2BGR)
    region=rgb[82:146,62:114]
    mask=np.zeros(region.shape[:2],np.uint8)
    white=(cv2.cvtColor(region,cv2.COLOR_BGR2GRAY)>205)
    # Mask the P strokes but leave nearby vertical parking bay markings intact.
    mask[:, :48]=white[:,:48].astype(np.uint8)*255
    mask=cv2.dilate(mask,np.ones((3,3),np.uint8),iterations=1)
    rgb[82:146,62:114]=cv2.inpaint(region,mask,3,cv2.INPAINT_TELEA)
    rgba[:,:,:3]=cv2.cvtColor(rgb,cv2.COLOR_BGR2RGB)
    working=Image.fromarray(rgba).copy()
    working.save(CLEAN/src.name)
  # VTracer's installed Windows binding fails on partial-alpha RGBA. Quantize antialias alpha for tracing;
  # preserve the original transparent PNG and keep empty background transparent in the SVG.
  pix=working.load()
  for y in range(working.height):
    for x in range(working.width):
      r,g,b,a=pix[x,y]
      pix[x,y]=(r,g,b,255) if a>=72 else (0,0,0,0)
  safe=TMP/f'carplay-vt-{src.stem}.png'; target=TMP/f'carplay-vt-{src.stem}.svg'
  working.save(safe)
  vtracer.convert_image_to_svg_py(str(safe),str(target))
  output=SVG/f'{src.stem}.svg';shutil.copy2(target,output);target.unlink(missing_ok=True)
  # Smoother preset: discard more tiny patches and merge nearby colors, ask for smoother spline corners,
  # simplify longer segments, and write fewer decimal places. Positional args avoid a bug in this Windows binding's kwargs path.
  smooth_target=TMP/f'carplay-vt-smooth-{src.stem}.svg'
  vtracer.convert_image_to_svg_py(str(safe),str(smooth_target),None,None,'spline',8,5,24,90,5.5,10,45,2)
  smooth_output=SMOOTH/f'{src.stem}.svg';shutil.copy2(smooth_target,smooth_output);smooth_target.unlink(missing_ok=True)
  safe.unlink(missing_ok=True)
  # Preserve SVG intrinsic dimensions and record source info.
  vector=output.read_text(encoding='utf-8'); smooth_vector=smooth_output.read_text(encoding='utf-8')
  if '<svg' not in vector or '<image' in vector or '<svg' not in smooth_vector or '<image' in smooth_vector:raise RuntimeError(f'Unexpected non-vector output: {output.name}')
  assets.append({'name':src.stem,'title':cn_names.get(src.name,human_name(src.stem)),'category':category(src.name),'png':f'png/{src.name}','svg':f'svg/{output.name}','smoothSvg':f'svg-smooth/{smooth_output.name}','width':img.width,'height':img.height,'textRemoved':src.name.startswith('54_')})
  if n%10==0:print(f'Converted {n}/60',flush=True)

order=['车辆','货物与施工道具','建筑地点','植物天气','道路','道路与施工道具']
parts=[]
for cat in order:
  items=[a for a in assets if a['category']==cat]
  cards=''.join(f'<article class="card"><h3>{html.escape(a["title"])}</h3><div class="compare"><figure><img src="{html.escape(a["png"])}"><figcaption>原始 PNG</figcaption></figure><figure><img src="{html.escape(a["svg"])}"><figcaption>标准版</figcaption></figure><figure><img src="{html.escape(a["smoothSvg"])}"><figcaption>平滑版</figcaption></figure></div><code>{html.escape(a["name"])}</code></article>' for a in items)
  parts.append(f'<section><h2>{cat} <small>{len(items)} 件</small></h2><div class="grid">{cards}</div></section>')
page='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>60 款素材 SVG 平滑对比</title><style>*{box-sizing:border-box}body{margin:0;background:#f8f6ed;color:#304f45;font:15px system-ui,sans-serif}.wrap{max-width:1500px;margin:auto;padding:24px}h1{font-size:34px;margin-bottom:6px}p,small,figcaption{color:#75887a}section{margin:32px 0}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(390px,1fr));gap:12px}.card{padding:12px;background:#fffdf6;border:1px solid #e0e6d9;border-radius:17px}.card h3{margin:0 0 9px;font-size:16px;text-transform:capitalize}.compare{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.compare figure{margin:0;min-width:0}.compare img{display:block;width:100%;height:150px;object-fit:contain;background-color:#fff;border:1px solid #e5e8df;border-radius:10px;background-image:linear-gradient(45deg,#eef0e9 25%,transparent 25%),linear-gradient(-45deg,#eef0e9 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eef0e9 75%),linear-gradient(-45deg,transparent 75%,#eef0e9 75%);background-size:18px 18px;background-position:0 0,0 9px,9px -9px,-9px 0}figcaption{text-align:center;font-size:12px;padding:4px}code{display:block;font-size:11px;color:#8b9b8c;word-break:break-all;margin-top:6px}@media(max-width:600px){.wrap{padding:14px}.grid{grid-template-columns:1fr;gap:8px}.card{padding:8px}.compare img{height:118px}}</style></head><body><main class="wrap"><h1>60 款素材：原图 / 标准版 / 平滑版</h1><p>平滑版提高拐角平滑阈值、加大微小色块过滤、合并接近颜色并简化路径。SVG 是独立矢量路径；54 号停车牌的字母只在转换结果中去掉，原 PNG 仍保留。</p>'''+''.join(parts)+'''</main></body></html>'''
(BASE/'preview.html').write_text(page,encoding='utf-8')
(BASE/'manifest.json').write_text(json.dumps({'tool':'vtracer Python 0.6.15','count':len(assets),'assets':assets},ensure_ascii=False,indent=2),encoding='utf-8')
with zipfile.ZipFile(BASE/'svg-smooth.zip','w',compression=zipfile.ZIP_DEFLATED) as archive:
  for file in sorted(SMOOTH.glob('*.svg')):archive.write(file,arcname=file.name)
print(f'Finished: {len(assets)} standard + {len(assets)} smooth SVGs; packaged smooth set as svg-smooth.zip.')

