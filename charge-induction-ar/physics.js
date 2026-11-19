/* Distances in illustrative lab units. +x initially points from sphere to rod.
   Grounding fixes a qualitative equilibrium; isolation conserves net charge. */
(function(root){
const COUNT=64,RADIUS=1;
function strength(gap){return Math.max(0,Math.exp(-Math.max(.15,gap)/1.35)-Math.exp(-5/1.35));}
function equilibrium(gap){return Math.round(28*strength(gap));}
function advance(state,dt){if(state.grounded&&!state.paused){state.relax+=dt;while(state.relax>=.055){state.relax-=.055;const goal=equilibrium(state.gap);state.missing+=Math.sign(goal-state.missing);}}else state.relax=0;return state;}
function direction(i){const y=1-2*(i+.5)/COUNT,a=i*2.399963229728653;return {x:Math.cos(a)*Math.sqrt(1-y*y),y,z:Math.sin(a)*Math.sqrt(1-y*y)};}
const api={COUNT,RADIUS,strength,equilibrium,advance,direction};root.ChargePhysics=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
