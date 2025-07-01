// Script pour la page contact avec intégration Supabase
import { contactService, validateClientData } from './supabase-config.js'

// Gestion du formulaire de contact
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm')
    const submitButton = contactForm.querySelector('button[type="submit"]')
    
    // Fonction pour afficher les messages
    function showMessage(message, type = 'success') {
        // Supprimer les anciens messages
        const existingMessages = document.querySelectorAll('.form-message')
        existingMessages.forEach(msg => msg.remove())
        
        // Créer le nouveau message
        const messageDiv = document.createElement('div')
        messageDiv.className = `form-message ${type}`
        messageDiv.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `
        
        // Insérer le message avant le formulaire
        contactForm.parentNode.insertBefore(messageDiv, contactForm)
        
        // Faire défiler vers le message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // Supprimer le message après 5 secondes
        setTimeout(() => {
            messageDiv.remove()
        }, 5000)
    }
    
    // Fonction pour valider le formulaire
    function validateForm(formData) {
        const errors = []
        
        // Validation du nom
        if (!formData.name || formData.name.trim().length < 2) {
            errors.push('Le nom doit contenir au moins 2 caractères')
        }
        
        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!formData.email || !emailRegex.test(formData.email)) {
            errors.push('Veuillez saisir une adresse email valide')
        }
        
        // Validation du sujet
        if (!formData.subject) {
            errors.push('Veuillez sélectionner un sujet')
        }
        
        // Validation du message
        if (!formData.message || formData.message.trim().length < 10) {
            errors.push('Le message doit contenir au moins 10 caractères')
        }
        
        // Validation de la case de confidentialité
        if (!formData.privacy) {
            errors.push('Vous devez accepter l\'utilisation de vos données')
        }
        
        return {
            isValid: errors.length === 0,
            errors
        }
    }
    
    // Fonction pour désactiver/activer le bouton de soumission
    function setSubmitButtonState(disabled, text) {
        submitButton.disabled = disabled
        submitButton.innerHTML = disabled ? 
            `<i class="fas fa-spinner fa-spin"></i> ${text}` : 
            text
    }
    
    // Gestion de la soumission du formulaire
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault()
        
        // Récupérer les données du formulaire
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value.trim(),
            privacy: document.getElementById('privacy').checked
        }
        
        // Valider le formulaire
        const validation = validateForm(formData)
        if (!validation.isValid) {
            showMessage(`Erreurs de validation :<br>• ${validation.errors.join('<br>• ')}`, 'error')
            return
        }
        
        // Désactiver le bouton pendant l'envoi
        setSubmitButtonState(true, 'Envoi en cours...')
        
        try {
            // Préparer les données pour Supabase
            const messageData = {
                nom: formData.name,
                email: formData.email,
                message: `Sujet: ${getSubjectText(formData.subject)}\n\n${formData.message}${formData.phone ? `\n\nTéléphone: ${formData.phone}` : ''}`
            }
            
            // Envoyer le message via Supabase
            const result = await contactService.create(messageData)
            
            if (result.success) {
                showMessage(
                    'Votre message a été envoyé avec succès ! Nous vous recontacterons dans les plus brefs délais.',
                    'success'
                )
                
                // Réinitialiser le formulaire
                contactForm.reset()
                
                // Envoyer une notification interne (simulation)
                await sendInternalNotification(messageData)
                
            } else {
                throw new Error(result.error)
            }
            
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error)
            showMessage(
                'Une erreur est survenue lors de l\'envoi de votre message. Veuillez réessayer ou nous contacter directement.',
                'error'
            )
        } finally {
            // Réactiver le bouton
            setSubmitButtonState(false, 'Envoyer le message')
        }
    })
    
    // Fonction pour obtenir le texte du sujet
    function getSubjectText(value) {
        const subjects = {
            'rdv': 'Demande de rendez-vous',
            'info': 'Demande d\'information',
            'urgence': 'Situation d\'urgence',
            'autre': 'Autre'
        }
        return subjects[value] || value
    }
    
    // Fonction pour envoyer une notification interne (simulation)
    async function sendInternalNotification(messageData) {
        try {
            console.log('Notification interne envoyée:', {
                type: 'nouveau_message_contact',
                data: messageData,
                timestamp: new Date().toISOString()
            })
            
            // Ici, vous pourriez intégrer un service de notification réel
            // comme SendGrid, Mailgun, ou un webhook
            
        } catch (error) {
            console.warn('Erreur lors de l\'envoi de la notification interne:', error)
        }
    }
    
    // Validation en temps réel des champs
    const inputs = contactForm.querySelectorAll('input, select, textarea')
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this)
        })
        
        input.addEventListener('input', function() {
            clearFieldError(this)
        })
    })
    
    // Fonction pour valider un champ individuel
    function validateField(field) {
        const value = field.value.trim()
        let isValid = true
        let errorMessage = ''
        
        // Supprimer les erreurs existantes
        clearFieldError(field)
        
        switch (field.id) {
            case 'name':
                if (value.length < 2) {
                    isValid = false
                    errorMessage = 'Le nom doit contenir au moins 2 caractères'
                }
                break
                
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                if (!emailRegex.test(value)) {
                    isValid = false
                    errorMessage = 'Veuillez saisir une adresse email valide'
                }
                break
                
            case 'message':
                if (value.length < 10) {
                    isValid = false
                    errorMessage = 'Le message doit contenir au moins 10 caractères'
                }
                break
        }
        
        if (!isValid) {
            showFieldError(field, errorMessage)
        }
        
        return isValid
    }
    
    // Fonction pour afficher une erreur sur un champ
    function showFieldError(field, message) {
        field.classList.add('error')
        
        const errorDiv = document.createElement('div')
        errorDiv.className = 'field-error'
        errorDiv.textContent = message
        
        field.parentNode.appendChild(errorDiv)
    }
    
    // Fonction pour supprimer l'erreur d'un champ
    function clearFieldError(field) {
        field.classList.remove('error')
        
        const errorDiv = field.parentNode.querySelector('.field-error')
        if (errorDiv) {
            errorDiv.remove()
        }
    }
    
    // Gestion des urgences
    const urgenceOption = document.querySelector('option[value="urgence"]')
    const subjectSelect = document.getElementById('subject')
    
    subjectSelect.addEventListener('change', function() {
        if (this.value === 'urgence') {
            showUrgencyWarning()
        }
    })
    
    // Fonction pour afficher l'avertissement d'urgence
    function showUrgencyWarning() {
        const warningDiv = document.createElement('div')
        warningDiv.className = 'urgency-warning'
        warningDiv.innerHTML = `
            <div class="warning-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Situation d'urgence détectée</h3>
                <p>Si vous êtes en détresse immédiate, veuillez contacter :</p>
                <div class="emergency-contacts">
                    <a href="tel:15" class="emergency-btn">SAMU : 15</a>
                    <a href="tel:3114" class="emergency-btn">Prévention suicide : 3114</a>
                </div>
                <p>Ces services sont disponibles 24h/24 et 7j/7</p>
                <button type="button" class="close-warning">Continuer avec le formulaire</button>
            </div>
        `
        
        document.body.appendChild(warningDiv)
        
        // Fermer l'avertissement
        warningDiv.querySelector('.close-warning').addEventListener('click', function() {
            warningDiv.remove()
        })
        
        // Fermer en cliquant à l'extérieur
        warningDiv.addEventListener('click', function(e) {
            if (e.target === warningDiv) {
                warningDiv.remove()
            }
        })
    }
})

// Styles CSS pour les messages et erreurs
const styles = `
.form-message {
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 500;
}

.form-message.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.form-message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.field-error {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 5px;
}

input.error, select.error, textarea.error {
    border-color: #dc3545;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.urgency-warning {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
}

.warning-content {
    background: white;
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    max-width: 500px;
    margin: 20px;
}

.warning-content i {
    font-size: 3rem;
    color: #ffc107;
    margin-bottom: 15px;
}

.emergency-contacts {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin: 20px 0;
    flex-wrap: wrap;
}

.emergency-btn {
    background-color: #dc3545;
    color: white;
    padding: 10px 20px;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
    transition: background-color 0.3s;
}

.emergency-btn:hover {
    background-color: #c82333;
}

.close-warning {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 15px;
}

.close-warning:hover {
    background-color: #5a6268;
}
`

// Injecter les styles
const styleSheet = document.createElement('style')
styleSheet.textContent = styles
document.head.appendChild(styleSheet)