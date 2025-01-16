document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializePasswordToggles();
    initializeForms();
    checkRememberedUser();
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
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const rememberMe = formData.get('remember-me') === 'on';
    const isAdminLogin = window.location.pathname.includes('admin-login.html');

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        alert('Email ou mot de passe incorrect');
        return;
    }

    if (isAdminLogin && !user.isAdmin) {
        alert('Accès non autorisé. Cette page est réservée aux administrateurs.');
        return;
    }

    if (!isAdminLogin && user.isAdmin) {
        alert('Veuillez utiliser la page de connexion administrateur');
        return;
    }

    if (rememberMe) {
        localStorage.setItem('rememberedUser', JSON.stringify({
            email: email,
            isAdmin: user.isAdmin
        }));
    }

    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('user', JSON.stringify(user));
    if (user.isAdmin) {
        sessionStorage.setItem('isAdmin', 'true');
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'profile.html';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');

    if (password !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existingUser = users.find(user => user.email === email);
    
    if (existingUser) {
        alert('Un compte existe déjà avec cet email');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password,
        role: 'client', // Par défaut, les nouveaux comptes sont des clients
        isAdmin: false,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(newUser));

    alert('Compte créé avec succès !');
    window.location.href = 'profile.html';
}

// Mise à jour des boutons d'authentification
function updateAuthButtons() {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;

    const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    
    if (isAuthenticated && user) {
        if (user.isAdmin) {
            authButtons.innerHTML = `
                <a href="admin.html" class="btn-auth">Espace Admin</a>
                <button onclick="logout()" class="btn-auth">Déconnexion</button>
            `;
        } else {
            authButtons.innerHTML = `
                <a href="profile.html" class="btn-auth">Mon Profil</a>
                <button onclick="logout()" class="btn-auth">Déconnexion</button>
            `;
        }
    } else {
        authButtons.innerHTML = `
            <a href="auth.html" class="btn-auth">Connexion</a>
            <a href="auth.html#register" class="btn-auth">S'inscrire</a>
            <a href="admin-login.html" class="btn-auth btn-admin">Espace Admin</a>
        `;
    }
}

// Déconnexion
function logout() {
    sessionStorage.clear(); // Effacer toutes les données de session
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

function checkRememberedUser() {
    const rememberedUser = JSON.parse(localStorage.getItem('rememberedUser') || 'null');
    if (rememberedUser) {
        const emailInput = document.querySelector('input[name="email"]');
        if (emailInput) {
            emailInput.value = rememberedUser.email;
        }
    }
} 