import assert from 'node:assert/strict';
import { getProcessState, getProcessFrame, getProcessMorphTime, getProcessPlayback } from '../wwwroot/js/process-motion.mjs';

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

assert.deepEqual([0, 1, 2, 3].map(getProcessMorphTime), [1.2, 2.12, 4.12, 6.12]);
assert.equal(getProcessMorphTime(-2), 1.2);
assert.equal(getProcessMorphTime(8), 6.12, 'Launch must not enter the SVG closing loop.');
for (let stage = 0; stage < 3; stage++) {
    let previous = -Infinity;
    for (let step = 1; step < 100; step++) {
        const time = getProcessMorphTime(stage + step / 100);
        assert.ok(time > previous);
        previous = time;
    }
    // A single scroll trigger keeps playing to completion without further scroll events.
    const start = getProcessPlayback(stage, stage + 1, 0);
    const middle = getProcessPlayback(stage, stage + 1, 425);
    const end = getProcessPlayback(stage, stage + 1, 850);
    assert.equal(start.progress, stage);
    assert.equal(middle.done, false);
    assert.ok(middle.progress > stage && middle.progress < stage + 1);
    assert.deepEqual(end, { progress: stage + 1, done: true });
    assert.deepEqual(getProcessPlayback(middle.progress, stage, 0), { progress: middle.progress, done: false });
    assert.deepEqual(getProcessPlayback(stage + 1, stage, 850), { progress: stage, done: true });
    assert.equal(getProcessFrame(stage + 1).stages[stage + 1].emphasis, 1);
}
assert.deepEqual(getProcessPlayback(0, 3, 2000), { progress: 3, done: true });
console.log('Passed: four SVG checkpoints, transition playback, reverse/retarget continuity and completion without scroll.');
