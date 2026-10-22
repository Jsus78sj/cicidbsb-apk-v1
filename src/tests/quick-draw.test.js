import assert from 'node:assert/strict';
import {closePolygon,drawingCommitPlan,nextPointFromLength,rectangleFromCorners} from '../core/quick-draw.js';
const p=nextPointFromLength([1000,2000],3000,0); assert.deepEqual(p,[4000,2000]);
assert.deepEqual(nextPointFromLength([0,0],1000,90).map(Math.round),[0,1000]);
const rect=rectangleFromCorners([5000,4000],[0,0]); assert.deepEqual(rect,[[0,0],[5000,0],[5000,4000],[0,4000]]);
const closed=closePolygon([...rect,rect[0]],2); assert.equal(closed.closed,true); assert.equal(closed.points.length,4);
const plan=drawingCommitPlan([[0,0],[5000,0],[5000,4000]]); assert.equal(plan.operationCount,3); assert.deepEqual(plan.segments[2],[[5000,4000],[0,0]]);
assert.throws(()=>nextPointFromLength([0,0],0),/required/); assert.throws(()=>rectangleFromCorners([0,0],[0,0]),/area/);
console.log('quick draw: ok');
