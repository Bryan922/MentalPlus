const { sendEmail, scheduleReminderEmail } = require('./email-service');
const { addToCalendar, checkAvailability } = require('./calendar-service');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function handleAppointment(req, res) {
    try {
        const { 
            paymentIntentId,
            appointmentData
        } = req.body;

        // Vérifier le paiement
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            throw new Error('Le paiement n\'a pas été validé');
        }

        // Vérifier la disponibilité
        const isAvailable = await checkAvailability(appointmentData.date, appointmentData.time);
        if (!isAvailable) {
            throw new Error('Ce créneau n\'est plus disponible');
        }

        // Ajouter au calendrier
        const calendarEvent = await addToCalendar(appointmentData);

        // Envoyer les emails
        await Promise.all([
            sendEmail('CONFIRMATION', appointmentData),
            sendEmail('EMPLOYEE_NOTIFICATION', appointmentData)
        ]);

        // Planifier le rappel
        scheduleReminderEmail(appointmentData);

        res.status(200).json({
            success: true,
            message: 'Rendez-vous confirmé',
            calendarEventId: calendarEvent.id
        });

    } catch (error) {
        console.error('Erreur lors du traitement du rendez-vous:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Une erreur est survenue lors de la confirmation du rendez-vous'
        });
    }
}

module.exports = handleAppointment; 