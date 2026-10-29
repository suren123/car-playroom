import type {VehicleKind} from '../../lib/replay-games';
import type {RepairPart} from './model';

export type Region={x:number;y:number;w:number;h:number;round?:boolean};
export type RepairMaster={width:number;height:number;parts:Record<RepairPart,Region>;wheels:Region[];equipment:string};
const circle=(cx:number,cy:number,r:number):Region=>({x:cx-r,y:cy-r,w:r*2,h:r*2,round:true});
// Coordinates refer to the original PNG, never to a redrawn substitute.
export const repairMasters:Record<VehicleKind,RepairMaster>={
 fire:{width:768,height:408,parts:{wheel:circle(166,324,76),window:{x:531,y:101,w:164,h:82},light:{x:546,y:6,w:88,h:54},equipment:{x:43,y:17,w:456,h:85}},wheels:[circle(166,324,76),circle(608,324,76)],equipment:'车顶梯子'},
 ambulance:{width:273,height:176,parts:{wheel:circle(55,143,27),window:{x:181,y:47,w:49,h:42},light:{x:159,y:4,w:58,h:32},equipment:{x:17,y:36,w:139,h:78}},wheels:[circle(55,143,27),circle(205,143,27)],equipment:'后车门'},
 bus:{width:288,height:158,parts:{wheel:circle(62,126,26),window:{x:81,y:28,w:32,h:44},light:{x:270,y:87,w:13,h:26},equipment:{x:82,y:84,w:110,h:30}},wheels:[circle(62,126,26),circle(234,126,26)],equipment:'车身护板'},
 truck:{width:288,height:170,parts:{wheel:circle(61,138,26),window:{x:210,y:49,w:45,h:37},light:{x:265,y:99,w:18,h:24},equipment:{x:13,y:13,w:174,h:110}},wheels:[circle(61,138,26),circle(223,138,26)],equipment:'货箱门'},
 digger:{width:267,height:176,parts:{wheel:circle(65,150,10),window:{x:70,y:84,w:29,h:26},light:{x:25,y:107,w:26,h:18},equipment:{x:185,y:111,w:73,h:52}},wheels:[circle(31,150,10),circle(65,150,10),circle(99,150,10),circle(134,150,10)],equipment:'挖斗'},
 crane:{width:270,height:176,parts:{wheel:circle(176,150,25),window:{x:163,y:91,w:36,h:22},light:{x:13,y:111,w:21,h:16},equipment:{x:236,y:48,w:31,h:44}},wheels:[circle(42,148,22),circle(81,148,22),circle(176,150,25)],equipment:'吊钩'},
};
export function repairPartName(vehicle:VehicleKind,part:RepairPart){return part==='light'&&vehicle==='digger'?'机身盖板':part==='equipment'?repairMasters[vehicle].equipment:part==='wheel'&&vehicle==='digger'?'履带轮':({wheel:'轮胎',window:'车窗',light:'车灯',equipment:'装备'})[part];}
