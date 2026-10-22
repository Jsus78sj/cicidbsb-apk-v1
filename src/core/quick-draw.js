const finite=v=>typeof v==='number'&&Number.isFinite(v);
const point=p=>Array.isArray(p)&&p.length===2&&finite(+p[0])&&finite(+p[1]);
const dist=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
export function nextPointFromLength(start,length,angleDeg=0){
 if(!point(start)||!finite(+length)||+length<=0||!finite(+angleDeg))throw new TypeError('start, length and angle are required');
 const a=+angleDeg*Math.PI/180; return [start[0]+length*Math.cos(a),start[1]+length*Math.sin(a)];
}
export function closePolygon(points,tolerance=1){
 if(!Array.isArray(points)||points.length<3||!points.every(point))throw new TypeError('A polygon needs at least three valid points');
 const p=points.map(x=>[+x[0],+x[1]]), closed=dist(p[0],p[p.length-1])<=Math.max(0,+tolerance||0);
 return {points:closed?p.slice(0,-1):p,closed,closingEdge:[p[p.length-1],p[0]]};
}
export function rectangleFromCorners(a,b){
 if(!point(a)||!point(b))throw new TypeError('Two corners are required');
 const x0=Math.min(+a[0],+b[0]),x1=Math.max(+a[0],+b[0]),y0=Math.min(+a[1],+b[1]),y1=Math.max(+a[1],+b[1]);
 if(x1===x0||y1===y0)throw new RangeError('Rectangle must have area');
 return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
}
export function drawingCommitPlan(points,options={}){
 const p=closePolygon(points,options.tolerance==null?1:options.tolerance),segments=[];
 for(let i=0;i<p.points.length-1;i++)segments.push([p.points[i],p.points[i+1]]);
 if(p.points.length>=3)segments.push([p.points[p.points.length-1],p.points[0]]);
 return {points:p.points,segments,closed:true,operationCount:segments.length};
}
