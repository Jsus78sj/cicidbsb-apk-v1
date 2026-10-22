import {addWall} from './walls.js';
import {addArea} from './areas.js';
import {addOpen} from './opens.js';
import {strictEdit as edit} from './strict-edit.js';   /* الفشلُ يُرمى لا يُبلَع (المرحلة ٩) */
import {rectangleFromCorners} from './quick-draw.js';

export function commitGuidedRoom(a,b,options={}){
 const ring=rectangleFromCorners(a,b),walls=[]; let room,opening;
 edit(()=>{
  for(let i=0;i<ring.length;i++)walls.push(addWall(ring[i],ring[(i+1)%ring.length],options.thickness,options.type||'ext',options.align||'c',options.height));
  room=addArea(ring,options.name||'',{showArea:1,fill:options.fill||'tint'});
  if(options.doorOffset!=null){
   opening=addOpen(walls[0],options.doorOffset,options.doorKind||'door',options.doorWidth||900,options.doorHeight||2100,options.doorSill||0);
  }
 },options.label||'غرفة موجهة');
 return {walls,room,opening,ring};
}
