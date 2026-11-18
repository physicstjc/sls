export const MAX_CAMERA_ZOOM=4;

// One transform is shared by the displayed video and its landmark overlay.
// 1x fills the view; the minimum reveals the entire original camera frame.
export function cameraFrame(width,height,videoWidth,videoHeight,zoom=1){
  if(![width,height,videoWidth,videoHeight].every(v=>Number.isFinite(v)&&v>0))return null;
  const cover=Math.max(width/videoWidth,height/videoHeight);
  const minZoom=Math.min(width/videoWidth,height/videoHeight)/cover;
  const value=Math.max(minZoom,Math.min(MAX_CAMERA_ZOOM,Number.isFinite(zoom)?zoom:1));
  const w=videoWidth*cover*value,h=videoHeight*cover*value;
  return {left:(width-w)/2,top:(height-h)/2,width:w,height:h,zoom:value,minZoom};
}
export function landmarkPoint(point,frame){return [frame.left+point.x*frame.width,frame.top+point.y*frame.height];}

export function installCameraPinch(surface,{enabled,getZoom,onZoom,onGesture=()=>{}}){
  let active=false,baseline=null;
  const distance=touches=>Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
  const consume=event=>{if(event.cancelable!==false)event.preventDefault();event.stopImmediatePropagation();};
  const begin=touches=>{baseline={distance:Math.max(1,distance(touches)),zoom:getZoom()};};
  function start(event){
    if(!enabled()||event.target?.closest?.('button,dialog,.live-coach'))return;
    if(event.touches.length>=2){
      if(!active){active=true;onGesture(true);}
      begin(event.touches);consume(event);
    }else if(active)consume(event);
  }
  function move(event){
    if(!active)return;consume(event);
    if(event.touches.length>=2){
      if(!baseline)begin(event.touches);
      onZoom(baseline.zoom*distance(event.touches)/baseline.distance);
    }
  }
  function finish(event){
    if(!active)return;
    if(event.touches.length>=2)begin(event.touches);
    else baseline=null;
    // Consume remaining moves until every finger lifts. Let touchend reach
    // OrbitControls so its earlier one-finger gesture cannot remain latched.
    if(event.touches.length===0)cancel();
  }
  function cancel(){if(!active)return;active=false;baseline=null;onGesture(false);}
  surface.addEventListener('touchstart',start,{capture:true,passive:false});
  surface.addEventListener('touchmove',move,{capture:true,passive:false});
  surface.addEventListener('touchend',finish,{capture:true});
  surface.addEventListener('touchcancel',cancel,{capture:true});
  return {cancel};
}
