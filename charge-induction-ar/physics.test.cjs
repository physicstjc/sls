const assert=require('node:assert/strict'),P=require('./physics.js');
const state={gap:.15,grounded:false,paused:false,missing:0,relax:0};
function settle(){for(let i=0;i<150;i++)P.advance(state,.05);}
settle();assert.equal(state.missing,0,'isolated neutral sphere conserves electrons');
state.grounded=true;settle();assert.equal(state.missing,24,'near rod drives electrons to earth');
state.grounded=false;state.gap=5;settle();assert.equal(state.missing,24,'disconnecting before withdrawal traps positive charge');
state.grounded=true;settle();assert.equal(state.missing,0,'grounded sphere neutralises when rod is far');
state.paused=true;state.gap=.15;settle();assert.equal(state.missing,0,'pause freezes electron transfer');
for(let i=0;i<P.COUNT;i++){const n=P.direction(i);assert.ok(Math.abs(Math.hypot(n.x,n.y,n.z)-1)<1e-9);}
assert.ok(P.strength(.15)>P.strength(2));assert.equal(P.strength(5),0);console.log('Physics checks passed: isolation, earthing, induction retention, return from earth, pause, finite sphere positions.');
