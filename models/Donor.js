// const mongoose = require('mongoose');

// const donorSchema = new mongoose.Schema({
//     nom: {
//         type: String,
//         required: [true, 'Le nom est requis'],
//         trim: true
//     },
//     prenom: {
//         type: String,
//         required: [true, 'Le prénom est requis'],
//         trim: true
//     },
//     email: {
//         type: String,
//         required: [true, 'L\'email est requis'],
//         unique: true,
//         trim: true,
//         lowercase: true,
//         match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
//     },
//     telephone: {
//         type: String,
//         trim: true
//     },
//     adresse: {
//         rue: String,
//         ville: String,
//         codePostal: String,
//         pays: String
//     },
//     typedonateur: {
//         type: String,
//         enum: ['regulier', 'ponctuel', 'anonyme'],
//         default: 'ponctuel'
//     },
//     montantCumule: {
//         type: Number,
//         default: 0
//     },
//     dernierDon: {
//         date: Date,
//         montant: Number
//     },
//     preferences: {
//         frequenceContact: {
//             type: String,
//             enum: ['hebdomadaire', 'mensuel', 'trimestriel', 'annuel', 'jamais'],
//             default: 'mensuel'
//         },
//         recevoirNewsletter: {
//             type: Boolean,
//             default: true
//         }
//     },
//     commentaires: String
// }, {
//     timestamps: true
// });

// // Index pour la recherche
// donorSchema.index({ email: 1 });
// donorSchema.index({ typedonateur: 1 });
// donorSchema.index({ 'dernierDon.date': -1 });

// // Méthode pour mettre à jour le montant cumulé
// donorSchema.methods.updateMontantCumule = async function(nouveauDon) {
//     this.montantCumule += nouveauDon;
//     this.dernierDon = {
//         date: new Date(),
//         montant: nouveauDon
//     };
//     return this.save();
// };

// const Donor = mongoose.model('Donor', donorSchema);

// module.exports = Donor; 