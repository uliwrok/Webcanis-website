const navigation = document.getElementById('main-navigation');

navigation?.addEventListener('click', (event) => {
    if (event.target.closest('a') && window.matchMedia('(max-width: 991.98px)').matches) {
        bootstrap.Collapse.getOrCreateInstance(navigation, { toggle: false }).hide();
    }
});
