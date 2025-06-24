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
    console.log('DOM loaded, initializing menu...');
    
    // Sélection des éléments du menu
    const burgerMenu = document.querySelector('.burger-menu');
    const navMenu = document.querySelector('nav ul');
    const navLinks = document.querySelectorAll('nav ul li a');
    
    console.log('Burger menu found:', !!burgerMenu);
    console.log('Nav menu found:', !!navMenu);
    console.log('Nav links found:', navLinks.length);

    if (burgerMenu && navMenu) {
        // Ajouter des styles pour s'assurer que le burger est visible
        burgerMenu.style.pointerEvents = 'auto';
        burgerMenu.style.cursor = 'pointer';
        burgerMenu.style.zIndex = '1001';
        
        burgerMenu.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Burger menu clicked!');
            
            // Toggle les classes active
            const spans = burgerMenu.querySelectorAll('span');
            spans.forEach(span => span.classList.toggle('active'));
            navMenu.classList.toggle('active');
            
            console.log('Menu is now:', navMenu.classList.contains('active') ? 'open' : 'closed');
        });
        
        // Ajouter support tactile
        burgerMenu.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.click();
        });
    } else {
        console.error('Burger menu or nav menu not found!');
    }

    // Ferme le menu quand on clique sur un lien
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (burgerMenu && navMenu) {
                burgerMenu.querySelectorAll('span').forEach(span => span.classList.remove('active'));
                navMenu.classList.remove('active');
                console.log('Menu closed after link click');
            }
        });
    });
    
    // Fermer le menu en cliquant en dehors
    document.addEventListener('click', function(e) {
        if (burgerMenu && navMenu && !burgerMenu.contains(e.target) && !navMenu.contains(e.target)) {
            burgerMenu.querySelectorAll('span').forEach(span => span.classList.remove('active'));
            navMenu.classList.remove('active');
        }
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
    
    // Fix pour les boutons "Réserver un créneau"
    const reservationButtons = document.querySelectorAll('a[href="rendez-vous.html"], .btn-primary[href="rendez-vous.html"]');
    console.log('Boutons de réservation trouvés:', reservationButtons.length);
    
    reservationButtons.forEach((button, index) => {
        console.log(`Bouton ${index + 1}:`, button);
        
        // Supprimer les anciens event listeners
        button.removeEventListener('click', handleReservationClick);
        
        // Ajouter le nouvel event listener
        button.addEventListener('click', handleReservationClick);
        
        // Assurer que le bouton est cliquable
        button.style.pointerEvents = 'auto';
        button.style.cursor = 'pointer';
    });
    
    function handleReservationClick(e) {
        console.log('Clic sur bouton réservation détecté');
        e.preventDefault();
        
        // Forcer la navigation
        try {
            window.location.href = 'rendez-vous.html';
        } catch (error) {
            console.error('Erreur de navigation:', error);
            // Fallback
            window.open('rendez-vous.html', '_self');
        }
    }
});