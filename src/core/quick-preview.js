import {nextPointFromLength,rectangleFromCorners} from './quick-draw.js';

export function previewQuickWall(start,length,angleDeg=0){
 const end=nextPointFromLength(start,length,angleDeg);
 return {type:'wall',a:[...start],b:end,length,angle:angleDeg};
}

export function previewQuickRectangle(a,b){
 return {type:'room',points:rectangleFromCorners(a,b),closed:true};
}
