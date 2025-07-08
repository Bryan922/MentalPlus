// Correction des problèmes de sélection dans le formulaire de rendez-vous
// Ce fichier corrige les conflits entre les scripts et améliore la fonctionnalité

class RendezVousManager {
    constructor() {
        this.selectedDomain = null
        this.selectedType = 'classique'
        this.selectedDate = null
        this.selectedTime = null
        this.currentStep = 1
        
        this.init()
    }

    init() {
        console.log('Initialisation du gestionnaire de rendez-vous')
        
        // Attendre que le DOM soit complètement chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners())
        } else {
            this.setupEventListeners()
        }
    }

    setupEventListeners() {
        console.log('Configuration des écouteurs d\'événements')
        
        // Gestion des types de consultation
        this.setupConsultationTypes()
        
        // Gestion des domaines
        this.setupDomainSelection()
        
        // Gestion du calendrier
        this.setupCalendar()
        
        // Gestion des créneaux horaires
        this.setupTimeSlots()
        
        // Gestion du formulaire
        this.setupForm()
        
        // Initialiser l'interface
        this.updateInterface()
    }

    setupConsultationTypes() {
        const typeButtons = document.querySelectorAll('.type-btn')
        console.log('Boutons de type trouvés:', typeButtons.length)
        
        typeButtons.forEach(btn => {
            // Supprimer les anciens écouteurs pour éviter les doublons
            btn.replaceWith(btn.cloneNode(true))
        })
        
        // Réattacher les écouteurs aux nouveaux éléments
        const newTypeButtons = document.querySelectorAll('.type-btn')
        newTypeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault()
                e.stopPropagation()
                
                const type = btn.dataset.type
                console.log('Type de consultation sélectionné:', type)
                
                this.selectConsultationType(type)
            })
        })
        
        // Détecter le type depuis l'URL
        const urlParams = new URLSearchParams(window.location.search)
        const typeParam = urlParams.get('type')
        if (typeParam === 'night') {
            this.selectConsultationType('night')
        }
    }

    selectConsultationType(type) {
        console.log('Sélection du type:', type)
        
        this.selectedType = type === 'night' ? 'nuit' : 'classique'
        
        // Mettre à jour l'interface
        const typeButtons = document.querySelectorAll('.type-btn')
        typeButtons.forEach(btn => {
            btn.classList.remove('active')
            if (btn.dataset.type === type) {
                btn.classList.add('active')
            }
        })
        
        // Mettre à jour le prix
        const price = this.selectedType === 'nuit' ? '80€' : '60€'
        const priceElement = document.getElementById('summary-price')
        if (priceElement) {
            priceElement.textContent = price
        }
        
        // Recharger les créneaux si une date est sélectionnée
        if (this.selectedDate) {
            this.loadTimeSlotsForDate(this.selectedDate)
        }
        
        console.log('Type mis à jour:', this.selectedType)
    }

    setupDomainSelection() {
        const domainCards = document.querySelectorAll('.domaine-card')
        console.log('Cartes de domaine trouvées:', domainCards.length)
        
        domainCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault()
                
                const domain = card.dataset.domaine
                const domainText = card.querySelector('h3')?.textContent || domain
                
                console.log('Domaine sélectionné:', domain)
                this.selectDomain(domain, domainText)
            })
        })
    }

    selectDomain(domain, domainText) {
        this.selectedDomain = domain
        
        // Mettre à jour l'interface
        const domainCards = document.querySelectorAll('.domaine-card')
        domainCards.forEach(card => {
            card.classList.remove('selected')
            if (card.dataset.domaine === domain) {
                card.classList.add('selected')
            }
        })
        
        // Mettre à jour le résumé
        const summaryDomain = document.getElementById('summary-domaine')
        if (summaryDomain) {
            summaryDomain.textContent = domainText
        }
        
        // Activer le bouton suivant
        this.enableNextStep()
        
        console.log('Domaine mis à jour:', this.selectedDomain)
    }

    setupCalendar() {
        // Générer le calendrier
        this.generateCalendar()
        
        // Gestion des boutons de navigation
        const prevBtn = document.querySelector('.prev-month')
        const nextBtn = document.querySelector('.next-month')
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1)
                this.generateCalendar()
            })
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1)
                this.generateCalendar()
            })
        }
    }

    generateCalendar() {
        const calendar = document.getElementById('calendar')
        if (!calendar) return
        
        // Nettoyer le calendrier existant
        calendar.innerHTML = ''
        
        // Créer l'en-tête
        const header = document.createElement('div')
        header.className = 'calendar-header'
        header.innerHTML = `
            <button class="prev-month"><i class="fas fa-chevron-left"></i></button>
            <h3>${this.formatMonth(this.currentMonth)}</h3>
            <button class="next-month"><i class="fas fa-chevron-right"></i></button>
        `
        calendar.appendChild(header)
        
        // Créer la grille des jours
        const daysGrid = document.createElement('div')
        daysGrid.className = 'calendar-grid'
        
        // Ajouter les en-têtes des jours
        const dayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div')
            dayHeader.className = 'day-header'
            dayHeader.textContent = day
            daysGrid.appendChild(dayHeader)
        })
        
        // Générer les jours du mois
        this.generateDays(daysGrid)
        
        calendar.appendChild(daysGrid)
        
        // Réattacher les écouteurs
        this.setupCalendar()
    }

    generateDays(container) {
        const year = this.currentMonth.getFullYear()
        const month = this.currentMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const today = new Date()
        
        // Jours vides au début
        const startDay = (firstDay.getDay() + 6) % 7 // Lundi = 0
        for (let i = 0; i < startDay; i++) {
            const emptyDay = document.createElement('div')
            emptyDay.className = 'day empty'
            container.appendChild(emptyDay)
        }
        
        // Jours du mois
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div')
            dayElement.className = 'day'
            dayElement.textContent = day
            
            const currentDate = new Date(year, month, day)
            
            // Désactiver les jours passés
            if (currentDate < today) {
                dayElement.classList.add('disabled')
            } else {
                dayElement.classList.add('available')
                dayElement.addEventListener('click', () => {
                    this.selectDate(currentDate)
                })
            }
            
            container.appendChild(dayElement)
        }
    }

    selectDate(date) {
        this.selectedDate = date
        
        // Mettre à jour l'interface
        const days = document.querySelectorAll('.day.available')
        days.forEach(day => day.classList.remove('selected'))
        
        const selectedDay = Array.from(days).find(day => 
            parseInt(day.textContent) === date.getDate()
        )
        if (selectedDay) {
            selectedDay.classList.add('selected')
        }
        
        // Mettre à jour le résumé
        const summaryDate = document.getElementById('summary-date')
        if (summaryDate) {
            summaryDate.textContent = this.formatDate(date)
        }
        
        // Charger les créneaux horaires
        this.loadTimeSlotsForDate(date)
        
        console.log('Date sélectionnée:', date)
    }

    loadTimeSlotsForDate(date) {
        const timeSlotsContainer = document.getElementById('time-slots')
        if (!timeSlotsContainer) return
        
        // Générer les créneaux selon le type de consultation
        const slots = this.generateTimeSlots()
        
        timeSlotsContainer.innerHTML = ''
        
        slots.forEach(slot => {
            const slotElement = document.createElement('button')
            slotElement.type = 'button'
            slotElement.className = 'time-slot'
            slotElement.textContent = slot
            slotElement.addEventListener('click', () => {
                this.selectTimeSlot(slot)
            })
            
            timeSlotsContainer.appendChild(slotElement)
        })
    }

    generateTimeSlots() {
        if (this.selectedType === 'nuit') {
            // Créneaux de nuit (20h-6h)
            return ['20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00']
        } else {
            // Créneaux classiques (9h-18h)
            return ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00']
        }
    }

    selectTimeSlot(time) {
        this.selectedTime = time
        
        // Mettre à jour l'interface
        const timeSlots = document.querySelectorAll('.time-slot')
        timeSlots.forEach(slot => slot.classList.remove('selected'))
        
        const selectedSlot = Array.from(timeSlots).find(slot => 
            slot.textContent === time
        )
        if (selectedSlot) {
            selectedSlot.classList.add('selected')
        }
        
        // Mettre à jour le résumé
        const summaryTime = document.getElementById('summary-time')
        if (summaryTime) {
            summaryTime.textContent = time
        }
        
        // Activer le bouton suivant
        this.enableNextStep()
        
        console.log('Créneau sélectionné:', time)
    }

    setupTimeSlots() {
        // Les créneaux sont générés dynamiquement
    }

    setupForm() {
        const form = document.getElementById('rdv-form')
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault()
                this.handleFormSubmission()
            })
        }
    }

    handleFormSubmission() {
        console.log('Soumission du formulaire')
        console.log('Données:', {
            domain: this.selectedDomain,
            type: this.selectedType,
            date: this.selectedDate,
            time: this.selectedTime
        })
        
        // Rediriger vers la page de paiement
        window.location.href = 'payment.html'
    }

    enableNextStep() {
        const nextBtn = document.querySelector('.btn-next')
        if (nextBtn) {
            nextBtn.disabled = false
            nextBtn.classList.remove('disabled')
        }
    }

    updateInterface() {
        // Mettre à jour l'interface selon l'état actuel
        if (this.selectedType) {
            this.selectConsultationType(this.selectedType === 'nuit' ? 'night' : 'regular')
        }
    }

    formatMonth(date) {
        const months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ]
        return `${months[date.getMonth()]} ${date.getFullYear()}`
    }

    formatDate(date) {
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
        const months = [
            'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
            'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
        ]
        
        return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
    }
}

// Initialiser le gestionnaire de rendez-vous
const rdvManager = new RendezVousManager()

// Exposer globalement pour compatibilité
window.rdvManager = rdvManager

// Fonctions globales pour la navigation entre les étapes
function nextStep() {
    const currentStep = document.querySelector('.form-step.active');
    const currentStepNumber = parseInt(currentStep.id.replace('step', ''));
    const nextStepNumber = currentStepNumber + 1;
    
    if (!validateStep(currentStepNumber)) {
        return;
    }

    document.querySelector(`#step${currentStepNumber}`).classList.remove('active');
    document.querySelector(`#step${nextStepNumber}`).classList.add('active');
    updateStepIndicators(nextStepNumber);
}

function prevStep() {
    const currentStep = document.querySelector('.form-step.active');
    const currentStepNumber = parseInt(currentStep.id.replace('step', ''));
    const prevStepNumber = currentStepNumber - 1;
    
    document.querySelector(`#step${currentStepNumber}`).classList.remove('active');
    document.querySelector(`#step${prevStepNumber}`).classList.add('active');
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
            if (!rdvManager.selectedDomain) {
                alert('Veuillez sélectionner un domaine d\'intervention');
                return false;
            }
            return true;
        case 2:
            if (!rdvManager.selectedDate || !rdvManager.selectedTime) {
                alert('Veuillez sélectionner une date et une heure');
                return false;
            }
            return true;
        default:
            return true;
    }
}

console.log('Gestionnaire de rendez-vous initialisé')