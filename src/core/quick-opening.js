import {addOpen} from './opens.js';
import {strictEdit as edit} from './strict-edit.js';   /* الفشلُ يُرمى لا يُبلَع (المرحلة ٩) */

export function commitQuickOpening(wall,s,options={}){
 if(!wall||typeof wall!=='object')throw new TypeError('wall is required');
 let opening;
 edit(()=>{
  opening=addOpen(wall,s,options.kind||'door',options.width,options.height,options.sill,options);
 },options.label||'إضافة فتحة سريعة');
 return {opening,wallId:wall.id};
}
