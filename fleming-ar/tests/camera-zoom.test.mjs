import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraFrame,landmarkPoint,installCameraPinch} from '../camera-zoom.js';

test('default camera frame matches the original screen-filling crop',()=>{
  const f=cameraFrame(400,600,640,480);assert.equal(f.width,800);assert.equal(f.height,600);assert.equal(f.left,-200);assert.equal(f.top,0);
});
test('zooming out reaches the entire original camera frame without distortion',()=>{
  const f=cameraFrame(400,600,640,480,0);assert.equal(f.zoom,.5);assert.equal(f.width,400);assert.equal(f.height,300);assert.equal(f.left,0);assert.equal(f.top,150);
  assert.equal(f.width/f.height,640/480);
});
test('zoom limits and invalid camera metadata are handled safely',()=>{
  assert.equal(cameraFrame(400,600,640,480,99).zoom,4);assert.equal(cameraFrame(400,600,640,480,NaN).zoom,1);
  assert.equal(cameraFrame(400,600,0,0),null);assert.equal(cameraFrame(0,600,640,480),null);
});
test('landmarks remain aligned with the video at every zoom',()=>{
  for(const z of [.5,1,2,4]){
    const f=cameraFrame(400,600,640,480,z);
    assert.deepEqual(landmarkPoint({x:.5,y:.5},f),[200,300]);
    const p=landmarkPoint({x:.25,y:.25},f);
    assert.equal(p[0],f.left+f.width/4);assert.equal(p[1],f.top+f.height/4);
  }
  assert.deepEqual(landmarkPoint({x:.25,y:.5},cameraFrame(400,600,640,480,2)),[-200,300]);
});
function setup(){
  const handlers={},options={},changes=[];let zoom=1,enabled=true;
  const surface={addEventListener(type,fn,opts){handlers[type]=fn;options[type]=opts;}};
  const controller=installCameraPinch(surface,{enabled:()=>enabled,getZoom:()=>zoom,onZoom:value=>zoom=cameraFrame(400,600,640,480,value).zoom,onGesture:active=>changes.push(active)});
  function event(type,points,button=false){
    const e={touches:points.map(([clientX,clientY])=>({clientX,clientY})),target:{closest:()=>button?{}:null},cancelable:true,prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};
    handlers[type](e);return e;
  }
  return {event,changes,options,controller,get zoom(){return zoom;},set enabled(value){enabled=value;}};
}
test('a two-finger spread zooms in and inward pinch zooms out',()=>{
  const p=setup();p.event('touchstart',[[0,0],[100,0]]);p.event('touchmove',[[0,0],[200,0]]);assert.equal(p.zoom,2);
  p.event('touchmove',[[0,0],[50,0]]);assert.equal(p.zoom,.5);assert.deepEqual(p.changes,[true]);
  p.event('touchend',[]);assert.deepEqual(p.changes,[true,false]);
});
test('one-finger rotation and non-camera gestures pass through',()=>{
  const p=setup();assert.equal(p.event('touchstart',[[10,10]]).stopped,false);assert.equal(p.event('touchmove',[[20,20]]).stopped,false);
  p.enabled=false;assert.equal(p.event('touchstart',[[0,0],[100,0]]).stopped,false);assert.equal(p.zoom,1);
});
test('pinch events are captured before model/browser zoom handlers',()=>{
  const p=setup();const start=p.event('touchstart',[[0,0],[100,0]]),move=p.event('touchmove',[[0,0],[120,0]]);
  assert.equal(start.prevented,true);assert.equal(move.stopped,true);assert.equal(p.options.touchmove.capture,true);assert.equal(p.options.touchmove.passive,false);
});
test('lifting one finger does not turn the remaining touch into a model drag',()=>{
  const p=setup();p.event('touchstart',[[0,0],[100,0]]);p.event('touchend',[[0,0]]);
  assert.equal(p.event('touchmove',[[30,30]]).stopped,true);p.event('touchend',[]);
  assert.equal(p.event('touchmove',[[50,50]]).stopped,false);
});
test('cancellation restores gestures and leaves no stale pinch baseline',()=>{
  const p=setup();p.event('touchstart',[[0,0],[100,0]]);p.event('touchmove',[[0,0],[200,0]]);p.event('touchcancel',[]);
  assert.deepEqual(p.changes,[true,false]);p.event('touchstart',[[0,0],[50,0]]);p.event('touchmove',[[0,0],[100,0]]);assert.equal(p.zoom,4);
  p.controller.cancel();assert.deepEqual(p.changes,[true,false,true,false]);
});
test('buttons and instruction cards do not begin camera pinching',()=>{
  const p=setup();assert.equal(p.event('touchstart',[[0,0],[100,0]],true).stopped,false);assert.deepEqual(p.changes,[]);
});
