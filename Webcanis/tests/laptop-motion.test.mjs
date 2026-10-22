import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getLaptopPose, laptopPoses } from '../wwwroot/js/laptop-motion.mjs';

function assertPose(actual, expected) {
    for (const key of Object.keys(expected)) assert.ok(Math.abs(actual[key] - expected[key]) < 1e-9, key);
}
assertPose(getLaptopPose(0), laptopPoses.home);
assertPose(getLaptopPose(1.3), laptopPoses.solutions);
assertPose(getLaptopPose(2.3), laptopPoses.projects);
assertPose(getLaptopPose(-1), laptopPoses.home);
assertPose(getLaptopPose(4), laptopPoses.projects);

// Scrubbing is deterministic in either direction, without a discontinuity at a scene boundary.
for (const time of [.35, .7, 1.2, 1.55, 1.9, 2.2]) {
    const before = getLaptopPose(time - .00001);
    const after = getLaptopPose(time + .00001);
    for (const key of Object.keys(before)) assert.ok(Math.abs(before[key] - after[key]) < .1, key);
}
for (let time = 1.55; time <= 2.2; time += .01) {
    assert.ok(getLaptopPose(time).lid <= getLaptopPose(time + .01).lid);
}
const intermediate = getLaptopPose(1.875);
assert.ok(intermediate.lid > laptopPoses.solutions.lid && intermediate.lid < laptopPoses.projects.lid);
assert.ok(Math.abs(laptopPoses.solutions.pitch + laptopPoses.solutions.lid + Math.PI / 2) < 1e-9,
    'The Solutions screen must be vertical in world space.');
assert.ok(laptopPoses.projects.lid > 0, 'Projects must close beyond the exported hinge gap.');
assert.ok(intermediate.x < laptopPoses.solutions.x && intermediate.x > laptopPoses.projects.x);
const forward = [.7, 1.3, 1.875].map(getLaptopPose);
const reverse = [1.875, 1.3, .7].map(getLaptopPose).reverse();
assert.deepEqual(forward, reverse);

const binary = readFileSync(new URL('../wwwroot/models/generic-laptop.glb', import.meta.url));
assert.equal(binary.readUInt32LE(0), 0x46546c67);
const gltf = JSON.parse(binary.subarray(20, 20 + binary.readUInt32LE(12)).toString());
const hinge = gltf.nodes.find(node => node.name === 'Lid_Hinge');
const screen = gltf.nodes.find(node => node.name === 'Screen_Surface');
assert.ok(hinge && screen, 'The published model must expose the hinge and screen.');
assert.ok(hinge.children.includes(gltf.nodes.indexOf(screen)));
assert.ok('TEXCOORD_0' in gltf.meshes[screen.mesh].primitives[0].attributes);
assert.ok(Math.abs(hinge.extras.open_angle_x - laptopPoses.home.lid) < .000001);
console.log('Passed: endpoint poses, continuous reversible interpolation, lid closure, GLB hierarchy and screen UVs.');
