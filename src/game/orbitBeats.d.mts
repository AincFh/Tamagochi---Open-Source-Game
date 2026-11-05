export interface OrbitNote {id:number;lane:number;at:number}
export type OrbitGrade='perfect'|'good'|'okay'
export interface OrbitJudgment {noteId:number;grade:OrbitGrade;points:number;delta:number}
export const ORBIT_LANES:number
export const ORBIT_COUNT:number
export const ORBIT_FIRST_MS:number
export const ORBIT_INTERVAL_MS:number
export const ORBIT_HIT_WINDOW_MS:number
export const ORBIT_APPROACH_MS:number
export const ORBIT_END_MS:number
export function makeOrbitChart(seed?:number):OrbitNote[]
export function judgeOrbitPress(notes:readonly OrbitNote[],resolved:ReadonlySet<number>,lane:number,elapsedMs:number):OrbitJudgment|null
export function expiredOrbitNotes(notes:readonly OrbitNote[],resolved:ReadonlySet<number>,elapsedMs:number):OrbitNote[]
export function orbitNotePosition(note:OrbitNote,elapsedMs:number):number
