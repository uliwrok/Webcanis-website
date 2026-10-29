export function smoothstep(start, end, value) {
    const progress = Math.max(0, Math.min(1, (value - start) / (end - start)));
    return progress * progress * (3 - 2 * progress);
}

// Centers and widths use the 1728 × 1077 Figma content canvas; angles are radians.
export const laptopPoses = {
    home: { x: 1140, y: 560, width: 1100, pitch: .35, yaw: -.78, roll: -.09, lid: -1.8325957146 },
    solutions: { x: 1095, y: 674, width: 1168, pitch: .04, yaw: 0, roll: 0, lid: -Math.PI / 2 - .04 },
    // Slight hinge overtravel seals the visible gap between the lid and base.
    projects: { x: 864, y: 972, width: 1040, pitch: .015, yaw: 0, roll: 0, lid: .035 }
};

function blend(from, to, progress) {
    return Object.fromEntries(Object.keys(from).map(key => [key, from[key] + (to[key] - from[key]) * progress]));
}

export function getLaptopPose(time) {
    const front = blend(laptopPoses.home, laptopPoses.solutions, smoothstep(.35, 1.2, time));
    return blend(front, laptopPoses.projects, smoothstep(1.55, 2.2, time));
}

export function getLaptopSceneTime(scrollTime) {
    if (scrollTime >= 2.8) return 3;
    if (scrollTime >= 1.8) return 2.3;
    if (scrollTime >= .65) return 1.3;
    return 0;
}

export function getLaptopPlayback(from, to, elapsed) {
    const duration = Math.min(1800, 900 * Math.max(.3, Math.abs(to - from)));
    const fraction = Math.max(0, Math.min(1, elapsed / duration));
    return { time: from + (to - from) * smoothstep(0, 1, fraction), done: fraction === 1 };
}
