/* MORI'S GARDEN TRAIL — three original, deterministic 5x5 spatial puzzles.
 * Each board requires actually walking to collect at least two flowers.
 * Tapping distant cells, walls, revisits, or the goal too early cannot cheat.
 * No timers, assets, platform storage, external music or side effects.
 */
export const GARDEN_W=5
export const GARDEN_LEVELS=Object.freeze([
 Object.freeze(['....G','.##..','.*#*.','..#..','S.*..']),
 Object.freeze(['..*.G','.#.#.','..*..','.##..','S...*']),
 Object.freeze(['...*G','.###.','*...*','.#.#.','S...*']),
])
export const GARDEN_MIN_FLOWERS=2
export const GARDEN_SCORE_MAX=108
const key=(x,y)=>x+','+y
const inside=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<GARDEN_W&&y>=0&&y<GARDEN_W
export function gardenCell(level,x,y){
 if(!Number.isInteger(level)||level<0||level>=GARDEN_LEVELS.length||!inside(x,y))return '#'
 return GARDEN_LEVELS[level][y][x]
}
export function gardenStart(level){
 if(!Number.isInteger(level)||level<0||level>=GARDEN_LEVELS.length)return null
 for(let y=0;y<GARDEN_W;y++)for(let x=0;x<GARDEN_W;x++)
   if(gardenCell(level,x,y)==='S')return {x,y}
 return null
}
export function startGardenTrail(){
 return {level:0,player:gardenStart(0),visited:[],moves:0,flowers:0,
   totalFlowers:0,score:0,completed:0,status:'playing',feedback:'Find two blossoms, then reach the gate.'}
}
export function moveGardenTrail(run,x,y){
 if(!run||run.status!=='playing'||!inside(x,y)||!run.player)return run
 if(Math.abs(x-run.player.x)+Math.abs(y-run.player.y)!==1)return run
 const cell=gardenCell(run.level,x,y)
 if(cell==='#')return {...run,feedback:'A hedge blocks this path.'}
 if(cell==='G'&&run.flowers<GARDEN_MIN_FLOWERS)
   return {...run,feedback:'Collect at least two blossoms before the gate.'}
 const visited=[...run.visited]
 const isFlower=cell==='*'&&!visited.includes(key(x,y))
 if(isFlower)visited.push(key(x,y))
 const flowers=run.flowers+(isFlower?1:0)
 const score=run.score+(isFlower?4:0)
 const moves=run.moves+1
 if(cell==='G'){
   // A valid finished path earns a completion reward and a pace bonus.
   const bonus=10+Math.max(0,Math.floor((22-moves)/2))
   const total=score+bonus
   if(run.level===GARDEN_LEVELS.length-1)
     return {...run,player:{x,y},visited,flowers,moves,score:Math.min(GARDEN_SCORE_MAX,total),
       totalFlowers:run.totalFlowers+(isFlower?1:0),completed:3,status:'done',
       feedback:'All three gardens restored. Mori found a new path!'}
   return {level:run.level+1,player:gardenStart(run.level+1),visited:[],moves:0,flowers:0,
      totalFlowers:run.totalFlowers+(isFlower?1:0),score:Math.min(GARDEN_SCORE_MAX,total),
      completed:run.completed+1,status:'playing',feedback:'A new garden opens. Find two more blossoms.'}
 }
 // Lost directions are still navigable, but skill rewards come from true paths.
 return {...run,player:{x,y},visited,moves,flowers,
   totalFlowers:run.totalFlowers+(isFlower?1:0),score,
   feedback:isFlower?'A blossom! +4 points.':run.feedback}
}
export function moveGardenDirection(run,dx,dy){
 if(!run||!run.player||!Number.isInteger(dx)||!Number.isInteger(dy)||
    Math.abs(dx)+Math.abs(dy)!==1)return run
 return moveGardenTrail(run,run.player.x+dx,run.player.y+dy)
}
