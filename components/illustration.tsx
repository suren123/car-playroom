import type {CSSProperties} from 'react';
import {illustrationUrl,type IllustrationId} from '../games/illustration-assets';

export function Illustration({id,className='',alt='',style,priority=false}:{id:IllustrationId;className?:string;alt?:string;style?:CSSProperties;priority?:boolean}){
 return <img className={`illustration-art ${className}`} src={illustrationUrl(id)} alt={alt} draggable={false} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} decoding="async" style={style}/>;
}
