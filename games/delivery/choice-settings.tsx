import {choiceLimits,choicePresets,resolveChoices,type ChoiceOptions} from './options';
import type {Level} from './model';

export function DeliveryChoiceSettings({value,level,inRound,onChange}:{value:ChoiceOptions;level:Level;inRound:boolean;onChange:(value:ChoiceOptions)=>void}){
 const resolved=resolveChoices(level,value);
 return <section className="dv-choice-settings" aria-label="备选项目设置">
  <h3>多放几个，让孩子找一找</h3>
  <p>{inRound?'从下一整局生效，这一局的三份订单保持不变。':'选好后，下一次出发就会使用。'}额外项目不包含订单要求的货物和站点。</p>
  <div className="dv-choice-presets">{choicePresets.map(preset=><button key={preset.name} aria-pressed={value.extraCargo===preset.extraCargo&&value.extraStops===preset.extraStops} onClick={()=>onChange({extraCargo:preset.extraCargo,extraStops:preset.extraStops})}>{preset.name}<small>货物 +{preset.extraCargo} · 站点 +{preset.extraStops}</small></button>)}</div>
  {(['extraCargo','extraStops'] as const).map(key=>{const label=key==='extraCargo'?'额外货物':'额外目的地',unit=key==='extraCargo'?'件':'个',active=value[key],effective=resolved[key];return <div className="dv-choice-control" key={key} role="group" aria-label={label}>
   <strong>{label}<small>0–{choiceLimits[key]} {unit}</small></strong>
   <button aria-pressed={active==='auto'} onClick={()=>onChange({...value,[key]:'auto'})}>按任务</button>
   <div className="dv-choice-stepper"><button aria-label={`减少${label}`} disabled={effective===0} onClick={()=>onChange({...value,[key]:Math.max(0,effective-1)})}>−</button><output aria-label={`${label}数量`} aria-live="polite">{effective}<small>{unit}</small></output><button aria-label={`增加${label}`} disabled={effective===choiceLimits[key]} onClick={()=>onChange({...value,[key]:Math.min(choiceLimits[key],effective+1)})}>+</button></div>
  </div>;})}
  <p className="dv-choice-summary">按当前任务：从 {resolved.cargoChoices} 件货物中选 {level.count} 件，从 {resolved.stopChoices} 个目的地中{level.stops===2?'依次选 2 个':'选 1 个'}。{resolved.stopChoices===1?'单站且没有额外目的地时，小车直接开往目的地。':''}</p>
 </section>;
}
