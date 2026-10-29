import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createInputRouter} from '../input-router.mjs';
test('mouse immediately takes over an active hand',()=>{
 const r=createInputRouter();assert.ok(r.accept('hand',true,0));assert.ok(r.accept('mouse',true,100));assert.equal(r.owner,'mouse');assert.equal(r.accept('hand',true,101),false);
});
test('mouse can complete a dwell while a hand keeps reporting, closing or disappearing',()=>{
 const r=createInputRouter();r.accept('mouse',true,0);for(const t of [50,500,1800,2200]){assert.equal(r.accept('hand',true,t),false);assert.equal(r.accept('hand',false,t),false);}assert.equal(r.owner,'mouse');
});
test('a valid hand resumes after the mouse idle period; new mouse motion renews it',()=>{
 const r=createInputRouter();r.accept('mouse',true,0);r.accept('mouse',true,1000);assert.equal(r.accept('hand',true,3000),false);assert.equal(r.accept('hand',true,3800),true);assert.equal(r.owner,'hand');
});
test('leaving the artwork releases the mouse so the hand can resume',()=>{
 const r=createInputRouter();r.accept('mouse',true,0);assert.ok(r.accept('mouse',false,100));assert.ok(r.accept('hand',true,101));assert.equal(r.owner,'hand');
});
test('closing the controlling hand pauses it without deactivating a mouse',()=>{
 const r=createInputRouter();r.accept('hand',true,0);assert.ok(r.accept('hand',false,1));assert.equal(r.owner,'none');r.accept('mouse',true,10);assert.equal(r.accept('hand',false,5000),false);assert.equal(r.owner,'mouse');
});
