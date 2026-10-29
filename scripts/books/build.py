"""Rebuild a self-contained ebook and matching online assets from one template."""
import base64, json, sys, shutil, argparse, hashlib, html
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'python_lib'))
import fitz
import qrcode
from PIL import Image, ImageDraw

IN_SITE=ROOT.parent.name=='scripts'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--site-dir',type=Path)
parser.add_argument('--output-dir',type=Path)
parser.add_argument('--pdf',type=Path)
args=parser.parse_args()
SITE=(args.site_dir or (ROOT.parents[1] if IN_SITE else ROOT.parent.parent/'car-playroom')).resolve()
OUT=(args.output_dir or (SITE/'outputs'/'rice-book' if IN_SITE else ROOT.parent)).resolve()
WEB=SITE/'public'/'books'
PDF=args.pdf or Path(r'D:/Program Files/wechat/xwechat_files/suren__123_e874/msg/file/2026-10/水稻研学手册_幼儿园绘本版.pdf')
AUDIO=WEB/'audio' if IN_SITE else ROOT/'audio'
URL='https://haoran.awarejam67.chatgpt.site/books/rice.html'

def datauri(path,mime):
    return 'data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode('ascii')

def main():
    WEB.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
    assets=WEB/'images' if IN_SITE else ROOT/'images'; assets.mkdir(exist_ok=True)
    if PDF.is_file():
        doc=fitz.open(PDF)
        for i,page in enumerate(doc):
            page.get_pixmap(matrix=fitz.Matrix(1.6,1.6),alpha=False).pil_save(str(assets/f'original{i}.jpg'),quality=85)
        doc[0].get_pixmap(matrix=fitz.Matrix(2,2),clip=fitz.Rect(74,136,531,575),alpha=False).pil_save(str(assets/'hero.jpg'),quality=91)
        # Reuse the original botanical illustration and close-ups from page 2.
        source_crops={
            'plant':(1,(73,133,530,425)),
            'part-ear':(1,(80,480,288,575)),
            'part-stem':(1,(380,463,444,586)),
            'part-leaf':(1,(81,642,264,773)),
            'part-root':(1,(344,660,485,750)),
            'grain-rice':(3,(129,184,276,330)),
            'grain-millet':(3,(329,392,476,537)),
            'grain-corn':(3,(330,596,476,738)),
            'paddy':(3,(329,186,476,331)),
        }
        for name,(page,box) in source_crops.items():
            doc[page].get_pixmap(matrix=fitz.Matrix(2.5,2.5),clip=fitz.Rect(*box),alpha=False).pil_save(str(assets/f'{name}.jpg'),quality=91)
        clips=[(180,214,220,330),(385,214,425,330),(180,415,220,532),(385,415,425,532),(180,620,220,735),(385,620,425,735)]
        for i,box in enumerate(clips):
            doc[2].get_pixmap(matrix=fitz.Matrix(3,3),clip=fitz.Rect(*box),alpha=False).pil_save(str(assets/f'stage{i}.jpg'),quality=90)
        doc.close()
    elif not (assets/'hero.jpg').exists():
        raise FileNotFoundError('Pass --pdf or retain public/books/images from the repository')
    content=json.loads((ROOT/'content.json').read_text(encoding='utf-8'))
    audio_manifest=json.loads((ROOT/'audio-manifest.json').read_text(encoding='utf-8'))
    timings={}
    for key in content:
        p=AUDIO/f'{key}.mp3'
        if not p.exists() or p.stat().st_size<1000: raise ValueError('Missing audio '+key)
        entry=audio_manifest.get(key,{})
        if entry.get('text')!=content[key] or not entry.get('words') or entry.get('audio_sha256')!=hashlib.sha256(p.read_bytes()).hexdigest():
            raise ValueError('Missing or mismatched word timings '+key)
        timings[key]=entry['words']
    asset_paths={p.stem:p for p in assets.glob('*.jpg') if not p.stem.endswith('-hd')}
    hd_assets=WEB/'images' if IN_SITE else ROOT/'高清插图'
    food_keys=['grain-rice','grain-millet','grain-sorghum','grain-soybean','grain-wheat','grain-corn','paddy','cooked-rice']
    for key in [*(f'stage{i}' for i in range(6)),*food_keys]:
        candidates=[hd_assets/f'{key}-hd.jpg',hd_assets/'网页用图'/f'{key}-hd.jpg',hd_assets/f'{key}-hd.png']
        hd=next((p for p in candidates if p.exists()),None)
        if hd:asset_paths[key]=hd
        elif key in food_keys:raise ValueError('Missing illustrated food asset '+key)
    embedded_assets={key:datauri(p,'image/png' if p.suffix=='.png' else 'image/jpeg') for key,p in asset_paths.items()}
    embedded_clips={key:datauri(AUDIO/f'{key}.mp3','audio/mpeg') for key in content}
    template=(ROOT/'book.html').read_text(encoding='utf-8').replace('__WORD_HIGHLIGHTING__',(ROOT/'word-highlighting.js').read_text(encoding='utf-8'))
    for placeholder,name in [('__PLAYBACK__','playback.js'),('__READER_UTILS__','reader-utils.js'),('__READER_CSS__','reader-polish.css')]:template=template.replace(placeholder,(ROOT/name).read_text(encoding='utf-8'))
    def render(a,c,meta):
        return template.replace('__ASSETS__',json.dumps(a,ensure_ascii=False)).replace('__CLIPS__',json.dumps(c,ensure_ascii=False)).replace('__TEXT__',json.dumps(content,ensure_ascii=False)).replace('__TIMINGS__',json.dumps(timings,ensure_ascii=False)).replace('__WEB_META__',meta)
    icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#e6ebd0"/><path d="M28 55L35 12" stroke="#54734c" stroke-width="3"/><g fill="#cba14b"><ellipse cx="28" cy="18" rx="5" ry="9"/><ellipse cx="40" cy="28" rx="5" ry="9"/><ellipse cx="25" cy="36" rx="5" ry="9"/></g></svg>'
    icon_meta='<link rel="icon" href="data:image/svg+xml;base64,'+base64.b64encode(icon.encode()).decode()+'">'
    (OUT/'index.html').write_text(render(embedded_assets,embedded_clips,icon_meta),encoding='utf-8')
    (WEB/'images').mkdir(exist_ok=True);(WEB/'audio').mkdir(exist_ok=True)
    for p in asset_paths.values():
        if p.resolve()!=(WEB/'images'/p.name).resolve():shutil.copy2(p,WEB/'images'/p.name)
    for p in AUDIO.glob('*.mp3'):
        if p.resolve()!=(WEB/'audio'/p.name).resolve():shutil.copy2(p,WEB/'audio'/p.name)
    online_assets={key:'./images/'+p.name+'?v='+hashlib.sha256(p.read_bytes()).hexdigest()[:12] for key,p in asset_paths.items()}
    online_clips={key:'./audio/'+key+'.mp3?v='+hashlib.sha256((AUDIO/f'{key}.mp3').read_bytes()).hexdigest()[:12] for key in content}
    meta='<link rel="manifest" href="/books/rice.webmanifest"><link rel="apple-touch-icon" href="/books/icon-180.png"><link rel="icon" href="/books/icon-180.png">'
    (WEB/'rice.html').write_text(render(online_assets,online_clips,meta),encoding='utf-8')
    shutil.copy2(OUT/'index.html',WEB/'rice-offline.html')
    for size in [180,512]:
        im=Image.new('RGB',(size,size),'#f4efd9'); d=ImageDraw.Draw(im)
        def pt(x,y):return (int(x*size/180),int(y*size/180))
        d.rounded_rectangle([pt(10,10),pt(170,170)],radius=int(size*.18),fill='#e6ebd0')
        d.line([pt(78,151),pt(96,33)],fill='#587849',width=max(2,int(size*.025)))
        d.polygon([pt(84,130),pt(40,78),pt(70,90)],fill='#789650')
        d.polygon([pt(86,117),pt(139,63),pt(119,108)],fill='#6d8a46')
        for j in range(5):
            y=30+j*19
            d.ellipse([pt(76,y),pt(92,y+24)],fill='#cba14b')
            d.ellipse([pt(98,y+8),pt(114,y+32)],fill='#d7b558')
        im.save(WEB/f'icon-{size}.png')
    manifest={'id':'/books/rice.html','name':'稻田里的小秘密','short_name':'水稻绘本','lang':'zh-CN','start_url':'/books/rice.html','scope':'/books/','display':'standalone','background_color':'#f2f0e6','theme_color':'#f7f4eb','icons':[{'src':'/books/icon-180.png','sizes':'180x180','type':'image/png'},{'src':'/books/icon-512.png','sizes':'512x512','type':'image/png','purpose':'any maskable'}]}
    (WEB/'rice.webmanifest').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    qr=qrcode.QRCode(version=None,error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=10,border=4);qr.add_data(URL);qr.make(fit=True)
    qr.make_image(fill_color='#314d3c',back_color='#ffffff').save(OUT/'iPad扫码阅读.png')
    shutil.copy2(OUT/'iPad扫码阅读.png',WEB/'rice-qr.png')
    books=json.loads((ROOT/'books.json').read_text(encoding='utf-8'))
    esc=lambda value:html.escape(str(value),quote=True)
    cards=[];help_blocks=[]
    for book in books:
        title,url,cover=map(esc,[book['title'],book['url'],book['cover']])
        cover_path=SITE/'public'/book['cover'].lstrip('/')
        if cover_path.exists():cover+='?v='+hashlib.sha256(cover_path.read_bytes()).hexdigest()[:12]
        key=esc(book['storageKey']);chapters=esc(json.dumps(book['chapters'],ensure_ascii=False))
        cards.append(f'<article class="book-entry" data-storage-key="{key}" data-chapters="{chapters}"><div class="cover-unit"><a class="cover-link" href="{url}" aria-label="阅读{title}"><div class="cover"><small>小小自然观察家</small><h2>{title}</h2><img src="{cover}" alt="{esc(book["coverAlt"])}" width="220" height="215" decoding="async"><div class="edition">一本可以听、可以玩的绘本</div></div></a><div class="plank" aria-hidden="true"></div></div><div class="book-caption"><span class="book-meta">{esc(book["category"])} · {esc(book["pages"])} 页</span><h3>{title}</h3><p>{esc(book["subtitle"])}</p><div class="features"><span>▷ 听故事</span><span>⤢ 看大图</span><span>✿ 玩一玩</span></div><p class="reading-position" hidden></p><a class="read" href="{url}">开始阅读 →</a><a class="start-over" href="{url}?start=1" hidden>从第一页开始</a></div></article>')
        help_blocks.append(f'<div class="help-content"><img class="qr" src="{esc(book["qr"])}" alt="扫描打开{title}" width="140" height="140" loading="lazy"><div><h3>把绘本放进 iPad</h3><ol class="steps"><li>用相机扫码，或将绘本链接发给自己。</li><li>在 Safari 中打开，按提示登录有访问权限的账号。</li><li>点击播放按钮，跟着声音一起读。</li><li>分享 → 添加到主屏幕，下次直接点图标。</li></ol><p>从书架添加会进入书架；从绘本添加会直接进入这本书。在线阅读需要联网，电脑无需开机。</p><a class="download" href="{esc(book["download"])}" download="{title}.html">下载这本书 · 电脑离线版</a><p>下载文件适合电脑浏览器打开；iPad 请使用网站链接。</p></div></div>')
    shelf=(ROOT/'shelf.html').read_text(encoding='utf-8').replace('__BOOK_CARDS__',''.join(cards)).replace('__BOOK_HELP__',''.join(help_blocks))
    (WEB/'index.html').write_text(shelf,encoding='utf-8')
    for size in [180,512]:
        im=Image.new('RGB',(size,size),'#f4f1e7');d=ImageDraw.Draw(im)
        k=size/180
        box=lambda coords:tuple(round(v*k) for v in coords)
        for x,y,w,h,color in [(38,42,29,94,'#6c855b'),(73,31,31,105,'#c5a664'),(110,53,28,83,'#9daf87')]:
            d.rounded_rectangle(box((x,y,x+w,y+h)),radius=round(4*k),fill=color)
            d.line(box((x+7,y+12,x+w-7,y+12)),fill='#f4f1e7',width=max(1,round(2*k)))
        d.rounded_rectangle(box((25,137,155,148)),radius=round(3*k),fill='#b99464')
        im.save(WEB/f'shelf-icon-{size}.png')
    shelf_manifest={**manifest,'id':'/books','name':'小小绘本书架','short_name':'绘本书架','start_url':'/books','icons':[{'src':f'/books/shelf-icon-{size}.png','sizes':f'{size}x{size}','type':'image/png'} for size in [180,512]]}
    (WEB/'shelf.webmanifest').write_text(json.dumps(shelf_manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    # Retain maintainable inputs in the site's source repository as well.
    src=SITE/'scripts'/'books';src.mkdir(parents=True,exist_ok=True)
    for name in ['book.html','content.json','generate_audio.py','build.py','audio-manifest.json','word-highlighting.js','shelf.html','books.json','playback.js','reader-utils.js','reader-polish.css']:
        if (ROOT/name).exists() and (ROOT/name).resolve()!=(src/name).resolve():shutil.copy2(ROOT/name,src/name)
    print(json.dumps({'offline_bytes':(OUT/'index.html').stat().st_size,'online_bytes':(WEB/'rice.html').stat().st_size,'audio_clips':len(content),'image_count':len(embedded_assets),'url':URL},ensure_ascii=False))

if __name__=='__main__':main()
