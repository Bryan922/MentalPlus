// Gestion de l'authentification
class AuthManager {
    constructor() {
        // Temporairement, on simule l'API
        this.simulateAPI = true;
        this.baseUrl = '/api/auth.php';
        this.errorMessage = document.querySelector('.error-message');
        this.successMessage = document.querySelector('.success-message');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Gestion des formulaires
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm')?.addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('adminForm')?.addEventListener('submit', (e) => this.handleAdminLogin(e));
        
        // Gestion du mot de passe oublié
        document.getElementById('forgotPassword')?.addEventListener('click', (e) => this.handleForgotPassword(e));
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        try {
            let response;
            if (this.simulateAPI) {
                // Simulation de réponse pour les tests
                response = {
                    success: true,
                    token: 'fake_token_123'
                };
            } else {
                response = await this.sendRequest('login', {
                    email,
                    password,
                    remember_me: rememberMe
                });
            }

            if (response.success) {
                this.showSuccess('Connexion réussie ! Redirection...');
                localStorage.setItem('token', response.token);
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1500);
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            this.showError('Les mots de passe ne correspondent pas');
            return;
        }

        try {
            let response;
            if (this.simulateAPI) {
                // Simulation de réponse pour les tests
                response = {
                    success: true
                };
            } else {
                response = await this.sendRequest('register', {
                    name,
                    email,
                    password
                });
            }

            if (response.success) {
                this.showSuccess('Compte créé avec succès ! Redirection vers la connexion...');
                setTimeout(() => {
                    document.querySelector('[data-tab="login"]').click();
                }, 1500);
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;

        try {
            let response;
            if (this.simulateAPI) {
                // Simulation de réponse pour les tests
                response = {
                    success: true,
                    token: 'fake_admin_token_123'
                };
            } else {
                response = await this.sendRequest('admin-login', {
                    email,
                    password
                });
            }

            if (response.success) {
                this.showSuccess('Connexion administrateur réussie ! Redirection...');
                localStorage.setItem('token', response.token);
                localStorage.setItem('isAdmin', 'true');
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1500);
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        
        if (!email) {
            this.showError('Veuillez entrer votre email avant de réinitialiser le mot de passe');
            return;
        }

        try {
            let response;
            if (this.simulateAPI) {
                // Simulation de réponse pour les tests
                response = {
                    success: true
                };
            } else {
                response = await this.sendRequest('forgot-password', { email });
            }

            if (response.success) {
                this.showSuccess('Un email de réinitialisation a été envoyé à votre adresse');
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.successMessage.style.display = 'none';
    }

    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successMessage.style.display = 'block';
        this.errorMessage.style.display = 'none';
    }

    async sendRequest(action, data) {
        try {
            const response = await fetch(`${this.baseUrl}?action=${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Une erreur est survenue');
            }

            return result;
        } catch (error) {
            throw new Error(error.message || 'Une erreur est survenue lors de la connexion au serveur');
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
}); 