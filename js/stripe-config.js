// Configuration Stripe
const stripeConfig = {
    publicKey: 'pk_live_51QhYTQG6ANFCmFDzl7XLynpC5qx0tplCUpTFy90KkZNNGbkNkgKSzr22sUKy3L8OCJJIJz84bOvvLn12D4OFQYg000jn8pCue7',
    currency: 'eur',
    locale: 'fr',
    allowedCountries: ['FR'],
};

// Initialisation de Stripe
const stripe = Stripe(stripeConfig.publicKey);

// Fonction pour initialiser un paiement
async function initializePayment(amount, description) {
    try {
        const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount,
                description: description,
                currency: stripeConfig.currency,
            }),
        });

        const data = await response.json();
        return data.clientSecret;
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du paiement:', error);
        throw error;
    }
}

// Exporter les fonctions et configurations
export {
    stripe,
    initializePayment,
    stripeConfig,
}; 