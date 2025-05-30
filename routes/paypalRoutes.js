const express = require('express');
const router = express.Router();
const { 
    createOrder,
    capturePayment,
    checkOrderStatus
} = require('../controllers/paypalController');
const { protect } = require('../middleware/auth');

// Protection de toutes les routes
router.use(protect);

// Routes PayPal
router.post('/create-order', createOrder);
router.post('/capture-payment', capturePayment);
router.get('/order/:orderID', checkOrderStatus);

module.exports = router; 