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

// Gestion globale de l'authentification
function checkAuth() {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('isAdmin');
    return token ? true : false;
}

// Mise à jour du bouton d'authentification
function updateAuthButton() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;
    
    if (checkAuth()) {
        authLink.innerHTML = `
            <a href="profile.html" class="btn-profile">
                <i class="fas fa-user"></i> Mon Profil
            </a>
        `;
    } else {
        authLink.innerHTML = `<a href="auth.html" class="btn-connexion">Connexion</a>`;
    }
}

// Gestion de la déconnexion
function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    updateAuthButton();
    
    // Gestion du bouton de déconnexion s'il existe
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}); 