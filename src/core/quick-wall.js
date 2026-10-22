import {addWall} from './walls.js';
import {strictEdit as edit} from './strict-edit.js';   /* الفشلُ يُرمى لا يُبلَع (المرحلة ٩) */
import {nextPointFromLength} from './quick-draw.js';

export function commitQuickWall(start,length,angleDeg=0,options={}){
 const end=nextPointFromLength(start,length,angleDeg);
 let wall;
 edit(()=>{
  wall=addWall(start,end,options.thickness,options.type||'int',options.align||'c',options.height);
 },options.label||'رسم جدار سريع');
 return {wall,start:[...start],end};
}
