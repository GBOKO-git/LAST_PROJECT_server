// aeey_server/models/MemberRequest.js

const mongoose = require('mongoose');

const memberRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Référence au modèle User
    required: true,
  },
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true },
  
  message: { // Champ pour les motivations de l'utilisateur
    type: String,
    required: false, 
    maxlength: 1000
  },
  status: { // Statut de la demande : 'pending', 'approved', 'rejected'
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedRole: { // Le rôle que l'utilisateur demande via ce formulaire
    type: String,
    enum: ['member'], // Via ce formulaire, l'objectif est de devenir 'member'
    default: 'member'
  },
}, {
  timestamps: true // Ajoute automatiquement `createdAt` et `updatedAt`
});

memberRequestSchema.index({ user: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });


module.exports = mongoose.model('MemberRequest', memberRequestSchema);