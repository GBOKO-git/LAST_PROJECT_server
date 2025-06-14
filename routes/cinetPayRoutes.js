// routes/cinetpay.js
const express = require('express');
const router = express.Router();
const cinetPayTransaction = require('../controllers/cinetPayController');
require('dotenv').config();

router.post('/payment', cinetPayTransaction);

// Optionnel : notification CinetPay
router.post("/notify", (req, res) => {
  console.log("📥 Notification CinetPay reçue :", req.body);
  res.status(200).send("OK");
});

module.exports = router;
