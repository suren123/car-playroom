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
    "generic": "如果任务有点难，没关系，我们一起慢慢来。",
    "home-choose": "选一类汽车游戏。",
    "home-pick-game": "选一个喜欢的汽车游戏。",
    "home-focus": "选一个：汽车分类、找不同、汽车数独，或者消防车听指挥。",
    "home-rules": "选一个：小汽车排队、红绿灯、道路改道、修车，或者搭桥。",
    "sort-color": "这次按颜色停车。",
    "sort-model": "这次按车型停车。",
    "sort-purpose": "这次按用途停车。",
    "sort-rules": "把小车送到对应车站。消防车和救护车去救援站，公交车和货车去运输站，挖掘机和吊车去施工站。",
    "difference-rules": "两边的车有一点不一样。找到以后，点任意一边的小车。",
    "sudoku-tutorial": "每一排和每一列，放不一样的小车。",
    "sudoku-rules": "先点空位，再选一辆车。每一排、每一列，还有粗线围起来的小车库，同一种车只能停一次。",
    "queue-intro": "选一辆你的车，排队轮流出发。",
    "traffic-intro": "红灯停，绿灯走。",
    "listen-intro": "听听消防车要去哪里。",
    "detour-intro": "路上施工啦，换一条路。",
    "repair-intro": "一起修好消防车。",
    "bridge-intro": "你一块，我一块，一起修桥。",
    "continue": "我们继续玩。",
    "continue-here": "我们从这里继续，慢慢来。",
    "red-light": "红灯，停一停。",
    "green-light": "绿灯，可以出发。",
    "queue-pick": "先选你的小汽车。",
    "queue-next": "看看队伍，轮到最前面的车出发。",
    "detour-ready": "准备出发，看看路上有什么变化。",
    "detour-blocked": "前面施工啦，换一条没有封住的路。",
    "road-error-1": "慢慢看，再试一次。",
    "road-error-2": "看看亮起来的提示。",
    "demo": "看一遍示范，再试试。",
    "traffic-arrive": "安全到站啦！",
    "traffic-next": "做得好，看下一个灯。",
    "queue-ready": "排好队了，看看轮到谁。",
    "queue-wait-1": "前面的车先走，等一等。",
    "queue-wait-2": "看亮起来的车先走。",
    "queue-finished": "大家都出发啦！",
    "queue-next-car": "轮到下一辆车。",
    "listen-finished": "任务完成啦！",
    "listen-next": "第一站到了，再去下一站。",
    "listen-group-done": "这一项完成啦，准备好再继续。",
    "detour-begin": "前面施工啦，找另一条路。",
    "detour-error-1": "这条路封住啦，换一条看看。",
    "detour-error-2": "看看没有路障的路。",
    "detour-finished": "改道也能到达！",
    "hint-look": "先慢慢看一看。",
    "hint-light": "看看亮起来的地方。",
    "hint-demo": "看一遍示范，再试试。",
    "sort-error": "换一个试试。",
    "difference-error": "再看看。",
    "sudoku-error": "换一辆试试。",
    "sort-finished": "停对啦！",
    "difference-finished": "找到啦！",
    "sudoku-finished": "停好啦！",
    "repair-wheel-instruction": "找一找，哪个轮胎和车上的一样大？",
    "repair-wheel-hint": "看看小车右边的轮胎，再比一比大小。",
    "repair-wheel-success": "轮胎装好了！你找到合适的大小啦。",
    "repair-light-instruction": "车顶少了一盏灯，选一盏圆圆的车顶灯。",
    "repair-light-hint": "找找黄色、圆圆的那盏车顶灯。",
    "repair-light-success": "车顶灯装好了！小车又精神啦。",
    "repair-ladder-instruction": "选一把竖着的梯子，上面有三根横档。",
    "repair-ladder-hint": "找找两条竖杆、中间三根横档的梯子。",
    "repair-ladder-success": "梯子装好了！三个小任务都完成啦。",
    "repair-wheel-too-large": "这个轮胎有点大，再看看车上的轮胎。",
    "repair-wheel-too-small": "这个轮胎有点小，再看看车上的轮胎。",
    "repair-wrong-part": "这一个还不太合适。我们再看看，也可以请大人帮忙。",
    "bridge-start": "一人放一块，先轮到小司机。",
    "bridge-river": "小河在唱歌，我们一起铺好四块桥板。",
    "bridge-puddle": "路上有个小水洼，我们轮流来搭桥。",
    "bridge-gully": "最后一座小桥啦，我们还是一人一块。",
    "bridge-child-first": "这一块轮到大人。我们等一等，下一块就轮到你。",
    "bridge-adult-first": "这一块轮到小司机。大人也要等一等哦。",
    "bridge-adult-placed": "这一块放好了！现在轮到大人。",
    "bridge-child-placed": "谢谢大人！现在轮到小司机。",
    "bridge-finished": "小桥搭好啦！你一块，我一块，消防车可以过桥啦。",
    "hint-bridge": "看头像，亮起来的那一边放一块桥板。",
    "help": "可以说：“有点难，请帮帮我。”大人陪你一起看看。",
    "retry-repair": "我们慢慢来，再选一个试试。",
    "retry-bridge": "没关系，已经搭好的桥还在。我们从这里继续。",
    "garage-finished": "小车回到车库啦。谢谢你们一起完成小任务！",
    "pause": "我们休息一下。想继续的时候，再点继续。",
    "detour": "这条路在施工，我们换一条路试试。",
    "finished": "这次小任务完成啦。小汽车平安回家了。",
}

for _first in ("加油站", "灭火点", "小车库"):
    CLIPS[f"listen-one-{_first}"] = f"消防车听指挥。先去{_first}。"

for _first in ("加油站", "灭火点", "小车库"):
    for _second in ("加油站", "灭火点", "小车库"):
        if _first != _second:
            CLIPS[f"listen-two-{_first}-{_second}"] = f"消防车听指挥。先去{_first}，再去{_second}。"

BRIDGE_LINES = {
    "小河": "小河在唱歌，我们一起铺好四块桥板。",
    "小水洼": "路上有个小水洼，我们轮流来搭桥。",
    "小山沟": "最后一座小桥啦，我们还是一人一块。",
}
for _place, _line in BRIDGE_LINES.items():
    CLIPS[f"bridge-next-{_place}"] = f"{_line}先轮到小司机。"


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
    (ROOT / "lib" / "audio-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    asyncio.run(generate())
