import {exportCanonicalFile,importCanonicalFile} from '../io/canonical-project.js';

export function saveGuidedPlan(state){
 return exportCanonicalFile(state,{includeSource:true});
}
export function loadGuidedPlan(text){
 const result=importCanonicalFile(text);
 return {state:result.state,source:result.source,report:result.report};
}
export function guidedPlanSummary(state){
 return {walls:Array.isArray(state?.walls)?state.walls.length:0,openings:Array.isArray(state?.opens)?state.opens.length:0,rooms:Array.isArray(state?.areas)?state.areas.length:0,levels:Array.isArray(state?.levelDefs)?state.levelDefs.length:0};
}
