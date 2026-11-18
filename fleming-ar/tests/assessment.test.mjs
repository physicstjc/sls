import test from 'node:test';
import assert from 'node:assert/strict';
import {targets,assessHand,HoldTracker,angle,unit} from '../assessment.js';

import {pose} from './hand-fixture.mjs';

test('all eight polarity / conductor combinations obey I cross B',()=>{
  for(const field of [1,-1])for(const current of [1,-1])for(const side of ['a','b']){
    const t=targets({field,current,side});const r=assessHand(pose(t));assert.equal(r.match,true,JSON.stringify({field,current,side,r}));
    assert.equal(t.f[1],field*current*(side==='a'?1:-1));
  }
});
test('reversing one input reverses force; reversing both preserves force',()=>{
  assert.equal(targets({field:-1}).f[1],-1);assert.equal(targets({current:-1}).f[1],-1);assert.equal(targets({field:-1,current:-1}).f[1],1);
});
test('right angles alone do not pass a direction check',()=>{
  const p=pose();p.target=targets({field:-1});const r=assessHand(p);assert.equal(r.match,false);assert.equal(r.code,'direction');assert.equal(r.angles.b,180);
});
test('hand confirmation is required and the other hand is rejected',()=>{
  assert.equal(assessHand({...pose(),confirmedLabel:null}).code,'confirm');
  assert.equal(assessHand({...pose(),handedness:'Right'}).code,'wrong-hand');
  assert.equal(assessHand({...pose(),handedness:'Right',confirmedLabel:'Right'}).match,true,'explicit left-hand calibration can use either model label');
});
test('missing, low-confidence, clipped and nonfinite inputs withhold assessment',()=>{
  assert.equal(assessHand({...pose(),world:undefined}).code,'missing');
  assert.equal(assessHand({...pose(),confidence:.6}).code,'uncertain');
  let p=pose();p.landmarks[8].x=.999;assert.equal(assessHand(p).code,'frame');
  p=pose();p.world[4].z=NaN;assert.equal(assessHand(p).code,'uncertain');
});
test('bent joints pass when the overall finger directions match',()=>{
  const p=pose();p.world[6].y+=.035;p.world[10].x+=.035;p.world[3].x+=.035;
  assert.equal(assessHand(p).match,true);
});
test('indeterminate and nonperpendicular finger directions cannot pass',()=>{
  let p=pose();p.world[8]={...p.world[5]};assert.equal(assessHand(p).code,'uncertain');
  p=pose();p.world[12]={x:p.world[9].x+.08,y:0,z:0};p.world[10]={x:.03,y:0,z:0};assert.equal(assessHand(p).code,'direction');
});
test('zero supply cannot be awarded a force match',()=>{
  const p=pose();p.target=targets({power:0});assert.equal(assessHand(p).code,'off');
});
test('an end-on middle finger can match using its estimated 3D direction',()=>{
  const p=pose();for(const k of [10,11,12])p.landmarks[k]={...p.landmarks[9]};assert.equal(assessHand(p).match,true);
});
test('continuous hold awards after 1.2 seconds and only once while held',()=>{
  const h=new HoldTracker();let r;for(let t=0;t<=1300;t+=100)r=h.update(true,t);assert.equal(r.complete,true);assert.equal(h.update(true,1400).newAward,false);
});
test('mismatch or stale camera frames reset the hold',()=>{
  const h=new HoldTracker();h.update(true,0);h.update(true,100);h.update(false,200);assert.equal(h.elapsed,0);
  h.update(true,300);h.update(true,400);assert.equal(h.update(true,1500).complete,false);assert.equal(h.elapsed,0);
});
test('vector angle handles degenerate and opposite directions',()=>{assert.equal(angle([0,0,0],[1,0,0]),180);assert.equal(angle([1,0,0],[-1,0,0]),180);});
