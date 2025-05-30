const jwt = require('jsonwebtoken');
const User = require('../models/User');

// require('dotenv').config();

exports.protect = async (req, res, next) => {
    // ... (Votre fonction protect reste inchangée) ...
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Veuillez vous connecter pour accéder à cette ressource'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'L\'utilisateur associé à ce token n\'existe plus'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Erreur de protection du token:", error.message);
        return res.status(401).json({
            success: false,
            message: 'Token invalide ou expiré'
        });
    }
};

// Middleware d'autorisation mis à jour
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // 1. Vérifier si l'utilisateur est présent dans la requête
    if (!req.user) {
        return res.status(403).json({
            success: false,
            message: 'Accès refusé : Utilisateur non authentifié.'
        });
    }

    // NOUVELLE LOGIQUE CLÉ : Accès total pour les Super Admin et Admin
    // Si l'utilisateur est un Super Admin ou un Admin, il a accès à TOUTES les routes qui utilisent 'authorize'
    if (req.user.isSuperAdmin || req.user.isAdmin) {
        return next();
    }

    // 2. Si l'utilisateur n'est PAS un admin/superAdmin, on vérifie ses rôles spécifiques
    // Vérification du rôle principal de l'utilisateur
    // Si le rôle de l'utilisateur correspond à l'un des rôles explicitement requis
    if (roles.includes(req.user.role)) {
        return next();
    }

    // 3. Si aucune des conditions précédentes n'est remplie, l'accès est refusé
    return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les droits pour accéder à cette ressource'
    });
  };
};