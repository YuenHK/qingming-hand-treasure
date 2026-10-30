// Hold each region before gently returning towards the city gate.
export const RECAP_SEGMENT_SECONDS=12;
export const recapDuration=chapters=>Math.max(0,chapters.length-1)*RECAP_SEGMENT_SECONDS;
export function recapFrame(chapters,elapsed){
 const segment=Math.floor(Math.max(0,elapsed)/RECAP_SEGMENT_SECONDS);
 if(segment>=chapters.length-1)return {done:true,index:0,x:chapters[0].x};
 const index=chapters.length-1-segment,local=Math.max(0,elapsed)%RECAP_SEGMENT_SECONDS;
 const t=Math.max(0,Math.min(1,(local-2)/10)),ease=t*t*(3-2*t);
 return {done:false,index,x:chapters[index].x+(chapters[Math.max(0,index-1)].x-chapters[index].x)*ease};
}
