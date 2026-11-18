import test from 'node:test';
import assert from 'node:assert/strict';
import {directionLabel} from '../view-directions.js';
test('screen-axis and depth hints follow the camera-space vector',()=>{
  for(const [v,label]of [[[1,0,0],'→ Right'],[[-1,0,0],'← Left'],[[0,1,0],'↑ Up'],[[0,-1,0],'↓ Down'],[[0,0,1],'⊙ Toward you'],[[0,0,-1],'⊗ Away from you']])assert.equal(directionLabel(v),label);
});
test('oblique directions show the screen diagonal and depth component',()=>{
  assert.equal(directionLabel([1,1,1]),'↗ Up-right · ⊙ Toward');
  assert.equal(directionLabel([-1,-1,-1]),'↙ Down-left · ⊗ Away');
});
test('direction hints are scale invariant and reject invalid vectors',()=>{
  assert.equal(directionLabel([8,0,0]),directionLabel([1,0,0]));
  assert.equal(directionLabel([0,0,0]),'—');assert.equal(directionLabel([NaN,0,0]),'—');
});
