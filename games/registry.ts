export const gameNames={sort:'汽车分类',difference:'找不同',sudoku:'汽车数独',repair:'修车小师傅',bridge:'一起修桥',traffic:'红绿灯小司机',queue:'小汽车排队',listen:'消防车听指挥',detour:'道路施工改道',delivery:'汽车快递站'} as const;
export type GameId=keyof typeof gameNames;
export const gameIds=Object.keys(gameNames) as GameId[];
