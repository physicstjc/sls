import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraFrame,landmarkPoint} from '../camera-zoom.js';

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