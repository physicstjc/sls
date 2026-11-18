// Camera axes match the hand estimates: right, up, toward the viewer.
export function directionLabel(vector){
  const size=Math.hypot(...vector);if(!Number.isFinite(size)||size<1e-8)return '—';
  const [x,y,z]=vector.map(value=>value/size);
  if(Math.abs(z)>.85)return z>0?'⊙ Toward you':'⊗ Away from you';
  const octant=(Math.round(Math.atan2(y,x)/(Math.PI/4))+8)%8;
  const planar=['→ Right','↗ Up-right','↑ Up','↖ Up-left','← Left','↙ Down-left','↓ Down','↘ Down-right'][octant];
  return Math.abs(z)>.35?planar+(z>0?' · ⊙ Toward':' · ⊗ Away'):planar;
}
