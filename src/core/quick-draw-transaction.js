import {addWall} from './walls.js';
import {strictEdit as edit} from './strict-edit.js';   /* الفشلُ يُرمى لا يُبلَع (المرحلة ٩) */
import {drawingCommitPlan,rectangleFromCorners} from './quick-draw.js';
export function commitQuickRectangle(a,b,options={}){
 const plan=drawingCommitPlan(rectangleFromCorners(a,b)),created=[];
 edit(()=>{for(const [p,q] of plan.segments)created.push(addWall(p,q,options.thickness,options.type||'ext',options.align||'c',options.height));},options.label||'رسم مستطيل سريع');
 return {created,plan};
}
