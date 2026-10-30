import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recapFrame,RECAP_SEGMENT_SECONDS} from '../recap.mjs';
const chapters=[{x:15400},{x:13650},{x:11100},{x:5200},{x:300}];
test('the return tour lasts 60 seconds and holds each inspected region before moving',()=>{
 assert.equal(RECAP_SEGMENT_SECONDS*chapters.length,60);
 for(let i=0;i<5;i++){
  const start=i*12,expected=chapters[4-i].x;
  assert.equal(recapFrame(chapters,start).x,expected);
  assert.equal(recapFrame(chapters,start+2).x,expected);
 }
 assert.equal(recapFrame(chapters,59.99).done,false);
 assert.deepEqual(recapFrame(chapters,60),{done:true,index:0,x:15400});
});
test('the tour moves continuously from the deepest scene to the gate without overshooting',()=>{
 let previous=300;
 for(let second=0;second<=60;second+=.1){const {x}=recapFrame(chapters,second);assert.ok(x>=previous-.001&&x<=15400);previous=x;}
 assert.equal(recapFrame(chapters,-1).x,300);
});
