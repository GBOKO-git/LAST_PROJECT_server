const express = require('express');
const router = express.Router();
const { 
    creerTransaction, 
    getMesTransactions, 
    getTransaction, 
    updateTransactionStatus,
    getTransactionStats 
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

// Routes protégées pour tous les utilisateurs authentifiés
router.use(protect);

router.route('/')
    .post(creerTransaction)
    .get(getMesTransactions);

router.route('/:id')
    .get(getTransaction)
    .put(updateTransactionStatus);

// Routes admin
router.get('/stats/all', authorize('admin'), getTransactionStats);

module.exports = router; 