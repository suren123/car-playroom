"""Generate the bounded reusable rules; station names reuse delivery fragments."""
import asyncio
import json
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]

async def main():
    clips = json.loads((ROOT / 'games/workshop/voices.json').read_text(encoding='utf-8'))
    for key, clip in clips.items():
        path = ROOT / 'public' / clip['file'].lstrip('/')
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists() and path.stat().st_size > 1000:
            continue
        for attempt in range(3):
            try:
                await edge_tts.Communicate(clip['text'], 'zh-CN-XiaoxiaoNeural', rate='-12%', volume='-8%').save(str(path))
                print('Generated', key, flush=True)
                break
            except Exception:
                if attempt == 2:
                    raise
                await asyncio.sleep(1)

asyncio.run(main())
