const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Templates d'emails
const EMAIL_TEMPLATES = {
    CONFIRMATION: {
        subject: 'Confirmation de votre rendez-vous - MentalPlus',
        templateId: 'd-votre_template_id_confirmation'
    },
    REMINDER: {
        subject: 'Rappel de votre rendez-vous demain - MentalPlus',
        templateId: 'd-votre_template_id_rappel'
    },
    EMPLOYEE_NOTIFICATION: {
        subject: 'Nouveau rendez-vous programmé - MentalPlus',
        templateId: 'd-votre_template_id_notification'
    }
};

// Fonction principale d'envoi d'email
async function sendEmail(type, data) {
    try {
        const template = EMAIL_TEMPLATES[type];
        if (!template) throw new Error('Type d\'email invalide');

        const msg = {
            to: data.email,
            from: 'contact@mentalplus.fr',
            subject: template.subject,
            templateId: template.templateId,
            dynamic_template_data: {
                appointment_date: data.date,
                appointment_time: data.time,
                domain: data.domain,
                name: data.name,
                ...data
            }
        };

        await sgMail.send(msg);
        console.log(`Email ${type} envoyé à ${data.email}`);
        return true;
    } catch (error) {
        console.error('Erreur d\'envoi d\'email:', error);
        throw error;
    }
}

// Planifier l'envoi d'un email de rappel
function scheduleReminderEmail(appointmentData) {
    const appointmentDate = new Date(appointmentData.date);
    const reminderDate = new Date(appointmentDate);
    reminderDate.setDate(reminderDate.getDate() - 1); // 24h avant
    
    const now = new Date();
    const delay = reminderDate.getTime() - now.getTime();
    
    if (delay > 0) {
        setTimeout(async () => {
            try {
                await sendEmail('REMINDER', appointmentData);
            } catch (error) {
                console.error('Erreur lors de l\'envoi du rappel:', error);
            }
        }, delay);
    }
}

module.exports = {
    sendEmail,
    scheduleReminderEmail
}; 