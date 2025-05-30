const paypal = require('@paypal/checkout-server-sdk');
const { client } = require('../config/paypal');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Créer une commande PayPal
exports.createOrder = async (req, res) => {
    try {
        const { montant, type, description } = req.body;

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'EUR',
                    value: montant.toString()
                },
                description: `${type === 'don' ? 'Don' : 'Cotisation'} - AEEY`
            }],
            application_context: {
                brand_name: 'AEEY',
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW',
                return_url: `${process.env.CLIENT_URL}/payment/success`,
                cancel_url: `${process.env.CLIENT_URL}/payment/cancel`
            }
        });

        const order = await client().execute(request);

        // Créer une transaction en attente
        const transaction = await Transaction.create({
            user: req.user._id,
            type,
            montant,
            methodePaiement: 'paypal',
            description,
            reference: order.result.id,
            annee: type === 'cotisation' ? new Date().getFullYear() : undefined
        });

        res.json({
            success: true,
            orderID: order.result.id,
            transactionId: transaction._id
        });
    } catch (error) {
        console.error('Erreur PayPal:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la commande PayPal'
        });
    }
};

// Capturer le paiement PayPal
exports.capturePayment = async (req, res) => {
    try {
        const { orderID } = req.body;
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({});

        const capture = await client().execute(request);

        if (capture.result.status === 'COMPLETED') {
            // Mettre à jour la transaction
            const transaction = await Transaction.findOne({ reference: orderID });
            if (transaction) {
                transaction.statut = 'complété';
                transaction.recu = {
                    emis: true,
                    numero: transaction.genererRecuNumero(),
                    dateEmission: new Date()
                };
                await transaction.save();

                // Mettre à jour le profil utilisateur
                const user = await User.findById(transaction.user);
                if (transaction.type === 'cotisation') {
                    user.cotisations.push({
                        montant: transaction.montant,
                        date: new Date(),
                        statut: 'payée'
                    });
                } else {
                    user.dons.push({
                        montant: transaction.montant,
                        date: new Date(),
                        description: transaction.description
                    });
                }
                await user.save();
            }

            res.json({
                success: true,
                captureID: capture.result.id
            });
        } else {
            throw new Error('Paiement non complété');
        }
    } catch (error) {
        console.error('Erreur capture PayPal:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la capture du paiement'
        });
    }
};

// Vérifier le statut d'une commande PayPal
exports.checkOrderStatus = async (req, res) => {
    try {
        const { orderID } = req.params;
        const request = new paypal.orders.OrdersGetRequest(orderID);
        
        const order = await client().execute(request);
        
        res.json({
            success: true,
            status: order.result.status
        });
    } catch (error) {
        console.error('Erreur vérification PayPal:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification du statut de la commande'
        });
    }
};

// Initier une transaction PayPal
exports.initiatePayment = async (req, res) => {
    try {
        const { amount, type, donorInfo, isAnonymous } = req.body;

        // Créer une transaction en attente
        const transaction = await Transaction.create({
            amount,
            type,
            paymentMethod: 'paypal',
            status: 'pending',
            isAnonymous,
            donorInfo: isAnonymous ? null : donorInfo,
            userId: req.user?._id,
            year: new Date().getFullYear()
        });

        res.json({
            success: true,
            transactionId: transaction._id
        });
    } catch (error) {
        console.error('Erreur PayPal:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'initiation du paiement'
        });
    }
};

// Confirmer le paiement PayPal
exports.confirmPayment = async (req, res) => {
    try {
        const { transactionId, paypalOrderId } = req.body;

        // Mettre à jour la transaction
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction non trouvée'
            });
        }

        transaction.status = 'completed';
        transaction.paymentDetails = {
            orderId: paypalOrderId,
            completedAt: new Date()
        };
        await transaction.save();

        // Si ce n'est pas un don anonyme et qu'il y a un utilisateur associé
        if (!transaction.isAnonymous && transaction.userId) {
            const user = await User.findById(transaction.userId);
            if (user) {
                if (transaction.type === 'cotisation') {
                    // Mettre à jour le statut de cotisation
                    user.subscriptions = user.subscriptions || [];
                    user.subscriptions.push({
                        year: transaction.year,
                        amount: transaction.amount,
                        paidAt: new Date(),
                        transactionId: transaction._id
                    });
                } else {
                    // Enregistrer le don
                    user.donations = user.donations || [];
                    user.donations.push({
                        amount: transaction.amount,
                        date: new Date(),
                        transactionId: transaction._id
                    });
                }
                await user.save();
            }
        }

        res.json({
            success: true,
            message: 'Paiement confirmé avec succès'
        });
    } catch (error) {
        console.error('Erreur confirmation PayPal:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la confirmation du paiement'
        });
    }
}; 