import assert from 'node:assert/strict';
import {S,newState,canUndo,undo} from '../core/state.js';
import {commitQuickRectangle} from '../core/quick-draw-transaction.js';
newState(); const before=S.walls.length;
const result=commitQuickRectangle([0,0],[5000,4000],{thickness:200,type:'ext'});
assert.equal(result.created.length,4); assert.equal(S.walls.length,before+4); assert.equal(canUndo(),true); assert.equal(undo(),true); assert.equal(S.walls.length,before);
assert.throws(()=>commitQuickRectangle([0,0],[0,0],{thickness:200}),/area/); assert.equal(S.walls.length,before);
console.log('quick draw transaction: ok');
