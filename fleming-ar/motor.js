export function createMotor(container){
  const T=window.THREE;
  if(!T)throw new Error('The 3D library could not load. Reload the page.');
  const scene=new T.Scene();
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.setClearColor(0x000000,0);renderer.outputEncoding=T.sRGBEncoding;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','3D DC motor with N and S magnets, a rectangular coil, brushes and split-ring commutator');
  const camera=new T.PerspectiveCamera(37,1,.1,100);
  const controls=new T.OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.enablePan=false;controls.minDistance=7;controls.maxDistance=19;controls.maxPolarAngle=Math.PI*.85;
  scene.add(new T.HemisphereLight(0xe2fff6,0x344c46,.65));
  const light=new T.DirectionalLight(0xfff6df,.85);light.position.set(3,7,7);scene.add(light);
  const fill=new T.DirectionalLight(0x83d7ff,.3);fill.position.set(-6,2,-4);scene.add(fill);
  const root=new T.Group();scene.add(root);
  const mat=(color,metalness=.1,roughness=.45)=>new T.MeshStandardMaterial({color,metalness,roughness});
  const slate=mat(0x496964,.55),copper=mat(0xdd9757,.72,.27),dark=mat(0x1c3432),green=mat(0xc9e8ab),red=mat(0xe87d82),blue=mat(0x7daeda),gold=mat(0xe5bc66,.7);
  function box(w,h,d,m,x=0,y=0,z=0,parent=root){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o;}
  function rod(a,b,r,m,parent=root){const delta=new T.Vector3().subVectors(b,a);const o=new T.Mesh(new T.CylinderGeometry(r,r,delta.length(),14),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());parent.add(o);return o;}
  const v=(x,y,z)=>new T.Vector3(x,y,z);
  function label(text,color,x,y,z,size=.38,parent=root){const c=document.createElement('canvas');c.width=256;c.height=96;const ctx=c.getContext('2d');ctx.clearRect(0,0,256,96);ctx.font='600 52px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,128,48);const texture=new T.CanvasTexture(c);const s=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false}));s.scale.set(size*2.65,size,1);s.position.set(x,y,z);parent.add(s);return s;}
  box(6.7,.22,4.4,slate,0,-1.75,0);
  [-2.7,2.7].forEach(x=>[-1.7,1.7].forEach(z=>box(.35,.15,.35,dark,x,-1.93,z)));
  const leftMag=box(1.18,2.05,2.7,red,-2.65,-.3,-.2),rightMag=box(1.18,2.05,2.7,blue,2.65,-.3,-.2);
  box(1.45,.22,3,slate,-2.65,-1.45,-.2);box(1.45,.22,3,slate,2.65,-1.45,-.2);
  const nl=label('N','#662831',-2.65,.05,1.18,.6),sl=label('S','#173a60',2.65,.05,1.18,.6);
  // Axle is z; the active conductors run along z. Rotor lies in the x-z plane at phase zero.
  rod(v(0,0,-2.1),v(0,0,2.2),.09,gold);
  box(.55,1.75,.38,slate,0,-.85,-1.95);box(.65,.28,.7,dark,0,-1.6,-1.95);
  const rotor=new T.Group();root.add(rotor);
  const wireA=rod(v(-1.38,0,-1.3),v(-1.38,0,1.3),.075,copper,rotor);
  const wireB=rod(v(1.38,0,-1.3),v(1.38,0,1.3),.075,copper,rotor);
  rod(v(-1.38,0,-1.3),v(1.38,0,-1.3),.075,copper,rotor);
  rod(v(-1.38,0,1.3),v(1.38,0,1.3),.075,copper,rotor);
  // Two insulated semicircular copper segments rotate with the coil.
  const commutator=new T.Group();rotor.add(commutator);
  for(let n=0;n<2;n++){
    const ring=new T.Mesh(new T.CylinderGeometry(.33,.33,.42,36,1,false,.06+n*Math.PI,Math.PI-.12),copper);
    ring.rotation.x=Math.PI/2;ring.position.z=1.92;commutator.add(ring);
  }
  rod(v(-1.38,0,1.3),v(-.21,0,1.73),.035,copper,rotor);rod(v(1.38,0,1.3),v(.21,0,1.73),.035,copper,rotor);
  box(.38,.25,.4,dark,-.48,0,1.92);box(.38,.25,.4,dark,.48,0,1.92);
  rod(v(-.67,0,1.92),v(-1.05,-1.2,1.92),.035,red);rod(v(.67,0,1.92),v(1.05,-1.2,1.92),.035,blue);
  box(1.6,.35,.65,dark,0,-1.42,1.72);label('+  DC  −','#d8e7cf',0,-1.38,2.08,.22);
  const la=label('A','#d6f6b8',-1.38,.35,1.4,.29,rotor),lb=label('B','#d6f6b8',1.38,.35,1.4,.29,rotor);
  const fieldGroup=new T.Group();root.add(fieldGroup);
  const fieldArrows=[];
  for(const y of [-.65,.65])for(const z of [-.8,.65]){const a=new T.ArrowHelper(v(1,0,0),v(-1.92,y,z),3.84,0x72c8ff,.2,.1);fieldArrows.push(a);fieldGroup.add(a);}
  const currentArrows=[],forceArrows=[];
  for(let n=0;n<2;n++){
    const i=new T.ArrowHelper(v(0,0,1),v(0,0,0),1.1,0xffcf69,.25,.14);root.add(i);currentArrows.push(i);
    const f=new T.ArrowHelper(v(0,1,0),v(0,0,0),1,0xf7a2bd,.25,.14);root.add(f);forceArrows.push(f);
  }
  const commLabel=label('SPLIT RING','#a6c9bc',0,-.6,2.2,.19);
  const state={field:1,current:1,side:'a',power:60,practice:false,paused:false,lines:true,ar:false};
  let theta=.35,previous=performance.now();
  function resetView(){controls.reset();camera.position.set(state.practice?0:5.8,state.practice?1.8:4.1,state.practice?12.8:9);controls.target.set(0,state.ar?-1.1:-.1,0);camera.lookAt(controls.target);controls.update();}
  function resize(){const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();resetView();
  function sync(changes){const practiceChanged='practice'in changes&&changes.practice!==state.practice;Object.assign(state,changes);if(practiceChanged){theta=0;controls.enabled=!state.practice;resetView();}if('ar'in changes){root.position.y=state.ar?-1.65:0;root.scale.setScalar(state.ar?.72:1);resetView();}}
  function animate(now){
    const dt=Math.min((now-previous)/1000,.04);previous=now;
    if(!state.practice&&!state.paused&&state.power>0)theta-=dt*(.3+state.power*.022)*state.field*state.current;
    rotor.rotation.z=theta;
    leftMag.material=state.field===1?red:blue;rightMag.material=state.field===1?blue:red;
    nl.visible=state.field===1;sl.visible=state.field===1;
    reverseN.visible=state.field===-1;reverseS.visible=state.field===-1;
    fieldGroup.visible=state.lines;
    fieldArrows.forEach((a,n)=>{a.setDirection(v(state.field,0,0));a.position.x=state.field===1?-1.92:1.92;});
    const q=Math.cos(theta)>=0?1:-1;
    for(let n=0;n<2;n++){
      const side=n===0?-1:1,x=side*1.38*Math.cos(theta),y=side*1.38*Math.sin(theta),i=(n===0?1:-1)*q*state.current;
      currentArrows[n].position.set(x,y,-i*.5);currentArrows[n].setDirection(v(0,0,i));currentArrows[n].visible=state.power>0;
      forceArrows[n].position.set(x,y,0);forceArrows[n].setDirection(v(0,i*state.field,0));forceArrows[n].visible=state.power>0;
    }
    wireA.material=state.practice&&state.side==='a'?green:copper;wireB.material=state.practice&&state.side==='b'?green:copper;
    la.visible=lb.visible=state.practice;commLabel.visible=!state.ar;
    controls.update();renderer.render(scene,camera);
    animation=requestAnimationFrame(animate);
  }
  const reverseN=label('N','#662831',2.65,.05,1.18,.6),reverseS=label('S','#173a60',-2.65,.05,1.18,.6);
  let animation=requestAnimationFrame(animate);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();container.dispatchEvent(new CustomEvent('scene-failed',{detail:'The 3D graphics context was interrupted. Reload to restore the motor.'}));});
  function getTargets(){
    const inverse=camera.quaternion.clone().invert(),b=v(state.field,0,0),i=v(0,0,state.current*(state.side==='a'?1:-1)),f=new T.Vector3().crossVectors(i,b);
    return {b:b.applyQuaternion(inverse).toArray(),i:i.applyQuaternion(inverse).toArray(),f:f.applyQuaternion(inverse).toArray(),energised:state.power>0};
  }
  return {sync,resetView,getTargets,getState:()=>({...state,theta}),destroy(){cancelAnimationFrame(animation);observer.disconnect();controls.dispose();renderer.dispose();}};
}
