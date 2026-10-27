import type {VehicleKind} from '../lib/replay-games.ts';
export type CarKind=VehicleKind|'police'|'delivery'|'mixer'|'roller'|'tow'|'garbage';
export const carCatalog:{id:CarKind;name:string;states:readonly string[];version:string}[]=[
 {id:'fire',name:'消防车',states:['idle','drive'],version:'0.2.0'},
 {id:'ambulance',name:'救护车',states:['idle','drive'],version:'0.2.0'},
 {id:'police',name:'警车',states:['idle','drive'],version:'0.2.0'},
 {id:'bus',name:'公交车',states:['idle','drive'],version:'0.2.0'},
 {id:'truck',name:'货车',states:['idle','drive','load','unload'],version:'0.2.0'},
 {id:'delivery',name:'快递车',states:['idle','drive','load','unload'],version:'0.2.0'},
 {id:'digger',name:'挖掘机',states:['idle','drive'],version:'0.2.0'},
 {id:'crane',name:'吊车',states:['idle','drive'],version:'0.2.0'},
 {id:'mixer',name:'搅拌车',states:['idle','drive'],version:'0.2.0'},
 {id:'roller',name:'压路机',states:['idle','drive'],version:'0.2.0'},
 {id:'tow',name:'拖车',states:['idle','drive'],version:'0.2.0'},
 {id:'garbage',name:'垃圾车',states:['idle','drive'],version:'0.2.0'},
];
