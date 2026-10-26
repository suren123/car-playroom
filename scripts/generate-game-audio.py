"""Generate reusable Mandarin voice prompts for Car Little Missions."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "audio"
VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "-12%"
VOLUME = "-8%"
PITCH = "+0Hz"

CLIPS = {
    "welcome": "小司机，我们慢慢来。准备好了吗？",
    "red-light": "红灯亮了，我们停一停。",
    "green-light": "绿灯亮了，慢慢出发吧。",
    "wait-turn": "现在轮到前面的车。我们等一等，很快就到你。",
    "try-again": "没关系，我们再试一次。",
    "ask-for-help": "遇到困难没关系，可以请大人帮忙。",
    "hint": "我们一起找一个小提示吧。",
    "pause": "我们休息一下。想继续的时候，再点继续。",
    "detour": "这条路在施工，我们换一条路试试。",
    "finished": "这次小任务完成啦。小汽车平安回家了。",
}


async def generate() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, dict[str, str]] = {}

    for key, text in CLIPS.items():
        target = OUTPUT_DIR / f"{key}.mp3"
        communicate = edge_tts.Communicate(
            text,
            VOICE,
            rate=RATE,
            volume=VOLUME,
            pitch=PITCH,
        )
        await communicate.save(str(target))
        manifest[key] = {
            "file": target.name,
            "text": text,
            "voice": VOICE,
            "rate": RATE,
            "volume": VOLUME,
        }
        print(f"Generated {target.relative_to(ROOT)}")

    (OUTPUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    asyncio.run(generate())
