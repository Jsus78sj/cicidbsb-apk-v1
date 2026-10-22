import assert from 'node:assert/strict';
import {findTool} from '../tools/registry.js';
import '../tools/quickwall.js';
const tool=findTool('quickwall');
assert.ok(tool);
assert.equal(findTool('qw'),tool);
assert.equal(findTool('جدار_سريع'),tool);
assert.equal(tool.steps.length,3);
assert.ok(tool.steps[1].text); /* أعلامُ الخطوة 1 لا true — اصطلاحُ المشروع (modify · sheet) */
assert.ok(tool.steps[2].text); /* أعلامُ الخطوة 1 لا true — اصطلاحُ المشروع (modify · sheet) */
assert.ok(tool.opts.some(x=>x.k==='t'));
console.log('quickwall registration: ok');
