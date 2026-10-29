import {test} from 'node:test';
import assert from 'node:assert/strict';
import {palmControl,smoothPoint} from '../hand-math.mjs';
function hand(x=.4,y=.5,open=true){const h=Array.from({length:21},()=>({x,y}));h[0].y=y+.1;for(const [tip,pip]of [[8,6],[12,10],[16,14],[20,18]]){h[pip].y=y-.05;h[tip].y=y+(open?-.2:.08);}return h;}
test('mirroring maps physical hand movement to opposite image coordinate',()=>{const a=palmControl(hand(.3)),b=palmControl(hand(.7));assert.ok(a.x>b.x);assert.ok(palmControl(hand(.3),false).x<palmControl(hand(.7),false).x);});
test('working area reaches both edges and clamps out-of-frame coordinates',()=>{assert.equal(palmControl(hand(.02)).x,1);assert.equal(palmControl(hand(.98)).x,0);});
test('open hand runs; closed hand pauses; missing or malformed landmarks stop',()=>{assert.equal(palmControl(hand()).open,true);assert.equal(palmControl(hand(.4,.5,false)).open,false);assert.equal(palmControl(null),null);assert.equal(palmControl([{x:NaN,y:0}]),null);});
test('smoothing reduces jitter, converges, and is frame-rate independent',()=>{let p={x:0,y:0};for(let i=0;i<15;i++)p=smoothPoint(p,{x:1,y:1},1/30);const q=smoothPoint(null,{x:.5,y:.5},.1);assert.ok(p.x>.99&&p.x<=1);assert.deepEqual(q,{x:.5,y:.5});const a=smoothPoint({x:0,y:0},{x:1,y:1},.1),b=smoothPoint(smoothPoint({x:0,y:0},{x:1,y:1},.05),{x:1,y:1},.05);assert.ok(Math.abs(a.x-b.x)<1e-9);});
