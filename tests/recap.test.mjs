import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recapFrame,RECAP_SEGMENT_SECONDS,recapDuration} from '../recap.mjs';
const chapters=[{x:15400},{x:13650},{x:11100},{x:5200},{x:300}];
test('the tour holds before moving and finishes immediately on reaching the gate',()=>{
 assert.equal(RECAP_SEGMENT_SECONDS,12);assert.equal(recapDuration(chapters),48);
 for(let i=0;i<4;i++){
  const start=i*12,expected=chapters[4-i].x;
  assert.equal(recapFrame(chapters,start).x,expected);
  assert.equal(recapFrame(chapters,start+2).x,expected);
 }
 assert.equal(recapFrame(chapters,47.99).done,false);
 assert.deepEqual(recapFrame(chapters,48),{done:true,index:0,x:15400});
 assert.deepEqual(recapFrame([{x:30}],0),{done:true,index:0,x:30});
});
test('the tour moves continuously from the deepest scene to the gate without overshooting',()=>{
 let previous=300;
 for(let second=0;second<=60;second+=.1){const {x}=recapFrame(chapters,second);assert.ok(x>=previous-.001&&x<=15400);previous=x;}
 assert.equal(recapFrame(chapters,-1).x,300);
});
