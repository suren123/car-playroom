import type {CarKind} from './vehicle-catalog';
import type {ItemId,StopId} from './delivery/model';

const base='/assets/illustrations/v1/';
const files={
 fire:'01_fire-truck.png',ambulance:'02_ambulance.png',police:'03_police-car.png',bus:'04_bus.png',truck:'05_cargo-truck.png',delivery:'06_delivery-truck.png',digger:'07_excavator.png',crane:'08_crane-truck.png',mixer:'09_cement-mixer.png',roller:'10_road-roller.png',tow:'11_tow-truck.png',garbage:'12_garbage-truck.png',dump:'13_dump-truck.png',tipper:'14_tipper-truck.png',forklift:'15_forklift.png',tractor:'16_tractor.png',fuelTanker:'17_fuel-tanker.png',sweeper:'18_street-sweeper.png',
 wheel:'19_wheel.png',toolbox:'20_toolbox.png',hose:'21_hose.png',bucket:'22_bucket.png',helmet:'23_hard-hat.png',cone:'24_traffic-cone.png',board:'25_wood-planks.png',box:'26_wooden-crate.png',parcel:'27_parcel.png',fuel:'28_fuel-can.png',ladder:'29_ladder.png',barrier:'30_construction-barrier.png',
 warehouse:'31_warehouse.png',fireStation:'32_fire-station.png',constructionSite:'33_construction-site.png',shop:'34_shop.png',hospital:'35_hospital.png',factory:'36_factory.png',
 roundTree:'37_round-tree.png',tallTree:'38_tall-tree.png',pineTree:'39_pine-tree.png',roundBush:'40_round-bush.png',flowerBush:'41_flower-bush.png',hillBush:'42_small-hill-bush.png',cloud:'43_cloud.png',doubleCloud:'44_double-cloud.png',layeredCloud:'45_layered-cloud.png',grassHill:'46_grass-hill.png',greenHills:'47_green-hills.png',rocks:'48_rocks.png',
 straightRoad:'49_straight-road.png',curveRoad:'50_curve-road.png',tJunction:'51_t-junction.png',crossroads:'52_crossroads.png',roundabout:'53_roundabout.png',parkingLot:'54_parking-lot.png',whiteFence:'55_white-fence.png',woodFence:'56_wood-fence.png',meshFence:'57_green-mesh-fence.png',roadBarrier:'58_road-barrier.png',chevronSign:'59_chevron-sign.png',streetlamp:'60_streetlamp.png',
} as const;

const deliveryFiles={
 'cargo-luggage':'cargo-luggage.png',
 'cargo-backpack':'cargo-backpack.png',
 'cargo-gift':'cargo-gift.png',
 'cargo-toys':'cargo-toys.png',
 'cargo-books':'cargo-books.png',
 'cargo-apples':'cargo-apples.png',
 'cargo-vegetables':'cargo-vegetables.png',
 'cargo-fish':'cargo-fish.png',
 'cargo-milk':'cargo-milk.png',
 'cargo-juice':'cargo-juice.png',
 'cargo-hay':'cargo-hay.png',
 'cargo-paint':'cargo-paint.png',
 'cargo-barrier':'cargo-barrier.png',
 'cargo-flowers':'cargo-flowers.png',
 'cargo-firstAid':'cargo-firstAid.png',
 'cargo-picnic':'cargo-picnic.png',
 'cargo-oranges':'cargo-oranges.png',
 'cargo-eggs':'cargo-eggs.png',
 'stop-home':'stop-home.png',
 'stop-school':'stop-school.png',
 'stop-police':'stop-police.png',
 'stop-gas':'stop-gas.png',
 'stop-farm':'stop-farm.png',
 'stop-greenhouse':'stop-greenhouse.png',
 'stop-parking':'stop-parking.png',
 'stop-busStop':'stop-busStop.png',
 'stop-repair':'stop-repair.png',
} as const;
export type IllustrationId=keyof typeof files|keyof typeof deliveryFiles;
export const illustrationUrl=(id:IllustrationId)=>Object.hasOwn(deliveryFiles,id)?`/assets/illustrations/delivery-v2/${deliveryFiles[id as keyof typeof deliveryFiles]}`:`${base}${files[id as keyof typeof files]}`;
export const vehicleIllustration:Record<CarKind,IllustrationId>={fire:'fire',ambulance:'ambulance',police:'police',bus:'bus',truck:'truck',delivery:'delivery',digger:'digger',crane:'crane',mixer:'mixer',roller:'roller',tow:'tow',garbage:'garbage'};
export const cargoIllustration:Record<ItemId,IllustrationId>={wheel:'wheel',toolbox:'toolbox',hose:'hose',bucket:'bucket',helmet:'helmet',cone:'cone',sign:'chevronSign',board:'board',box:'box',parcel:'parcel',fuel:'fuel',ladder:'ladder',luggage:'cargo-luggage',backpack:'cargo-backpack',gift:'cargo-gift',toys:'cargo-toys',books:'cargo-books',apples:'cargo-apples',vegetables:'cargo-vegetables',fish:'cargo-fish',milk:'cargo-milk',juice:'cargo-juice',hay:'cargo-hay',paint:'cargo-paint',barrier:'cargo-barrier',flowers:'cargo-flowers',firstAid:'cargo-firstAid',picnic:'cargo-picnic',oranges:'cargo-oranges',eggs:'cargo-eggs'};
export const destinationIllustration:Record<StopId,IllustrationId>={fire:'fireStation',work:'constructionSite',shop:'shop',hospital:'hospital',factory:'factory',home:'stop-home',school:'stop-school',police:'stop-police',gas:'stop-gas',farm:'stop-farm',greenhouse:'stop-greenhouse',parking:'stop-parking',busStop:'stop-busStop',repair:'stop-repair'};
