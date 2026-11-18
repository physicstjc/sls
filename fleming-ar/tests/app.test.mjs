import test from 'node:test';
import assert from 'node:assert/strict';

// Unit-test activity state and camera cancellation without a browser or webcam.
const nodes=new Map(),listeners=new Map();
function element(){return {hidden:false,disabled:false,value:0,textContent:'',style:{},classList:{toggle(){}},setAttribute(){},addEventListener(){},getContext(){return {clearRect(){}};}};}
globalThis.document={hidden:false,getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},querySelector(){return element();},addEventListener(name,fn){listeners.set(name,fn);}};
globalThis.window={isSecureContext:false,addEventListener(){}};
globalThis.requestAnimationFrame=()=>0;
let getMedia;
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:(...args)=>getMedia(...args)}}});
await import('../app.js');
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
