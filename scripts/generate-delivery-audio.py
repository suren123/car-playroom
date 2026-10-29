"""Generate fixed prompts and reusable Mandarin speech fragments for delivery."""
from __future__ import annotations
import asyncio
import json
import subprocess
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'audio' / 'delivery'
CLIPS = {
    'welcome': '小司机，欢迎来到汽车快递站。我们一起送货吧。',
    'demo': '先看订单，装好货物，开车送到目的地。',
    'choose_level': '和大人一起选一个小任务吧。',
    'choose_car': '选一辆喜欢的小车，准备出发。',
    'order_one': '看看订单，记住这件货物。',
    'order_two': '看看订单，记住这两件货物。',
    'ready': '看好了，就点记好了。',
    'load': '找一找，把订单里的货物装上车。',
    'loaded': '货物装好了，我们准备出发。',
    'depart': '小车出发啦，慢慢开。',
    'unload': '到站啦，把货物送到站里。',
    'remaining': '还有一件货物，想一想是什么。',
    'delivered': '货物送到啦，谢谢小司机。',
    'next': '准备好了，再送下一份。',
    'finished': '三份货物都送到了，小车回车库啦。',
    'wrong': '没关系，再看看订单。',
    'hint_one': '慢慢看看，可以请大人一起找。',
    'hint_two': '看看亮起来的地方。',
    'hint_demo': '看我示范一次，再一起试试。',
    'help': '有点难，找大人一起帮忙吧。',
    'pause': '小车停在这里，想继续时再出发。',
    'resume': '我们从这里继续，慢慢来。',
    'which_stop': '接下来去哪个站呢？',
    'wrong_route': '没关系，我们再想想路线。',
    'next_stop': '第一站到啦，再去下一站。',
    'look_again': '我们再看看订单。',
    'demonstrate': '看手指示范，再试试。',
    'sound_retry': '点一下，打开声音。',
}

catalog = json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import {items,stopNames} from './games/delivery/model.ts';process.stdout.write(JSON.stringify({items,stopNames}));"
], cwd=ROOT, text=True, encoding='utf-8'))
ITEMS = {item['id']: item['name'] for item in catalog['items']}
STOPS = catalog['stopNames']
CLIPS.update({'segment_cargo_intro':'这次要送', 'segment_and':'和', 'segment_first':'先去', 'segment_next':'再去'})
CLIPS.update({f'segment_item_{key}':value for key,value in ITEMS.items()})
CLIPS.update({f'segment_stop_{key}':value for key,value in STOPS.items()})

async def generate_one(key: str, text: str, limit: asyncio.Semaphore) -> None:
    async with limit:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, 'zh-CN-XiaoxiaoNeural', rate='-12%', volume='-8%').save(str(OUT / f'{key}.mp3'))
                return
            except Exception:
                if attempt == 2: raise
                await asyncio.sleep(1 + attempt)

async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = ROOT / 'lib' / 'delivery-voice.json'
    previous = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
    limit = asyncio.Semaphore(3)
    await asyncio.gather(*(generate_one(k, v, limit) for k, v in CLIPS.items() if previous.get(k, {}).get('text') != v or not (OUT / f'{k}.mp3').is_file()))
    manifest = {k: {'text': v, 'file': f'/audio/delivery/{k}.mp3'} for k, v in CLIPS.items()}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Generated {len(CLIPS)} voice prompts.')

if __name__ == '__main__': asyncio.run(main())
