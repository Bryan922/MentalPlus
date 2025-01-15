document.addEventListener('DOMContentLoaded', function() {
    // Menu burger
    const burgerMenu = document.querySelector('.burger-menu');
    const navMenu = document.querySelector('nav ul');

    burgerMenu.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        burgerMenu.classList.toggle('active');
    });

    // Fermer le menu quand on clique sur un lien
    document.querySelectorAll('nav ul li a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            burgerMenu.classList.remove('active');
        });
    });

    // Fermer le menu quand on clique en dehors
    document.addEventListener('click', (e) => {
        if (!e.target.closest('nav')) {
            navMenu.classList.remove('active');
            burgerMenu.classList.remove('active');
        }
    });
}); 