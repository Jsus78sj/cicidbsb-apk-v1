import assert from 'node:assert/strict';
import {findTool} from '../tools/registry.js';
import '../tools/quickopening.js';
const tool=findTool('quickopening');
assert.ok(tool);
assert.equal(findTool('qo'),tool);
assert.equal(findTool('فتحة_سريعة'),tool);
assert.equal(tool.steps[0].ent,'wall');
assert.ok(tool.steps[1].text); /* أعلامُ الخطوة 1 لا true — اصطلاحُ المشروع (modify · sheet) */
assert.ok(tool.opts.some(x=>x.k==='w'));
console.log('quick opening registration: ok');
