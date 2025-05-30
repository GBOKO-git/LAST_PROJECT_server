// const mongoose = require('mongoose');

// const eventSchema = new mongoose.Schema({
//     titre: {
//         type: String,
//         required: [true, 'Le titre est requis'],
//         trim: true
//     },
//     description: {
//         type: String,
//         required: [true, 'La description est requise']
//     },
//     date: {
//         type: Date,
//         required: [true, 'La date est requise']
//     },
//     heure: {
//         debut: {
//             type: String,
//             required: [true, 'L\'heure de début est requise']
//         },
//         fin: {
//             type: String,
//             required: [true, 'L\'heure de fin est requise']
//         }
//     },
//     lieu: {
//         nom: {
//             type: String,
//             required: [true, 'Le nom du lieu est requis']
//         },
//         adresse: {
//             rue: String,
//             ville: String,
//             codePostal: String,
//             pays: String
//         },
//         coordonnees: {
//             latitude: Number,
//             longitude: Number
//         }
//     },
//     type: {
//         type: String,
//         enum: ['reunion', 'formation', 'conference', 'social', 'autre'],
//         required: true
//     },
//     image: {
//         url: String,
//         alt: String
//     },
//     capacite: {
//         type: Number,
//         min: [0, 'La capacité ne peut pas être négative']
//     },
//     participants: [{
//         user: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User'
//         },
//         statut: {
//             type: String,
//             enum: ['confirmé', 'en attente', 'annulé'],
//             default: 'en attente'
//         },
//         dateInscription: {
//             type: Date,
//             default: Date.now
//         }
//     }],
//     organisateur: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     },
//     statut: {
//         type: String,
//         enum: ['planifié', 'en cours', 'terminé', 'annulé'],
//         default: 'planifié'
//     },
//     estPublic: {
//         type: Boolean,
//         default: true
//     },
//     tags: [{
//         type: String,
//         trim: true
//     }],
//     documents: [{
//         nom: String,
//         url: String,
//         type: String
//     }]
// }, {
//     timestamps: true
// });

// // Index pour la recherche
// eventSchema.index({ titre: 'text', description: 'text', tags: 'text' });

// // Méthode pour vérifier si l'événement est complet
// eventSchema.methods.estComplet = function() {
//     if (!this.capacite) return false;
//     return this.participants.filter(p => p.statut === 'confirmé').length >= this.capacite;
// };

// // Méthode pour obtenir le nombre de places restantes
// eventSchema.methods.placesRestantes = function() {
//     if (!this.capacite) return Infinity;
//     const participantsConfirmes = this.participants.filter(p => p.statut === 'confirmé').length;
//     return Math.max(0, this.capacite - participantsConfirmes);
// };

// // Middleware pour mettre à jour automatiquement le statut
// eventSchema.pre('save', function(next) {
//     const maintenant = new Date();
//     const dateEvenement = new Date(this.date);
    
//     if (this.statut !== 'annulé') {
//         if (dateEvenement < maintenant) {
//             this.statut = 'terminé';
//         } else if (dateEvenement.toDateString() === maintenant.toDateString()) {
//             this.statut = 'en cours';
//         } else {
//             this.statut = 'planifié';
//         }
//     }
    
//     next();
// });

// const Event = mongoose.model('Event', eventSchema);

// module.exports = Event; 