import {normalizeDimension,normalizeNumber} from './dimension-input.js';

export const WIZARD_STEPS=Object.freeze(['size','name','door','preview']);
export function createGuidedRoomWizard(){return {step:'size',first:null,second:null,width:null,height:null,name:'',doorOffset:null,doorWidth:900,doorKind:'door'};}
export function setCorners(wizard,first,second){
 if(!Array.isArray(first)||!Array.isArray(second))throw new TypeError('الركنان مطلوبان');
 if(first[0]===second[0]||first[1]===second[1])throw new RangeError('المقاس يجب أن يكون مستطيلاً');
 return {...wizard,first:[...first],second:[...second],step:'name'};
}
export function setRoomName(wizard,name){return {...wizard,name:String(name??'').trim().slice(0,40),step:'door'};}
export function setDoor(wizard,{offset,width=900,kind='door'}={}){
 const s=normalizeDimension(offset),w=normalizeDimension(width,'mm');
 return {...wizard,doorOffset:s,doorWidth:w,doorKind:kind,step:'preview'};
}
export function setDoorFromText(wizard,offset,width='900'){return setDoor(wizard,{offset,width});}
export function previewGuidedRoom(wizard){
 if(wizard.step!=='preview'||!wizard.first||!wizard.second||wizard.doorOffset==null)throw new Error('المعاينة غير مكتملة');
 return {first:[...wizard.first],second:[...wizard.second],name:wizard.name,doorOffset:wizard.doorOffset,doorWidth:wizard.doorWidth,doorKind:wizard.doorKind,ready:true};
}
export function cancelGuidedRoom(){return createGuidedRoomWizard();}
