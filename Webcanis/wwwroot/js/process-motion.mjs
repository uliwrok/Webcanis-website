import { smoothstep } from './laptop-motion.mjs';

export function getProcessState(progress) {
    const time = Math.max(0, Math.min(3, progress));
    const from = Math.floor(time);
    const to = Math.min(3, from + 1);
    // Give Understand extra reading space when entering the section.
    const blend = smoothstep(from === 0 ? .45 : .22, .78, time - from);
    return getProcessFrame(from + blend * (to - from));
}

// Playback uses the same layout without the reading holds in the scroll trigger.
export function getProcessFrame(progress) {
    const time = Math.max(0, Math.min(3, progress));
    const from = Math.floor(time);
    const to = Math.min(3, from + 1);
    const blend = time - from;
    // The first two columns follow the supplied Figma poses; later stages repeat the same shift.
    const xAt = (index, active) => active === 0 ? [288, 758, 1113, 1490][index] : index === active ? 288 : index < active
        ? 288 - (active - index) * 405 : 771 + (index - active - 1) * 377;
    return {
        active: blend < .5 ? from : to,
        stages: [0, 1, 2, 3].map(index => {
            const emphasis = (index === from ? 1 - blend : 0) + (index === to ? blend : 0);
            return {
                x: xAt(index, from) + (xAt(index, to) - xAt(index, from)) * blend,
                y: 965 - emphasis * 234,
                emphasis
            };
        })
    };
}

export function getProcessMorphTime(progress) {
    const time = Math.max(0, Math.min(3, progress));
    if (Number.isInteger(time)) return [1.2, 2.12, 4.12, 6.12][time];
    const segment = Math.floor(time);
    // Skip the SVG's idle holds and closing loop; retain its original fragment choreography.
    const start = [1.2, 3.15, 5.15][segment];
    const end = [2.12, 4.12, 6.12][segment];
    return start + (end - start) * (time - segment);
}

export function getProcessPlayback(from, to, elapsed) {
    const duration = Math.min(2000, 850 * Math.max(.35, Math.abs(to - from)));
    const fraction = Math.max(0, Math.min(1, elapsed / duration));
    return { progress: from + (to - from) * smoothstep(0, 1, fraction), done: fraction === 1 };
}
