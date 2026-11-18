// Rear commutator: -z. Out from the commutator, along the coil: +z.
// A is permanently red, B permanently black. Supply leads never change polarity.
export const COMMUTATION_GAP = 0.06; // half-angle of each insulating gap, radians
export function coilCircuit({theta=0,current=1,power=60,side='a',field=1}={}){
  const c=Math.cos(theta);
  const contact=Math.abs(c)<=Math.sin(COMMUTATION_GAP)?0:Math.sign(c);
  const brush=side==='a'?contact:-contact; // -1 right brush; +1 left brush
  const polarity=brush*current;
  const connected=contact!==0;
  const energised=connected&&power>0;
  const direction=energised?polarity:0;
  return {contact,connected,energised,polarity,direction,
    brush:connected?(brush>0?'left':'right'):null,
    terminal:connected?(polarity>0?'positive':'negative'):null,
    // Fixed B along x; F = Iℓ × B. Torque signs use r × F about z.
    b:[field,0,0],i:[0,0,direction],f:[0,direction*field,0],
    torqueZ:-Math.abs(c)*current*field*(energised?1:0)};
}
