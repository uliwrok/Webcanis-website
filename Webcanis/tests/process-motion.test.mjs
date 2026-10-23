import assert from 'node:assert/strict';
import { getProcessState } from '../wwwroot/js/process-motion.mjs';

for (let stage = 0; stage < 4; stage++) {
    const state = getProcessState(stage);
    assert.equal(state.active, stage);
    assert.equal(state.stages[stage].x, 288);
    assert.equal(state.stages[stage].y, 731);
    assert.equal(state.stages[stage].emphasis, 1);
    assert.equal(state.stages.reduce((sum, pose) => sum + pose.emphasis, 0), 1);
}
assert.deepEqual(getProcessState(-1), getProcessState(0));
assert.deepEqual(getProcessState(5), getProcessState(3));
assert.deepEqual(getProcessState(.45), getProcessState(0));
assert.equal(getProcessState(.5).active, 0, 'Understand stays selected until the visual transition passes halfway.');
assert.equal(getProcessState(.7).active, 1);
for (let stage = 0; stage < 4; stage++) {
    assert.deepEqual(getProcessState(stage + .2).stages, getProcessState(stage).stages);
    assert.deepEqual(getProcessState(stage - .2).stages, getProcessState(stage).stages);
}
assert.deepEqual(getProcessState(0).stages.map(pose => pose.x), [288, 758, 1113, 1490]);
assert.deepEqual(getProcessState(1).stages.map(pose => pose.x), [-117, 288, 771, 1148]);
for (let t = .01; t < 3; t += .01) {
    const before = getProcessState(t - .00001);
    const after = getProcessState(t + .00001);
    before.stages.forEach((pose, i) => assert.ok(Math.abs(pose.x - after.stages[i].x) < .1));
    assert.ok(Math.abs(before.stages.reduce((sum, pose) => sum + pose.emphasis, 0) - 1) < 1e-9);
}
assert.ok(getProcessState(.5).stages[0].x < getProcessState(0).stages[0].x);
assert.equal(getProcessState(1).stages[0].y, 965);
console.log('Passed: process endpoints, reading pauses, continuous horizontal travel, stage emphasis and clamped scroll.');
