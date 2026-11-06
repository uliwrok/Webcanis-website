import { getProcessState, getProcessFrame, getProcessMorphTime, getProcessPlayback } from './process-motion.mjs';

const process = document.querySelector('.process-section');
if (process) {
    const tabs = [...process.querySelectorAll('.process-tab')];
    const details = [...process.querySelectorAll('.process-detail')];
    const slides = [...process.querySelectorAll('.process-slide')];
    const tablist = process.querySelector('.process-tabs');
    const canvas = process.querySelector('.process-canvas');
    const illustration = process.querySelector('.process-illustration');
    const artwork = illustration.querySelector('object');
    let svgTimelines = [];
    const desktop = matchMedia('(min-width: 1100px) and (min-height: 680px)');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let active = 0;
    let pinned = false;
    let pending = false;
    let range = 1;
    let visualProgress = 0;
    let targetStage = 0;
    let playbackFrame = 0;

    process.classList.add('process-interactive');
    tablist.setAttribute('role', 'list');
    tabs.forEach((tab, index) => {
        slides[index].setAttribute('role', 'listitem');
        details[index].setAttribute('role', 'region');
    });

    function paint(progress) {
        visualProgress = progress;
        const state = getProcessFrame(progress);
        active = state.active;
        const selected = desktop.matches ? active : targetStage;
        process.dataset.stage = String(selected);
        svgTimelines.forEach(timeline => timeline.setCurrentTime(getProcessMorphTime(progress)));
        tabs.forEach((tab, index) => {
            const pose = state.stages[index];
            slides[index].classList.toggle('is-active', index === selected);
            slides[index].classList.toggle('is-before', index < selected);
            slides[index].classList.toggle('is-after', index > selected);
            tab.setAttribute('aria-pressed', String(index === selected));
            tab.tabIndex = index === selected ? 0 : -1;
            tab.style.setProperty('--stage-x', `${pose.x / 17.28}cqw`);
            tab.style.setProperty('--stage-y', `${pose.y / 17.28}cqw`);
            tab.style.setProperty('--stage-color', `rgb(${128 + pose.emphasis * 127}, ${128 - pose.emphasis * 33}, ${128 - pose.emphasis * 77})`);
            const detail = details[index];
            const opacity = Math.max(0, pose.emphasis * 2 - 1);
            detail.hidden = desktop.matches ? opacity < .001 : index !== selected;
            detail.inert = index !== selected;
            detail.setAttribute('aria-hidden', String(index !== selected));
            detail.style.opacity = desktop.matches ? opacity : 1;
            detail.style.transform = desktop.matches ? `translateY(${(1 - pose.emphasis) * 12}px)` : '';
        });
    }

    function showStage(index, immediate = false) {
        if (index === targetStage && (!immediate || (!playbackFrame && visualProgress === index))) return;
        targetStage = index;
        cancelAnimationFrame(playbackFrame);
        playbackFrame = 0;
        if (immediate || reducedMotion.matches) {
            paint(index);
            return;
        }
        const from = visualProgress;
        const start = performance.now();
        function tick(now) {
            const frame = getProcessPlayback(from, index, now - start);
            paint(frame.progress);
            playbackFrame = frame.done ? 0 : requestAnimationFrame(tick);
        }
        playbackFrame = requestAnimationFrame(tick);
    }

    function render() {
        pending = false;
        const rect = process.getBoundingClientRect();
        const progress = pinned ? -rect.top / range * 3 : targetStage;
        showStage(getProcessState(progress).active, rect.bottom < 0 || rect.top > innerHeight);
    }

    function schedule() {
        if (!pending) { pending = true; requestAnimationFrame(render); }
    }

    function select(index) {
        if (pinned) {
            const start = scrollY + process.getBoundingClientRect().top;
            // The sticky scene stays in place; its own playback provides the transition.
            window.scrollTo({ top: start + range * index / 3, behavior: 'instant' });
        } else if (!desktop.matches) {
            const slide = slides[index];
            tablist.scrollTo({
                left: slide.offsetLeft - (tablist.clientWidth - slide.offsetWidth) / 2,
                behavior: 'instant'
            });
        }
        showStage(index);
    }

    function syncCarouselStage() {
        const center = tablist.getBoundingClientRect().left + tablist.clientWidth / 2;
        const nearest = slides.reduce((closest, slide, index) => {
            const rect = slide.getBoundingClientRect();
            const distance = Math.abs(rect.left + rect.width / 2 - center);
            return distance < closest.distance ? { index, distance } : closest;
        }, { index: active, distance: Infinity }).index;
        if (nearest !== targetStage) showStage(nearest);
    }

    let carouselFrame = 0;
    tablist.addEventListener('scroll', () => {
        if (desktop.matches || carouselFrame) return;
        carouselFrame = requestAnimationFrame(() => {
            carouselFrame = 0;
            syncCarouselStage();
        });
    }, { passive: true });
    tablist.addEventListener('scrollend', () => {
        if (!desktop.matches) syncCarouselStage();
    }, { passive: true });

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
        if (reducedMotion.matches) showStage(targetStage, true);
        render();
    }
    artwork.addEventListener('load', () => {
        const root = artwork.contentDocument?.documentElement;
        if (typeof root?.pauseAnimations !== 'function') return;
        // Nested SVG viewports have independent SMIL clocks in Chromium.
        svgTimelines = [root, ...root.querySelectorAll('svg')];
        svgTimelines.forEach(timeline => {
            timeline.pauseAnimations();
            timeline.setCurrentTime(getProcessMorphTime(visualProgress));
        });
        illustration.classList.add('is-ready');
    });
    artwork.data = illustration.dataset.animationUrl;
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', configure);
    desktop.addEventListener('change', configure);
    reducedMotion.addEventListener('change', configure);
    window.addEventListener('load', () => {
        if (pinned && location.hash === '#proceso') {
            window.scrollTo({ top: scrollY + process.getBoundingClientRect().top, behavior: 'instant' });
        }
    });
    window.addEventListener('pagehide', () => showStage(targetStage, true));
    paint(0);
    configure();
}
