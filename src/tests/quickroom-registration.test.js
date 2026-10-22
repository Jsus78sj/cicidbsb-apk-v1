import assert from 'node:assert/strict';
import {findTool} from '../tools/registry.js';
import '../tools/quickroom.js';
const tool=findTool('quickroom');
assert.ok(tool);
assert.equal(findTool('qroom'),tool);
assert.equal(findTool('غرفة_سريعة'),tool);
assert.equal(tool.steps.length,2);
assert.ok(tool.steps[1].box); /* أعلامُ الخطوة 1 لا true — اصطلاحُ المشروع (modify · sheet) */
assert.ok(tool.opts.some(x=>x.k==='name'));
console.log('quickroom registration: ok');
