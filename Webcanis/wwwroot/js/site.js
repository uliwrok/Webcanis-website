const navigation = document.getElementById('main-navigation');
navigation?.addEventListener('click', (event) => {
    if (event.target.closest('a') && window.matchMedia('(max-width: 991.98px)').matches) {
        bootstrap.Collapse.getOrCreateInstance(navigation, { toggle: false }).hide();
    }
});

// Enhance only when all three desktop compositions fit. Native scrolling is never intercepted.
const journey = document.querySelector('.showcase-journey');
if (journey) {
    const panels = [...journey.querySelectorAll('.story-panel')];
    const poses = [...journey.querySelectorAll('.laptop-pose')];
    const desktop = window.matchMedia('(min-width: 1100px) and (min-height: 680px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sectionIds = panels.map(panel => panel.id);
    const stops = [0, 1.3 / 3, 2.3 / 3];
    let markers = [];
    let enabled = false;
    let scrollRange = 1;
    let framePending = false;

    function smoothstep(start, end, value) {
        const progress = Math.max(0, Math.min(1, (value - start) / (end - start)));
        return progress * progress * (3 - 2 * progress);
    }

    function render() {
        framePending = false;
        if (!enabled) return;
        const time = Math.max(0, Math.min(3, -journey.getBoundingClientRect().top / scrollRange * 3));
        const visibility = [
            1 - smoothstep(.35, .95, time),
            smoothstep(.9, 1.2, time) * (1 - smoothstep(1.55, 1.95, time)),
            smoothstep(1.9, 2.2, time) * (1 - smoothstep(2.65, 3, time))
        ];
        const active = visibility.indexOf(Math.max(...visibility));
        panels.forEach((panel, index) => {
            const opacity = visibility[index];
            panel.style.setProperty('--scene-opacity', opacity.toFixed(4));
            panel.style.setProperty('--scene-blur', `${((1 - opacity) * 12).toFixed(2)}px`);
            panel.style.visibility = opacity < .005 ? 'hidden' : 'visible';
            panel.inert = index !== active || opacity < .15;
            panel.classList.toggle('is-active', !panel.inert);
        });
        // Crossfade reference poses independently: the laptop never receives the content blur.
        const front = smoothstep(.95, 1.2, time);
        const closed = smoothstep(1.95, 2.2, time);
        [1 - front, front * (1 - closed), closed].forEach((opacity, index) => {
            poses[index].style.opacity = opacity.toFixed(4);
        });
    }

    function scheduleRender() {
        if (enabled && !framePending) {
            framePending = true;
            requestAnimationFrame(render);
        }
    }

    function alignHash() {
        if (!enabled) return;
        const marker = markers.find(item => `#${item.id}` === window.location.hash);
        if (marker) {
            // Land on the fully readable part of a scene, including direct links and browser Back.
            window.scrollTo({ top: window.scrollY + journey.getBoundingClientRect().top + marker.offsetTop, behavior: 'instant' });
            scheduleRender();
        }
    }

    function configure() {
        const shouldEnable = desktop.matches && !reducedMotion.matches;
        if (shouldEnable !== enabled) {
            enabled = shouldEnable;
            journey.classList.toggle('story-ready', enabled);
            if (enabled) {
                markers = panels.map((panel, index) => {
                    panel.removeAttribute('id');
                    const marker = document.createElement('div');
                    marker.id = sectionIds[index];
                    marker.className = 'story-marker';
                    marker.setAttribute('aria-hidden', 'true');
                    journey.append(marker);
                    return marker;
                });
            } else {
                markers.forEach(marker => marker.remove());
                markers = [];
                panels.forEach((panel, index) => {
                    panel.id = sectionIds[index];
                    panel.inert = false;
                    panel.removeAttribute('style');
                    panel.classList.remove('is-active');
                });
                poses.forEach(pose => pose.removeAttribute('style'));
            }
        }
        if (enabled) {
            const canvas = journey.querySelector('.story-canvas');
            canvas.style.setProperty('--callout-scale', canvas.clientWidth / 1728);
            scrollRange = Math.max(1, journey.offsetHeight - window.innerHeight);
            markers.forEach((marker, index) => { marker.style.top = `${scrollRange * stops[index]}px`; });
            render();
        }
    }

    window.addEventListener('scroll', scheduleRender, { passive: true });
    window.addEventListener('resize', configure);
    window.addEventListener('hashchange', alignHash);
    window.addEventListener('load', alignHash);
    document.addEventListener('click', (event) => {
        const anchor = event.target.closest('a[href^="#"]');
        if (!enabled || !anchor || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        if (markers.some(marker => `#${marker.id}` === anchor.hash)) {
            event.preventDefault();
            if (window.location.hash !== anchor.hash) history.pushState(null, '', anchor.hash);
            alignHash();
        }
    });
    desktop.addEventListener('change', configure);
    reducedMotion.addEventListener('change', configure);
    configure();
    requestAnimationFrame(alignHash);
}
