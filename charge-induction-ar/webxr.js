/* WebXR owns camera poses and the immersive frame loop. Lab coordinates remain
   illustrative units; one lab unit is 4.5 cm in immersive mode. */
export class WebXRExperiment {
 constructor({THREE,renderer,camera,scene,root,overlay,getObject,onMove,onState,onExit}){
  Object.assign(this,{T:THREE,renderer,camera,scene,root,overlay,getObject,onMove,onState,onExit});
  this.session=null;this.placed=false;this.hitSource=null;this.referenceSpace=null;this.input=null;this.grab=null;this.pinches=new Map();this.pending=false;
  this.reticle=new THREE.Mesh(new THREE.RingGeometry(.065,.08,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x19c7ad,side:THREE.DoubleSide}));
  this.reticle.matrixAutoUpdate=false;this.reticle.visible=false;scene.add(this.reticle);
  overlay.addEventListener('beforexrselect',e=>{if(e.target.closest?.('button,input,select,summary,a,#panel'))e.preventDefault();});
 }
 get active(){return !!this.session;}
 async supported(){return !!(navigator.xr&&await navigator.xr.isSessionSupported('immersive-ar'));}
 async start(){
  if(this.active||this.pending)return;this.pending=true;
  try{
   if(!navigator.xr)throw new Error('WebXR AR is unavailable in this browser. Use Camera + hand tracking instead.');
   const session=await navigator.xr.requestSession('immersive-ar',{requiredFeatures:['hit-test','dom-overlay'],optionalFeatures:['hand-tracking'],domOverlay:{root:this.overlay}});
   this.session=session;this.placed=false;this.root.visible=false;
   session.addEventListener('end',()=>this.finish(),{once:true});
   session.addEventListener('selectstart',e=>this.selectStart(e));session.addEventListener('selectend',()=>this.release());
   session.addEventListener('inputsourceschange',e=>{if([...e.removed].includes(this.input))this.release();for(const input of e.removed)this.pinches.delete(input);});
   session.addEventListener('visibilitychange',()=>{if(session.visibilityState!=='visible')this.release();});
   this.renderer.xr.enabled=true;this.renderer.xr.setReferenceSpaceType('local');await this.renderer.xr.setSession(session);
   if(this.session!==session)throw new Error('AR session ended. You can start it again.');
   this.referenceSpace=this.renderer.xr.getReferenceSpace();const viewer=await session.requestReferenceSpace('viewer');
   if(this.session!==session)throw new Error('AR session ended. You can start it again.');
   const source=await session.requestHitTestSource({space:viewer});
   if(this.session!==session){source.cancel();throw new Error('AR session ended. You can start it again.');}
   this.hitSource=source;
   this.onState('Scan a well-lit table. Tap when the green ring appears.');
  }catch(e){if(this.session){try{await this.session.end();}catch{this.finish();}}throw e;}
  finally{this.pending=false;}
 }
 async stop(){if(this.session)await this.session.end();}
 finish(){
  this.hitSource?.cancel();this.hitSource=null;this.session=null;this.referenceSpace=null;this.placed=false;this.release();this.pinches.clear();this.reticle.visible=false;
  this.root.position.set(0,0,0);this.root.quaternion.identity();this.root.scale.setScalar(1);this.root.visible=true;this.root.updateMatrixWorld(true);
  this.onExit();
 }
 place(){
  if(!this.reticle.visible)return false;
  this.reticle.matrix.decompose(this.root.position,this.root.quaternion,new this.T.Vector3());this.root.scale.setScalar(.045);this.root.visible=true;this.root.updateMatrixWorld(true);
  this.placed=true;this.reticle.visible=false;this.release();this.onState('Placed · move the phone to look around. Touch-drag the selected object; pinch nearby on supported hand-tracking devices.');return true;
 }
 reposition(){if(!this.active)return;this.placed=false;this.root.visible=false;this.release();this.onState('Scan the table again, then tap the green ring.');}
 localPoint(world){this.root.updateMatrixWorld(true);return this.root.worldToLocal(world.clone());}
 pointFromRay(frame,input){
  const pose=frame.getPose(input.targetRaySpace,this.referenceSpace);if(!pose)return null;
  const matrix=new this.T.Matrix4().fromArray(pose.transform.matrix),ray=new this.T.Ray(new this.T.Vector3().setFromMatrixPosition(matrix),new this.T.Vector3(0,0,-1).transformDirection(matrix));
  this.root.updateMatrixWorld(true);ray.applyMatrix4(this.root.matrixWorld.clone().invert());if(Math.abs(ray.direction.y)<.06)return null;
  return ray.intersectPlane(new this.T.Plane(new this.T.Vector3(0,1,0),-2.25),new this.T.Vector3());
 }
 begin(point,input,nearOnly=false){
  if(!point||!this.placed)return false;const obj=this.getObject(),anchor=obj.position.clone();if(obj.userData.isStand)anchor.y+=2.25;
  if((nearOnly?point.distanceTo(anchor):Math.hypot(point.x-anchor.x,point.z-anchor.z))>1.3)return false;
  this.grab={obj,offset:obj.position.clone().sub(point)};this.input=input;this.onState('Grabbed · move to reposition, release to drop.');return true;
 }
 move(point){if(!point||!this.grab)return;const p=point.clone().add(this.grab.offset),o=this.grab.obj;o.position.x=this.T.MathUtils.clamp(p.x,-4,5);o.position.z=this.T.MathUtils.clamp(p.z,-3,3);this.onMove();}
 release(){this.grab=null;this.input=null;}
 selectStart(event){if(event.inputSource.hand)return;if(!this.placed){this.place();return;}this.begin(this.pointFromRay(event.frame,event.inputSource),event.inputSource);}
 update(frame){
  if(!this.active||!frame||!this.referenceSpace)return;
  const viewer=frame.getViewerPose(this.referenceSpace);if(!viewer){this.root.visible=false;this.reticle.visible=false;this.release();this.onState('Tracking interrupted · move the phone slowly to recover.');return;}
  this.root.visible=this.placed;
  if(!this.placed&&this.hitSource){
   this.reticle.visible=false;for(const result of frame.getHitTestResults(this.hitSource)){
    const pose=result.getPose(this.referenceSpace);if(!pose)continue;const m=new this.T.Matrix4().fromArray(pose.transform.matrix);
    if(m.elements[5]<.85)continue;this.reticle.matrix.copy(m);this.reticle.visible=true;break;
   }
  }
  if(this.input&&!this.input.hand)this.move(this.pointFromRay(frame,this.input));
  for(const source of this.session.inputSources){
   if(!source.hand)continue;const thumb=source.hand.get('thumb-tip'),index=source.hand.get('index-finger-tip');
   const a=thumb&&frame.getJointPose(thumb,this.referenceSpace),b=index&&frame.getJointPose(index,this.referenceSpace);
   if(!a||!b){this.pinches.delete(source);if(this.input===source)this.release();continue;}
   const p=new this.T.Vector3(b.transform.position.x,b.transform.position.y,b.transform.position.z),q=new this.T.Vector3(a.transform.position.x,a.transform.position.y,a.transform.position.z);
   const before=this.pinches.get(source)||false,pinch=p.distanceTo(q)<(before?.04:.025);this.pinches.set(source,pinch);
   if(pinch&&!before){if(!this.placed)this.place();else this.begin(this.localPoint(p),source,true);}
   if(pinch&&this.input===source)this.move(this.localPoint(p));if(!pinch&&this.input===source)this.release();
  }
 }
}
