import { smoothstep } from './laptop-motion.mjs';

export function getProcessState(progress) {
    const time = Math.max(0, Math.min(3, progress));
    const from = Math.floor(time);
    const to = Math.min(3, from + 1);
    // Give Understand extra reading space when entering the section.
    const blend = smoothstep(from === 0 ? .45 : .22, .78, time - from);
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
