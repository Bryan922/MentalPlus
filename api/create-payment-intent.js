const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, description, currency } = req.body;

        // Créer l'intention de paiement
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            description,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                description
            }
        });

        // Renvoyer le client secret
        res.status(200).json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Erreur lors de la création du payment intent:', error);
        res.status(500).json({
            error: 'Erreur lors de l\'initialisation du paiement'
        });
    }
}; 