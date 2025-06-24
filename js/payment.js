document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    initializePaymentMethods();
    initializePaymentForm();
    loadAppointmentDetails();
});

// Initialisation des moyens de paiement
function initializePaymentMethods() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    const cardPaymentForm = document.getElementById('card-payment-form');
    
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Retirer la classe active de toutes les options
            paymentOptions.forEach(opt => opt.classList.remove('active'));
            
            // Ajouter la classe active à l'option sélectionnée
            this.classList.add('active');
            
            const method = this.dataset.method;
            
            if (method === 'card') {
                // Afficher le formulaire de carte
                cardPaymentForm.style.display = 'block';
            } else {
                // Masquer le formulaire de carte pour les autres méthodes
                cardPaymentForm.style.display = 'none';
                
                // Afficher un message pour les autres méthodes
                showPaymentMethodMessage(method);
            }
        });
    });
}

// Affichage du message pour les méthodes de paiement non-carte
function showPaymentMethodMessage(method) {
    const messages = {
        'cash': 'Le paiement en espèces se fera directement lors de la consultation.',
        'check': 'Veuillez apporter votre chèque lors de la consultation.',
        'transfer': 'Les informations de virement vous seront communiquées par email.'
    };
    
    // Créer ou mettre à jour le message
    let messageDiv = document.getElementById('payment-method-message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'payment-method-message';
        messageDiv.className = 'payment-method-message';
        document.querySelector('.payment-form').parentNode.insertBefore(messageDiv, document.querySelector('.payment-form').nextSibling);
    }
    
    messageDiv.innerHTML = `
        <div class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            <p>${messages[method]}</p>
            <button type="button" class="btn-primary" onclick="confirmPaymentMethod('${method}')">Confirmer cette méthode</button>
        </div>
    `;
}

// Confirmation de la méthode de paiement
function confirmPaymentMethod(method) {
    alert(`Méthode de paiement confirmée: ${method}. Votre rendez-vous est réservé!`);
    // Ici vous pourriez rediriger vers une page de confirmation
    window.location.href = 'confirmation.html';
}

// Vérification de l'authentification
function checkAuth() {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

// Initialisation du formulaire de paiement
function initializePaymentForm() {
    const form = document.getElementById('payment-form');
    const cardNumber = document.getElementById('card-number');
    const expiry = document.getElementById('expiry');
    const cvv = document.getElementById('cvv');

    // Formatage du numéro de carte
    cardNumber.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(.{4})/g, '$1 ').trim();
        e.target.value = value;
    });

    // Formatage de la date d'expiration
    expiry.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0,2) + '/' + value.slice(2);
        }
        e.target.value = value;
    });

    // Formatage du CVV
    cvv.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    // Gestion de la soumission du formulaire
    form.addEventListener('submit', handlePayment);
}

// Chargement des détails du rendez-vous
function loadAppointmentDetails() {
    // Récupérer les détails du localStorage
    const appointment = JSON.parse(localStorage.getItem('currentAppointment')) || {
        date: '15 janvier 2024',
        time: '14:00',
        type: 'Consultation standard',
        price: '60€'
    };

    // Mettre à jour l'affichage
    document.getElementById('appointment-date').textContent = appointment.date;
    document.getElementById('appointment-time').textContent = appointment.time;
    document.getElementById('appointment-type').textContent = appointment.type;
    document.getElementById('appointment-price').textContent = appointment.price;
}

// Gestion du paiement
async function handlePayment(e) {
    e.preventDefault();

    const button = e.target.querySelector('button');
    const originalText = button.innerHTML;
    
    try {
        // Désactiver le bouton et afficher le chargement
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement en cours...';

        // Simuler une requête de paiement
        await simulatePayment();

        // Afficher le succès
        showNotification('success', 'Paiement effectué avec succès !');
        
        // Sauvegarder la confirmation
        savePaymentConfirmation();

        // Rediriger vers la page de confirmation
        setTimeout(() => {
            window.location.href = 'confirmation.html';
        }, 2000);

    } catch (error) {
        // Afficher l'erreur
        showNotification('error', error.message);
        
        // Réactiver le bouton
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Simulation du paiement
function simulatePayment() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const success = Math.random() > 0.1; // 90% de chance de succès
            if (success) {
                resolve();
            } else {
                reject(new Error('Le paiement a été refusé. Veuillez vérifier vos informations.'));
            }
        }, 2000);
    });
}

// Sauvegarde de la confirmation
function savePaymentConfirmation() {
    const confirmation = {
        id: generateConfirmationId(),
        date: document.getElementById('appointment-date').textContent,
        time: document.getElementById('appointment-time').textContent,
        type: document.getElementById('appointment-type').textContent,
        price: document.getElementById('appointment-price').textContent,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem('lastPaymentConfirmation', JSON.stringify(confirmation));
}

// Génération d'un ID de confirmation
function generateConfirmationId() {
    return 'CONF-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Affichage des notifications
function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <p>${message}</p>
    `;

    document.body.appendChild(notification);

    // Supprimer la notification après 5 secondes
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Gestion de la déconnexion
document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
});