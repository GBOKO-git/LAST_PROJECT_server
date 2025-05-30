const Donor = require('../models/Donor');
const Donation = require('../models/Donation');

// Créer un nouveau donateur
exports.createDonor = async (req, res) => {
    try {
        const { nom, prenom, email, telephone, adresse, typedonateur, preferences } = req.body;

        // Vérifier si le donateur existe déjà
        const existingDonor = await Donor.findOne({ email });
        if (existingDonor) {
            return res.status(400).json({
                success: false,
                message: 'Un donateur avec cet email existe déjà'
            });
        }

        // Créer le donateur
        const donor = await Donor.create({
            nom,
            prenom,
            email,
            telephone,
            adresse,
            typedonateur,
            preferences
        });

        res.status(201).json({
            success: true,
            donor
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Obtenir tous les donateurs
exports.getAllDonors = async (req, res) => {
    try {
        const donors = await Donor.find()
            .sort('-montantCumule');

        res.json({
            success: true,
            count: donors.length,
            donors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Obtenir un donateur spécifique
exports.getDonor = async (req, res) => {
    try {
        const donor = await Donor.findById(req.params.id);
        
        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donateur non trouvé'
            });
        }

        // Récupérer l'historique des dons
        const donations = await Donation.find({
            donor: donor._id,
            donorModel: 'Donor',
            status: 'completed'
        }).sort('-createdAt');

        res.json({
            success: true,
            donor,
            donations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Mettre à jour un donateur
exports.updateDonor = async (req, res) => {
    try {
        const { nom, prenom, telephone, adresse, preferences } = req.body;
        
        const donor = await Donor.findById(req.params.id);
        
        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donateur non trouvé'
            });
        }

        // Mise à jour des champs
        if (nom) donor.nom = nom;
        if (prenom) donor.prenom = prenom;
        if (telephone) donor.telephone = telephone;
        if (adresse) donor.adresse = adresse;
        if (preferences) donor.preferences = {...donor.preferences, ...preferences};

        await donor.save();

        res.json({
            success: true,
            donor
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Supprimer un donateur
exports.deleteDonor = async (req, res) => {
    try {
        const donor = await Donor.findById(req.params.id);
        
        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donateur non trouvé'
            });
        }

        // Vérifier s'il y a des dons associés
        const donations = await Donation.find({
            donor: donor._id,
            donorModel: 'Donor'
        });

        if (donations.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer ce donateur car il a des dons associés'
            });
        }

        await donor.remove();

        res.json({
            success: true,
            message: 'Donateur supprimé avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Obtenir les statistiques des donateurs
exports.getDonorStats = async (req, res) => {
    try {
        const stats = await Donor.aggregate([
            {
                $group: {
                    _id: '$typedonateur',
                    count: { $sum: 1 },
                    totalDons: { $sum: '$montantCumule' },
                    moyenneDons: { $avg: '$montantCumule' }
                }
            }
        ]);

        const totalDonors = await Donor.countDocuments();
        const totalAmount = await Donor.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$montantCumule' }
                }
            }
        ]);

        res.json({
            success: true,
            stats,
            totalDonors,
            totalAmount: totalAmount[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 