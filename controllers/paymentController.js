
// const Transaction = require('../models/Transaction');
// const Donation = require('../models/Donation');
// const Donor = require('../models/Donor');
// const User = require('../models/User');
// const axios = require('axios'); // <--- N'oubliez pas d'importer axios
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // <--- Assurez-vous d'importer et d'initialiser Stripe


// const CINETPAY_API_KEY = process.env.CINETPAY_API_KEY;
// const CINETPAY_SITE_ID = process.env.CINETPAY_SITE_ID;
// const CINETPAY_NOTIFY_URL = process.env.CINETPAY_NOTIFY_URL;
// const CINETPAY_RETURN_URL = process.env.CINETPAY_RETURN_URL;
// const BASE_URL = process.env.BASE_URL; // Pour Stripe, l'URL de votre application React.js


// // --- Gestionnaire de paiement générique (handlePayment) ---
// const handlePayment = async (req, res) => {
//     console.log('Requête reçue avec body:', req.body);

//     try {
//         const { amount, paymentMethod, type, isAnonymous, donorInfo, year } = req.body;
//         const userId = req.user ? req.user._id : null;

//         const validMethods = ['paypal', 'carte', 'virement', 'mobile'];
//         if (!validMethods.includes(paymentMethod)) {
//             return res.status(400).json({ message: 'Méthode de paiement invalide' });
//         }

//         let donorId = null;
//         if (type === 'don' && !userId && !isAnonymous) {
//             // Création ou mise à jour du donateur
//             const donor = await Donor.findOneAndUpdate(
//                 { email: donorInfo.email },
//                 {
//                     nom: donorInfo.lastName,
//                     prenom: donorInfo.firstName,
//                     email: donorInfo.email,
//                     telephone: donorInfo.phone,
//                     adresse: {
//                         rue: donorInfo.address,
//                         ville: donorInfo.city,
//                         codePostal: donorInfo.postalCode,
//                         pays: donorInfo.country
//                     },
//                     typedonateur: donorInfo.isRecurring ? 'regulier' : 'ponctuel',
//                     preferences: {
//                         recevoirNewsletter: donorInfo.receiveNewsletter
//                     }
//                 },
//                 { upsert: true, new: true }
//             );
//             donorId = donor._id;
//         }

//         const transactionUserId = userId || donorId;
//         if (!transactionUserId) {
//             return res.status(400).json({ message: "Utilisateur ou donateur requis pour la transaction" });
//         }

    
//         const transaction = new Transaction({
//             user: transactionUserId,
//             type,
//             montant: amount,
//             methodePaiement: paymentMethod,
//             annee: year,
//             description: `${type === 'don' ? 'Don' : 'Cotisation'} via ${paymentMethod}`
//         });

//         if (type === 'don') {
//             const donation = new Donation({
//                 donor: transactionUserId,
//                 donorModel: userId ? 'User' : 'Donor',
//                 amount,
//                 paymentMethod,
//                 paymentId: transaction.reference, // Assurer que transaction.reference est l'ID unique
//                 isAnonymous,
//                 description: `Don via ${paymentMethod}`
//             });
//             await donation.save();
//         }

//         await transaction.save(); // Sauvegardez la transaction pour avoir un `_id` ou `reference` défini

//         // --- Intégration CinetPay pour les paiements mobile/carte ---
//         if (paymentMethod === 'mobile' || paymentMethod === 'carte') {
//             // AJOUT DE LOG POUR DÉBOGUER LES VARIABLES D'ENVIRONNEMENT AVANT L'APPEL CINETPAY
//             console.log('CinetPay API Key:', CINETPAY_API_KEY ? 'Loaded' : 'NOT LOADED');
//             console.log('CinetPay Site ID:', CINETPAY_SITE_ID ? 'Loaded' : 'NOT LOADED');
//             console.log('CinetPay Notify URL:', CINETPAY_NOTIFY_URL);
//             console.log('CinetPay Return URL:', CINETPAY_RETURN_URL);
//             console.log('Transaction Reference:', transaction.reference);
//             console.log('Amount:', amount);

//             try {
//                 // Définition de la valeur correcte pour 'channels' selon la documentation CinetPay
//                 let cinetpayChannels;
//                 if (paymentMethod === 'mobile') {
//                     cinetpayChannels = 'MOBILE_MONEY'; // <-- CORRECTION ICI
//                 } else if (paymentMethod === 'carte') {
//                     cinetpayChannels = 'CREDIT_CARD'; // <-- CORRECTION ICI (ou 'ALL' si vous voulez toutes les cartes)
//                 } else {
//                     cinetpayChannels = 'ALL'; // Fallback, bien que la condition `if (paymentMethod === 'mobile' || paymentMethod === 'carte')` gère déjà cela
//                 }

//                 const cinetpayResponse = await axios.post('https://api-checkout.cinetpay.com/v2/payment', {
//                     apikey: CINETPAY_API_KEY,
//                     site_id: CINETPAY_SITE_ID,
//                     transaction_id: transaction.reference, // Utilisez la référence de la transaction sauvegardée
//                     amount: amount,
//                     currency: 'USD', // IMPORTANT: Confirmez votre devise (XOF, EUR, USD, etc.)
//                     description: transaction.description,
//                     return_url: CINETPAY_RETURN_URL, // Page de redirection après paiement
//                     notify_url: CINETPAY_NOTIFY_URL, // Votre endpoint de webhook pour CinetPay
//                     channels: cinetpayChannels, // <-- UTILISATION DE LA VALEUR CORRIGÉE
//                     // Ajoutez ici les informations client si disponibles et requises par CinetPay
//                     customer_name: donorInfo.firstName,
//                     customer_surname: donorInfo.lastName,
//                     customer_phone_number: donorInfo.phone,
//                     customer_email: donorInfo.email,
//                 });

//                 if (cinetpayResponse.data.code === '200') {
//                     const paymentUrl = cinetpayResponse.data.data.payment_url;
//                     console.log('CinetPay Payment URL:', paymentUrl); // Log l'URL reçue de CinetPay
//                     // Mettre à jour le statut de la transaction à 'en_attente' ou 'pending_cinetpay' si vous avez un tel statut
//                     // transaction.statut = 'en_attente'; // Si vous avez un statut pour les paiements en cours
//                     // await transaction.save();

//                     // Renvoyez l'URL de paiement à votre frontend React
//                     return res.status(200).json({
//                         success: true,
//                         transactionId: transaction.reference,
//                         message: cinetpayResponse.data.description || 'Paiement initié avec succès via CinetPay',
//                         paymentUrl: paymentUrl // <--- C'EST CETTE CLÉ QUE VOTRE FRONTEND ATTEND
//                     });
//                 } else {
//                     // CinetPay a renvoyé une erreur (ex: paramètres invalides, compte non configuré)
//                     console.error('Erreur CinetPay lors de l\'initialisation (code non 200):', cinetpayResponse.data);
//                     // Mettre à jour la transaction comme échouée si possible
//                     transaction.statut = 'échoué'; // <-- CORRECTION ICI : utilisez un statut valide de votre enum
//                     await transaction.save();
//                     return res.status(400).json({
//                         success: false,
//                         message: cinetpayResponse.data.description || 'Erreur lors de l\'initialisation du paiement CinetPay',
//                         code: cinetpayResponse.data.code
//                     });
//                 }
//             } catch (cinetpayError) {
//                 // Erreur de communication avec l'API CinetPay (ex: réseau, timeout, ou erreur côté CinetPay)
//                 console.error('Erreur lors de l\'appel API CinetPay (catch block):', cinetpayError.message);
//                 if (cinetpayError.response) {
//                     console.error('CinetPay Response Data:', cinetpayError.response.data);
//                     console.error('CinetPay Response Status:', cinetpayError.response.status);
//                 } else if (cinetpayError.request) {
//                     console.error('CinetPay Request made but no response received:', cinetpayError.request);
//                 } else {
//                     console.error('Error in setting up CinetPay request:', cinetpayError.message);
//                 }
//                 // Mettre à jour la transaction comme échouée
//                 transaction.statut = 'échoué'; // <-- CORRECTION ICI : utilisez un statut valide de votre enum
//                 await transaction.save();
//                 return res.status(500).json({
//                     success: false,
//                     message: 'Erreur lors de la communication avec CinetPay',
//                     error: cinetpayError.message // Utiliser message pour une description plus simple pour le frontend
//                 });
//             }
//         } else {
//             // Si la méthode de paiement n'est pas gérée par CinetPay (ex: PayPal, Virement)
//             // et qu'elle n'est pas gérée par Stripe non plus.
//             return res.status(200).json({
//                 success: true,
//                 transactionId: transaction.reference,
//                 message: 'Paiement initié avec succès (méthode non CinetPay/Stripe)'
//             });
//         }

//     } catch (error) {
//         // Ce catch global attrapera les erreurs avant ou après l'appel CinetPay, mais pas les erreurs CinetPay elles-mêmes
//         console.error('Erreur globale lors du traitement du paiement (catch block):', error.message);
//         console.error('Détails de l\'erreur globale:', error); // Pour voir la stack trace complète
//         return res.status(500).json({ // Assurez-vous d'utiliser `return` pour arrêter l'exécution
//             success: false,
//             message: 'Erreur lors du traitement du paiement',
//             error: error.message
//         });
//     }
// };


// // --- Webhook pour mettre à jour le statut du paiement (updatePaymentStatus) ---
// // ATTENTION : Cette fonction est un webhook générique.
// // Pour un webhook CinetPay, vous devrez l'adapter pour :
// // 1. Recevoir les paramètres spécifiques de CinetPay (cpm_trans_id, cpm_amount, etc.).
// // 2. Vérifier le HASH de sécurité de CinetPay pour s'assurer que la notification est légitime.
// // 3. Répondre avec "200 OK" à CinetPay après le traitement.
// const updatePaymentStatus = async (req, res) => {
//     // console.log('Notification de paiement reçue:', req.body); // Décommentez pour déboguer les webhooks

//     try {
//         // Pour CinetPay, ces paramètres devront être extraits de req.body
//         // selon la documentation de CinetPay (ex: req.body.cpm_trans_id, req.body.cpm_result)
//         const { transactionId, status, paymentDetails } = req.body;

//         // 1. Vérifiez la légitimité de la requête si c'est un webhook (TRÈS IMPORTANT POUR CINETPAY)
//         // Pour CinetPay, cela implique de vérifier le HASH et les paramètres.
//         // Exemple (logique simplifiée, référez-vous à la doc CinetPay pour le hash réel) :
//         // if (!verifyCinetPayHash(req.body, YOUR_CINETPAY_SECRET_KEY)) {
//         //     return res.status(403).send('Forbidden');
//         // }

//         // 2. Mettre à jour la transaction
//         const transaction = await Transaction.findOne({ reference: transactionId });
//         if (!transaction) {
//             console.warn(`Transaction non trouvée pour référence: ${transactionId}`);
//             return res.status(404).send('Transaction non trouvée'); // Important de répondre à CinetPay
//         }

//         // CinetPay peut renvoyer différents statuts (SUCCESS, REFUSED, PENDING, etc.)
//         // Adaptez la logique `statut` en fonction des codes de retour de CinetPay
//         transaction.statut = status === 'success' ? 'complété' : 'échoué';
//         transaction.paymentDetails = paymentDetails; // Enregistrez les détails complets du paiement si besoin
//         await transaction.save();

//         // 3. Si c'est un don, mettre à jour aussi l'enregistrement de don
//         if (transaction.type === 'don') {
//             const donation = await Donation.findOne({ paymentId: transactionId });
//             if (donation) {
//                 donation.status = status === 'success' ? 'completed' : 'failed';
//                 await donation.save();

//                 // Mettre à jour le montant cumulé du donateur si le paiement est réussi
//                 if (status === 'success' && donation.donor) {
//                     if (donation.donorModel === 'Donor') {
//                         const donor = await Donor.findById(donation.donor);
//                         if (donor) {
//                             await donor.updateMontantCumule(donation.amount); // Assurez-vous que cette méthode existe
//                         }
//                     } else if (donation.donorModel === 'User') { // Si le donateur est un utilisateur enregistré
//                          const user = await User.findById(donation.donor);
//                          if (user && user.updateMontantCumule) { // Supposant que User a aussi cette méthode
//                              await user.updateMontantCumule(donation.amount);
//                          }
//                     }
//                 }
//             }
//         }

//         // 4. Si c'est une cotisation réussie, mettre à jour le statut de l'utilisateur
//         if (transaction.type === 'cotisation' && status === 'success') {
//             const user = await User.findById(transaction.user);
//             if (user) {
//                 user.cotisations = user.cotisations || [];
//                 user.cotisations.push({
//                     annee: transaction.annee,
//                     montant: transaction.montant,
//                     datePaiement: new Date()
//                 });
//                 await user.save();
//             }
//         }

//         // TRÈS IMPORTANT : Répondre 200 OK à CinetPay pour confirmer la réception du webhook
//         return res.status(200).send('OK');

//     } catch (error) {
//         console.error('Erreur lors de la mise à jour du statut:', error);
//         // En cas d'erreur interne, renvoyez une erreur non 200 pour que CinetPay puisse réessayer
//         return res.status(500).send('Erreur interne du serveur');
//     }
// };


// // --- Gestionnaire de paiement Stripe (handlePaymentStrype) ---
// const handlePaymentStrype = async (req, res) => {
//     try {
//         const { amount } = req.body;

//         const session = await stripe.checkout.sessions.create({
//             payment_method_types: ['card'],
//             line_items: [
//                 {
//                     price_data: {
//                         currency: 'eur', // IMPORTANT: Confirmez votre devise
//                         product_data: {
//                             name: 'Don à l’association',
//                         },
//                         unit_amount: amount, // Assurez-vous que le montant est en centimes si c'est ce que Stripe attend
//                     },
//                     quantity: 1,
//                 },
//             ],
//             mode: 'payment',
//             success_url: `${BASE_URL}/success`,
//             cancel_url: `${BASE_URL}/cancel`,
//         });

//         return res.json({ url: session.url });

//     } catch (error) {
//         console.error("Erreur Stripe :", error.message);
//         return res.status(500).json({ error: "Erreur serveur Stripe" });
//     }
// };

// module.exports = {
//     handlePayment,
//     updatePaymentStatus,
//     handlePaymentStrype
// };


const Transaction = require('../models/Transaction');
const Donation = require('../models/Donation');
const Donor = require('../models/Donor');
const User = require('../models/User');
const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Assurez-vous que ces variables sont définies dans votre fichier .env et chargées (via dotenv).
// require('dotenv').config(); doit être la première ligne de votre fichier principal (app.js/server.js).
const CINETPAY_API_KEY = process.env.CINETPAY_API_KEY;
const CINETPAY_SITE_ID = process.env.CINETPAY_SITE_ID;
const CINETPAY_NOTIFY_URL = process.env.CINETPAY_NOTIFY_URL;
const CINETPAY_RETURN_URL = process.env.CINETPAY_RETURN_URL;
const BASE_URL = process.env.BASE_URL; // URL de base de votre application React.js

const handlePayment = async (req, res) => {
    console.log('Requête reçue avec body:', req.body);

    try {
        const { amount, paymentMethod, type, isAnonymous, donorInfo, year } = req.body;
        const userId = req.user ? req.user._id : null;

        const validMethods = ['paypal', 'carte', 'virement', 'mobile'];
        if (!validMethods.includes(paymentMethod)) {
            return res.status(400).json({ message: 'Méthode de paiement invalide' });
        }

        // Validation du montant minimum pour CinetPay
        if ((paymentMethod === 'mobile' || paymentMethod === 'carte') && amount < 100) {
            return res.status(400).json({
                success: false,
                message: 'Le montant minimum pour le paiement mobile ou carte est de 100 XOF.'
            });
        }

        let donorId = null;
        if (type === 'don' && !userId && !isAnonymous) {
            const donor = await Donor.findOneAndUpdate(
                { email: donorInfo.email },
                {
                    nom: donorInfo.lastName,
                    prenom: donorInfo.firstName,
                    email: donorInfo.email,
                    telephone: donorInfo.phone,
                    adresse: {
                        rue: donorInfo.address,
                        ville: donorInfo.city,
                        codePostal: donorInfo.postalCode,
                        pays: donorInfo.country
                    },
                    typedonateur: donorInfo.isRecurring ? 'regulier' : 'ponctuel',
                    preferences: {
                        recevoirNewsletter: donorInfo.receiveNewsletter
                    }
                },
                { upsert: true, new: true }
            );
            donorId = donor._id;
        }

        const transactionUserId = userId || donorId;
        if (!transactionUserId) {
            return res.status(400).json({ message: "Utilisateur ou donateur requis pour la transaction" });
        }

        const transaction = new Transaction({
            user: transactionUserId,
            type,
            montant: amount,
            methodePaiement: paymentMethod,
            annee: year,
            description: `${type === 'don' ? 'Don' : 'Cotisation'} via ${paymentMethod}`
        });

        if (type === 'don') {
            const donation = new Donation({
                donor: transactionUserId,
                donorModel: userId ? 'User' : 'Donor',
                amount,
                paymentMethod,
                paymentId: transaction.reference,
                isAnonymous,
                description: `Don via ${paymentMethod}`
            });
            await donation.save();
        }

        await transaction.save();

        if (paymentMethod === 'mobile' || paymentMethod === 'carte') {
            console.log('CinetPay API Key:', CINETPAY_API_KEY ? 'Loaded' : 'NOT LOADED');
            console.log('CinetPay Site ID:', CINETPAY_SITE_ID ? 'Loaded' : 'NOT LOADED');
            console.log('CinetPay Notify URL:', CINETPAY_NOTIFY_URL ? CINETPAY_NOTIFY_URL : 'NOT LOADED (undefined)');
            console.log('CinetPay Return URL:', CINETPAY_RETURN_URL ? CINETPAY_RETURN_URL : 'NOT LOADED (undefined)');
            console.log('Transaction Reference:', transaction.reference);
            console.log('Amount:', amount);

            // Vérification critique des URLs CinetPay
            if (!CINETPAY_NOTIFY_URL || !CINETPAY_RETURN_URL) {
                console.error('Erreur de configuration: CINETPAY_NOTIFY_URL ou CINETPAY_RETURN_URL sont manquantes.');
                transaction.statut = 'échoué';
                await transaction.save();
                return res.status(500).json({
                    success: false,
                    message: 'Erreur de configuration serveur: URLs de CinetPay manquantes.'
                });
            }

            try {
                let cinetpayChannels;
                if (paymentMethod === 'mobile') {
                    cinetpayChannels = 'MOBILE_MONEY';
                } else if (paymentMethod === 'carte') {
                    cinetpayChannels = 'CREDIT_CARD';
                } else {
                    cinetpayChannels = 'ALL';
                }

                const cinetpayResponse = await axios.post('https://api-checkout.cinetpay.com/v2/payment', {
                    apikey: CINETPAY_API_KEY,
                    site_id: CINETPAY_SITE_ID,
                    transaction_id: transaction.reference,
                    amount: amount,
                    currency: 'XOF', // Confirmez votre devise
                    description: transaction.description,
                    return_url: CINETPAY_RETURN_URL,
                    notify_url: CINETPAY_NOTIFY_URL,
                    channels: cinetpayChannels,
                    customer_name: donorInfo.firstName,
                    customer_surname: donorInfo.lastName,
                    customer_phone_number: donorInfo.phone,
                    customer_email: donorInfo.email,
                });

                // Accepter le code 201 (CREATED) en plus de 200 (OK) comme un succès d'initialisation
                if (cinetpayResponse.data.code === '200' || cinetpayResponse.data.code === '201') {
                    const paymentUrl = cinetpayResponse.data.data.payment_url;
                    console.log('CinetPay Payment URL:', paymentUrl);

                    return res.status(200).json({
                        success: true,
                        transactionId: transaction.reference,
                        message: cinetpayResponse.data.description || 'Paiement initié avec succès via CinetPay',
                        paymentUrl: paymentUrl
                    });
                } else {
                    console.error('Erreur CinetPay lors de l\'initialisation (code non 200/201):', cinetpayResponse.data);
                    transaction.statut = 'échoué';
                    await transaction.save();
                    return res.status(400).json({
                        success: false,
                        message: cinetpayResponse.data.description || 'Erreur lors de l\'initialisation du paiement CinetPay',
                        code: cinetpayResponse.data.code
                    });
                }
            } catch (cinetpayError) {
                console.error('Erreur lors de l\'appel API CinetPay (catch block):', cinetpayError.message);
                if (cinetpayError.response) {
                    console.error('CinetPay Response Data:', cinetpayError.response.data);
                    console.error('CinetPay Response Status:', cinetpayError.response.status);
                } else if (cinetpayError.request) {
                    console.error('CinetPay Request made but no response received:', cinetpayError.request);
                } else {
                    console.error('Error in setting up CinetPay request:', cinetpayError.message);
                }
                transaction.statut = 'échoué';
                await transaction.save();
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la communication avec CinetPay',
                    error: cinetpayError.message
                });
            }
        } else {
            return res.status(200).json({
                success: true,
                transactionId: transaction.reference,
                message: 'Paiement initié avec succès (méthode non CinetPay/Stripe)'
            });
        }

    } catch (error) {
        console.error('Erreur globale lors du traitement du paiement (catch block):', error.message);
        console.error('Détails de l\'erreur globale:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors du traitement du paiement',
            error: error.message
        });
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        // Pour un webhook CinetPay, vous devrez extraire les paramètres spécifiques
        // et vérifier le HASH de sécurité (référez-vous à la doc CinetPay).
        const { transactionId, status, paymentDetails } = req.body;

        const transaction = await Transaction.findOne({ reference: transactionId });
        if (!transaction) {
            console.warn(`Transaction non trouvée pour référence: ${transactionId}`);
            return res.status(404).send('Transaction non trouvée');
        }

        // Adaptez la logique `statut` en fonction des codes de retour de CinetPay
        transaction.statut = status === 'success' ? 'complété' : 'échoué';
        transaction.paymentDetails = paymentDetails;
        await transaction.save();

        if (transaction.type === 'don') {
            const donation = await Donation.findOne({ paymentId: transactionId });
            if (donation) {
                donation.status = status === 'success' ? 'completed' : 'failed';
                await donation.save();

                if (status === 'success' && donation.donor) {
                    if (donation.donorModel === 'Donor') {
                        const donor = await Donor.findById(donation.donor);
                        if (donor) {
                            await donor.updateMontantCumule(donation.amount);
                        }
                    } else if (donation.donorModel === 'User') {
                         const user = await User.findById(donation.donor);
                         if (user && user.updateMontantCumule) {
                             await user.updateMontantCumule(donation.amount);
                         }
                    }
                }
            }
        }

        if (transaction.type === 'cotisation' && status === 'success') {
            const user = await User.findById(transaction.user);
            if (user) {
                user.cotisations = user.cotisations || [];
                user.cotisations.push({
                    annee: transaction.annee,
                    montant: transaction.montant,
                    datePaiement: new Date()
                });
                await user.save();
            }
        }

        // TRÈS IMPORTANT : Répondre 200 OK à CinetPay pour confirmer la réception du webhook
        return res.status(200).send('OK');

    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        return res.status(500).send('Erreur interne du serveur');
    }
};

const handlePaymentStrype = async (req, res) => {
    try {
        const { amount } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Don à l’association',
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${BASE_URL}/success`,
            cancel_url: `${BASE_URL}/cancel`,
        });

        return res.json({ url: session.url });

    } catch (error) {
        console.error("Erreur Stripe :", error.message);
        return res.status(500).json({ error: "Erreur serveur Stripe" });
    }
};

module.exports = {
    handlePayment,
    updatePaymentStatus,
    handlePaymentStrype
};
