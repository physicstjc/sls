import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createMotor} from '../motor.js';

// Exercise real Three.js geometry and transforms; replace only browser rendering.
const context={exports:{},console};
context.module={exports:context.exports};
vm.runInNewContext(fs.readFileSync(new URL('../vendor/three.r128.min.js',import.meta.url),'utf8'),context);
const T=context.exports;
let nextFrame,renderedScene,renderedCamera;
T.WebGLRenderer=class{
  constructor(){this.domElement={setAttribute(){},addEventListener(){}};}
  setPixelRatio(){}setClearColor(){}setSize(){}dispose(){}
  render(scene,camera){renderedScene=scene;renderedCamera=camera;}
};
T.OrbitControls=class{constructor(camera){this.camera=camera;this.target=new T.Vector3();}reset(){}update(){this.camera.lookAt(this.target);}dispose(){}};
globalThis.window={THREE:T};globalThis.devicePixelRatio=1;
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillText(){},beginPath(){},arc(){},fill(){},stroke(){}})})};
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
globalThis.requestAnimationFrame=fn=>{nextFrame=fn;return 1;};globalThis.cancelAnimationFrame=()=>{};
const motor=createMotor({appendChild(){},clientWidth:1000,clientHeight:700});
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
