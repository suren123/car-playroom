'use client';
import {useContext,type CSSProperties} from 'react';
import {GameResourceContext} from './game-resource-context';
import {illustrationUrl,type IllustrationId} from '../games/illustration-assets';

export function Illustration({id,className='',alt='',style,priority=false}:{id:IllustrationId;className?:string;alt?:string;style?:CSSProperties;priority?:boolean}){
 const resources=useContext(GameResourceContext),url=illustrationUrl(id),prepared=resources?.get(url);
 if(resources&&!prepared)throw new Error(`Missing prepared illustration: ${id}`);
 return <img className={`illustration-art ${className}`} data-illustration={id} src={prepared?.src??url} alt={alt} draggable={false} loading={prepared||priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} decoding="async" style={style}/>;
}
