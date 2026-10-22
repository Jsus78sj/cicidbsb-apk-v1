import assert from 'node:assert/strict';
import {previewQuickRectangle,previewQuickWall} from '../core/quick-preview.js';
const wall=previewQuickWall([0,0],3000,90);
assert.deepEqual(wall.b.map(Math.round),[0,3000]);
assert.equal(wall.type,'wall');
const room=previewQuickRectangle([0,0],[5000,4000]);
assert.equal(room.closed,true);
assert.equal(room.points.length,4);
console.log('quick preview: ok');
