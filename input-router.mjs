// Mouse movement takes priority long enough to finish the 1.8-second dwell.
// Tracking continues in the background, and an open hand can then take over.
export function createInputRouter(mouseHoldMs=2800){
 let owner='none',mouseUntil=-Infinity;
 return {
  accept(source,active,now){
   if(source==='mouse'){
    if(active){owner='mouse';mouseUntil=now+mouseHoldMs;return true;}
    mouseUntil=-Infinity;if(owner==='mouse'){owner='none';return true;}return false;
   }
   if(source==='hand'){
    if(active){if(now<mouseUntil)return false;owner='hand';return true;}
    if(owner==='hand'){owner='none';return true;}return false;
   }
   owner='none';mouseUntil=-Infinity;return true;
  },
  get owner(){return owner;}
 };
}
