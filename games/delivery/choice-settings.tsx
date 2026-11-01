import {choiceLimits,choicePresets,resolveChoices,type ChoiceOptions} from './options';
import type {Level} from './model';

export function DeliveryChoiceSettings({value,level,inRound,onChange}:{value:ChoiceOptions;level:Level;inRound:boolean;onChange:(value:ChoiceOptions)=>void}){
 const resolved=resolveChoices(level,value);
 return <section className="dv-choice-settings" aria-label="配送和备选设置">
  <h3>这次送多少，去几个站</h3>
  <p>{inRound?'从下一整局生效，这一局的三份订单保持不变。':'选好后，下一次出发就会使用。'}额外项目不包含订单要求的货物和站点。</p>
  {(['cargoCount','destinationCount'] as const).map(key=><div className="dv-count-control" key={key} role="group" aria-label={key==='cargoCount'?'要送的货物':'要去的目的地'}><strong>{key==='cargoCount'?'要送的货物':'要去的目的地'}</strong><div>{(['auto',1,2,3,4] as const).map(count=><button key={count} aria-pressed={(value[key]??'auto')===count} onClick={()=>onChange({...value,[key]:count})}>{count==='auto'?'按任务':`${count} ${key==='cargoCount'?'件':'站'}`}</button>)}</div></div>)}
  <div className="dv-choice-presets">{choicePresets.map(preset=><button key={preset.name} aria-pressed={value.extraCargo===preset.extraCargo&&value.extraStops===preset.extraStops} onClick={()=>onChange({...value,extraCargo:preset.extraCargo,extraStops:preset.extraStops})}>{preset.name}<small>货物 +{preset.extraCargo} · 站点 +{preset.extraStops}</small></button>)}</div>
  {(['extraCargo','extraStops'] as const).map(key=>{const label=key==='extraCargo'?'额外货物':'额外目的地',unit=key==='extraCargo'?'件':'个',active=value[key],effective=resolved[key];return <div className="dv-choice-control" key={key} role="group" aria-label={label}>
   <strong>{label}<small>0–{choiceLimits[key]} {unit}</small></strong>
   <button aria-pressed={active==='auto'} onClick={()=>onChange({...value,[key]:'auto'})}>按任务</button>
   <div className="dv-choice-stepper"><button aria-label={`减少${label}`} disabled={effective===0} onClick={()=>onChange({...value,[key]:Math.max(0,effective-1)})}>−</button><output aria-label={`${label}数量`} aria-live="polite">{effective}<small>{unit}</small></output><button aria-label={`增加${label}`} disabled={effective===choiceLimits[key]} onClick={()=>onChange({...value,[key]:Math.min(choiceLimits[key],effective+1)})}>+</button></div>
  </div>;})}
  {resolved.error?<p className="dv-settings-error" role="alert">{resolved.error}</p>:<p className="dv-choice-summary">要送 {resolved.cargoCount} 件，去 {resolved.destinationCount} 个站；货架共 {resolved.cargoChoices} 件，目的地共 {resolved.stopChoices} 个。{resolved.stopChoices===1?'单站且没有额外目的地时，小车直接开往目的地。':''}</p>}
  <p>每种货物一件，每站至少一件；一局包含三份订单。</p>
 </section>;
}
