import test from 'node:test'
import assert from 'node:assert/strict'
import {GARDEN_LEVELS,GARDEN_W,GARDEN_MIN_FLOWERS,GARDEN_SCORE_MAX,
 gardenCell,gardenStart,startGardenTrail,moveGardenTrail,moveGardenDirection} from '../src/game/gardenTrail.mjs'

const routes=[
 [[1,4],[2,4],[3,4],[3,3],[3,2],[3,1],[3,0],[4,0]],
 [[1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[3,2],[2,2],[2,1],[2,0],[3,0],[4,0]],
 [[1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[4,0]],
]
test('three hand-authored garden grids have a start, finish and multiple blooms',()=>{
 assert.equal(GARDEN_LEVELS.length,3)
 for(let index=0;index<GARDEN_LEVELS.length;index++){
  const map=GARDEN_LEVELS[index]
  assert.equal(map.length,GARDEN_W)
  assert.ok(map.every(line=>line.length===GARDEN_W))
  assert.equal(map.join('').split('S').length-1,1)
  assert.equal(map.join('').split('G').length-1,1)
  assert.ok(map.join('').split('*').length-1>=GARDEN_MIN_FLOWERS)
  assert.deepEqual(gardenStart(index),{x:0,y:4})
 }
 assert.equal(gardenCell(-1,0,0),'#')
 assert.equal(gardenCell(2,5,2),'#')
 assert.equal(gardenStart(9),null)
})
test('movement cannot skip walls, jump diagonally, teleport, pass outside or cheat points',()=>{
 const s=startGardenTrail(),snapshot=JSON.stringify(s)
 for(const [x,y] of [[4,0],[0,3.1],[-1,4],[8,10],[2,4],[2,3]]){
  assert.equal(moveGardenTrail(s,x,y),s)
 }
 assert.equal(moveGardenDirection(s,0,0),s)
 assert.equal(moveGardenDirection(s,2,0),s)
 assert.equal(moveGardenDirection(s,1,1),s)
 assert.equal(JSON.stringify(s),snapshot,'pure solver must not mutate input')
 const a=moveGardenTrail(s,1,4)
 assert.deepEqual(a.player,{x:1,y:4})
 assert.equal(a.score,0)
 assert.equal(s.player.x,0)
})
test('flowers grant exactly four points once per tile, not on revisit',()=>{
 let s=startGardenTrail()
 s=moveGardenTrail(s,1,4)
 s=moveGardenTrail(s,2,4)
 assert.equal(s.flowers,1);assert.equal(s.score,4);assert.equal(s.totalFlowers,1)
 s=moveGardenTrail(s,1,4)
 s=moveGardenTrail(s,2,4)
 assert.equal(s.flowers,1);assert.equal(s.score,4)
})
test('the exit gate rejects premature entry even if reachable',()=>{
 let s=startGardenTrail()
 const path=[[0,3],[0,2],[0,1],[0,0],[1,0],[2,0],[3,0],[4,0]]
 for(const [x,y]of path)s=moveGardenTrail(s,x,y)
 assert.equal(s.completed,0)
 assert.notDeepEqual(s.player,{x:4,y:0})
 assert.equal(s.feedback,'Collect at least two blossoms before the gate.')
})
test('real valid routes progress all three levels and issue score only on final success',()=>{
 let s=startGardenTrail()
 for(let level=0;level<routes.length;level++){
  assert.equal(s.level,level)
  for(const [x,y]of routes[level])s=moveGardenTrail(s,x,y)
  assert.equal(s.completed,level+1)
  assert.equal(s.status,level===routes.length-1?'done':'playing')
 }
 assert.ok(s.totalFlowers>=6)
 assert.ok(s.score>60)
 assert.ok(s.score<=GARDEN_SCORE_MAX)
 assert.equal(moveGardenTrail(s,4,0),s,'finished round cannot pay twice')
})
test('all three puzzle paths are solvable with strict adjacent traversals',()=>{
 for(let level=0;level<routes.length;level++){
  let p=gardenStart(level),flowers=0
  for(const [x,y]of routes[level]){
   assert.equal(Math.abs(p.x-x)+Math.abs(p.y-y),1)
   assert.notEqual(gardenCell(level,x,y),'#')
   if(gardenCell(level,x,y)==='*')flowers++
   if(gardenCell(level,x,y)==='G')assert.ok(flowers>=GARDEN_MIN_FLOWERS)
   p={x,y}
  }
  assert.equal(gardenCell(level,p.x,p.y),'G')
 }
})
test('a new round resets all counters, and invalid finished operations stay pure',()=>{
 const a=startGardenTrail()
 const b=startGardenTrail()
 assert.deepEqual(a,b)
 assert.equal(a.score,0);assert.equal(a.completed,0)
 assert.equal(moveGardenTrail(null,1,4),null)
 assert.equal(moveGardenTrail({...a,status:'done'},1,4).score,0)
})
