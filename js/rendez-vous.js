document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let selectedDomaine = null;
    let selectedDate = null;
    let selectedTime = null;

    // Sélection des domaines
    const domaineCards = document.querySelectorAll('.domaine-card');
    domaineCards.forEach(card => {
        card.addEventListener('click', function() {
            // Retire la sélection précédente
            domaineCards.forEach(c => c.classList.remove('selected'));
            // Ajoute la sélection sur la carte cliquée
            this.classList.add('selected');
            selectedDomaine = this.dataset.domaine;
            
            // Met à jour le résumé
            updateSummary();
            
            // Active le bouton suivant
            document.querySelector('#step1 .btn-next').disabled = false;
        });
    });

    // Navigation entre les étapes
    function nextStep() {
        const currentStep = document.querySelector('.form-step.active');
        const currentStepNumber = parseInt(currentStep.id.replace('step', ''));
        const nextStepNumber = currentStepNumber + 1;
        
        // Validation avant de passer à l'étape suivante
        if (!validateStep(currentStepNumber)) {
            return;
        }

        // Change l'étape active
        document.querySelector(`#step${currentStepNumber}`).classList.remove('active');
        document.querySelector(`#step${nextStepNumber}`).classList.add('active');
        
        // Met à jour les indicateurs d'étape
        updateStepIndicators(nextStepNumber);
    }

    function prevStep() {
        const currentStep = document.querySelector('.form-step.active');
        const currentStepNumber = parseInt(currentStep.id.replace('step', ''));
        const prevStepNumber = currentStepNumber - 1;
        
        // Change l'étape active
        document.querySelector(`#step${currentStepNumber}`).classList.remove('active');
        document.querySelector(`#step${prevStepNumber}`).classList.add('active');
        
        // Met à jour les indicateurs d'étape
        updateStepIndicators(prevStepNumber);
    }

    function updateStepIndicators(activeStep) {
        document.querySelectorAll('.step').forEach(step => {
            const stepNumber = parseInt(step.dataset.step);
            step.classList.remove('active');
            if (stepNumber === activeStep) {
                step.classList.add('active');
            }
        });
    }

    function validateStep(stepNumber) {
        switch(stepNumber) {
            case 1:
                if (!selectedDomaine) {
                    alert('Veuillez sélectionner un domaine d\'intervention');
                    return false;
                }
                return true;
            case 2:
                if (!selectedDate || !selectedTime) {
                    alert('Veuillez sélectionner une date et une heure');
                    return false;
                }
                return true;
            default:
                return true;
        }
    }

    function updateSummary() {
        if (selectedDomaine) {
            const selectedCard = document.querySelector(`.domaine-card[data-domaine="${selectedDomaine}"]`);
            document.getElementById('summary-domaine').textContent = selectedCard.querySelector('h3').textContent;
        }
        if (selectedDate) {
            document.getElementById('summary-date').textContent = selectedDate;
        }
        if (selectedTime) {
            document.getElementById('summary-time').textContent = selectedTime;
        }
    }

    // Gestionnaires d'événements pour les boutons
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', nextStep);
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', prevStep);
    });

    // Désactive initialement le bouton suivant de l'étape 1
    document.querySelector('#step1 .btn-next').disabled = true;

    // Initialisation du résumé
    updateSummary();
}); 