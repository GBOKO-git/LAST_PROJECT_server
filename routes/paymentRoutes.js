const express = require('express');
const router = express.Router();
const { handlePayment, updatePaymentStatus } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Route pour initier un paiement
router.post('/initiate', handlePayment);

// Route pour le webhook de mise à jour du statut (protégée par une clé API)
router.post('/webhook', updatePaymentStatus);

// Route pour les cotisations (nécessite d'être connecté)
router.post('/cotisation', protect, handlePayment);

module.exports = router; 