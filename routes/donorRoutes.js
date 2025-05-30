const express = require('express');
const router = express.Router();
const { 
    createDonor, 
    getAllDonors, 
    getDonor, 
    updateDonor, 
    deleteDonor,
    getDonorStats
} = require('../controllers/donorController');
const { protect, authorize } = require('../middleware/auth');

// Routes publiques
router.post('/register', createDonor);

// Routes protégées pour les admins
router.use(protect);
router.use(authorize('admin'));

router.route('/')
    .get(getAllDonors);

router.route('/stats')
    .get(getDonorStats);

router.route('/:id')
    .get(getDonor)
    .put(updateDonor)
    .delete(deleteDonor);

module.exports = router; 