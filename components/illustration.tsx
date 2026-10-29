'use client';
import {useContext,type CSSProperties} from 'react';
import {GameResourceContext} from './game-resource-context';
import {illustrationUrl,redrawnIllustrations,type IllustrationId} from '../games/illustration-assets';
import {vehicleFrames} from '../games/vehicle-frames';
import {deliveryIllustrationFrames} from '../games/delivery/illustration-frames';

export function Illustration({id,className='',alt='',style,priority=false,align='center'}:{id:IllustrationId;className?:string;alt?:string;style?:CSSProperties;priority?:boolean;align?:'center'|'bottom-left'}){
 const resources=useContext(GameResourceContext),url=illustrationUrl(id),prepared=resources?.get(url);
 if(resources&&!prepared)throw new Error(`Missing prepared illustration: ${id}`);
 const frame=vehicleFrames[id]??(redrawnIllustrations.includes(id)?undefined:deliveryIllustrationFrames[id]);
 if(frame)return <svg className={`illustration-art ${className}`} data-illustration={id} viewBox={frame.viewBox} preserveAspectRatio={align==='bottom-left'?'xMinYMax meet':'xMidYMid meet'} role={alt?'img':undefined} aria-label={alt||undefined} aria-hidden={!alt} focusable="false" style={style}>
  <image href={prepared?.src??url} width={frame.width} height={frame.height}/>
 </svg>;
 return <img className={`illustration-art ${className}`} data-illustration={id} src={prepared?.src??url} alt={alt} draggable={false} loading={prepared||priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} decoding="async" style={{objectFit:'contain',objectPosition:align==='bottom-left'?'left bottom':'center',...style}}/>;
}
