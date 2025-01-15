const stripe = Stripe('votre_cle_publique_stripe');

// Configuration des options de paiement
const paymentOptions = {
    mode: 'payment',
    currency: 'eur',
    payment_method_types: ['card'],
    automatic_payment_methods: {
        enabled: true
    }
};

// Fonction pour initialiser le paiement
async function initializePayment(amount, description) {
    try {
        const response = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                description: description
            })
        });
        
        const {clientSecret} = await response.json();
        return stripe.confirmPayment({
            elements: stripe.elements(),
            clientSecret,
            confirmParams: {
                return_url: window.location.origin + '/confirmation.html'
            }
        });
    } catch (error) {
        console.error('Erreur de paiement:', error);
    }
}

export { stripe, initializePayment }; 