import test from 'node:test'
import assert from 'node:assert/strict'
import {
  makeOrbitChart,judgeOrbitPress,expiredOrbitNotes,orbitNotePosition,
  ORBIT_COUNT,ORBIT_END_MS,ORBIT_INTERVAL_MS,ORBIT_HIT_WINDOW_MS,
} from '../src/game/orbitBeats.mjs'

test('three-lane chart has stable seeded sequence, valid lanes and safe spacing',()=>{
 const a=makeOrbitChart(123),b=makeOrbitChart(123),c=makeOrbitChart(128)
 assert.deepEqual(a,b)
 assert.notDeepEqual(a.map(x=>x.lane),c.map(x=>x.lane))
 assert.equal(a.length,ORBIT_COUNT)
 assert.equal(new Set(a.map(x=>x.id)).size,ORBIT_COUNT)
 assert.ok(a.every(x=>x.lane>=0&&x.lane<3&&Number.isInteger(x.at)))
 for(let i=1;i<a.length;i++){
  assert.equal(a[i].at-a[i-1].at,ORBIT_INTERVAL_MS)
  assert.notEqual(a[i].lane,a[i-1].lane)
 }
 assert.ok(ORBIT_END_MS>a.at(-1)+ORBIT_HIT_WINDOW_MS)
})
test('on-beat, good, okay and wrong-lane judging use real timestamp windows',()=>{
 const a=makeOrbitChart(44),n=a[0],resolved=new Set()
 assert.deepEqual(judgeOrbitPress(a,resolved,n.lane,n.at),{noteId:0,grade:'perfect',points:4,delta:0})
 assert.equal(judgeOrbitPress(a,resolved,n.lane,n.at+120)?.grade,'good')
 assert.equal(judgeOrbitPress(a,resolved,n.lane,n.at-220)?.grade,'okay')
 assert.equal(judgeOrbitPress(a,resolved,(n.lane+1)%3,n.at),null)
 assert.equal(judgeOrbitPress(a,resolved,n.lane,n.at-241),null)
 assert.equal(judgeOrbitPress(a,resolved,n.lane,n.at+241),null)
})
test('each note can pay only once, even after repeated keyboard/touch taps',()=>{
 const a=makeOrbitChart(),resolved=new Set()
 const first=judgeOrbitPress(a,resolved,a[0].lane,a[0].at)
 assert.equal(first?.points,4)
 resolved.add(first.noteId)
 for(let i=0;i<100;i++)assert.equal(judgeOrbitPress(a,resolved,a[0].lane,a[0].at),null)
 const second=judgeOrbitPress(a,resolved,a[1].lane,a[1].at)
 assert.equal(second?.noteId,1)
})
test('late misses are recorded once and cannot be reclaimed after timing window',()=>{
 const a=makeOrbitChart(),r=new Set()
 assert.equal(expiredOrbitNotes(a,r,a[0].at+ORBIT_HIT_WINDOW_MS).length,0)
 assert.deepEqual(expiredOrbitNotes(a,r,a[0].at+ORBIT_HIT_WINDOW_MS+1).map(x=>x.id),[0])
 r.add(0)
 assert.equal(expiredOrbitNotes(a,r,a[0].at+ORBIT_HIT_WINDOW_MS+1).length,0)
 assert.equal(judgeOrbitPress(a,r,a[0].lane,a[0].at),null)
 assert.equal(expiredOrbitNotes(a,r,Number.NaN).length,0)
})
test('render positions advance toward visible judgment line',()=>{
 const a=makeOrbitChart(),n=a[0]
 const p0=orbitNotePosition(n,n.at-1000),p1=orbitNotePosition(n,n.at)
 assert.ok(p0>0&&p0<76)
 assert.equal(p1,76)
 assert.ok(orbitNotePosition(n,n.at+100)>76)
})
test('invalid inputs cannot be converted to free perfect rewards',()=>{
 const a=makeOrbitChart(),r=new Set()
 for(const lane of [-1,3,1.5,NaN,Infinity])
  assert.equal(judgeOrbitPress(a,r,lane,a[0].at),null)
 for(const when of [NaN,Infinity,-Infinity])
  assert.equal(judgeOrbitPress(a,r,a[0].lane,when),null)
 assert.equal(makeOrbitChart(NaN).length,ORBIT_COUNT)
})
