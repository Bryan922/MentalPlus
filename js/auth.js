import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Fonction d'inscription
async function handleRegister(event) {
    event.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const name = document.getElementById('register-name').value;

    try {
        // Créer l'utilisateur dans Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Sauvegarder les informations supplémentaires dans la base de données
        await set(ref(db, 'users/' + user.uid), {
            name: name,
            email: email,
            role: 'client'
        });

        alert('Compte créé avec succès !');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la création du compte: ' + error.message);
    }
}

// Fonction de connexion
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion: ' + error.message);
    }
}

// Fonction de déconnexion
async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la déconnexion: ' + error.message);
    }
}

// Ajouter les écouteurs d'événements une fois que le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');

    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
}); 