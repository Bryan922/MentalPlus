document.addEventListener('DOMContentLoaded', () => {
    initializeForgotPasswordForm();
});

function initializeForgotPasswordForm() {
    const form = document.getElementById('forgot-password-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = form.querySelector('#email').value;
        
        try {
            // Simulation d'envoi d'email
            await simulatePasswordReset(email);
            
            // Affichage du message de succès
            showSuccessMessage(form);
            
            // Réinitialisation du formulaire
            form.reset();
            
            // Redirection après 3 secondes
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 3000);
            
        } catch (error) {
            showErrorMessage(form, error.message);
        }
    });
}

async function simulatePasswordReset(email) {
    // Simulation d'une requête API
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (email.includes('@')) {
                resolve();
            } else {
                reject(new Error('Adresse email invalide'));
            }
        }, 1000);
    });
}

function showSuccessMessage(form) {
    const container = form.querySelector('.form-group');
    const existingMessage = form.querySelector('.message');
    if (existingMessage) existingMessage.remove();
    
    const message = document.createElement('div');
    message.className = 'message success';
    message.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <p>Un email de réinitialisation a été envoyé à votre adresse.<br>
        Vous allez être redirigé vers la page de connexion...</p>
    `;
    
    container.parentNode.insertBefore(message, container.nextSibling);
}

function showErrorMessage(form, errorText) {
    const container = form.querySelector('.form-group');
    const existingMessage = form.querySelector('.message');
    if (existingMessage) existingMessage.remove();
    
    const message = document.createElement('div');
    message.className = 'message error';
    message.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>${errorText}</p>
    `;
    
    container.parentNode.insertBefore(message, container.nextSibling);
} 