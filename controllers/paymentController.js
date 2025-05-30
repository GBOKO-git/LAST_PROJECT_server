const Transaction = require('../models/Transaction');
const Donation = require('../models/Donation');
const Donor = require('../models/Donor');
const User = require('../models/User');

// Gestionnaire de paiement générique
const handlePayment = async (req, res) => {
  try {
    const { 
      amount, 
      paymentMethod, 
      type, // 'don' ou 'cotisation'
      userId,
      isAnonymous,
      donorInfo, // Pour les nouveaux donateurs
      year // Pour les cotisations
    } = req.body;

    // 1. Créer ou mettre à jour le donateur si nécessaire
    let donorId;
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

    // 2. Créer la transaction
    const transaction = new Transaction({
      user: userId || donorId,
      type,
      montant: amount,
      methodePaiement: paymentMethod,
      annee: year,
      description: `${type === 'don' ? 'Don' : 'Cotisation'} via ${paymentMethod}`
    });

    // 3. Si c'est un don, créer aussi l'enregistrement de don
    if (type === 'don') {
      const donation = new Donation({
        donor: userId || donorId,
        donorModel: userId ? 'User' : 'Donor',
        amount,
        paymentMethod,
        paymentId: transaction.reference, // On utilise la référence de la transaction
        isAnonymous,
        description: `Don via ${paymentMethod}`
      });
      await donation.save();
    }

    // 4. Sauvegarder la transaction
    await transaction.save();

    // 5. Retourner la réponse
    res.status(200).json({
      success: true,
      transactionId: transaction.reference,
      message: 'Paiement initié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du traitement du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement du paiement',
      error: error.message
    });
  }
};

// Webhook pour mettre à jour le statut du paiement
const updatePaymentStatus = async (req, res) => {
  try {
    const { transactionId, status, paymentDetails } = req.body;

    // 1. Mettre à jour la transaction
    const transaction = await Transaction.findOne({ reference: transactionId });
    if (!transaction) {
      throw new Error('Transaction non trouvée');
    }

    transaction.statut = status === 'success' ? 'complété' : 'échoué';
    await transaction.save();

    // 2. Si c'est un don, mettre à jour aussi l'enregistrement de don
    if (transaction.type === 'don') {
      const donation = await Donation.findOne({ paymentId: transactionId });
      if (donation) {
        donation.status = status === 'success' ? 'completed' : 'failed';
        await donation.save();

        // Mettre à jour le montant cumulé du donateur si le paiement est réussi
        if (status === 'success' && donation.donor) {
          if (donation.donorModel === 'Donor') {
            const donor = await Donor.findById(donation.donor);
            if (donor) {
              await donor.updateMontantCumule(donation.amount);
            }
          }
        }
      }
    }

    // 3. Si c'est une cotisation réussie, mettre à jour le statut de l'utilisateur
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

    res.status(200).json({
      success: true,
      message: 'Statut de paiement mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
};

module.exports = {
  handlePayment,
  updatePaymentStatus
}; 