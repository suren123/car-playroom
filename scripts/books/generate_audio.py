"""Generate matched MP3 and word timing pairs; publish the batch only after validation."""
import asyncio, argparse, hashlib, json, sys, unicodedata
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent / 'python_lib'))
import edge_tts
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parents[1] / 'public' / 'books' / 'audio' if ROOT.parent.name == 'scripts' else ROOT / 'audio'
VOICE = 'zh-CN-XiaoxiaoNeural'
RATE = '-12%'
VERSION = 'word-boundary-v1'

def letters(text):
    return ''.join(c for c in text if unicodedata.category(c)[0] in 'LN')

def align(text, events):
    positions = [i for i,c in enumerate(text) if unicodedata.category(c)[0] in 'LN']
    clean = letters(text)
    cursor = 0
    words = []
    for event in events:
        token = letters(event['text'])
        if not token:
            continue
        if clean[cursor:cursor+len(token)] != token:
            raise ValueError(f'Word mismatch: {event["text"]!r} at {cursor} in {text!r}')
        start = event['offset'] / 10_000_000
        end = start + event['duration'] / 10_000_000
        if end <= start or (words and start < words[-1]['end'] - .02):
            raise ValueError('Invalid word timing')
        words.append({'text':event['text'], 'from':positions[cursor], 'to':positions[cursor+len(token)-1]+1,
                      'start':round(start,6), 'end':round(end,6)})
        cursor += len(token)
    if cursor != len(clean) or not words:
        raise ValueError('Incomplete word coverage')
    return words

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sample', action='store_true')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    pending = OUT / '.pending-words'
    pending.mkdir(exist_ok=True)
    clips = json.loads((ROOT/'content.json').read_text(encoding='utf-8'))
    manifest_path = ROOT/'audio-manifest.json'
    previous = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
    manifest = dict(previous)
    failures, replacements = [], []
    semaphore = asyncio.Semaphore(3)

    async def one(key):
        text = clips[key]
        fingerprint = hashlib.sha256((VERSION+VOICE+RATE+text).encode()).hexdigest()
        target = OUT/f'{key}.mp3'
        prior = previous.get(key,{})
        if prior.get('sha') == fingerprint and prior.get('words') and target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() == prior.get('audio_sha256'):
            return
        async with semaphore:
            for attempt in range(3):
                temp = pending/f'{key}.mp3'
                try:
                    async def synthesize():
                        events = []
                        with temp.open('wb') as stream:
                            async for chunk in edge_tts.Communicate(text, VOICE, rate=RATE, boundary='WordBoundary').stream():
                                if chunk['type'] == 'audio':
                                    stream.write(chunk['data'])
                                elif chunk['type'] == 'WordBoundary':
                                    events.append(chunk)
                        return events
                    events = await asyncio.wait_for(synthesize(), timeout=70)
                    words = align(text, events)
                    duration = MP3(temp).info.length
                    if temp.stat().st_size < 1000 or words[-1]['end'] > duration + .1:
                        raise ValueError('Audio duration does not cover word timings')
                    manifest[key] = {'text':text,'voice':VOICE,'rate':RATE,'sha':fingerprint,'bytes':temp.stat().st_size,
                                     'audio_sha256':hashlib.sha256(temp.read_bytes()).hexdigest(),
                                     'duration':duration,'timing_version':VERSION,'words':words}
                    replacements.append((temp,target))
                    print('OK',key,'words='+str(len(words)),flush=True)
                    return
                except Exception as exc:
                    print('RETRY',key,type(exc).__name__,str(exc)[:160],flush=True)
                    if attempt == 2:
                        failures.append(key)
                    else:
                        await asyncio.sleep(attempt+2)

    samples = ['p1a','stage3name','stage3']
    for key in samples:
        await one(key)
    if failures:
        raise SystemExit('Sample failed; existing audio unchanged: '+str(failures))
    if not args.sample:
        await asyncio.gather(*(one(k) for k in clips if k not in samples))
    if failures:
        raise SystemExit('Batch failed; existing audio unchanged: '+str(failures))
    # The builder verifies hashes and refuses to package mismatched audio/timing pairs.
    for temp,target in replacements:
        temp.replace(target)
    tmp_manifest = manifest_path.with_suffix('.tmp')
    tmp_manifest.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    tmp_manifest.replace(manifest_path)
    print('COMPLETE',len(replacements),'matched clips updated',flush=True)

if __name__ == '__main__':
    asyncio.run(main())
