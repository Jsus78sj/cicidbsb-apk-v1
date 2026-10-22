import {addWall} from './walls.js';
import {addArea} from './areas.js';
import {strictEdit as edit} from './strict-edit.js';   /* الفشلُ يُرمى لا يُبلَع (المرحلة ٩) */
import {rectangleFromCorners} from './quick-draw.js';

export function commitQuickRoom(a,b,options={}){
 const ring=rectangleFromCorners(a,b), walls=[];
 let room;
 edit(()=>{
  for(let i=0;i<ring.length;i++){
   const p=ring[i], q=ring[(i+1)%ring.length];
   walls.push(addWall(p,q,options.thickness,options.type||'ext',options.align||'c',options.height));
  }
  room=addArea(ring,options.name||'',{showArea:options.showArea===0?0:1,fill:options.fill||'tint'});
 },options.label||'رسم غرفة سريعة');
 return {walls,room,ring};
}
