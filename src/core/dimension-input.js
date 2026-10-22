const finite=v=>typeof v==='number'&&Number.isFinite(v);
const DIGITS={'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'};
const clean=value=>String(value??'').trim().replace(/[٠-٩۰-۹]/g,ch=>DIGITS[ch]).replace('٫','.').replace('،',',');
export function normalizeNumber(value){
 const raw=clean(value),n=Number(raw);
 if(!raw)throw new TypeError('الرقم فارغ');
 if(!finite(n))throw new TypeError('الرقم غير صالح');
 return n;
}
export function normalizeAngle(value){const n=normalizeNumber(value);if(!finite(n))throw new TypeError('الزاوية غير صالحة');return n;}
export function normalizeDimension(value,defaultUnit='mm'){
 let raw=clean(value);if(!raw)throw new TypeError('المقاس فارغ');
 if(/^[-+]?\d+(?:\.\d*)?$/.test(raw)&&defaultUnit)raw+=defaultUnit;
 const m=/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(mm|cm|m|م|سم|ملم)?$/i.exec(raw);
 if(!m)throw new TypeError('المقاس غير صالح');
 const n=Number(m[1]),unit=(m[2]||'mm').toLowerCase();
 if(!finite(n)||n<=0)throw new RangeError('المقاس يجب أن يكون موجباً');
 const factor={mm:1,ملم:1,cm:10,سم:10,m:1000,م:1000}[unit];
 if(!factor)throw new TypeError('وحدة غير معروفة');
 return n*factor;
}
export function dimensionPreview(start,end){const dx=end[0]-start[0],dy=end[1]-start[1];return {length:Math.hypot(dx,dy),angle:Math.atan2(dy,dx)*180/Math.PI};}
