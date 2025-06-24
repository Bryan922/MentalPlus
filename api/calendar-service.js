const { google } = require('googleapis');
const calendar = google.calendar('v3');

// Configuration des identifiants OAuth2
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// Ajouter un rendez-vous au calendrier
async function addToCalendar(appointmentData) {
    try {
        const startTime = new Date(`${appointmentData.date}T${appointmentData.time}`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 heure

        const event = {
            summary: `Consultation ${appointmentData.domain}`,
            description: `Rendez-vous avec ${appointmentData.name}\nTéléphone: ${appointmentData.phone}\nEmail: ${appointmentData.email}\nNotes: ${appointmentData.notes || 'Aucune'}`,
            start: {
                dateTime: startTime.toISOString(),
                timeZone: 'Europe/Paris',
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: 'Europe/Paris',
            },
            attendees: [
                { email: appointmentData.email }
            ],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 24h avant
                    { method: 'popup', minutes: 60 } // 1h avant
                ],
            },
        };

        const response = await calendar.events.insert({
            auth: oauth2Client,
            calendarId: 'primary',
            resource: event,
            sendUpdates: 'all',
        });

        console.log('Événement créé:', response.data);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de l\'ajout au calendrier:', error);
        throw error;
    }
}

// Vérifier la disponibilité d'un créneau
async function checkAvailability(date, time) {
    try {
        const startTime = new Date(`${date}T${time}`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

        const response = await calendar.freebusy.query({
            auth: oauth2Client,
            resource: {
                timeMin: startTime.toISOString(),
                timeMax: endTime.toISOString(),
                items: [{ id: 'primary' }],
            },
        });

        const busySlots = response.data.calendars.primary.busy;
        return busySlots.length === 0;
    } catch (error) {
        console.error('Erreur lors de la vérification de disponibilité:', error);
        throw error;
    }
}

module.exports = {
    addToCalendar,
    checkAvailability
}; 