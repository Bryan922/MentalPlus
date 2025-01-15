document.addEventListener('DOMContentLoaded', function() {
    // Récupérer les paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookingDate = new Date(urlParams.get('date'));
    const bookingTime = urlParams.get('time');

    // Générer un numéro de réservation unique
    const bookingNumber = generateBookingNumber();

    // Mettre à jour les détails du rendez-vous
    if (bookingDate && bookingTime) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('appointmentDate').textContent = bookingDate.toLocaleDateString('fr-FR', options);
        document.getElementById('appointmentTime').textContent = bookingTime;
    }

    // Afficher le numéro de réservation
    document.getElementById('bookingNumber').textContent = bookingNumber;

    // Fonction pour générer un numéro de réservation
    function generateBookingNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        return `RDV-${year}${month}${day}-${random}`;
    }

    // Animation d'entrée des éléments
    const elements = document.querySelectorAll('.appointment-details, .next-steps, .emergency-reminder, .action-buttons');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.5s ease-out';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 500 + (index * 200));
    });

    // Vérifier si l'utilisateur est connecté
    const isLoggedIn = checkLoginStatus();
    const clientSpaceButton = document.querySelector('a[href="espace-client.html"]');
    
    if (!isLoggedIn) {
        clientSpaceButton.href = 'login.html';
        clientSpaceButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
    }

    // Fonction pour vérifier le statut de connexion
    function checkLoginStatus() {
        // À implémenter avec la logique de gestion des sessions
        return false;
    }

    // Gérer le partage de la réservation (optionnel)
    if (navigator.share) {
        const shareButton = document.createElement('button');
        shareButton.className = 'btn-secondary share-button';
        shareButton.innerHTML = '<i class="fas fa-share-alt"></i> Partager';
        
        shareButton.addEventListener('click', async () => {
            try {
                await navigator.share({
                    title: 'Ma réservation PsychoAide',
                    text: `J'ai un rendez-vous le ${document.getElementById('appointmentDate').textContent} à ${document.getElementById('appointmentTime').textContent}`,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Erreur lors du partage:', err);
            }
        });

        document.querySelector('.action-buttons').appendChild(shareButton);
    }
}); 