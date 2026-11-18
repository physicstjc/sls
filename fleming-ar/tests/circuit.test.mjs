import test from 'node:test';
import assert from 'node:assert/strict';
import {coilCircuit,COMMUTATION_GAP} from '../circuit.js';
import {targets,assessHand} from '../assessment.js';

test('red half touching the red positive lead carries current out of the rear commutator',()=>{
  const c=coilCircuit({theta:0,side:'a'});
  assert.equal(c.brush,'left');assert.equal(c.terminal,'positive');assert.equal(c.direction,1);assert.deepEqual(c.i,[0,0,1]);
});
test('after a half-turn the same red half meets the black negative lead and current reverses',()=>{
  const c=coilCircuit({theta:Math.PI,side:'a'});
  assert.equal(c.brush,'right');assert.equal(c.terminal,'negative');assert.equal(c.direction,-1);
  assert.equal(coilCircuit({theta:Math.PI,side:'b'}).direction,1);
});
test('opposite coil sides always carry opposite currents',()=>{
  for(const theta of [0,.8,2,Math.PI,4.5,5.5])for(const current of [1,-1]){
    const a=coilCircuit({theta,current,side:'a'}),b=coilCircuit({theta,current,side:'b'});
    assert.equal(a.direction,-b.direction);assert.notEqual(a.terminal,b.terminal);
  }
});
test('swapping brush connections changes contact polarity without changing physical brush or coil identity',()=>{
  const a=coilCircuit({theta:0,side:'a',current:1}),b=coilCircuit({theta:0,side:'a',current:-1});
  assert.equal(a.brush,b.brush);assert.equal(a.terminal,'positive');assert.equal(b.terminal,'negative');assert.equal(b.direction,-a.direction);
});
test('insulating gaps interrupt current and cannot be awarded a pose match',()=>{
  for(const phase of [90,270]){
    const c=targets({phase});assert.equal(c.connected,false);assert.equal(c.energised,false);assert.equal(c.direction,0);
    assert.equal(assessHand({target:c}).code,'gap');
  }
  assert.equal(coilCircuit({theta:Math.PI/2-COMMUTATION_GAP-.01}).direction,1);
  assert.equal(coilCircuit({theta:Math.PI/2+COMMUTATION_GAP+.01}).direction,-1);
});
test('force on a fixed coloured half reverses while the turning effect retains its sense',()=>{
  for(const field of [1,-1])for(const current of [1,-1]){
    const a=coilCircuit({theta:0,field,current}),b=coilCircuit({theta:Math.PI,field,current});
    assert.equal(a.f[1],-b.f[1]);assert.equal(Math.sign(a.torqueZ),Math.sign(b.torqueZ));
    assert.equal(Math.sign(a.torqueZ),-field*current);
  }
});
test('supply off retains physical contact but removes current and force',()=>{
  const c=coilCircuit({theta:0,power:0});assert.equal(c.connected,true);assert.equal(c.terminal,'positive');assert.equal(c.direction,0);assert.equal(c.energised,false);
});
