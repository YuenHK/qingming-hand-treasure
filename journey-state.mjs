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
export const COMPLETION_TEXT='你由城門外行到長卷深處，認識交通、買賣、河岸同建築。古城已經亮起真色，亦陪你慢慢回望咗畫中生活。準備好再出發，就按「再玩一次」，重新開始尋寶啦！';
