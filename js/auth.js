document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializePasswordToggles();
    initializeForms();
    updateAuthButtons();
});

// Gestion des onglets
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetForm = tab.dataset.tab;
            
            // Mise à jour des onglets actifs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Mise à jour des formulaires actifs
            forms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${targetForm}-form`) {
                    form.classList.add('active');
                }
            });
        });
    });
}

// Gestion de l'affichage des mots de passe
function initializePasswordToggles() {
    const toggles = document.querySelectorAll('.toggle-password');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const input = toggle.previousElementSibling;
            const type = input.getAttribute('type');
            
            if (type === 'password') {
                input.setAttribute('type', 'text');
                toggle.classList.remove('fa-eye');
                toggle.classList.add('fa-eye-slash');
            } else {
                input.setAttribute('type', 'password');
                toggle.classList.remove('fa-eye-slash');
                toggle.classList.add('fa-eye');
            }
        });
    });
}

// Gestion des formulaires
function initializeForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const adminForm = document.getElementById('admin-form');

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (adminForm) adminForm.addEventListener('submit', handleAdminLogin);
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitButton = e.target.querySelector('button[type="submit"]');

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';

        // Simulation d'une connexion réussie
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({
            email: email,
            name: 'Utilisateur Test'
        }));
        
        updateAuthButtons();
        window.location.href = 'rendez-vous.html';
    } catch (error) {
        console.error('Erreur de connexion:', error);
        alert('Erreur lors de la connexion. Veuillez réessayer.');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Se connecter';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submitButton = e.target.querySelector('button[type="submit"]');
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirm_password')
    };

    if (data.password !== data.confirmPassword) {
        alert('Les mots de passe ne correspondent pas.');
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';

        // Simulation d'une inscription réussie
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({
            email: data.email,
            name: data.name
        }));
        
        updateAuthButtons();
        window.location.href = 'rendez-vous.html';
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        alert('Erreur lors de l\'inscription. Veuillez réessayer.');
        submitButton.disabled = false;
        submitButton.innerHTML = 'S\'inscrire';
    }
}

// Mise à jour des boutons d'authentification
function updateAuthButtons() {
    const btnConnexion = document.querySelector('.btn-connexion');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (btnConnexion) {
        if (isAuthenticated) {
            btnConnexion.textContent = 'Mon Profil';
            btnConnexion.href = 'profile.html';
        } else {
            btnConnexion.textContent = 'Connexion';
            btnConnexion.href = 'auth.html';
        }
    }
}

// Déconnexion
function logout() {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    updateAuthButtons();
    window.location.href = 'index.html';
}

// Gestion de la connexion admin
function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    // Vérification des identifiants admin
    if (email === 'admin@mentalserenity.fr' && password === 'Admin123!') {
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({
            email: email,
            name: 'Administrateur',
            role: 'admin'
        }));
        window.location.href = 'admin.html';
    } else {
        alert('Identifiants administrateur incorrects');
    }
} 