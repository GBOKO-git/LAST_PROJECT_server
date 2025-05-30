const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Créer une nouvelle transaction (don ou cotisation)
exports.creerTransaction = async (req, res) => {
    try {
        const { type, montant, methodePaiement, description } = req.body;
        
        // Vérifier le type de transaction
        if (!['don', 'cotisation'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type de transaction invalide'
            });
        }

        // Créer la transaction
        const transaction = await Transaction.create({
            user: req.user._id,
            type,
            montant,
            methodePaiement,
            description,
            annee: type === 'cotisation' ? new Date().getFullYear() : undefined
        });

        res.status(201).json({
            success: true,
            transaction
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Obtenir toutes les transactions d'un utilisateur
exports.getMesTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id })
            .sort('-dateTransaction');

        res.json({
            success: true,
            count: transactions.length,
            transactions
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Obtenir une transaction spécifique
exports.getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction non trouvée'
            });
        }

        res.json({
            success: true,
            transaction
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Mettre à jour le statut d'une transaction
exports.updateTransactionStatus = async (req, res) => {
    try {
        const { statut } = req.body;
        
        const transaction = await Transaction.findById(req.params.id);
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction non trouvée'
            });
        }

        // Vérifier si le statut est valide
        if (!['en attente', 'complété', 'échoué', 'remboursé'].includes(statut)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide'
            });
        }

        transaction.statut = statut;

        // Si la transaction est complétée, générer un reçu
        if (statut === 'complété' && !transaction.recu.emis) {
            transaction.recu = {
                emis: true,
                numero: transaction.genererRecuNumero(),
                dateEmission: new Date()
            };

            // Mettre à jour l'utilisateur si c'est une cotisation
            if (transaction.type === 'cotisation') {
                await User.findByIdAndUpdate(transaction.user, {
                    $push: {
                        cotisations: {
                            montant: transaction.montant,
                            date: transaction.dateTransaction,
                            statut: 'payée'
                        }
                    }
                });
            } else {
                // Si c'est un don
                await User.findByIdAndUpdate(transaction.user, {
                    $push: {
                        dons: {
                            montant: transaction.montant,
                            date: transaction.dateTransaction,
                            description: transaction.description
                        }
                    }
                });
            }
        }

        await transaction.save();

        res.json({
            success: true,
            transaction
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Obtenir les statistiques des transactions (pour l'admin)
exports.getTransactionStats = async (req, res) => {
    try {
        const stats = await Transaction.aggregate([
            {
                $match: {
                    statut: 'complété'
                }
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$montant' },
                    count: { $sum: 1 },
                    avgMontant: { $avg: '$montant' }
                }
            }
        ]);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}; 