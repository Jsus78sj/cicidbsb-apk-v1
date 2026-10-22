import {createGuidedRoomWizard,setCorners,setRoomName,setDoorFromText,previewGuidedRoom,cancelGuidedRoom} from '../core/guided-room-wizard.js';

export function createGuidedRoomUI({mount=document.body,onCommit=()=>{},onClose=()=>{}}={}){
 const root=document.createElement('section');root.className='guided-room';root.dir='rtl';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','معالج الغرفة');
 root.innerHTML=`<header><h2>إنشاء غرفة</h2><button type="button" data-close aria-label="إغلاق">×</button></header><div data-step></div><div data-error role="alert"></div><div class="guided-actions"><button type="button" data-back>رجوع</button><button type="button" data-next>التالي</button><button type="button" data-cancel>إلغاء</button></div>`;
 mount.appendChild(root);let state=createGuidedRoomWizard(),first=null;
 const step=root.querySelector('[data-step]'),error=root.querySelector('[data-error]');
 const render=()=>{error.textContent='';const n=state.step;if(n==='size')step.innerHTML='<label>الركن الأول <input data-a placeholder="0,0"></label><label>الركن المقابل <input data-b placeholder="5m,4m"></label>';else if(n==='name')step.innerHTML='<label>اسم الغرفة <input data-name maxlength="40" placeholder="اختياري"></label>';else if(n==='door')step.innerHTML='<label>موضع الباب <input data-offset placeholder="٢٫٥ م"></label><label>عرض الباب <input data-width value="٩٠٠ ملم"></label>';else {const p=previewGuidedRoom(state);step.innerHTML=`<p>معاينة جاهزة: ${p.name||'غرفة بلا اسم'} · باب عند ${p.doorOffset} مم</p>`;}};
 const point=s=>{const [x,y]=String(s).split(',').map(v=>Number(v.trim()));if(!Number.isFinite(x)||!Number.isFinite(y))throw new Error('اكتب نقطتين بصيغة x,y');return [x,y];};
 const next=()=>{try{if(state.step==='size'){const a=point(step.querySelector('[data-a]').value),b=point(step.querySelector('[data-b]').value);state=setCorners(state,a,b);}else if(state.step==='name'){state=setRoomName(state,step.querySelector('[data-name]').value);}else if(state.step==='door'){state=setDoorFromText(state,step.querySelector('[data-offset]').value,step.querySelector('[data-width]').value);}else{onCommit(previewGuidedRoom(state));api.close();return;}render();}catch(e){error.textContent=e.message;}};
 const back=()=>{state=createGuidedRoomWizard();first=null;render();};
 const api={root,open(){root.hidden=false;render();},close(){root.remove();onClose();},next};
 root.querySelector('[data-next]').addEventListener('click',next);root.querySelector('[data-back]').addEventListener('click',back);root.querySelector('[data-cancel]').addEventListener('click',()=>{state=cancelGuidedRoom();api.close();});root.querySelector('[data-close]').addEventListener('click',()=>api.close());
 render();return api;
}
