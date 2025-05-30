const Event = require('../models/Event');

// Créer un nouvel événement
exports.createEvent = async (req, res) => {
    try {
        const eventData = { ...req.body, organisateur: req.user._id };
        const event = await Event.create(eventData);

        res.status(201).json({
            success: true,
            event
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Obtenir tous les événements
exports.getEvents = async (req, res) => {
    try {
        const { type, date, search } = req.query;
        let query = {};

        // Filtrer par type
        if (type) {
            query.type = type;
        }

        // Filtrer par date
        if (date) {
            const dateDebut = new Date(date);
            dateDebut.setHours(0, 0, 0, 0);
            const dateFin = new Date(date);
            dateFin.setHours(23, 59, 59, 999);
            query.date = { $gte: dateDebut, $lte: dateFin };
        }

        // Recherche textuelle
        if (search) {
            query.$text = { $search: search };
        }

        const events = await Event.find(query)
            .populate('organisateur', 'nom prenom')
            .sort({ date: 1 });

        res.json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Obtenir un événement spécifique
exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organisateur', 'nom prenom')
            .populate('participants.user', 'nom prenom');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            });
        }

        res.json({
            success: true,
            event
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Mettre à jour un événement
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            });
        }

        // Vérifier si l'utilisateur est l'organisateur
        if (event.organisateur.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à modifier cet événement'
            });
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            event: updatedEvent
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Supprimer un événement
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            });
        }

        // Vérifier si l'utilisateur est l'organisateur
        if (event.organisateur.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à supprimer cet événement'
            });
        }

        await event.remove();

        res.json({
            success: true,
            message: 'Événement supprimé avec succès'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// S'inscrire à un événement
exports.registerForEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            });
        }

        // Vérifier si l'utilisateur est déjà inscrit
        const dejaInscrit = event.participants.find(
            p => p.user.toString() === req.user._id.toString()
        );

        if (dejaInscrit) {
            return res.status(400).json({
                success: false,
                message: 'Déjà inscrit à cet événement'
            });
        }

        // Vérifier s'il reste des places
        if (event.estComplet()) {
            return res.status(400).json({
                success: false,
                message: 'Événement complet'
            });
        }

        event.participants.push({
            user: req.user._id,
            statut: 'en attente'
        });

        await event.save();

        res.json({
            success: true,
            message: 'Inscription réussie'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Se désinscrire d'un événement
exports.unregisterFromEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            });
        }

        // Trouver et retirer le participant
        event.participants = event.participants.filter(
            p => p.user.toString() !== req.user._id.toString()
        );

        await event.save();

        res.json({
            success: true,
            message: 'Désinscription réussie'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Mettre à jour le statut d'un participant
exports.updateParticipantStatus = async (req, res) => {
    try {
        const { participantId, statut } = req.body;
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            });
        }

        // Vérifier si l'utilisateur est l'organisateur
        if (event.organisateur.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à modifier les statuts des participants'
            });
        }

        const participant = event.participants.id(participantId);
        if (!participant) {
            return res.status(404).json({
                success: false,
                message: 'Participant non trouvé'
            });
        }

        participant.statut = statut;
        await event.save();

        res.json({
            success: true,
            message: 'Statut du participant mis à jour'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}; 