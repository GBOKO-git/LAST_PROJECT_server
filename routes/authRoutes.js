// backend/routes/auth.js

const express = require('express');
const router = express.Router();
// CHANGEMENT 1 : Importez la nouvelle fonction du contrôleur
// Vous devrez créer ou adapter la fonction 'getUnvalidatedMembers' dans authController.js
const {  updateProfilePhoto, register, login, getProfile, updateProfile, validateMember, getAllMembers, getAdminStats, getUnvalidatedMembers, rejectMember, submitMembershipRequest } = require('../controllers/authController'); // AJOUTEZ 'getUnvalidatedMembers' ici
const { protect, authorize } = require('../middleware/auth');

// Routes publiques
router.post('/register', register);
router.post('/login', login);

// Routes protégées (utilisateur connecté)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/photo', protect, updateProfilePhoto);

// demande membre
router.post('/request', protect, submitMembershipRequest);

// Routes admin (nécessitent d'être admin pour y accéder)
router.put('/validate/:userId', protect, authorize('admin'), validateMember);
router.get('/members', protect, authorize('admin'), getAllMembers);
// NOUVELLE ROUTE : Pour récupérer les statistiques d'administration
router.get('/admin/stats', protect, authorize('admin'), getAdminStats);

// --- NOUVELLE ROUTE : Pour récupérer la liste des membres non validés (déjà ajoutée) ---
router.get('/unvalidated-members', protect, authorize('admin'), getUnvalidatedMembers);

// --- NOUVELLE ROUTE : Pour rejeter un membre ---
router.patch('/reject/:userId', protect, authorize('admin'), rejectMember); // NOUVELLE LIGNE AJOUTÉE ICI


module.exports = router;