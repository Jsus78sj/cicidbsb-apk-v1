import assert from 'node:assert/strict';
import {previewGuidedRoom3d} from '../core/guided-room-3d.js';
const p=previewGuidedRoom3d({first:[0,0],second:[5000,4000],name:'مجلس',doorOffset:2500,doorWidth:900});
assert.ok(p.model.faces.length>0);
assert.ok(p.model.faces.some(f=>f.kind==='wall'));
assert.equal(p.canonical.storageUnit,'mm');
console.log('guided room 3d: ok');
