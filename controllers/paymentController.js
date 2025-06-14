// const Transaction = require('../models/Transaction');
// const Donation = require('../models/Donation');
// const Donor = require('../models/Donor');
// const User = require('../models/User');
// const axios = require('axios');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// // Assurez-vous que ces variables sont définies dans votre fichier .env et chargées (via dotenv).
// // require('dotenv').config(); doit être la première ligne de votre fichier principal (app.js/server.js).
// const CINETPAY_API_KEY = process.env.CINETPAY_API_KEY;
// const CINETPAY_SITE_ID = process.env.CINETPAY_SITE_ID;
// const CINETPAY_NOTIFY_URL = process.env.CINETPAY_NOTIFY_URL;
// const CINETPAY_RETURN_URL = process.env.CINETPAY_RETURN_URL;
// const BASE_URL = process.env.BASE_URL; // URL de base de votre application React.js

// const handlePayment = async (req, res) => {
//     console.log('Requête reçue avec body:', req.body);

//     try {
//         const { amount, paymentMethod, type, isAnonymous, donorInfo, year } = req.body;
//         const userId = req.user ? req.user._id : null;

//         const validMethods = ['paypal', 'carte', 'virement', 'mobile'];
//         if (!validMethods.includes(paymentMethod)) {
//             return res.status(400).json({ message: 'Méthode de paiement invalide' });
//         }

//         // Validation du montant minimum pour CinetPay
//         if ((paymentMethod === 'mobile' || paymentMethod === 'carte') && amount < 100) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Le montant minimum pour le paiement mobile ou carte est de 100 XOF.'
//             });
//         }

//         let donorId = null;
//         if (type === 'don' && !userId && !isAnonymous) {
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
//                 paymentId: transaction.reference,
//                 isAnonymous,
//                 description: `Don via ${paymentMethod}`
//             });
//             await donation.save();
//         }

//         await transaction.save();

//         if (paymentMethod === 'mobile' || paymentMethod === 'carte') {
//             console.log('CinetPay API Key:', CINETPAY_API_KEY ? 'Loaded' : 'NOT LOADED');
//             console.log('CinetPay Site ID:', CINETPAY_SITE_ID ? 'Loaded' : 'NOT LOADED');
//             console.log('CinetPay Notify URL:', CINETPAY_NOTIFY_URL ? CINETPAY_NOTIFY_URL : 'NOT LOADED (undefined)');
//             console.log('CinetPay Return URL:', CINETPAY_RETURN_URL ? CINETPAY_RETURN_URL : 'NOT LOADED (undefined)');
//             console.log('Transaction Reference:', transaction.reference);
//             console.log('Amount:', amount);

//             // Vérification critique des URLs CinetPay
//             if (!CINETPAY_NOTIFY_URL || !CINETPAY_RETURN_URL) {
//                 console.error('Erreur de configuration: CINETPAY_NOTIFY_URL ou CINETPAY_RETURN_URL sont manquantes.');
//                 transaction.statut = 'échoué';
//                 await transaction.save();
//                 return res.status(500).json({
//                     success: false,
//                     message: 'Erreur de configuration serveur: URLs de CinetPay manquantes.'
//                 });
//             }

//             try {
//                 let cinetpayChannels;
//                 if (paymentMethod === 'mobile') {
//                     cinetpayChannels = 'MOBILE_MONEY';
//                 } else if (paymentMethod === 'carte') {
//                     cinetpayChannels = 'CREDIT_CARD';
//                 } else {
//                     cinetpayChannels = 'ALL';
//                 }

//                 const cinetpayResponse = await axios.post('https://api-checkout.cinetpay.com/v2/payment', {
//                     apikey: CINETPAY_API_KEY,
//                     site_id: CINETPAY_SITE_ID,
//                     transaction_id: transaction.reference,
//                     amount: amount,
//                     currency: 'XOF', // Confirmez votre devise
//                     description: transaction.description,
//                     return_url: CINETPAY_RETURN_URL,
//                     notify_url: CINETPAY_NOTIFY_URL,
//                     channels: cinetpayChannels,
//                     customer_name: donorInfo.firstName,
//                     customer_surname: donorInfo.lastName,
//                     customer_phone_number: donorInfo.phone,
//                     customer_email: donorInfo.email,
//                 });

//                 // Accepter le code 201 (CREATED) en plus de 200 (OK) comme un succès d'initialisation
//                 if (cinetpayResponse.data.code === '200' || cinetpayResponse.data.code === '201') {
//                     const paymentUrl = cinetpayResponse.data.data.payment_url;
//                     console.log('CinetPay Payment URL:', paymentUrl);

//                     return res.status(200).json({
//                         success: true,
//                         transactionId: transaction.reference,
//                         message: cinetpayResponse.data.description || 'Paiement initié avec succès via CinetPay',
//                         paymentUrl: paymentUrl
//                     });
//                 } else {
//                     console.error('Erreur CinetPay lors de l\'initialisation (code non 200/201):', cinetpayResponse.data);
//                     transaction.statut = 'échoué';
//                     await transaction.save();
//                     return res.status(400).json({
//                         success: false,
//                         message: cinetpayResponse.data.description || 'Erreur lors de l\'initialisation du paiement CinetPay',
//                         code: cinetpayResponse.data.code
//                     });
//                 }
//             } catch (cinetpayError) {
//                 console.error('Erreur lors de l\'appel API CinetPay (catch block):', cinetpayError.message);
//                 if (cinetpayError.response) {
//                     console.error('CinetPay Response Data:', cinetpayError.response.data);
//                     console.error('CinetPay Response Status:', cinetpayError.response.status);
//                 } else if (cinetpayError.request) {
//                     console.error('CinetPay Request made but no response received:', cinetpayError.request);
//                 } else {
//                     console.error('Error in setting up CinetPay request:', cinetpayError.message);
//                 }
//                 transaction.statut = 'échoué';
//                 await transaction.save();
//                 return res.status(500).json({
//                     success: false,
//                     message: 'Erreur lors de la communication avec CinetPay',
//                     error: cinetpayError.message
//                 });
//             }
//         } else {
//             return res.status(200).json({
//                 success: true,
//                 transactionId: transaction.reference,
//                 message: 'Paiement initié avec succès (méthode non CinetPay/Stripe)'
//             });
//         }

//     } catch (error) {
//         console.error('Erreur globale lors du traitement du paiement (catch block):', error.message);
//         console.error('Détails de l\'erreur globale:', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Erreur lors du traitement du paiement',
//             error: error.message
//         });
//     }
// };

// const updatePaymentStatus = async (req, res) => {
//     try {
//         // Pour un webhook CinetPay, vous devrez extraire les paramètres spécifiques
//         // et vérifier le HASH de sécurité (référez-vous à la doc CinetPay).
//         const { transactionId, status, paymentDetails } = req.body;

//         const transaction = await Transaction.findOne({ reference: transactionId });
//         if (!transaction) {
//             console.warn(`Transaction non trouvée pour référence: ${transactionId}`);
//             return res.status(404).send('Transaction non trouvée');
//         }

//         // Adaptez la logique `statut` en fonction des codes de retour de CinetPay
//         transaction.statut = status === 'success' ? 'complété' : 'échoué';
//         transaction.paymentDetails = paymentDetails;
//         await transaction.save();

//         if (transaction.type === 'don') {
//             const donation = await Donation.findOne({ paymentId: transactionId });
//             if (donation) {
//                 donation.status = status === 'success' ? 'completed' : 'failed';
//                 await donation.save();

//                 if (status === 'success' && donation.donor) {
//                     if (donation.donorModel === 'Donor') {
//                         const donor = await Donor.findById(donation.donor);
//                         if (donor) {
//                             await donor.updateMontantCumule(donation.amount);
//                         }
//                     } else if (donation.donorModel === 'User') {
//                          const user = await User.findById(donation.donor);
//                          if (user && user.updateMontantCumule) {
//                              await user.updateMontantCumule(donation.amount);
//                          }
//                     }
//                 }
//             }
//         }

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
//         return res.status(500).send('Erreur interne du serveur');
//     }
// };

// const handlePaymentStrype = async (req, res) => {
//     try {
//         const { amount } = req.body;

//         const session = await stripe.checkout.sessions.create({
//             payment_method_types: ['card'],
//             line_items: [
//                 {
//                     price_data: {
//                         currency: 'eur',
//                         product_data: {
//                             name: 'Don à l’association',
//                         },
//                         unit_amount: amount,
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

        const validMethods = ['paypal', 'card', 'mobile'];
        if (!validMethods.includes(paymentMethod)) {
            return res.status(400).json({ message: 'Méthode de paiement invalide' });
        }

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
                    currency: 'XOF', // Confirmez votre devise CinetPay
                    description: transaction.description,
                    return_url: CINETPAY_RETURN_URL,
                    notify_url: CINETPAY_NOTIFY_URL,
                    channels: cinetpayChannels,
                    customer_name: donorInfo.firstName,
                    customer_surname: donorInfo.lastName,
                    customer_phone_number: donorInfo.phone,
                    customer_email: donorInfo.email,
                });

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
        const { transactionId, status, paymentDetails } = req.body;

        const transaction = await Transaction.findOne({ reference: transactionId });
        if (!transaction) {
            console.warn(`Transaction non trouvée pour référence: ${transactionId}`);
            return res.status(404).send('Transaction non trouvée');
        }

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

        return res.status(200).send('OK');

    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        return res.status(500).send('Erreur interne du serveur');
    }
};

const handlePaymentStrype = async (req, res) => {
    try {
        const { amount, transactionId, isAnonymous } = req.body;

        const amountInCents = Math.round(amount * 100);

        // --- Devise définie sur USD ---
        const currencyToUse = 'usd'; 

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: currencyToUse, // Utilisation de la devise USD
                        product_data: {
                            name: 'Don à l’association',
                            description: `Transaction ID: ${transactionId} (Anonyme: ${isAnonymous ? 'Oui' : 'Non'})`
                        },
                        unit_amount: amountInCents, // Montant en centimes
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
        if (error.raw) {
            console.error("Détails erreur Stripe raw:", error.raw);
        }
        return res.status(500).json({ error: "Erreur serveur Stripe" });
    }
};

module.exports = {
    handlePayment,
    updatePaymentStatus,
    handlePaymentStrype
};
