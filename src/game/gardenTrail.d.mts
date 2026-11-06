export interface GardenPoint {x:number;y:number}
export interface GardenRun {
 level:number
 player:GardenPoint|null
 visited:string[]
 moves:number
 flowers:number
 totalFlowers:number
 score:number
 completed:number
 status:'playing'|'done'
 feedback:string
}
export const GARDEN_W:number
export const GARDEN_MIN_FLOWERS:number
export const GARDEN_SCORE_MAX:number
export const GARDEN_LEVELS:readonly (readonly string[])[]
export function gardenCell(level:number,x:number,y:number):string
export function gardenStart(level:number):GardenPoint|null
export function startGardenTrail():GardenRun
export function moveGardenTrail(run:GardenRun,x:number,y:number):GardenRun
export function moveGardenDirection(run:GardenRun,dx:number,dy:number):GardenRun
