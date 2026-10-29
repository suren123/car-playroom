// IDs shared by images, speech fragments, orders and resource manifests.
export const expandedCars=['dump','forklift','tractor','fuelTanker','sweeper','schoolBus','iceCream','race'] as const;
export const expandedItems=[
 {id:'bananas',name:'香蕉',symbol:'◡',color:'#e4b83f'},
 {id:'watermelon',name:'西瓜',symbol:'●',color:'#5d9d55'},
 {id:'strawberry',name:'草莓',symbol:'♥',color:'#da5862'},
 {id:'pineapple',name:'菠萝',symbol:'◆',color:'#d6aa42'},
 {id:'corn',name:'玉米',symbol:'▥',color:'#e2b645'},
 {id:'pumpkin',name:'南瓜',symbol:'●',color:'#dd8f3c'},
 {id:'bread',name:'面包',symbol:'▰',color:'#c78f48'},
 {id:'cake',name:'蛋糕',symbol:'▤',color:'#d99bba'},
 {id:'cookies',name:'饼干',symbol:'●',color:'#bf8d52'},
 {id:'basketball',name:'篮球',symbol:'●',color:'#ce793b'},
 {id:'football',name:'足球',symbol:'●',color:'#6f8280'},
 {id:'kite',name:'风筝',symbol:'◆',color:'#7e9bbf'},
 {id:'guitar',name:'吉他',symbol:'♩',color:'#c7924d'},
 {id:'umbrella',name:'雨伞',symbol:'⌒',color:'#8e86c0'},
 {id:'rainBoots',name:'雨靴',symbol:'▙',color:'#e2b647'},
 {id:'clock',name:'时钟',symbol:'◷',color:'#6ca3af'},
 {id:'letters',name:'信件',symbol:'✉',color:'#88a994'},
 {id:'extinguisher',name:'灭火器',symbol:'▥',color:'#ce5c54'},
 {id:'shovel',name:'铁锹',symbol:'▾',color:'#80959a'},
 {id:'broom',name:'扫把',symbol:'▴',color:'#c9a658'},
] as const;
export const expandedStops={postOffice:'邮局',bakery:'面包店',library:'图书馆',zoo:'动物园',amusementPark:'游乐园',stadium:'体育场'} as const;
export type ExpansionArtId=typeof expandedCars[number]|`overhead-${typeof expandedCars[number]}`|`cargo-${typeof expandedItems[number]['id']}`|`stop-${keyof typeof expandedStops}`;
export const expansionArtIds:readonly ExpansionArtId[]=[...expandedCars,...expandedCars.map(id=>`overhead-${id}` as const),...expandedItems.map(item=>`cargo-${item.id}` as const),...Object.keys(expandedStops).map(id=>`stop-${id}` as `stop-${keyof typeof expandedStops}`)];
