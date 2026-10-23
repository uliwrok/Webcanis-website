import { getProcessState } from './process-motion.mjs';

const process = document.querySelector('.process-section');
if (process) {
    const tabs = [...process.querySelectorAll('.process-tab')];
    const details = [...process.querySelectorAll('.process-detail')];
    const tablist = process.querySelector('.process-tabs');
    const canvas = process.querySelector('.process-canvas');
    const desktop = matchMedia('(min-width: 1100px) and (min-height: 680px)');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let active = 0;
    let pinned = false;
    let pending = false;
    let range = 1;

    process.classList.add('process-interactive');
    tablist.setAttribute('role', 'tablist');
    tabs.forEach((tab, index) => {
        tab.setAttribute('role', 'tab');
        details[index].setAttribute('role', 'tabpanel');
    });

    function paint(progress) {
        const state = getProcessState(progress);
        active = state.active;
        process.dataset.stage = String(active);
        tabs.forEach((tab, index) => {
            const pose = state.stages[index];
            tab.setAttribute('aria-selected', String(index === active));
            tab.tabIndex = index === active ? 0 : -1;
            tab.style.setProperty('--stage-x', `${pose.x / 17.28}cqw`);
            tab.style.setProperty('--stage-y', `${pose.y / 17.28}cqw`);
            tab.style.setProperty('--stage-color', `rgb(${128 + pose.emphasis * 127}, ${128 - pose.emphasis * 33}, ${128 - pose.emphasis * 77})`);
            const detail = details[index];
            const opacity = Math.max(0, pose.emphasis * 2 - 1);
            detail.hidden = desktop.matches ? opacity < .001 : index !== active;
            detail.inert = index !== active;
            detail.setAttribute('aria-hidden', String(index !== active));
            detail.style.opacity = desktop.matches ? opacity : 1;
            detail.style.transform = desktop.matches ? `translateY(${(1 - pose.emphasis) * 12}px)` : '';
        });
    }

    function render() {
        pending = false;
        const progress = pinned ? -process.getBoundingClientRect().top / range * 3 : active;
        paint(progress);
    }

    function schedule() {
        if (!pending) { pending = true; requestAnimationFrame(render); }
    }

    function select(index) {
        if (pinned) {
            const start = scrollY + process.getBoundingClientRect().top;
            window.scrollTo({ top: start + range * index / 3, behavior: 'smooth' });
        } else {
            paint(index);
        }
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => select(index));
        tab.addEventListener('keydown', event => {
            let next;
            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = tabs.length - 1;
            if (next === undefined) return;
            event.preventDefault();
            tabs[next].focus({ preventScroll: true });
            select(next);
        });
    });

    function configure() {
        pinned = desktop.matches && !reducedMotion.matches;
        process.classList.toggle('process-pinned', pinned);
        range = Math.max(1, process.offsetHeight - innerHeight);
        canvas.style.setProperty('--process-scale', canvas.clientWidth / 1728);
        render();
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', configure);
    desktop.addEventListener('change', configure);
    reducedMotion.addEventListener('change', configure);
    window.addEventListener('load', () => {
        if (pinned && location.hash === '#proceso') {
            window.scrollTo({ top: scrollY + process.getBoundingClientRect().top, behavior: 'instant' });
        }
    });
    configure();
}
