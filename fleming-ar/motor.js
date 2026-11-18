import {coilCircuit,COMMUTATION_GAP} from './circuit.js?v=feedback-4';

export function createMotor(container,{onViewChange}={}){
  const T=window.THREE;
  if(!T)throw new Error('The 3D library could not load. Reload the page.');
  const scene=new T.Scene();
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.setClearColor(0x000000,0);renderer.outputEncoding=T.sRGBEncoding;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Teaching DC motor on a clear stand: red positive lead, black negative lead, permanent red and black coil halves, rear split-ring commutator, N and S poles');
  const camera=new T.PerspectiveCamera(37,1,.1,100);
  const controls=new T.OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.enablePan=false;controls.minDistance=9;controls.maxDistance=22;controls.maxPolarAngle=Math.PI*.85;
  scene.add(new T.HemisphereLight(0xe2fff6,0x344c46,.8));
  const light=new T.DirectionalLight(0xfff6df,1);light.position.set(3,7,7);scene.add(light);
  const fill=new T.DirectionalLight(0x83d7ff,.35);fill.position.set(-6,2,-4);scene.add(fill);
  const root=new T.Group();scene.add(root);
  const mat=(color,metalness=.1,roughness=.45)=>new T.MeshStandardMaterial({color,metalness,roughness});
  const red=mat(0xc7293d,.25,.32),black=mat(0x171d24,.18,.4),silver=mat(0xa7bbc2,.75,.25),copper=mat(0xb77d42,.72,.3),white=mat(0xf1f1e9),magnet=mat(0x536a73,.55),baseMat=mat(0xb3cbd0,.35);
  const glass=new T.MeshPhysicalMaterial({color:0xd8edf0,transparent:true,opacity:.16,roughness:.15,metalness:.05,depthWrite:false,side:T.DoubleSide});
  const v=(x,y,z)=>new T.Vector3(x,y,z);
  function box(w,h,d,m,x=0,y=0,z=0,parent=root){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o;}
  function rod(a,b,r,m,parent=root){const delta=new T.Vector3().subVectors(b,a);const o=new T.Mesh(new T.CylinderGeometry(r,r,delta.length(),16),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(v(0,1,0),delta.normalize());parent.add(o);return o;}
  function label(text,color,x,y,z,size=.38,parent=root){const c=document.createElement('canvas');c.width=384;c.height=96;const ctx=c.getContext('2d');ctx.font='700 48px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,192,48);const texture=new T.CanvasTexture(c);const s=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false}));s.scale.set(size*4,size,1);s.position.set(x,y,z);parent.add(s);return s;}
  function tube(points,r,material,parent=root){const mesh=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),64,r,10,false),material);parent.add(mesh);return mesh;}
  function hoop(radius,z){const ring=new T.Mesh(new T.TorusGeometry(radius,.055,10,72),baseMat);ring.position.z=z;root.add(ring);return ring;}

  // Clear acrylic teaching apparatus, with the cell in front and commutator behind.
  box(6.4,.18,5.6,baseMat,0,-2.12,-.3);
  box(6.1,.07,5.35,glass,0,-1.99,-.3);
  for(const z of [-2.75,1.65]){
    box(.4,1.92,.35,glass,0,-1.02,z);
    box(2.1,.12,.9,glass,0,-1.93,z);
    const bearing=new T.Mesh(new T.CylinderGeometry(.27,.27,.35,32),silver);bearing.rotation.x=Math.PI/2;bearing.position.z=z;root.add(bearing);
  }
  for(const z of [-2.85,-1.35]){hoop(1.42,z);box(.25,2.15,.18,glass,-1.35,-.95,z);box(.25,2.15,.18,glass,1.35,-.95,z);}
  const drum=new T.Mesh(new T.CylinderGeometry(1.4,1.4,1.5,64,1,true),glass);drum.rotation.x=Math.PI/2;drum.position.z=-2.1;root.add(drum);
  rod(v(0,0,-3),v(0,0,1.85),.065,silver);

  // Neutral pole pieces carry explicit N/S plaques; supply colours belong to wires.
  for(const x of [-2.15,2.15]){
    box(.45,2.35,2.5,magnet,x,-.3,-.05);
    box(.65,.18,2.7,baseMat,x,-1.56,-.05);
    box(.62,.52,.12,white,x,1.08,1.26);
    rod(v(x,-1.95,1.23),v(x,1.08,1.23),.045,silver);
  }
  const poleLabels=[label('N','#202e34',-2.15,1.08,1.35,.4),label('S','#202e34',2.15,1.08,1.35,.4),label('S','#202e34',-2.15,1.08,1.35,.4),label('N','#202e34',2.15,1.08,1.35,.4)];

  // Coil identity never changes colour as it rotates or changes electrical contact.
  const rotor=new T.Group();root.add(rotor);
  const R=1.3,back=-1.3,front=1.3;
  const wireA=box(.13,.19,2.6,red,-R,0,0,rotor),wireB=box(.13,.19,2.6,black,R,0,0,rotor);
  wireA.name='coil-red';wireB.name='coil-black';rotor.name='rotor';
  box(R,.19,.13,red,-R/2,0,front,rotor);box(R,.19,.13,black,R/2,0,front,rotor);
  box(R-.18,.19,.13,red,-(R+.18)/2,0,back,rotor);box(R-.18,.19,.13,black,(R+.18)/2,0,back,rotor);
  rod(v(-.18,0,back),v(-.25,0,-1.83),.055,red,rotor);
  rod(v(.18,0,back),v(.25,0,-1.83),.055,black,rotor);

  // Left half is red at phase zero. The actual contact surfaces are copper.
  for(const [material,start]of [[red,Math.PI+COMMUTATION_GAP],[black,COMMUTATION_GAP]]){
    for(const [radius,m]of [[.62,material],[.64,copper]]){
      const ring=new T.Mesh(new T.CylinderGeometry(radius,radius,radius===.62?.98:.25,48,1,false,start,Math.PI-2*COMMUTATION_GAP),m);
      ring.rotation.x=Math.PI/2;ring.position.z=radius===.62?-2.15:-1.93;rotor.add(ring);
    }
  }
  const brushes=[box(.32,.045,.38,black,-.79,0,-1.93),box(.32,.045,.38,black,.79,0,-1.93)];
  for(const x of [-.79,.79])rod(v(x,-1.9,-1.93),v(x,-.04,-1.93),.045,silver);
  label('SPLIT RING','#d0e3dc',0,1.65,-1.93,.2);
  label('BRUSHES','#bdcfc9',0,-.5,-1.93,.18);

  // Both leads remain attached to the same labelled cell terminals. A connection
  // swap moves their brush endpoints; it does not recolour the leads or the coil.
  box(2.15,.22,.85,white,-1.35,-1.98,3.15);
  box(.72,.025,.12,red,-1.85,-1.85,3.15);box(.72,.025,.12,black,-.85,-1.85,3.15);
  function terminalSign(sign,color,x){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const ctx=canvas.getContext('2d');
    ctx.beginPath();ctx.arc(128,128,112,0,Math.PI*2);ctx.fillStyle='#ffffff';ctx.fill();
    ctx.lineWidth=14;ctx.strokeStyle=color;ctx.stroke();
    ctx.fillStyle=color;ctx.font='900 178px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(sign,128,120);
    const badge=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas),depthTest:false,depthWrite:false}));
    badge.scale.set(.68,.68,1);badge.position.set(x,-1.17,3.2);badge.renderOrder=20;root.add(badge);
    rod(v(x,-1.8,3.15),v(x,-1.48,3.2),.018,silver);
  }
  terminalSign('+','#b61930',-1.85);terminalSign('−','#101820',-.85);
  label('CELL','#d0dfd8',-1.35,-2.27,3.3,.2);
  const pos=v(-1.85,-1.82,3.15),neg=v(-.85,-1.82,3.15);
  let redLead,blackLead,lastSupply=null;
  function updateLeads(current){
    if(lastSupply===current)return;lastSupply=current;
    for(const mesh of [redLead,blackLead])if(mesh){root.remove(mesh);mesh.geometry.dispose();}
    const x=current===1?-.94:.94;
    redLead=tube([pos,v(-3,-1.9,2),v(-3.1,-1.3,-1.25),v(x,-.3,-1.93),v(x,0,-1.93)],.035,red);
    blackLead=tube([neg,v(2.75,-1.9,2.5),v(3.05,-1.4,-1.4),v(-x,-.3,-1.93),v(-x,0,-1.93)],.035,black);
    redLead.name='positive-red-lead';blackLead.name='negative-black-lead';
  }
  updateLeads(1);

  const la=label('THIS WIRE','#d8ffac',-R,.45,.1,.42,rotor),lb=label('THIS WIRE','#d8ffac',R,.45,.1,.42,rotor);
  la.name='selected-red-wire-label';lb.name='selected-black-wire-label';
  // A separate outline selects a wire without overwriting its permanent colour.
  const selectMaterial=new T.MeshBasicMaterial({color:0xc8ed9d,wireframe:true,transparent:true,opacity:.85});
  const selectionA=box(.23,.29,2.7,selectMaterial,-R,0,0,rotor),selectionB=box(.23,.29,2.7,selectMaterial,R,0,0,rotor);
  const fieldGroup=new T.Group();root.add(fieldGroup);const fieldArrows=[];
  for(const y of [-.6,.6])for(const z of [-.7,.65]){const a=new T.ArrowHelper(v(1,0,0),v(-1.8,y,z),3.6,0x72c8ff,.18,.1);fieldArrows.push(a);fieldGroup.add(a);}
  const currentArrows=[],forceArrows=[];
  for(let n=0;n<2;n++){
    const i=new T.ArrowHelper(v(0,0,1),v(0,0,0),1.1,0xffcf69,.26,.15);root.add(i);currentArrows.push(i);
    const f=new T.ArrowHelper(v(0,1,0),v(0,0,0),.9,0xf7a2bd,.24,.15);root.add(f);forceArrows.push(f);
    i.name='current-'+(n===0?'a':'b');f.name='force-'+(n===0?'a':'b');
  }
  const state={field:1,current:1,side:'a',phase:0,power:60,practice:false,paused:false,lines:true,ar:false};
  let theta=.35,previous=performance.now(),viewFit=1;
  function resetView(){controls.reset();camera.position.set(state.practice?0:6,state.practice?2.1:4.5,state.practice?14.6:11.5);controls.target.set(0,state.ar?-1.1:-.25,0);camera.position.sub(controls.target).multiplyScalar(viewFit).add(controls.target);camera.lookAt(controls.target);controls.update();}
  function resize(){
    const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);
    camera.aspect=w/h;const fit=Math.max(1,.85/camera.aspect);
    camera.position.sub(controls.target).multiplyScalar(fit/viewFit).add(controls.target);viewFit=fit;
    controls.maxDistance=22*viewFit;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
    // Preserve room around the apparatus in a tall, full-height phone viewport.
    renderer.render(scene,camera);
  }
  const observer=new ResizeObserver(resize);observer.observe(container);resize();resetView();
  function sync(changes){
    const practiceChanged='practice'in changes&&changes.practice!==state.practice;
    const phaseChanged='phase'in changes&&changes.phase!==state.phase;
    Object.assign(state,changes);updateLeads(state.current);
    if(practiceChanged){if(state.practice)theta=state.phase*Math.PI/180;resetView();}
    else if(state.practice&&phaseChanged)theta=state.phase*Math.PI/180;
    if('ar'in changes){root.position.y=state.ar?-1.45:0;root.scale.setScalar(state.ar?.72:1);resetView();}
    animate(performance.now(),false);
  }
  function animate(now,queue=true){
    const dt=Math.min((now-previous)/1000,.04);previous=now;
    // Constant illustrative speed represents inertia carrying the coil across gaps.
    if(!state.practice&&!state.paused&&state.power>0)theta-=dt*(.3+state.power*.022)*state.field*state.current;
    rotor.rotation.z=theta;
    poleLabels.forEach((l,n)=>l.visible=state.field===1?n<2:n>=2);
    fieldGroup.visible=state.lines;fieldArrows.forEach(a=>{a.setDirection(v(state.field,0,0));a.position.x=state.field===1?-1.8:1.8;});
    for(let n=0;n<2;n++){
      const side=n===0?-1:1,x=side*R*Math.cos(theta),y=side*R*Math.sin(theta);
      const circuit=coilCircuit({...state,theta,side:n===0?'a':'b'}),i=circuit.direction;
      currentArrows[n].position.set(x,y,-i*.5);if(i)currentArrows[n].setDirection(v(0,0,i));currentArrows[n].visible=circuit.energised;
      forceArrows[n].position.set(x,y,0);if(i)forceArrows[n].setDirection(v(0,i*state.field,0));forceArrows[n].visible=circuit.energised;
    }
    selectionA.visible=state.practice&&state.side==='a';selectionB.visible=state.practice&&state.side==='b';
    la.visible=state.practice&&state.side==='a';lb.visible=state.practice&&state.side==='b';
    controls.update();renderer.render(scene,camera);if(queue)animation=requestAnimationFrame(animate);
  }
  let animation;
  animate(performance.now());
  let viewInteracting=false;
  const previousView=camera.quaternion.clone();
  controls.addEventListener('start',()=>{viewInteracting=true;onViewChange?.({moving:true});});
  controls.addEventListener('end',()=>{viewInteracting=false;onViewChange?.({moving:false});});
  controls.addEventListener('change',()=>{
    // A zoom changes the model's size, not the physical direction targets.
    // Clear pose evidence after a meaningful change in viewing orientation.
    if(previousView.angleTo(camera.quaternion)>Math.PI/360){
      previousView.copy(camera.quaternion);onViewChange?.({moving:viewInteracting});
    }
    renderer.render(scene,camera);
  });
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();container.dispatchEvent(new CustomEvent('scene-failed',{detail:'The 3D graphics context was interrupted. Reload to restore the motor.'}));});
  function getTargets(){
    const circuit=coilCircuit({...state,theta});const inverse=camera.quaternion.clone().invert();
    const convert=a=>new T.Vector3(...a).applyQuaternion(inverse).toArray();
    return {...circuit,b:convert(circuit.b),i:convert(circuit.i),f:convert(circuit.f),reason:!circuit.connected?'gap':state.power===0?'off':null};
  }
  function setCameraPinch(active){
    controls.enabled=!active;
    // r128 uses touchend to clear its private gesture state. Reset it after
    // camera pinching or cancellation without changing the model viewpoint.
    if(!active)renderer.domElement.dispatchEvent?.(new Event('touchend'));
  }
  return {sync,resetView,getTargets,setCameraPinch,getState:()=>({...state,theta}),destroy(){cancelAnimationFrame(animation);observer.disconnect();controls.dispose();renderer.dispose();}};
}
