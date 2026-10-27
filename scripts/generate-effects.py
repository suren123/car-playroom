"""Create a small, gentle sound sprite from editable synthesis parameters."""
import json, math, random, struct, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RATE = 24000
SOUNDS = {'tap':(420,.09),'select':(520,.13),'pickup':(590,.16),'load':(340,.18),'door':(220,.20),'start':(260,.24),'drive':(145,.30),'stop':(190,.18),'unload':(375,.17),'arrive':(610,.25),'help':(470,.22),'finish':(710,.30)}
samples=[]
manifest={}
random.seed(412)
for name,(frequency,duration) in SOUNDS.items():
    start=len(samples)/RATE
    count=int(duration*RATE)
    noise=0.0
    for i in range(count):
        t=i/RATE
        progress=i/count
        envelope=math.sin(math.pi*progress)**1.5
        noise=.92*noise+.08*random.uniform(-1,1)
        if name in ('start','drive','stop'):
            sweep=(.65+.35*progress) if name=='start' else (1-.25*progress if name=='stop' else 1)
            phase=2*math.pi*frequency*sweep*t
            harmonic=.65*math.sin(phase)+.25*math.sin(2*phase)+.18*noise
        elif name in ('pickup','load','door','unload'):
            harmonic=.65*math.sin(2*math.pi*frequency*t)*math.exp(-7*progress)+.38*noise
        else:
            harmonic=math.sin(2*math.pi*frequency*t)+.18*math.sin(2*math.pi*frequency*1.5*t)
        samples.append(int(4200*envelope*harmonic))
    manifest[name]={'start':round(start,4),'duration':round(duration,4)}
    samples.extend([0]*int(.08*RATE))
target=ROOT/'public'/'audio'/'effects.wav'
target.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(target),'wb') as out:
    out.setnchannels(1);out.setsampwidth(2);out.setframerate(RATE)
    out.writeframes(struct.pack('<'+'h'*len(samples),*samples))
(ROOT/'lib'/'effects-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(f'Generated {len(SOUNDS)} sound effects.')
