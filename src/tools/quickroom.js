import {defTool,H,ov,rec,pvRect} from './registry.js';
import {normalizeDimension} from '../core/dimension-input.js';
import {commitQuickRoom} from '../core/quick-room.js';
import {previewQuickRectangle} from '../core/quick-preview.js';
defTool({
 id:'quickroom',alias:'qroom غرفة_سريعة',label:'غرفة سريعة',hint:'ركنان متقابلان · اكتب الأبعاد بالأرقام العربية أو اللاتينية',
 opts:[{k:'t',label:'السماكة م',type:'len',def:'0.20'},{k:'type',label:'نوع الجدار',type:'sel',seg:1,items:[['ext','خارجي'],['int','داخلي']],def:'ext'},{k:'name',label:'اسم الغرفة',type:'text',def:''}],
 steps:[{p:'الركن الأول'},{p:'الركن المقابل',base:0,box:1,restart:1,each(ctx,p){const t=String(ov('quickroom','t')||'0.20');const thickness=normalizeDimension(/(?:mm|cm|m|م|سم|ملم)$/i.test(t.trim())?t:`${t}m`);const result=commitQuickRoom(ctx.pts[0],p,{thickness,type:ov('quickroom','type')||'ext',name:ov('quickroom','name')||'',label:'غرفة سريعة'});result.walls.forEach(w=>rec(ctx,w,'walls'));rec(ctx,result.room,'areas');H.rep('ok',`غرفة سريعة · ${result.walls.length} جدران · ${result.room.name||'بلا اسم'}`);}}],
 prev(ctx,g){if(!ctx.pts.length||!g)return [];previewQuickRectangle(ctx.pts[0],g);return [pvRect(ctx.pts[0],g,'#5cd98e')];}
});
