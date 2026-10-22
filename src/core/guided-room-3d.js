import {build3d} from './model3d.js';
import {canonicalProject} from './canonical-contract.js';
import {civilDraftToCanonical} from './canonical-adapter.js';
import {canonicalToCivilDraft} from './canonical-import.js';

export function previewGuidedRoom3d(plan){
 const canonical=canonicalProject({name:plan.name||'غرفة',levels:[{id:'level-0',number:0,elevation:0,height:3000,slab:200,walls:[],openings:[],rooms:[]}]});
 const state=canonicalToCivilDraft(canonical).state;
 state.walls=[]; state.opens=[];
 const x0=plan.first[0],y0=plan.first[1],x1=plan.second[0],y1=plan.second[1];
 const ring=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
 ring.forEach((a,i)=>state.walls.push({id:`preview-w${i}`,level:0,a,b:ring[(i+1)%4],t:200,type:'ext',align:'c'}));
 if(plan.doorOffset!=null)state.opens.push({id:'preview-door',wall:'preview-w0',kind:plan.doorKind||'door',s:plan.doorOffset,w:plan.doorWidth||900,h:2100,sill:0});
 return {model:build3d(state,{level:0}),canonical:civilDraftToCanonical(state)};
}
