// const paypal = require('@paypal/checkout-server-sdk');

// // Configuration de base
// const config = {
//     mode: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
//     clientId: process.env.PAYPAL_CLIENT_ID,
//     clientSecret: process.env.PAYPAL_CLIENT_SECRET,
//     // URLs de retour après paiement
//     returnUrl: process.env.NODE_ENV === 'production' 
//         ? 'https://votre-site.com/api/paypal/success'
//         : 'http://localhost:5000/api/paypal/success',
//     cancelUrl: process.env.NODE_ENV === 'production'
//         ? 'https://votre-site.com/api/paypal/cancel'
//         : 'http://localhost:5000/api/paypal/cancel'
// };

// // Création de l'environnement PayPal
// const environment = config.mode === 'live'
//     ? new paypal.core.LiveEnvironment(config.clientId, config.clientSecret)
//     : new paypal.core.SandboxEnvironment(config.clientId, config.clientSecret);

// // Création du client PayPal
// const client = new paypal.core.PayPalHttpClient(environment);

// // Fonction pour obtenir une nouvelle instance du client
// const getClient = () => client;

// module.exports = {
//     config,
//     client: getClient
// }; 