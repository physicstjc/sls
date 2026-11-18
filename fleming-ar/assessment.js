import {coilCircuit} from './circuit.js?v=feedback-4';
// Pure camera-space geometry. Camera axes: x right, y up, z toward viewer.
export const LIMITS = Object.freeze({direction:36, handedness:0.8, hold:1.2});
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const length=a=>Math.hypot(...a);
export const unit=a=>length(a)>1e-7?a.map(v=>v/length(a)):null;
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function angle(a,b){const u=unit(a),v=unit(b);return u&&v?Math.acos(Math.max(-1,Math.min(1,dot(u,v))))*180/Math.PI:180;}
export function targets({field=1,current=1,side='a',power=60,phase=0}={}){
  const circuit=coilCircuit({theta:phase*Math.PI/180,field,current,side,power});
  return {...circuit,reason:!circuit.connected?'gap':power===0?'off':null};
}
export function assessHand({landmarks,world,handedness,confidence,confirmedLabel,target}){
  const fail=(code,message)=>({code,message,match:false,angles:null});
  if(!target.energised)return target.reason==='gap'?fail('gap','A brush is over an insulating gap. Turn the coil slightly: there is no current or magnetic force to match here.'):fail('off','Increase the supply above zero: there is no magnetic force on the wire at zero current.');
  if(!landmarks||!world||world.length!==21||landmarks.length!==21)return fail('missing','Show one whole hand, with your wrist and all three fingers in view.');
  if(!world.every(p=>[p.x,p.y,p.z].every(Number.isFinite)))return fail('uncertain','The depth estimate is unstable. Spread your fingers and try again.');
  if(!landmarks.every(p=>[p.x,p.y].every(Number.isFinite)))return fail('uncertain','The image estimate is unstable. Hold steady with all finger joints visible.');
  if(!Number.isFinite(confidence)||confidence<LIMITS.handedness)return fail('uncertain','Hand identification is uncertain. Improve the lighting and hold still.');
  if(!confirmedLabel)return fail('confirm','Show your real left hand, then tap “Confirm: this is my LEFT hand”.');
  if(handedness!==confirmedLabel)return fail('wrong-hand','This looks like the other hand. Use the left hand you confirmed, or recalibrate.');
  const important=[0,2,3,4,5,6,7,8,9,10,11,12,17];
  if(important.some(k=>landmarks[k].x<.025||landmarks[k].x>.975||landmarks[k].y<.025||landmarks[k].y>.975))return fail('frame','Move your hand away from the edges so all finger joints stay in view.');
  const screenDist=(a,b)=>Math.hypot(landmarks[a].x-landmarks[b].x,landmarks[a].y-landmarks[b].y);
  if(screenDist(0,9)<.065)return fail('small','Move your hand closer to the camera. Keep the whole hand in view.');
  // An end-on second finger is expected for into/out-of-screen targets. Its
  // image projection may collapse; use the estimated 3D direction below.
  const p=world.map(v=>[v.x,-v.y,-v.z]);
  const palm=length(sub(p[9],p[0]));
  if(palm<.015||palm>.2)return fail('uncertain','The hand estimate is unstable. Hold steady with a plain background.');
  // Judge the overall direction, allowing natural bends at the finger joints.
  const b=sub(p[8],p[5]),i=sub(p[12],p[9]),f=sub(p[4],p[2]);
  if([b,i,f].some(vector=>length(vector)<palm*.12))return fail('uncertain','A finger’s overall direction is unclear. Reposition your hand so the camera can see where each finger points; a slight bend is fine.');
  // Comparing each finger with the orthogonal physical target already tests
  // the rule. Do not impose a second, stricter pairwise-angle gate.
  const angles={b:angle(b,target.b),i:angle(i,target.i),f:angle(f,target.f)};
  const match=Object.values(angles).every(a=>a<=LIMITS.direction);
  const worst=Object.entries(angles).sort((a,b)=>b[1]-a[1])[0][0];
  const tips={b:'Point your first finger along the field arrow, from N to S.',i:'Point your second finger along the current arrow. Check toward you (⊙) versus away (⊗).',f:'Point your thumb along the force arrow. Try rotating the whole hand while keeping the fingers at right angles.'};
  return {code:match?'match':'direction',match,angles,message:match?'All three estimated directions match. Hold your hand steady.':tips[worst],vectors:{b:unit(b),i:unit(i),f:unit(f)}};
}
export class HoldTracker{
  constructor({duration=LIMITS.hold,graceMs=0,maxGapMs=300}={}){this.duration=duration;this.graceMs=graceMs;this.maxGapMs=maxGapMs;this.reset();}
  reset(){this.elapsed=0;this.last=null;this.lastGood=null;this.awarded=false;}
  update(match,time){
    if(!match){
      if(!this.graceMs||this.lastGood===null||time-this.lastGood>this.graceMs)this.reset();
      else this.last=time;
      return {elapsed:this.elapsed,complete:false,newAward:false};
    }
    const dt=this.last===null?0:(time-this.last)/1000;
    if(dt<0||dt>this.maxGapMs/1000){this.elapsed=0;this.awarded=false;}
    else this.elapsed+=Math.min(.15,dt);
    this.last=this.lastGood=time;
    const complete=this.elapsed+1e-9>=this.duration,newAward=complete&&!this.awarded;
    if(complete)this.awarded=true;
    return {elapsed:complete?this.duration:Math.min(this.duration,this.elapsed),complete,newAward};
  }
}
