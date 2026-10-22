import {defTool,H} from './registry.js';
import {openGuidedRoom} from '../ui/guidedroom-action.js';

defTool({
 id:'guidedroom',alias:'gr غرفة_موجهة',label:'غرفة موجهة',own:1,noplan:1,
 hint:'يفتح معالجاً مرئياً: المقاس ثم الاسم ثم الباب ثم المعاينة',
 start(){
  openGuidedRoom({report:(kind,msg)=>H.rep(kind,msg),refresh:()=>H.refresh()});
  return false;
 }
});
