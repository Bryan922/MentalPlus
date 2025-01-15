document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializePasswordToggles();
    initializeForms();
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

    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
}

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        email: formData.get('email'),
        password: formData.get('password'),
        remember: formData.get('remember') === 'on'
    };

    try {
        // Simulation d'une requête API
        console.log('Tentative de connexion:', data);
        
        // En cas de succès, redirection vers la page de rendez-vous
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({
            email: data.email,
            name: 'John Doe' // À remplacer par les données réelles de l'utilisateur
        }));
        
        window.location.href = 'rendez-vous.html';
    } catch (error) {
        console.error('Erreur de connexion:', error);
        alert('Erreur lors de la connexion. Veuillez réessayer.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        firstname: formData.get('firstname'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        passwordConfirm: formData.get('password-confirm')
    };

    // Validation du mot de passe
    if (data.password !== data.passwordConfirm) {
        alert('Les mots de passe ne correspondent pas.');
        return;
    }

    try {
        // Simulation d'une requête API
        console.log('Tentative d\'inscription:', data);
        
        // En cas de succès, connexion automatique et redirection
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({
            email: data.email,
            name: `${data.firstname} ${data.name}`
        }));
        
        window.location.href = 'rendez-vous.html';
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        alert('Erreur lors de l\'inscription. Veuillez réessayer.');
    }
}

// Gestion de l'authentification
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Simuler une connexion réussie
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify({
        email: email,
        name: 'Utilisateur Test' // À remplacer par le vrai nom une fois la base de données configurée
    }));

    // Rediriger vers la page d'accueil
    window.location.href = 'index.html';
}

// Vérifier si l'utilisateur est connecté
function checkAuthStatus() {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const btnConnexion = document.querySelector('.btn-connexion');
    
    if (isAuthenticated) {
        btnConnexion.textContent = 'Mon Profil';
        btnConnexion.href = 'profile.html';
    } else {
        btnConnexion.textContent = 'Connexion';
        btnConnexion.href = 'login.html';
    }
}

// Déconnexion
function logout() {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Initialiser la vérification du statut d'authentification
document.addEventListener('DOMContentLoaded', checkAuthStatus);

// Ajouter les écouteurs d'événements si on est sur la page de connexion
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
} 