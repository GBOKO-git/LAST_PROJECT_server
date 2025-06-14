const express = require('express');
const router = express.Router();
const { handlePayment, updatePaymentStatus, handlePaymentStrype } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Route pour initier un paiement
router.post('/initiate',protect, handlePayment);

// Route pour initier un paiement
router.post('/stripe', handlePaymentStrype);
 

// Route pour le webhook de mise à jour du statut (protégée par une clé API)
router.post('/webhook', updatePaymentStatus);

// Route pour les cotisations (nécessite d'être connecté)
router.post('/cotisation', protect, handlePayment);

module.exports = router; 