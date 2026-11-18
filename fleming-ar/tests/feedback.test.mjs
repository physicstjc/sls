import test from 'node:test';
import assert from 'node:assert/strict';
import {AttemptFeedback,MATCH_HOLD_SECONDS} from '../feedback.js';
const good={code:'match',match:true,angles:{b:5,i:10,f:7}};
const bad={code:'direction',match:false,angles:{b:5,i:160,f:7}};
test('positive recognition is immediate, with a short hold for completion',()=>{
  const a=new AttemptFeedback();assert.equal(a.update(good,0).phase,'matching');
  a.update(good,150);a.update(good,300);const r=a.update(good,450);
  assert.equal(r.phase,'correct');assert.equal(r.newAward,true);assert.equal(r.elapsed,MATCH_HOLD_SECONDS);
});
test('a brief tracking wobble does not erase a nearly completed pose',()=>{
  const a=new AttemptFeedback();a.update(good,0);a.update(good,150);a.update(bad,220);a.update(good,300);
  a.update(good,450);assert.equal(a.update(good,600).phase,'correct');
});
test('persistent mismatch or stale frames cannot accumulate a success',()=>{
  const a=new AttemptFeedback();a.update(good,0);a.update(good,150);a.update(bad,450);
  assert.equal(a.update(good,600).phase,'matching');assert.equal(a.update(good,1600).elapsed,0);
});
test('wrong hand and supply gaps clear pending credit immediately',()=>{
  for(const code of ['wrong-hand','confirm','gap','off']){
    const a=new AttemptFeedback();a.update(good,0);a.update(good,150);
    assert.equal(a.update({code,match:false},200).elapsed,0);
  }
});
test('correct result is retained until the next attempt, not overwritten by lost hands',()=>{
  const a=new AttemptFeedback();for(const t of [0,150,300,450])a.update(good,t);
  assert.equal(a.update({code:'missing',match:false},900).phase,'correct');
  assert.equal(a.update(bad,1000).newAward,false);a.reset();assert.equal(a.update(bad,1100).phase,'adjust');
});
