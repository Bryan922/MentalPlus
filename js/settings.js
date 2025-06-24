document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeProfileImage();
    initializeFormSaving();
    initializePasswordChange();
    initializeTheme();
});

// Gérer la navigation
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.settings-nav a');
    const sections = document.querySelectorAll('.settings-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);

            // Mettre à jour les classes actives
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            link.classList.add('active');
            document.getElementById(targetId).classList.add('active');

            // En mobile, scroller vers la section
            if (window.innerWidth <= 768) {
                document.getElementById(targetId).scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Gérer l'image de profil
function initializeProfileImage() {
    const changeAvatarBtn = document.querySelector('.change-avatar');
    const profileImage = document.querySelector('.profile-avatar img');

    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.addEventListener('change', () => {
                if (input.files && input.files[0]) {
                    const reader = new FileReader();
                    
                    reader.onload = (e) => {
                        profileImage.src = e.target.result;
                        // En production, envoyer l'image au serveur
                        console.log('Image de profil mise à jour');
                    };
                    
                    reader.readAsDataURL(input.files[0]);
                }
            });

            input.click();
        });
    }
}

// Gérer la sauvegarde des formulaires
function initializeFormSaving() {
    const saveButton = document.getElementById('saveSettings');
    const forms = document.querySelectorAll('.settings-form');
    let hasUnsavedChanges = false;

    // Détecter les changements dans les formulaires
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                hasUnsavedChanges = true;
                saveButton.classList.add('pulse');
            });
        });
    });

    // Gérer la sauvegarde
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            if (hasUnsavedChanges) {
                // Simuler la sauvegarde
                // En production, envoyer les données au serveur
                saveButton.disabled = true;
                saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';

                setTimeout(() => {
                    saveButton.innerHTML = '<i class="fas fa-check"></i> Enregistré';
                    saveButton.classList.remove('pulse');
                    hasUnsavedChanges = false;

                    setTimeout(() => {
                        saveButton.disabled = false;
                        saveButton.innerHTML = '<i class="fas fa-save"></i> Enregistrer les modifications';
                    }, 2000);
                }, 1500);
            }
        });
    }

    // Avertir avant de quitter avec des changements non sauvegardés
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

// Gérer le changement de mot de passe
function initializePasswordChange() {
    const passwordForm = document.querySelector('#security .settings-form');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const currentPassword = passwordForm.querySelector('input[type="password"]:nth-child(1)').value;
            const newPassword = passwordForm.querySelector('input[type="password"]:nth-child(2)').value;
            const confirmPassword = passwordForm.querySelector('input[type="password"]:nth-child(3)').value;

            // Validation simple
            if (!currentPassword || !newPassword || !confirmPassword) {
                alert('Veuillez remplir tous les champs');
                return;
            }

            if (newPassword !== confirmPassword) {
                alert('Les nouveaux mots de passe ne correspondent pas');
                return;
            }

            if (newPassword.length < 8) {
                alert('Le nouveau mot de passe doit contenir au moins 8 caractères');
                return;
            }

            // Simuler le changement
            // En production, envoyer au serveur
            const submitButton = passwordForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Modification...';

            setTimeout(() => {
                submitButton.innerHTML = '<i class="fas fa-check"></i> Mot de passe modifié';
                passwordForm.reset();

                setTimeout(() => {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Changer le mot de passe';
                }, 2000);
            }, 1500);
        });
    }
}

// Gérer le thème
function initializeTheme() {
    const themeToggle = document.querySelector('#preferences .switch input');
    
    if (themeToggle) {
        // Charger la préférence
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        themeToggle.checked = isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);

        themeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode', themeToggle.checked);
            localStorage.setItem('darkMode', themeToggle.checked);
        });
    }
}

// Gérer les sessions
document.querySelectorAll('.session-item .btn-danger').forEach(button => {
    button.addEventListener('click', () => {
        const sessionItem = button.closest('.session-item');
        const deviceName = sessionItem.querySelector('h4').textContent;

        if (confirm(`Êtes-vous sûr de vouloir déconnecter "${deviceName}" ?`)) {
            // Simuler la déconnexion
            // En production, envoyer au serveur
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            setTimeout(() => {
                sessionItem.style.opacity = '0';
                setTimeout(() => {
                    sessionItem.remove();
                }, 300);
            }, 1000);
        }
    });
}); 