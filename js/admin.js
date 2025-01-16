// Vérification de l'authentification admin
document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('isAdmin')) {
        window.location.href = 'auth.html';
        return;
    }
    initializeNavigation();
    loadCalendar();
    loadAllClients();
    initializeEmployeeActions();
    initializeChat();
});

// Gestion de la navigation
function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`[href="#${sectionId}"]`).classList.add('active');
}

// Gestion du calendrier
function loadCalendar() {
    const calendar = document.querySelector('.calendar-grid');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Récupérer tous les rendez-vous
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    console.log('Rendez-vous chargés:', appointments); // Debug
    
    // Mettre à jour l'affichage du mois courant
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    document.querySelector('.calendar-header h3').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Générer le calendrier
    renderCalendar(currentMonth, currentYear, appointments);
}

function renderCalendar(month, year, appointments) {
    const calendar = document.querySelector('.calendar-grid');
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay() || 7; // Convertir dimanche (0) en 7
    const monthLength = lastDay.getDate();
    
    let calendarHTML = '';
    
    // En-têtes des jours
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    days.forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Remplir les jours
    let day = 1;
    const totalCells = Math.ceil((startingDay - 1 + monthLength) / 7) * 7;
    
    for (let i = 0; i < totalCells; i++) {
        if (i < startingDay - 1 || day > monthLength) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        } else {
            const date = new Date(year, month, day);
            const dayAppointments = appointments.filter(apt => {
                const aptDate = new Date(apt.date);
                return aptDate.getFullYear() === year &&
                       aptDate.getMonth() === month &&
                       aptDate.getDate() === day;
            });
            
            const isToday = date.toDateString() === new Date().toDateString();
            
            calendarHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${dayAppointments.length > 0 ? 'has-appointments' : ''}"
                     onclick="showDayAppointments(${year}, ${month}, ${day})">
                    ${day}
                    ${dayAppointments.length > 0 ? `<span class="appointment-count">${dayAppointments.length}</span>` : ''}
                </div>`;
            day++;
        }
    }
    
    calendar.innerHTML = calendarHTML;
}

function showDayAppointments(year, month, day) {
    const date = new Date(year, month, day);
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const formattedDate = date.toISOString().split('T')[0];
    
    console.log('Date recherchée:', formattedDate);
    console.log('Tous les rendez-vous:', appointments);
    
    const dayAppointments = appointments.filter(apt => apt.date === formattedDate);
    console.log('Rendez-vous du jour:', dayAppointments);
    
    const appointmentsList = document.querySelector('.appointments-list');
    appointmentsList.innerHTML = `<h3>Rendez-vous du ${date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })}</h3>`;
    
    if (dayAppointments.length === 0) {
        appointmentsList.innerHTML += '<p class="no-appointments">Aucun rendez-vous pour cette date</p>';
        return;
    }
    
    dayAppointments.sort((a, b) => a.time.localeCompare(b.time));
    
    dayAppointments.forEach(apt => {
        appointmentsList.innerHTML += `
            <div class="appointment-card">
                <div class="appointment-header">
                    <h4>${apt.prenom} ${apt.nom}</h4>
                    <span class="appointment-time">${apt.time}</span>
                </div>
                <div class="appointment-details">
                    <p><i class="fas fa-envelope"></i> ${apt.clientEmail}</p>
                    <p><i class="fas fa-tag"></i> ${apt.domaine.name}</p>
                    ${apt.notes ? `<p><i class="fas fa-comment"></i> ${apt.notes}</p>` : ''}
                </div>
                <div class="appointment-actions">
                    <button class="btn-action" onclick="editAppointment('${apt.id}')">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn-action" onclick="cancelAppointment('${apt.id}')">
                        <i class="fas fa-times"></i> Annuler
                    </button>
                </div>
            </div>
        `;
    });
}

// Fonctions de navigation du calendrier
function previousMonth() {
    const header = document.querySelector('.calendar-header h3');
    const [month, year] = header.textContent.split(' ');
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const currentMonthIndex = monthNames.indexOf(month);
    
    let newMonth = currentMonthIndex - 1;
    let newYear = parseInt(year);
    
    if (newMonth < 0) {
        newMonth = 11;
        newYear--;
    }
    
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    renderCalendar(newMonth, newYear, appointments);
    header.textContent = `${monthNames[newMonth]} ${newYear}`;
}

function nextMonth() {
    const header = document.querySelector('.calendar-header h3');
    const [month, year] = header.textContent.split(' ');
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const currentMonthIndex = monthNames.indexOf(month);
    
    let newMonth = currentMonthIndex + 1;
    let newYear = parseInt(year);
    
    if (newMonth > 11) {
        newMonth = 0;
        newYear++;
    }
    
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    renderCalendar(newMonth, newYear, appointments);
    header.textContent = `${monthNames[newMonth]} ${newYear}`;
}

// Fonction de chargement des clients
function loadAllClients() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const clients = users.filter(user => !user.isAdmin);
    
    const clientsList = document.querySelector('.clients-list');
    if (!clientsList) return;
    
    clientsList.innerHTML = '';
    clients.forEach(client => {
        clientsList.innerHTML += `
            <div class="client-card">
                <div class="client-info">
                    <h4>${client.name || 'Client'}</h4>
                    <p><i class="fas fa-envelope"></i> ${client.email}</p>
                    ${client.phone ? `<p><i class="fas fa-phone"></i> ${client.phone}</p>` : ''}
                </div>
                <div class="client-actions">
                    <button class="btn-action" onclick="startChat('${client.email}')">
                        <i class="fas fa-comments"></i> Message
                    </button>
                </div>
            </div>
        `;
    });

    // Mettre à jour la liste des destinataires du chat
    const recipientSelect = document.querySelector('.chat-recipient-select');
    if (recipientSelect) {
        recipientSelect.innerHTML = '<option value="">Sélectionner un destinataire</option>';
        clients.forEach(client => {
            recipientSelect.innerHTML += `<option value="${client.email}">${client.name || client.email}</option>`;
        });
    }
}

// Fonction d'initialisation des actions employés
function initializeEmployeeActions() {
    const addEmployeeBtn = document.querySelector('.add-employee-btn');
    if (addEmployeeBtn) {
        addEmployeeBtn.classList.add('btn-action');
        addEmployeeBtn.innerHTML = '<i class="fas fa-plus"></i> Ajouter un employé';
        addEmployeeBtn.onclick = showAddEmployeeModal;
    }
}

function showAddEmployeeModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Ajouter un employé</h3>
            <form id="add-employee-form">
                <div class="form-group">
                    <label>Nom</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" required>
                </div>
                <div class="form-group">
                    <label>Mot de passe</label>
                    <input type="password" name="password" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="closeModal()">Annuler</button>
                    <button type="submit" class="btn-action">Ajouter</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('add-employee-form').onsubmit = function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const employee = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            isAdmin: true,
            role: 'employee'
        };
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push(employee);
        localStorage.setItem('users', JSON.stringify(users));
        
        closeModal();
        loadAllClients(); // Recharger la liste qui inclut aussi les employés
    };
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// Initialisation du chat
function initializeChat() {
    const chatContainer = document.querySelector('.chat-container');
    if (!chatContainer) return;
    
    const recipientSelect = document.createElement('select');
    recipientSelect.className = 'chat-recipient-select';
    recipientSelect.innerHTML = '<option value="">Sélectionner un destinataire</option>';
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const clients = users.filter(user => !user.isAdmin);
    
    clients.forEach(client => {
        recipientSelect.innerHTML += `<option value="${client.email}">${client.name || client.email}</option>`;
    });
    
    chatContainer.querySelector('.chat-header').appendChild(recipientSelect);
    
    recipientSelect.onchange = function() {
        loadMessages(this.value);
    };
}

function loadMessages(recipientEmail) {
    if (!recipientEmail) return;
    
    const messages = JSON.parse(localStorage.getItem('messages') || '[]')
        .filter(msg => msg.to === recipientEmail || msg.from === recipientEmail);
    
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.innerHTML = '';
    
    messages.forEach(msg => {
        const isAdmin = msg.from === 'admin';
        chatMessages.innerHTML += `
            <div class="chat-message ${isAdmin ? 'sent' : 'received'}">
                <div class="message-content">
                    <p>${msg.content}</p>
                    <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
            </div>
        `;
    });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
    const recipientEmail = document.querySelector('.chat-recipient-select').value;
    const input = document.querySelector('.chat-input input');
    const content = input.value.trim();
    
    if (!recipientEmail || !content) return;
    
    const message = {
        from: 'admin',
        to: recipientEmail,
        content: content,
        timestamp: new Date().toISOString()
    };
    
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    messages.push(message);
    localStorage.setItem('messages', JSON.stringify(messages));
    
    input.value = '';
    loadMessages(recipientEmail);
}

// Gestion des paramètres
function saveSettings() {
    // Implémenter la sauvegarde des paramètres
    alert('Paramètres enregistrés avec succès !');
}

// Fonction de déconnexion
function logout() {
    localStorage.removeItem('isAdmin');
    window.location.href = 'index.html';
}

function initializeButtons() {
    // Bouton d'ajout d'employé
    const addEmployeeBtn = document.querySelector('.add-employee-btn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', () => {
            const btn = addEmployeeBtn;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ajout...';
            
            setTimeout(() => {
                showAddEmployeeModal();
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-plus"></i> Ajouter un employé';
            }, 500);
        });
    }

    // Boutons d'action des employés
    document.querySelectorAll('.employee-actions button').forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const employeeId = e.target.closest('.employee-card').dataset.id;
            
            button.disabled = true;
            const originalContent = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            setTimeout(() => {
                handleEmployeeAction(action, employeeId);
                button.disabled = false;
                button.innerHTML = originalContent;
            }, 500);
        });
    });

    // Boutons d'envoi de message
    const sendMessageBtn = document.querySelector('.chat-input button');
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', () => {
            const input = document.querySelector('.chat-input input');
            const message = input.value.trim();
            const recipient = document.querySelector('.chat-recipient-select').value;
            
            if (message && recipient) {
                sendMessageBtn.disabled = true;
                sendMessageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                
                setTimeout(() => {
                    sendMessage(message, recipient);
                    input.value = '';
                    sendMessageBtn.disabled = false;
                    sendMessageBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
                }, 500);
            }
        });
    }
}

function handleEmployeeAction(action, employeeId) {
    // Implémentation des actions sur les employés
    console.log(`Action ${action} sur l'employé ${employeeId}`);
}

function sendMessage(message, recipient) {
    // Implémentation de l'envoi de message
    console.log(`Message envoyé à ${recipient}: ${message}`);
    
    // Ajouter le message à la conversation
    const chatMessages = document.querySelector('.chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message sent';
    messageElement.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
            <span class="message-time">${new Date().toLocaleTimeString()}</span>
        </div>
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
} 