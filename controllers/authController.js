const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Imports des modèles 
const Donation = require("../models/Donation");
const Event = require("../models/Event");
const Transaction = require("../models/Transaction");
const MemberRequest = require("../models/MemberRequest");
// const Donor = require('../models/Donor');

// Générer le token JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
      estValide: user.estValide,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d", // Le token expire après 30 jours
    }
  );
};

// --- Fonction d'inscription (Register) ---
const register = async (req, res) => {
  try {
    // **ÉTAPE CLÉ 1 : Déstructurer 'role' du req.body.**
    // C'est crucial pour récupérer le rôle choisi par l'utilisateur dans le frontend.
    const { nom, prenom, email, password, telephone, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "Cet email est déjà utilisé" });
    }

    // **ÉTAPE CLÉ 2 : Définir la logique pour 'estValide' basée sur le rôle.**
    // Par défaut, un nouvel inscrit est considéré valide (actif).
    let estValideStatus = false;

    // Si le rôle choisi est 'member', alors il n'est pas validé initialement.
    // C'est le seul rôle qui nécessite une validation administrative.
    if (role === "member") {
      estValideStatus = false;
    }

    // **ÉTAPE CLÉ 3 : Créer l'utilisateur avec le rôle exact et le statut de validation déterminé.**
    const user = await User.create({
      nom,
      prenom,
      email,
      password,
      telephone,
      role: role, // Utilise le rôle EXACT envoyé par le frontend
      estValide: estValideStatus, // Applique la logique conditionnelle
    });

    // Générer le token JWT pour le nouvel utilisateur
    const token = generateToken(user);

    // Envoyer une réponse de succès avec les informations de l'utilisateur et le token
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        estValide: user.estValide,
        isSuperAdmin: user.isSuperAdmin,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error); // Log l'erreur pour le débogage

    // Gestion des erreurs de validation Mongoose (par exemple si le rôle envoyé n'est pas dans l'enum)
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({
          success: false,
          message: `Erreur de validation: ${messages.join(", ")}`,
        });
    }
    // Gestion des autres types d'erreurs
    res
      .status(400)
      .json({
        success: false,
        message:
          error.message ||
          "Une erreur inconnue est survenue lors de l'inscription.",
      });
  }
};

// --- Fonction de connexion (Login) ---
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'email et le mot de passe sont fournis
    if (!email || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Veuillez fournir un email et un mot de passe",
        });
    }

    // Trouver l'utilisateur par email et inclure le mot de passe (qui est select: false par défaut)
    const user = await User.findOne({ email }).select("+password");

    // Vérifier si l'utilisateur existe
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Email ou mot de passe incorrect" });
    }

    // Comparer le mot de passe fourni avec le mot de passe haché de l'utilisateur
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Email ou mot de passe incorrect" });
    }

    // Générer le token JWT pour l'utilisateur connecté
    const token = generateToken(user);

    // Envoyer la réponse de succès avec le token et les informations de l'utilisateur
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        estValide: user.estValide,
        isSuperAdmin: user.isSuperAdmin,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error); // Log l'erreur
    res
      .status(400)
      .json({
        success: false,
        message:
          error.message || "Une erreur est survenue lors de la connexion.",
      });
  }
};



// --- Fonction pour soumettre une demande d'adhésion ---

 const submitMembershipRequest = async (req, res) => {
  try {
    // 1. Récupération des données
    // Le message vient du corps de la requête (frontend)
    const { message } = req.body; 
    // L'ID de l'utilisateur vient du token JWT, attaché par le middleware d'authentification
    const userId = req.user._id;

    // 2. Vérification de l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      // Si pour une raison quelconque l'utilisateur du token n'est pas trouvé
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
    }

    // 3. Vérification si une demande est déjà en attente
    const existingPendingRequest = await MemberRequest.findOne({ user: userId, status: 'pending' });
    if (existingPendingRequest) {
      return res.status(409).json({ // 409 Conflict: la ressource existe déjà ou est en conflit
        success: false,
        message: "Vous avez déjà une demande d'adhésion en attente. Nous vous recontacterons bientôt.",
      });
    }

    // 4. Création de la nouvelle demande d'adhésion
    const newRequest = new MemberRequest({
      user: userId,
      nom: user.nom,       // Informations pré-remplies de l'utilisateur
      prenom: user.prenom,
      email: user.email,
      message: message,    // Le message spécifique de cette demande
      status: 'pending',   // Statut par défaut
      requestedRole: 'member', // Le rôle ciblé par cette demande
    });

    // 5. Sauvegarde de la demande
    await newRequest.save();

    // 6. Réponse de succès
    res.status(201).json({ // 201 Created: indique qu'une nouvelle ressource a été créée
      success: true,
      message: "Votre demande d'adhésion a été soumise avec succès. Elle est en attente d'approbation.",
      request: { // Renvoyer uniquement les informations pertinentes de la demande créée
        id: newRequest._id,
        user: newRequest.user,
        status: newRequest.status,
        requestedRole: newRequest.requestedRole,
        createdAt: newRequest.createdAt,
      },
    });

  } catch (error) {
    // 7. Gestion des erreurs
    console.error("Erreur lors de la soumission de la demande d'adhésion :", error);

    // Gérer spécifiquement les erreurs de base de données (ex: erreur de validation Mongoose, duplicata)
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    // Gérer l'erreur de duplicata (code 11000 pour MongoDB) si l'index partiel unique n'a pas été suffisant
    if (error.code === 11000) { 
        return res.status(409).json({ success: false, message: "Vous avez déjà une demande d'adhésion en cours." });
    }
    
    // Pour toutes les autres erreurs internes non gérées
    res.status(500).json({ success: false, message: "Erreur interne du serveur lors de la soumission de la demande." });
  }
};

// --- Fonction pour obtenir le profil utilisateur ---
const getProfile = async (req, res) => {
  try {
    // req.user._id est défini par votre middleware d'authentification (e.g., protect)
    const user = await User.findById(req.user._id).select("-password"); // Exclure le mot de passe

    // Si l'utilisateur n'est pas trouvé (peu probable si le token est valide)
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Profil utilisateur non trouvé." });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res
      .status(400)
      .json({
        success: false,
        message:
          error.message ||
          "Une erreur est survenue lors de la récupération du profil.",
      });
  }
};

// --- Fonction pour mettre à jour le profil utilisateur ---
const updateProfile = async (req, res) => {
  try {
    const { nom, prenom, telephone, adresse } = req.body;

    // Trouver l'utilisateur par son ID (req.user._id vient du token)
    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur non trouvé." });
    }

    // Mettre à jour les champs si fournis dans la requête
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (telephone) user.telephone = telephone;
    if (adresse) user.adresse = adresse; // Prend en charge l'objet adresse directement

    // Sauvegarder les modifications
    await user.save();

    // Répondre avec le profil mis à jour
    res.json({
      success: true,
      message: "Profil mis à jour avec succès",
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        adresse: user.adresse,
        role: user.role,
        estValide: user.estValide,
        isSuperAdmin: user.isSuperAdmin,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    // Gestion des erreurs de validation (ex: numéro de téléphone invalide si vous en avez)
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({
          success: false,
          message: `Erreur de validation: ${messages.join(", ")}`,
        });
    }
    res
      .status(400)
      .json({
        success: false,
        message:
          error.message ||
          "Une erreur est survenue lors de la mise à jour du profil.",
      });
  }
};

// --- Fonction pour valider un membre en attente (par un admin) ---
const validateMember = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur non trouvé" });
    }

    // Vérifier si le membre est déjà validé
    if (user.estValide === true) {
      return res.status(400).json({ message: "Ce membre est déjà validé." });
    }

    // S'assurer que seul un utilisateur avec le rôle 'member' peut être validé de cette manière
    if (user.role !== "member") {
      return res
        .status(400)
        .json({
          message:
            'Seuls les utilisateurs ayant le rôle "member" peuvent être validés de cette manière.',
        });
    }

    // Mettre à jour le statut de validation
    user.estValide = true;
    await user.save();

    res.json({
      success: true,
      message: "Membre validé avec succès",
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        estValide: user.estValide,
        isSuperAdmin: user.isSuperAdmin,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la validation du membre:", error);
    res
      .status(400)
      .json({
        success: false,
        message:
          error.message ||
          "Une erreur est survenue lors de la validation du membre.",
      });
  }
};

// --- Fonction pour obtenir tous les membres (ou utilisateurs) ---
const getAllMembers = async (req, res) => {
  try {
    // Renvoie tous les utilisateurs, quel que soit leur rôle
    // Si vous voulez filtrer spécifiquement pour les 'member', ajustez la requête:
    const members = await User.find({ role: "member" }).select("-password");
    // const members = await User.find().select('-password');
    res.json({ success: true, count: members.length, members });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de tous les membres/utilisateurs:",
      error
    );
    res
      .status(400)
      .json({
        success: false,
        message:
          error.message ||
          "Une erreur est survenue lors de la récupération des membres.",
      });
  }
};

// --- Fonction pour obtenir tous les membres (ou utilisateurs) ---
const getAllUsers = async (req, res) => {
  try {
    // Renvoie tous les utilisateurs, quel que soit leur rôle
    const members = await User.find().select("-password");
    res.json({ success: true, count: members.length, members });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de tous les membres/utilisateurs:",
      error
    );
    res
      .status(400)
      .json({
        success: false,
        message:
          error.message ||
          "Une erreur est survenue lors de la récupération des membres.",
      });
  }
};

// --- Fonction pour obtenir des statistiques pour l'admin dashboard ---
const getAdminStats = async (req, res) => {
  try {
    const users = await User.countDocuments(); // Nombre total d'utilisateurs
    const members = await User.countDocuments({
      role: "member",
      estValide: true,
    }); // Membres validés

    // Agrégation pour le total des dons
    const totalDonationResult = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalDonation = totalDonationResult[0]?.total || 0;

    // Agrégation pour le total des transactions de revenus
    const totalIncomeTransactionsResult = await Transaction.aggregate([
      { $match: { type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalIncomeTransactions =
      totalIncomeTransactionsResult[0]?.total || 0;

    // Agrégation pour le total des transactions de dépenses
    const totalExpenseTransactionsResult = await Transaction.aggregate([
      { $match: { type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalExpenseTransactions =
      totalExpenseTransactionsResult[0]?.total || 0;

    const events = await Event.countDocuments(); // Nombre total d'événements

    return res.json({
      success: true,
      members, // Membres validés
      users, // Total des utilisateurs (tous rôles confondus)
      totalDonation,
      totalIncomeTransactions,
      totalExpenseTransactions,
      events,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des statistiques admin :",
      error
    );
    res
      .status(500)
      .json({
        success: false,
        message: "Erreur serveur lors de la récupération des statistiques.",
      });
  }
};

// --- Fonction pour obtenir les membres non validés (pour la page d'administration) ---
const getUnvalidatedMembers = async (req, res) => {
  try {
    // Cherche uniquement les utilisateurs qui sont des 'member' et qui ne sont pas encore validés
    const unvalidatedMembers = await User.find({
      role: "member",
      estValide: false,
    }).select("-password");
    res
      .status(200)
      .json({
        success: true,
        message: "Membres en attente de validation récupérés avec succès.",
        data: unvalidatedMembers,
      });
  } catch (error) {
    console.error(
      "Erreur serveur lors de la récupération des membres non validés :",
      error
    );
    res
      .status(500)
      .json({
        message:
          "Une erreur serveur est survenue lors de la récupération des membres.",
      });
  }
};

// --- Fonction pour rejeter une demande de membre (supprime l'utilisateur) ---
const rejectMember = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur non trouvé." });
    }

    // Optionnel: Vous pouvez ajouter une vérification pour vous assurer que seul un 'member' non validé est rejeté
    // if (user.role !== 'member' || user.estValide === true) {
    //     return res.status(400).json({ success: false, message: 'Cette action ne peut être effectuée que sur une demande de membre non validée.' });
    // }

    await user.deleteOne(); // Supprime l'utilisateur de la base de données
    res
      .status(200)
      .json({
        success: true,
        message: "Demande de membre rejetée avec succès. Utilisateur supprimé.",
      });
  } catch (error) {
    console.error("Erreur serveur lors du rejet du membre :", error);
    res
      .status(500)
      .json({
        message: "Une erreur serveur est survenue lors du rejet du membre.",
      });
  }
};

// --- Exportation de toutes les fonctions du contrôleur en un seul objet ---
module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  validateMember,
  getAllMembers,
  getAdminStats,
  getUnvalidatedMembers,
  rejectMember,
  getAllUsers,
submitMembershipRequest,
};
