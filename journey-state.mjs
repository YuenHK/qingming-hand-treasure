export function createJourney(chapters){return {chapter:0,found:chapters.map(()=>[]),mode:'search',currentTarget:-1};}
export function discover(state,chapters,index){
  if(state.mode!=='search'||!chapters[state.chapter]?.targets[index]||state.found[state.chapter].includes(index))return false;
  state.found[state.chapter].push(index);state.currentTarget=index;state.mode='discovery';return true;
}
export function continueJourney(state,chapters){
  if(state.mode!=='discovery')return 'unchanged';
  if(state.found[state.chapter].length<chapters[state.chapter].targets.length){state.mode='search';return 'search';}
  if(state.chapter===chapters.length-1){state.mode='complete';return 'complete';}
  state.chapter++;state.mode='transition';return 'transition';
}
export const COMPLETION_TEXT='你已經搵齊十個線索，認識古人嘅交通、買賣同建築。一齊再出發，按「再玩一次」返回玩法說明，開始新一輪尋寶啦！';
