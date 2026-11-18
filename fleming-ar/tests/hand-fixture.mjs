import {targets,unit} from '../assessment.js';
export function pose(target=targets()){
  const p=Array.from({length:21},()=>[0,0,0]);
  p[0]=[0,-.06,0];p[5]=[-.025,0,0];p[9]=[0,0,0];p[17]=[.035,-.01,0];p[2]=[-.04,-.025,0];
  const digit=(base,indices,dir,len)=>indices.forEach((k,n)=>p[k]=p[base].map((v,j)=>v+dir[j]*len*(n+1)/indices.length));
  digit(5,[6,7,8],target.b,.075);digit(9,[10,11,12],unit([.18,0,target.i[2]]),.085);digit(2,[3,4],target.f,.055);
  return {world:p.map(([x,y,z])=>({x,y:-y,z:-z})),landmarks:p.map(([x,y])=>({x:.5+x*2,y:.5-y*2,z:0})),handedness:'Left',confidence:.98,confirmedLabel:'Left',target};
}
