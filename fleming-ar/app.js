import {createMotor} from './motor.js?v=welcome-10';
import {directionLabel} from './view-directions.js?v=orbit-9';
import {assessHand,targets,LIMITS} from './assessment.js?v=feedback-4';
import {coilCircuit} from './circuit.js?v=feedback-4';
import {AttemptFeedback,MATCH_HOLD_SECONDS} from './feedback.js?v=feedback-4';

const $=id=>document.getElementById(id);
const stage=document.querySelector('.stage'),video=$('camera'),canvas=$('landmarks'),ctx=canvas.getContext('2d');
const workspace=document.querySelector('.workspace');
let controlsCollapsed=false;
const state={field:1,current:1,side:'a',phase:0,power:60,practice:false,paused:false,lines:true};
const attempt=new AttemptFeedback(),completed=new Set();
let motor,landmarker,trackerLoading,stream=null,starting=false,cameraActive=false,viewMoving=false,facing='environment',session=0,confirmedLabel=null,candidate=null,lastResultAt=0,lastInference=0,lastVideoTime=-1,feedbackKey='',lastAnnouncement=0,challenge=0;
try{motor=createMotor($('scene'),{onViewChange:handleViewChange});}catch(error){$('scene-error').hidden=false;$('scene-error').textContent=error.message;}
$('scene').addEventListener('scene-failed',event=>{$('scene-error').hidden=false;$('scene-error').textContent=event.detail;});

function setFeedback(title,message,kind='neutral'){
  const key=title+message+kind;if(key===feedbackKey)return;
  feedbackKey=key;$('feedback-title').textContent=title;$('feedback-message').textContent=message;
  $('live-coach-title').textContent=title;$('live-coach-message').textContent=message;
  $('feedback').className='feedback'+(kind==='neutral'?'':' '+kind);
  $('feedback-icon').textContent=kind==='success'?'✓':kind==='warning'?'!':'↗';
  $('live-coach').className='live-coach '+kind;
  stage.classList.toggle('pose-correct',kind==='success'&&attempt.complete);
}
function clearMetrics(){for(const [k,name]of [['b','B'],['i','I'],['f','F']]){$('metric-'+k).textContent='—';$('check-'+k).textContent=name;$('check-'+k).className='';}}
function resetEvidence(){attempt.reset();$('hold-progress').value=0;$('live-hold-fill').style.width='0%';clearMetrics();candidate=null;$('confirm-left').disabled=true;lastResultAt=0;}
function resetTask(){resetEvidence();if(cameraActive)setFeedback('New directions. Same rule.','Match the target card with your three fingers.');}
function contactReadout(theta){
  for(const [side,id,name]of [['a','red-contact','Red'],['b','black-contact','Black']]){
    const c=coilCircuit({...state,theta,side});
    const text=!c.connected?name+' half → insulating gap · no current':state.power===0?name+' half → '+c.terminal+' brush · supply off':name+' half → '+c.terminal+' brush · current '+(c.direction>0?'out from':'into')+' commutator';
    if($(id).textContent!==text)$(id).textContent=text;
  }
}
function updateTargetDirections(){
  const t=motor?.getTargets()||targets(state);
  const labels={b:directionLabel(t.b),i:!t.energised?t.reason==='gap'?'No current · gap':'No current · off':directionLabel(t.i),f:!t.energised?'No force':directionLabel(t.f)};
  for(const k of ['b','i','f'])if($('target-'+k).textContent!==labels[k])$('target-'+k).textContent=labels[k];
}
function handleViewChange({moving=false}={}){
  viewMoving=moving;
  if(!state.practice)return;
  const frameTime=lastResultAt;resetEvidence();lastResultAt=frameTime;updateTargetDirections();
  if(cameraActive)setFeedback(moving?'Rotate the model.':'View changed — try your hand.',moving?'Release the model to check your hand.':'Match B, I and F for this view.');
}
function sync(){
  motor?.sync(state);
  const t=targets(state);
  updateTargetDirections();
  $('target-side').textContent=(state.side==='a'?'Red straight side':'Black straight side')+' · drag to rotate';
  $('wire-example').classList.toggle('black-selected',state.side==='b');
  $('phase-value').textContent=state.phase+'°';$('coil-phase').value=state.phase;
  contactReadout(state.phase*Math.PI/180);
  if(state.practice&&!t.energised)setFeedback(t.reason==='gap'?'The brushes are at a gap.':'The supply is off.',t.reason==='gap'?'There is no current to check here. Turn the coil slightly to restore contact.':'Increase the supply to practise the force direction.');
  else if(state.practice&&!cameraActive)setFeedback('Ready when you are.','Start the camera to get feedback on your real hand.');
  $('run-state').textContent=state.practice?'ROTOR HELD':state.power===0?'SUPPLY OFF':state.paused?'PAUSED':'RUNNING';
  $('play-pause').textContent=state.paused?'▶ Run motor':'Ⅱ Pause motor';
  $('play-pause').disabled=state.practice;
  $('power-value').textContent=state.power+'%';$('power').value=state.power;
  $('field-lines').textContent='Field lines '+(state.lines?'on':'off');$('field-lines').setAttribute('aria-pressed',state.lines);
  $('reverse-field').textContent=state.field===1?'⇄ N → S':'⇄ S ← N';
  $('reverse-current').textContent=state.current===1?'⇄ + on left brush':'⇄ + on right brush';
  for(const s of ['a','b']){$('wire-'+s).classList.toggle('active',state.side===s);$('wire-'+s).setAttribute('aria-pressed',state.side===s);}
}
function setControlsCollapsed(collapsed){
  controlsCollapsed=collapsed;workspace.classList.toggle('controls-collapsed',collapsed);
  $('control-panel').inert=collapsed;
  $('toggle-controls').textContent=collapsed?'Show controls':'Hide controls';
  $('toggle-controls').setAttribute('aria-expanded',String(!collapsed));
}
$('toggle-controls').onclick=()=>setControlsCollapsed(!controlsCollapsed);
function setMode(practice){
  if(!practice)stopCamera();
  state.practice=practice;
  $('practice-panel').hidden=!practice;$('target-card').hidden=!practice;$('explore-note').hidden=practice;
  stage.classList.toggle('practice',practice);
  $('live-coach').hidden=!practice;
  $('motor-options').open=!practice;
  for(const [id,on]of [['practice-mode',practice],['explore-mode',!practice]]){$(id).classList.toggle('active',on);$(id).setAttribute('aria-pressed',on);}
  $('view-hint').textContent='Drag to rotate · pinch or scroll to zoom';
  $('scene-caption').textContent=practice?'Use your left hand to predict the force.':'A current. A field. A force.';
  resetTask();sync();
  setControlsCollapsed(practice);
  if(practice&&!document.hidden)return startCamera();
}
$('explore-mode').onclick=()=>setMode(false);$('practice-mode').onclick=$('try-practice').onclick=()=>setMode(true);
$('reverse-field').onclick=()=>{state.field*=-1;resetTask();sync();};
$('reverse-current').onclick=()=>{state.current*=-1;resetTask();sync();};
$('power').oninput=e=>{state.power=Number(e.target.value);resetTask();sync();};
$('play-pause').onclick=()=>{state.paused=!state.paused;sync();};
$('field-lines').onclick=()=>{state.lines=!state.lines;sync();};
$('coil-phase').oninput=e=>{state.phase=Number(e.target.value);resetTask();sync();};
$('turn-coil').onclick=()=>{state.phase=Math.cos(state.phase*Math.PI/180)>=0?180:0;resetTask();sync();};
$('recalibrate').onclick=()=>{confirmedLabel=null;resetEvidence();$('confirm-left').hidden=!cameraActive;setFeedback('Confirm your left hand.','Show your left hand, then tap the button on the camera view.');};
$('reset-view').onclick=()=>motor?.resetView();
for(const s of ['a','b'])$('wire-'+s).onclick=()=>{state.side=s;resetTask();sync();};
$('next-challenge').onclick=()=>{
  const combinations=[[1,1,'a',180],[1,1,'b',180],[-1,1,'a',0],[-1,1,'b',180],[1,-1,'a',0],[1,-1,'b',180],[-1,-1,'b',0],[1,1,'a',0]];
  const c=combinations[challenge++%combinations.length];[state.field,state.current,state.side,state.phase]=c;if(!state.power)state.power=60;resetTask();sync();
};
$('help-button').onclick=()=>$('guide').showModal();$('close-guide').onclick=()=>$('guide').close();
$('dismiss-guide').onclick=()=>$('guide').close();
$('guide').onclick=e=>{if(e.target===$('guide')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}};

async function loadTracker(){
  if(landmarker)return;
  if(!trackerLoading)trackerLoading=(async()=>{
    const {FilesetResolver,HandLandmarker}=await import('./vendor/vision_bundle.mjs');
    const files=await FilesetResolver.forVisionTasks(new URL('./vendor',import.meta.url).href);
    landmarker=await HandLandmarker.createFromOptions(files,{
      baseOptions:{modelAssetPath:new URL('./vendor/hand_landmarker.task',import.meta.url).href,delegate:'CPU'},
      runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.65,minHandPresenceConfidence:.65,minTrackingConfidence:.65
    });
  })().finally(()=>{trackerLoading=null;});
  await trackerLoading;
}
function cameraUI(){
  $('start-camera').disabled=starting;$('start-camera').hidden=cameraActive;
  $('start-camera').textContent=starting?'Loading tracker…':'Start camera';
  $('camera-controls').hidden=!cameraActive;
  $('camera-status').textContent=cameraActive?(starting?'● CAMERA LIVE · LOADING TRACKER':'● CAMERA OVERLAY · LIVE'):starting?'◌ STARTING CAMERA':'○ 3D MODEL VIEW';
  stage.classList.toggle('camera-on',cameraActive);
  $('live-coach').hidden=!state.practice;
  $('confirm-left').hidden=!cameraActive||starting||!!confirmedLabel;
}
function stopCamera(){
  session++;starting=false;cameraActive=false;
  if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;
  confirmedLabel=null;resetEvidence();ctx.clearRect(0,0,canvas.width,canvas.height);
  $('confirm-left').textContent='This is my LEFT hand';
  $('camera-message').textContent='Show one left hand. Camera images stay on your device.';
  motor?.sync({ar:false});cameraUI();
  setFeedback('Ready when you are.','Start the camera to get feedback on your real hand.');
}
async function startCamera(){
  if(starting||cameraActive)return;
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){setControlsCollapsed(false);setFeedback('A secure camera connection is needed.','Open this app over HTTPS (GitHub Pages), or use localhost on a computer.','warning');return;}
  const token=++session;starting=true;cameraUI();setFeedback('Opening your camera…','Allow camera access. Tracking runs on this device; no microphone is requested.');
  try{
    const acquired=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:640},height:{ideal:480}}});
    if(token!==session){acquired.getTracks().forEach(t=>t.stop());return;}
    stream=acquired;video.srcObject=stream;await video.play();
    if(token!==session)return;
    cameraActive=true;motor?.sync({ar:true});cameraUI();
    const track=stream.getVideoTracks()[0];track.addEventListener('ended',()=>{if(cameraActive){stopCamera();setFeedback('Camera disconnected.','Start the camera again to continue.','warning');}});
    $('camera-message').textContent='Loading the hand model. The first load may take a moment…';
    setFeedback('Camera is on.','Loading hand tracking…');
    await loadTracker();if(token!==session)return;
    cameraActive=true;starting=false;lastVideoTime=-1;lastInference=0;lastResultAt=performance.now();
    cameraUI();
    if(matchMedia('(max-width:760px)').matches)stage.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
    $('camera-message').textContent='Camera is live. Confirm your left hand on the image.';
    setFeedback('Show your left hand.','Tap “This is my LEFT hand” on the image, then match the arrows.');
  }catch(error){
    if(token!==session)return;
    stopCamera();
    setControlsCollapsed(false);
    const messages={NotAllowedError:'Camera access was declined. Allow camera access in your browser settings, then try again.',NotFoundError:'No camera was found. You can still explore the 3D motor.',NotReadableError:'The camera may be in use by another app. Close it there and try again.',OverconstrainedError:'This camera could not use the requested settings. Try switching cameras.'};
    setFeedback('Camera or tracking unavailable.',messages[error.name]||'The local hand model could not start. Reload the page, or try a current Safari or Chrome browser. You can still explore the motor.','warning');
    console.error('Camera/tracker startup:',error);
  }
}
$('start-camera').onclick=startCamera;$('stop-camera').onclick=stopCamera;
$('flip-camera').onclick=async()=>{stopCamera();facing=facing==='environment'?'user':'environment';await startCamera();};
$('confirm-left').onclick=()=>{
  if(!candidate||performance.now()-lastResultAt>400)return;
  confirmedLabel=candidate.label;attempt.reset();$('hold-progress').value=0;
  $('confirm-left').hidden=true;
  $('camera-message').textContent='Left hand confirmed. Match the three directions.';
  setFeedback('Ready — match the arrows.','First finger: field. Second finger: current. Thumb: force.');
};

const connections=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
function drawHands(hands){
  const width=stage.clientWidth,height=stage.clientHeight,dpr=Math.min(devicePixelRatio,2);
  if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  const scale=Math.max(width/video.videoWidth,height/video.videoHeight),vw=video.videoWidth*scale,vh=video.videoHeight*scale;
  const point=p=>[p.x*vw+(width-vw)/2,p.y*vh+(height-vh)/2];
  ctx.lineWidth=2.5;ctx.lineCap='round';
  for(const hand of hands){
    for(const [a,b]of connections){ctx.strokeStyle=b<=4?'#f7a2bd':b<=8?'#72c8ff':b<=12?'#ffcf69':'#d3e5df88';ctx.beginPath();ctx.moveTo(...point(hand[a]));ctx.lineTo(...point(hand[b]));ctx.stroke();}
    hand.forEach((p,k)=>{ctx.fillStyle=k===4?'#f7a2bd':k===8?'#72c8ff':k===12?'#ffcf69':'#f3fff0';ctx.beginPath();ctx.arc(...point(p),[4,8,12].includes(k)?5:2.5,0,Math.PI*2);ctx.fill();});
    const badges=[],radius=21;
    for(const [k,text,color]of [[4,'F','#f7a2bd'],[8,'B','#72c8ff'],[12,'I','#ffcf69']]){
      const [x,y]=point(hand[k]);if(!Number.isFinite(x)||!Number.isFinite(y))continue;
      const clamp=(value,max)=>Math.max(radius+4,Math.min(max-radius-4,value));
      const candidates=[[30,-30],[-30,-30],[38,30],[-38,30],[0,-62],[0,62]].map(([dx,dy])=>[clamp(x+dx,width),clamp(y+dy,height)]);
      const [cx,cy]=candidates.find(([a,b])=>badges.every(([u,v])=>Math.hypot(a-u,b-v)>radius*2+5))||candidates[0];
      badges.push([cx,cy]);
      ctx.lineWidth=3;ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(cx,cy);ctx.stroke();
      ctx.shadowColor='#00000099';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
      ctx.shadowBlur=0;ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.stroke();
      ctx.font='800 28px ui-monospace, Menlo, monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#102c2d';ctx.fillText(text,cx,cy+1);
    }
  }
}
function renderAssessment(assessment,now){
  const view=attempt.update(assessment,now),shown=view.assessment;
  if(shown.angles){
    for(const [k,name]of [['b','B'],['i','I'],['f','F']]){
      const matched=shown.angles[k]<=LIMITS.direction;
      $('metric-'+k).textContent=Math.round(shown.angles[k])+'° off'+(matched?' ✓':'');
      $('check-'+k).textContent=name+(matched?' ✓':' ↗');$('check-'+k).className=matched?'matched':'';
    }
  }else clearMetrics();
  $('hold-progress').value=view.elapsed;
  $('live-hold-fill').style.width=(view.elapsed/MATCH_HOLD_SECONDS*100)+'%';
  if(view.phase==='correct'){
    if(view.newAward){
      completed.add([state.field,state.current,state.side,targets(state).contact].join('/'));
      $('match-count').textContent=completed.size+' matched';
    }
    setFeedback('Correct! ✓','Field, current and force matched. Try the next challenge.','success');
  }else if(view.phase==='matching')setFeedback('Good match!','All three directions match. Hold briefly…','success');
  else{
    const titles={confirm:'Confirm your left hand.',uncertain:'Adjust your hand slightly.', 'wrong-hand':'Use your left hand.',frame:'Move your hand into view.',small:'Move a little closer.',off:'The supply is off.',gap:'No current at this angle.',direction:'Match the arrows.',missing:'Show your left hand.'};
    if(now-lastAnnouncement>400||assessment.code==='confirm'){
      setFeedback(titles[assessment.code]||'Match the arrows.',assessment.message,assessment.code==='wrong-hand'?'warning':'neutral');lastAnnouncement=now;
    }
  }
}
export function processResult(result,now){
  lastResultAt=now;const hands=result.landmarks||[];drawHands(hands);candidate=null;$('confirm-left').disabled=true;
  if(viewMoving){setFeedback('Rotate the model.','Release the model to check your hand.');return;}
  if(hands.length!==1){
    renderAssessment({code:'missing',match:false,angles:null,message:hands.length>1?'Keep just one left hand in view.':'Show your left hand in the camera.'},now);return;
  }
  const category=(result.handedness||result.handednesses)?.[0]?.[0];
  if(category?.score>=LIMITS.handedness){candidate={label:category.categoryName};$('confirm-left').disabled=false;}
  $('confirm-left').hidden=!cameraActive||!!confirmedLabel;
  const assessment=assessHand({landmarks:hands[0],world:result.worldLandmarks?.[0],handedness:category?.categoryName,confidence:category?.score||0,confirmedLabel,target:motor?.getTargets()||targets(state)});
  renderAssessment(assessment,now);
}
function tick(now){
  if(state.practice)updateTargetDirections();
  if(!state.practice&&motor)contactReadout(motor.getState().theta);
  if(cameraActive&&!starting&&landmarker&&video.readyState>=2&&video.currentTime!==lastVideoTime&&now-lastInference>80){
    lastVideoTime=video.currentTime;lastInference=now;
    try{processResult(landmarker.detectForVideo(video,now),now);}catch(error){stopCamera();setFeedback('Tracking was interrupted.','Restart the camera. If this repeats, reload or try another browser.','warning');console.error(error);}
  }
  if(cameraActive&&!starting&&now-lastResultAt>500){ctx.clearRect(0,0,canvas.width,canvas.height);if(!attempt.complete){resetEvidence();setFeedback('Waiting for the camera.','Feedback resumes when the image updates.');}}
  requestAnimationFrame(tick);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(cameraActive||starting)){stopCamera();setFeedback('Camera paused for privacy.','Start it again when you are ready to continue.');}});
window.addEventListener('pagehide',()=>{stopCamera();landmarker?.close();landmarker=null;});
window.addEventListener('resize',()=>{if(cameraActive){ctx.clearRect(0,0,canvas.width,canvas.height);resetEvidence();}});
setMode(true);$('guide').showModal();requestAnimationFrame(tick);
