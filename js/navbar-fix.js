// NAVBAR FIX - Navigation sans conflits d'authentification
// Compatible avec auth-fix.js

class NavbarManager {
    constructor() {
        this.init()
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupMobileMenu()
            this.setupScrollEffects()
            this.setupActiveLinks()
            this.setupAuthButton()
            this.setupSmoothScroll()
        })
    }

    setupMobileMenu() {
        const navToggle = document.getElementById('nav-toggle')
        const navMenu = document.getElementById('nav-menu')
        const navLinks = document.querySelectorAll('.nav-link')
        
        if (!navToggle || !navMenu) return

        // Toggle du menu mobile
        navToggle.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            
            navToggle.classList.toggle('active')
            navMenu.classList.toggle('active')
            
            // Empêcher le scroll du body quand le menu est ouvert
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden'
            } else {
                document.body.style.overflow = ''
            }
        })
        
        // Fermer le menu quand on clique sur un lien
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Ne pas empêcher la navigation normale
                // Juste fermer le menu mobile
                navToggle.classList.remove('active')
                navMenu.classList.remove('active')
                document.body.style.overflow = ''
            })
        })
        
        // Fermer le menu avec la touche Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                navToggle.classList.remove('active')
                navMenu.classList.remove('active')
                document.body.style.overflow = ''
            }
        })
        
        // Fermer le menu si on clique en dehors
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                navToggle.classList.remove('active')
                navMenu.classList.remove('active')
                document.body.style.overflow = ''
            }
        })
    }

    setupScrollEffects() {
        let lastScrollTop = 0
        const header = document.querySelector('.main-header') || document.querySelector('header') || document.querySelector('nav')
        
        if (!header) return

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop
            
            // Ajouter/retirer la classe scrolled pour l'effet de transparence
            if (scrollTop > 50) {
                header.classList.add('scrolled')
            } else {
                header.classList.remove('scrolled')
            }
            
            lastScrollTop = scrollTop
        })
    }

    setupActiveLinks() {
        const navLinks = document.querySelectorAll('.nav-link')
        const currentPage = window.location.pathname.split('/').pop() || 'index.html'
        
        navLinks.forEach(link => {
            link.classList.remove('active')
            const href = link.getAttribute('href')
            
            if (href === currentPage || 
                (currentPage === 'index.html' && href === '/') ||
                (currentPage === '' && href === 'index.html')) {
                link.classList.add('active')
            }
        })
    }

    setupAuthButton() {
        // Attendre que authManager soit disponible
        const checkAuthManager = () => {
            if (window.authManager) {
                this.updateAuthButton()
                // Écouter les changements d'authentification
                window.addEventListener('authStateChanged', () => {
                    this.updateAuthButton()
                })
            } else {
                setTimeout(checkAuthManager, 100)
            }
        }
        
        checkAuthManager()
    }

    updateAuthButton() {
        const authButton = document.getElementById('auth-button') || 
                          document.querySelector('.auth-button') ||
                          document.querySelector('[data-auth-button]')
        
        if (!authButton) return

        if (window.authManager && window.authManager.isAuthenticated()) {
            const user = window.authManager.getCurrentUser()
            authButton.innerHTML = `
                <span class="user-info">
                    <i class="fas fa-user"></i>
                    ${user.name || 'Profil'}
                </span>
                <div class="dropdown-menu">
                    <a href="profile.html" class="dropdown-item">
                        <i class="fas fa-user-circle"></i> Mon Profil
                    </a>
                    <a href="#" onclick="navbarManager.logout()" class="dropdown-item">
                        <i class="fas fa-sign-out-alt"></i> Déconnexion
                    </a>
                </div>
            `
            authButton.classList.add('authenticated')
        } else {
            authButton.innerHTML = `
                <a href="auth.html" class="auth-link">
                    <i class="fas fa-sign-in-alt"></i>
                    Connexion
                </a>
            `
            authButton.classList.remove('authenticated')
        }
    }

    logout() {
        if (window.authManager) {
            window.authManager.logout()
            // Rediriger vers la page d'accueil après déconnexion
            setTimeout(() => {
                window.location.href = 'index.html'
            }, 500)
        }
    }

    setupSmoothScroll() {
        // Effet de scroll smooth pour les ancres
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault()
                e.stopPropagation()
                
                const target = document.querySelector(this.getAttribute('href'))
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    })
                }
            })
        })
    }

    // Méthode pour forcer la mise à jour de la navbar
    refresh() {
        this.setupActiveLinks()
        this.updateAuthButton()
    }
}

// Initialisation globale
const navbarManager = new NavbarManager()

// Exposer globalement
window.navbarManager = navbarManager

// Ajouter les styles CSS pour le dropdown
const navbarStyle = document.createElement('style')
navbarStyle.textContent = `
    .auth-button {
        position: relative;
        cursor: pointer;
    }
    
    .auth-button.authenticated .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        color: white;
        text-decoration: none;
    }
    
    .auth-button .dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        min-width: 180px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.3s ease;
        z-index: 1000;
    }
    
    .auth-button:hover .dropdown-menu {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }
    
    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        color: #333;
        text-decoration: none;
        border-bottom: 1px solid #eee;
        transition: background-color 0.2s;
    }
    
    .dropdown-item:hover {
        background-color: #f8f9fa;
    }
    
    .dropdown-item:last-child {
        border-bottom: none;
    }
    
    .auth-link {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        color: white;
        text-decoration: none;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        transition: all 0.3s ease;
    }
    
    .auth-link:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.5);
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .auth-button .dropdown-menu {
            position: static;
            opacity: 1;
            visibility: visible;
            transform: none;
            box-shadow: none;
            border: none;
            background: transparent;
        }
        
        .dropdown-item {
            color: white;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .dropdown-item:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
    }
`
document.head.appendChild(navbarStyle)