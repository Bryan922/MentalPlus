const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('votre_cle_api_sendgrid');

// Templates d'emails
const emailTemplates = {
    confirmation: {
        subject: 'Confirmation de votre rendez-vous',
        template: 'd-f7e2337f3bc04d058f1f1638e6a81cae' // ID du template dynamique SendGrid
    },
    rappel: {
        subject: 'Rappel de votre rendez-vous',
        template: 'd-f7e2337f3bc04d058f1f1638e6a81cae'
    },
    employe: {
        subject: 'Nouveau rendez-vous assigné',
        template: 'd-f7e2337f3bc04d058f1f1638e6a81cae'
    }
};

// Fonction d'envoi d'email
async function sendEmail(type, data) {
    try {
        const template = emailTemplates[type];
        const msg = {
            to: data.email,
            from: 'votre@email.com',
            templateId: template.template,
            dynamic_template_data: data
        };
        
        await sgMail.send(msg);
        console.log(`Email ${type} envoyé à ${data.email}`);
        return true;
    } catch (error) {
        console.error('Erreur d\'envoi d\'email:', error);
        return false;
    }
}

// Fonction de rappel automatique
async function scheduleReminderEmail(appointmentData) {
    const reminderDate = new Date(appointmentData.date);
    reminderDate.setDate(reminderDate.getDate() - 1);
    
    setTimeout(async () => {
        await sendEmail('rappel', appointmentData);
    }, reminderDate.getTime() - Date.now());
}

export { sendEmail, scheduleReminderEmail }; 