export function initializeSolutions(setScreenImage) {
    const buttons = [...document.querySelectorAll('.service-select')];
    const status = document.getElementById('solution-preview-status');
    let selectionRequest = 0;

    async function select(button) {
        const request = ++selectionRequest;
        try {
            await setScreenImage(button.dataset.screenImage);
            if (request !== selectionRequest) return;
            buttons.forEach(item => {
                const selected = item === button;
                item.setAttribute('aria-pressed', String(selected));
                item.closest('.service-item').classList.toggle('is-featured', selected);
            });
            status.textContent = '';
        } catch (error) {
            if (request !== selectionRequest) return;
            status.textContent = 'The preview could not be loaded. Please try again.';
            console.warn('Solution preview could not be loaded.', error);
        }
    }

    buttons.forEach(button => button.addEventListener('click', () => select(button)));
    // Queue the initial image before the shared laptop renderer loads, including Home.
    return buttons.length ? select(buttons[0]) : Promise.resolve();
}
