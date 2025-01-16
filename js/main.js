/**
 * Gestion du menu burger - NE PAS MODIFIER
 * Dernière mise à jour : 2024-03
 * 
 * Ce code gère le comportement du menu burger sur mobile :
 * - Ouverture/fermeture du menu au clic sur le burger
 * - Animation des barres du burger
 * - Fermeture du menu au clic en dehors
 * - Fermeture du menu après clic sur un lien
 */
document.addEventListener('DOMContentLoaded', function() {
    // Sélection des éléments du menu
    const burgerMenu = document.querySelector('.burger-menu');
    const navMenu = document.querySelector('nav ul');

    if (burgerMenu && navMenu) {
        // Gestion du clic sur le burger
        burgerMenu.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Animation du burger
            const spans = this.querySelectorAll('span');
            spans.forEach(span => span.classList.toggle('active'));
        });

        // Fermeture du menu au clic en dehors
        document.addEventListener('click', function(e) {
            if (!burgerMenu.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                const spans = burgerMenu.querySelectorAll('span');
                spans.forEach(span => span.classList.remove('active'));
            }
        });

        // Fermeture du menu après clic sur un lien
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                const spans = burgerMenu.querySelectorAll('span');
                spans.forEach(span => span.classList.remove('active'));
            });
        });
    }
}); 