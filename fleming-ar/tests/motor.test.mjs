import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createMotor} from '../motor.js';
import {assessHand} from '../assessment.js';
import {pose} from './hand-fixture.mjs';

// Exercise real Three.js geometry and transforms; replace only browser rendering.
const context={exports:{},console};
context.module={exports:context.exports};
vm.runInNewContext(fs.readFileSync(new URL('../vendor/three.r128.min.js',import.meta.url),'utf8'),context);
const T=context.exports;
let nextFrame,renderedScene,renderedCamera,orbitControls;
T.WebGLRenderer=class{
  constructor(){this.domElement={setAttribute(){},addEventListener(){}};}
  setPixelRatio(){}setClearColor(){}setSize(){}dispose(){}
  render(scene,camera){renderedScene=scene;renderedCamera=camera;}
};
T.OrbitControls=class{
  constructor(camera){orbitControls=this;this.camera=camera;this.target=new T.Vector3();this.enabled=true;this.listeners={};}
  reset(){}update(){this.camera.lookAt(this.target);this.dispatchEvent({type:'change'});}dispose(){}
  addEventListener(type,listener){(this.listeners[type]||=[]).push(listener);}
  dispatchEvent(event){for(const listener of this.listeners[event.type]||[])listener(event);}
};
globalThis.window={THREE:T};globalThis.devicePixelRatio=1;
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillText(){},beginPath(){},arc(){},fill(){},stroke(){}})})};
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
globalThis.requestAnimationFrame=fn=>{nextFrame=fn;return 1;};globalThis.cancelAnimationFrame=()=>{};
const viewChanges=[];
const motor=createMotor({appendChild(){},clientWidth:1000,clientHeight:700},{onViewChange:event=>viewChanges.push(event)});
const frame=()=>nextFrame(performance.now());
const object=name=>renderedScene.getObjectByName(name);
const direction=arrow=>new T.Vector3(0,1,0).applyQuaternion(arrow.quaternion);

test('permanent red and black coil meshes retain their materials through rotation and selection',()=>{
  for(const phase of [0,45,90,180,270,360])for(const side of ['a','b']){
    motor.sync({practice:true,phase,side});frame();
    assert.equal(object('coil-red').material.color.getHex(),0xc7293d);
    assert.equal(object('coil-black').material.color.getHex(),0x171d24);
    assert.ok(Math.abs(object('rotor').rotation.z-phase*Math.PI/180)<1e-9);
  }
});
test('rendered current arrows reverse on the same coil half every half-turn',()=>{
  motor.sync({practice:true,phase:0,current:1,power:60});frame();assert.ok(direction(object('current-a')).z>.99);
  motor.sync({phase:180});frame();assert.ok(direction(object('current-a')).z<-.99);
  motor.sync({phase:90});frame();assert.equal(object('current-a').visible,false);assert.equal(object('force-a').visible,false);assert.equal(motor.getTargets().reason,'gap');
});
test('swapping connections moves lead endpoints while red stays attached to the same positive cell terminal',()=>{
  motor.sync({current:1});frame();
  const old=object('positive-red-lead').geometry.parameters.path.points;
  const start=old[0].clone(),brushX=old.at(-1).x;
  motor.sync({current:-1});frame();
  const changed=object('positive-red-lead');const points=changed.geometry.parameters.path.points;
  assert.equal(changed.material.color.getHex(),0xc7293d);assert.equal(object('negative-black-lead').material.color.getHex(),0x171d24);
  assert.ok(points[0].distanceTo(start)<1e-9);assert.equal(points.at(-1).x,-brushX);
});
test('hand assessment targets agree with rendered current and force in camera coordinates',()=>{
  for(const phase of [0,180])for(const side of ['a','b']){
    motor.sync({practice:true,phase,side,current:1});frame();const target=motor.getTargets();
    for(const [name,key]of [['current-','i'],['force-','f']]){
      const cameraDirection=direction(object(name+side)).applyQuaternion(renderedCamera.quaternion.clone().invert());
      assert.ok(cameraDirection.distanceTo(new T.Vector3(...target[key]))<1e-9);
    }
  }
});
test('practice permits orbiting and updates B, I, F targets at side, rear and elevated views',()=>{
  motor.sync({practice:true,phase:0,side:'a',field:1,current:1});assert.equal(orbitControls.enabled,true);
  orbitControls.dispatchEvent({type:'start'});
  for(const position of [[0,2.1,14.6],[14.6,2.1,0],[0,2.1,-14.6],[-14.6,2.1,0],[3,14,6]]){
    renderedCamera.position.set(...position);orbitControls.update();frame();const target=motor.getTargets();
    const expectedB=new T.Vector3(1,0,0).applyQuaternion(renderedCamera.quaternion.clone().invert());
    assert.ok(expectedB.distanceTo(new T.Vector3(...target.b))<1e-9);
    for(const [name,key]of [['current-','i'],['force-','f']]){
      const shown=direction(object(name+'a')).applyQuaternion(renderedCamera.quaternion.clone().invert());
      assert.ok(shown.distanceTo(new T.Vector3(...target[key]))<1e-9);
    }
    assert.equal(assessHand(pose(target)).match,true,'matching the rotated vectors should pass');
  }
  orbitControls.dispatchEvent({type:'end'});
  assert.ok(viewChanges.some(event=>event.moving));assert.equal(viewChanges.at(-1).moving,false);
});
test('an old front-view hand pose fails after orbiting to the rear',()=>{
  motor.sync({practice:true,phase:0,side:'a',field:1,current:1});motor.resetView();frame();
  const original=pose(motor.getTargets());assert.equal(assessHand(original).match,true);
  renderedCamera.position.set(0,2.1,-14.6);orbitControls.update();frame();
  assert.equal(assessHand({...original,target:motor.getTargets()}).match,false);
  assert.equal(assessHand(pose(motor.getTargets())).match,true);
});
