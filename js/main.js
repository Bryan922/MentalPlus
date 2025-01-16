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
    const navLinks = document.querySelectorAll('nav ul li a');

    if (burgerMenu) {
        burgerMenu.addEventListener('click', function() {
            // Toggle les classes active
            burgerMenu.querySelectorAll('span').forEach(span => span.classList.toggle('active'));
            navMenu.classList.toggle('active');
        });
    }

    // Ferme le menu quand on clique sur un lien
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            burgerMenu.querySelectorAll('span').forEach(span => span.classList.remove('active'));
            navMenu.classList.remove('active');
        });
    });
}); 