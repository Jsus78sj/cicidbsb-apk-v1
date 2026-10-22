import {createGuidedRoomUI} from './guidedroom.js';
import {commitGuidedRoom} from '../core/guided-room.js';
import {normalizeDimension} from '../core/dimension-input.js';

export function openGuidedRoom({mount=document.body,report=()=>{},refresh=()=>{}}={}){
 return createGuidedRoomUI({mount,onCommit(plan){
  try{
   const result=commitGuidedRoom(plan.first,plan.second,{name:plan.name,doorOffset:plan.doorOffset,doorWidth:plan.doorWidth,doorKind:plan.doorKind,thickness:normalizeDimension('0.20m'),type:'ext',label:'غرفة موجهة'});
   report('ok',`غرفة موجهة · ${result.walls.length} جدران · ${result.opening?'باب مضاف':''}`);
   refresh();
  }catch(e){report('er',e.message)}
 }});
}
