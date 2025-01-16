import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializePasswordToggles();
    initializeForms();
});

// Gestion des onglets
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            
            // Mettre à jour les classes actives
            tabButtons.forEach(btn => btn.classList.remove('active'));
            forms.forEach(form => form.classList.remove('active'));
            
            button.classList.add('active');
            document.querySelector(`.auth-form[data-form="${tab}"]`).classList.add('active');
        });
    });
}

// Gestion de la visibilité des mots de passe
function initializePasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                button.textContent = '🔒';
            } else {
                input.type = 'password';
                button.textContent = '👁️';
            }
        });
    });
}

// Initialisation des formulaires
function initializeForms() {
    // Formulaire de connexion
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Formulaire d'inscription
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Formulaire admin
    const adminForm = document.getElementById('admin-form');
    if (adminForm) {
        adminForm.addEventListener('submit', handleAdminLogin);
    }
}

// Gérer la connexion
async function handleLogin(e) {
    e.preventDefault();
    
    try {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Vérifier le rôle de l'utilisateur
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        // Rediriger selon le rôle
        if (userData.role === 'client') {
            window.location.href = 'profile.html';
        } else {
            alert('Veuillez utiliser le formulaire de connexion admin');
            await signOut(auth);
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        alert('Erreur de connexion: ' + error.message);
    }
}

// Gérer l'inscription
async function handleRegister(e) {
    e.preventDefault();
    
    try {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            alert('Les mots de passe ne correspondent pas');
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Sauvegarder les informations supplémentaires
        await set(ref(db, `users/${user.uid}`), {
            name: name,
            email: email,
            role: 'client',
            createdAt: new Date().toISOString()
        });

        alert('Compte créé avec succès !');
        window.location.href = 'profile.html';
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        alert('Erreur d\'inscription: ' + error.message);
    }
}

// Gérer la connexion admin
async function handleAdminLogin(e) {
    e.preventDefault();
    
    try {
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Vérifier le rôle admin
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (userData.role === 'admin' || userData.role === 'super_admin') {
            window.location.href = 'admin.html';
        } else {
            alert('Accès non autorisé');
            await signOut(auth);
        }
    } catch (error) {
        console.error('Erreur de connexion admin:', error);
        alert('Erreur de connexion: ' + error.message);
    }
} 