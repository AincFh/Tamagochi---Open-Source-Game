/* ORBIT BEATS — the fully deterministic, asset-free rhythm chart.
 * Timing, evaluation and miss detection never depend on React rendering speed.
 * An input can score at most one unresolved note.
 */
export const ORBIT_LANES=3
export const ORBIT_COUNT=18
export const ORBIT_FIRST_MS=1600
export const ORBIT_INTERVAL_MS=620
export const ORBIT_HIT_WINDOW_MS=240
export const ORBIT_APPROACH_MS=1650
export const ORBIT_END_MS=ORBIT_FIRST_MS+(ORBIT_COUNT-1)*ORBIT_INTERVAL_MS+950
const mix=value=>{
 let x=(value^0x9e3779b9)>>>0
 x=Math.imul(x^(x>>>16),0x21f0aaad)
 x=Math.imul(x^(x>>>15),0x735a2d97)
 return (x^(x>>>15))>>>0
}
export function makeOrbitChart(seed=41273){
 const out=[]
 const base=mix(Number.isFinite(seed)?Math.floor(seed):41273)
 let previous=-1
 for(let i=0;i<ORBIT_COUNT;i++){
  const roll=mix(base^Math.imul(i+1,0x45d9f3b))
  // Avoid same-lane double notes: readable even on narrow touch screens.
  const lane=previous<0?roll%ORBIT_LANES:(previous+1+roll%(ORBIT_LANES-1))%ORBIT_LANES
  out.push({id:i,lane,at:ORBIT_FIRST_MS+i*ORBIT_INTERVAL_MS})
  previous=lane
 }
 return out
}
export function judgeOrbitPress(notes,resolved,lane,elapsedMs){
 if(!Number.isInteger(lane)||lane<0||lane>=ORBIT_LANES||!Number.isFinite(elapsedMs))return null
 let best=null,delta=ORBIT_HIT_WINDOW_MS+1
 for(const note of notes){
  if(note.lane!==lane||resolved.has(note.id))continue
  const distance=Math.abs(note.at-elapsedMs)
  if(distance<=ORBIT_HIT_WINDOW_MS && distance<delta){best=note;delta=distance}
 }
 if(!best)return null
 const grade=delta<=70?'perfect':delta<=145?'good':'okay'
 return {noteId:best.id,grade,points:grade==='perfect'?4:grade==='good'?2:1,delta}
}
export function expiredOrbitNotes(notes,resolved,elapsedMs){
 if(!Number.isFinite(elapsedMs))return []
 return notes.filter(n=>!resolved.has(n.id)&&elapsedMs>n.at+ORBIT_HIT_WINDOW_MS)
}
export function orbitNotePosition(note,elapsedMs){
 const delta=note.at-elapsedMs
 // Judgment line is 76% down the rail. Notes enter at the very top.
 return 76-(delta/ORBIT_APPROACH_MS)*76
}
