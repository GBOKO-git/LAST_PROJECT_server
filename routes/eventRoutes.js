const express = require('express');
const router = express.Router();
const {
    createEvent,
    getEvents,
    getEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    unregisterFromEvent,
    updateParticipantStatus
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

// Routes publiques
router.get('/', getEvents);
router.get('/:id', getEvent);

// Routes protégées
router.use(protect);

// Routes pour tous les utilisateurs authentifiés
router.post('/', authorize('admin'), createEvent);
router.post('/:id/register', registerForEvent);
router.delete('/:id/register', unregisterFromEvent);

// Routes pour les organisateurs et admins
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);
router.put('/:id/participants', updateParticipantStatus);

module.exports = router; 