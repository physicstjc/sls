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
