export const gameNames={sort:'汽车分类',difference:'找不同',sudoku:'汽车数独',repair:'修车小师傅',bridge:'一起修桥',traffic:'红绿灯小司机',queue:'小汽车排队',listen:'消防车听指挥',detour:'道路施工改道',delivery:'汽车快递站'} as const;
export type GameId=keyof typeof gameNames;
export const gameIds=Object.keys(gameNames) as GameId[];
export type GameCategory='focus'|'rules';
export const gameCatalog:Record<GameId,{name:string;path:string;category:GameCategory;cover:string;rulesVersion:number;stages:number}>={
 sort:{name:gameNames.sort,path:'/game/sort',category:'focus',cover:'bus',rulesVersion:1,stages:3},
 difference:{name:gameNames.difference,path:'/game/difference',category:'focus',cover:'fire',rulesVersion:1,stages:2},
 sudoku:{name:gameNames.sudoku,path:'/game/sudoku',category:'focus',cover:'bus',rulesVersion:2,stages:4},
 listen:{name:gameNames.listen,path:'/game/listen',category:'focus',cover:'fire',rulesVersion:2,stages:2},
 repair:{name:gameNames.repair,path:'/game/repair',category:'rules',cover:'fire',rulesVersion:1,stages:1},
 bridge:{name:gameNames.bridge,path:'/game/bridge',category:'rules',cover:'digger',rulesVersion:1,stages:1},
 traffic:{name:gameNames.traffic,path:'/game/traffic',category:'rules',cover:'fire',rulesVersion:1,stages:2},
 queue:{name:gameNames.queue,path:'/game/queue',category:'rules',cover:'bus',rulesVersion:2,stages:2},
 detour:{name:gameNames.detour,path:'/game/detour',category:'rules',cover:'fire',rulesVersion:1,stages:2},
 delivery:{name:gameNames.delivery,path:'/game/delivery',category:'rules',cover:'delivery',rulesVersion:1,stages:8},
};
