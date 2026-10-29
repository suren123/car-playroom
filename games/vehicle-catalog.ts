export const vehicleGroups={rescue:'救援车辆',transport:'客运与运输',construction:'工程车辆',service:'生活与服务',special:'特色车辆'} as const;
export type VehicleGroup=keyof typeof vehicleGroups;
const entries=[
 ['fire','消防车','rescue','ladder'],['ambulance','救护车','rescue','van'],['police','警车','rescue','car'],
 ['bus','公交车','transport','bus'],['truck','货车','transport','box'],['delivery','快递车','transport','box'],
 ['digger','挖掘机','construction','arm'],['crane','吊车','construction','ladder'],['mixer','搅拌车','construction','drum'],['roller','压路机','construction','roller'],
 ['tow','拖车','service','hook'],['garbage','垃圾车','service','box'],
 ['dump','自卸车','construction','bed'],['forklift','叉车','construction','fork'],['tractor','拖拉机','special','tractor'],
 ['fuelTanker','油罐车','transport','tank'],['sweeper','扫路车','service','brush'],['schoolBus','校车','transport','bus'],
 ['iceCream','冰淇淋车','service','iceCream'],['race','赛车','special','race'],
] as const;
export type CarKind=typeof entries[number][0];
export const carCatalog=entries.map(([id,name,group,silhouette])=>({id,name,group,silhouette,states:(id==='truck'||id==='delivery'?['idle','drive','load','unload']:['idle','drive']) as readonly string[],version:'assets-v5'}));
export const vehicleNames=Object.fromEntries(carCatalog.map(c=>[c.id,c.name])) as Record<CarKind,string>;
export const vehicleAssetVersion='expansion-v5';

// Prefer distinct silhouettes; never exclude a vehicle from the overall library.
export function pickPictureVehicles(count:number,random:()=>number):CarKind[]{
 const pool=[...carCatalog];
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 const selected:CarKind[]=[],families=new Set<string>();
 for(const car of pool)if(selected.length<count&&!families.has(car.silhouette)){selected.push(car.id);families.add(car.silhouette);}
 for(const car of pool)if(selected.length<count&&!selected.includes(car.id))selected.push(car.id);
 if(selected.length!==count)throw Error('Insufficient vehicle kinds');
 return selected;
}
