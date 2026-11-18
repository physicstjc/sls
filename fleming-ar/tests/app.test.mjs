import test from 'node:test';
import assert from 'node:assert/strict';
import {pose} from './hand-fixture.mjs';

// Unit-test activity state and camera cancellation without a browser or webcam.
const nodes=new Map(),listeners=new Map();
function element(){return {hidden:false,disabled:false,value:0,textContent:'',style:{},clientWidth:400,clientHeight:600,videoWidth:640,videoHeight:480,classList:{toggle(){}},setAttribute(){},addEventListener(){},getContext(){return {clearRect(){},setTransform(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){},fillRect(){},fillText(){},measureText(){return {width:70};}};}};}
globalThis.document={hidden:false,getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},querySelector(){return element();},addEventListener(name,fn){listeners.set(name,fn);}};
globalThis.window={isSecureContext:false,addEventListener(){}};
globalThis.requestAnimationFrame=()=>0;globalThis.devicePixelRatio=1;
let getMedia;
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:(...args)=>getMedia(...args)}}});
const {processResult}=await import('../app.js');
const $=id=>nodes.get(id);

test('practice holds rotor and exposes consistent direction targets',()=>{
  $('practice-mode').onclick();assert.equal($('practice-panel').hidden,false);assert.equal($('play-pause').disabled,true);
  assert.equal($('target-b').textContent,'→ Right');assert.equal($('target-f').textContent,'↑ Up');
  $('wire-b').onclick();assert.equal($('target-i').textContent,'⊗ Away from you');assert.equal($('target-f').textContent,'↓ Down');
  $('reverse-field').onclick();assert.equal($('target-b').textContent,'← Left');assert.equal($('target-f').textContent,'↑ Up');
  $('explore-mode').onclick();assert.equal($('practice-panel').hidden,true);assert.equal($('play-pause').disabled,false);
});
test('insecure context explains camera requirement without requesting access',async()=>{
  let requested=false;getMedia=()=>{requested=true;};await $('start-camera').onclick();assert.equal(requested,false);assert.match($('feedback-title').textContent,/secure/);
});
test('coil orientation updates contacts and assessment targets for the same selected coloured half',()=>{
  $('practice-mode').onclick();
  $('coil-phase').oninput({target:{value:'180'}});
  assert.match($('red-contact').textContent,/negative/);assert.match($('black-contact').textContent,/positive/);
  $('coil-phase').oninput({target:{value:'90'}});assert.match($('target-i').textContent,/gap/);assert.equal($('target-f').textContent,'No force');
  $('coil-phase').oninput({target:{value:'0'}});assert.match($('red-contact').textContent,/positive/);
  $('explore-mode').onclick();
});
test('camera rejection leaves a recoverable app with no confirmed hand',async()=>{
  window.isSecureContext=true;getMedia=async()=>{throw Object.assign(new Error('Test denial'),{name:'NotAllowedError'});};
  const original=console.error;console.error=()=>{};try{await $('start-camera').onclick();}finally{console.error=original;}
  assert.match($('feedback-message').textContent,/declined/);assert.equal($('start-camera').disabled,false);assert.equal($('confirm-left').disabled,true);
});
test('a permission response arriving after Explore stops its camera tracks',async()=>{
  $('practice-mode').onclick();let resolve,stops=0;getMedia=()=>new Promise(r=>resolve=r);
  const starting=$('start-camera').onclick();assert.equal($('start-camera').disabled,true);
  $('explore-mode').onclick();resolve({getTracks:()=>[{stop(){stops++;}}]});await starting;
  assert.equal(stops,1);assert.equal($('camera-controls').hidden,true);assert.equal($('camera').srcObject,null);
});
test('hiding activity cancels a pending camera permission response',async()=>{
  $('practice-mode').onclick();let resolve,stops=0;getMedia=()=>new Promise(r=>resolve=r);
  const starting=$('start-camera').onclick();document.hidden=true;listeners.get('visibilitychange')();
  resolve({getTracks:()=>[{stop(){stops++;}}]});await starting;document.hidden=false;
  assert.equal(stops,1);assert.match($('feedback-title').textContent,/privacy/);
});

function arrangeMatchingPose(){
  $('practice-mode').onclick();$('wire-a').onclick();$('coil-phase').oninput({target:{value:'0'}});
  if($('target-b').textContent!=='→ Right')$('reverse-field').onclick();
  if($('target-i').textContent!=='⊙ Toward you')$('reverse-current').onclick();
  const p=pose();for(const k of [10,11,12])p.landmarks[k]={...p.landmarks[9]};
  return {landmarks:[p.landmarks],worldLandmarks:[p.world],handedness:[[{categoryName:'Left',score:.98}]]};
}
test('a matching landmark result produces immediate positive feedback after hand confirmation',()=>{
  const result=arrangeMatchingPose(),now=performance.now();
  processResult(result,now);assert.notEqual($('feedback-title').textContent,'Correct! ✓');
  assert.equal($('confirm-left').disabled,false);$('confirm-left').onclick();
  processResult(result,now+100);assert.equal($('feedback-title').textContent,'Good match!');
  assert.match($('live-coach').className,/success/);assert.equal($('check-b').textContent,'Field ✓');
  for(const t of [250,400,550])processResult(result,now+t);
  assert.equal($('live-coach-title').textContent,'Correct! ✓');assert.equal($('match-count').textContent,'1 matched');
});
test('success remains visible after the hand leaves and is not counted twice',()=>{
  processResult({landmarks:[]},performance.now()+1000);
  assert.equal($('live-coach-title').textContent,'Correct! ✓');assert.equal($('match-count').textContent,'1 matched');
});
test('changing the coil side clears the previous success instead of accepting the old pose',()=>{
  $('wire-b').onclick();assert.notEqual($('live-coach-title').textContent,'Correct! ✓');
  const p=pose();processResult({landmarks:[p.landmarks],worldLandmarks:[p.world],handedness:[[{categoryName:'Left',score:.98}]]},performance.now()+2000);
  assert.notEqual($('live-coach-title').textContent,'Correct! ✓');
});
