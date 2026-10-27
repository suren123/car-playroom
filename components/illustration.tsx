import type {CSSProperties} from 'react';
import {illustrationUrl,type IllustrationId} from '../games/illustration-assets';

export function Illustration({id,className='',alt='',style}:{id:IllustrationId;className?:string;alt?:string;style?:CSSProperties}){
 return <img className={`illustration-art ${className}`} src={illustrationUrl(id)} alt={alt} draggable={false} loading="lazy" decoding="async" style={style}/>;
}
