// const mongoose = require('mongoose');

// const transactionSchema = new mongoose.Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     },
//     type: {
//         type: String,
//         enum: ['don', 'cotisation'],
//         required: true
//     },
//     montant: {
//         type: Number,
//         required: [true, 'Le montant est requis'],
//         min: [1, 'Le montant minimum est de 1€']
//     },
//     statut: {
//         type: String,
//         enum: ['en attente', 'complété', 'échoué', 'remboursé'],
//         default: 'en attente'
//     },
//     methodePaiement: {
//         type: String,
//         enum: ['paypal', 'carte', 'virement'],
//         required: true
//     },
//     reference: {
//         type: String,
//         unique: true
//     },
//     description: String,
//     dateTransaction: {
//         type: Date,
//         default: Date.now
//     },
//     annee: {
//         type: Number,
//         required: function() {
//             return this.type === 'cotisation';
//         }
//     },
//     recu: {
//         emis: {
//             type: Boolean,
//             default: false
//         },
//         numero: String,
//         dateEmission: Date
//     }
// }, {
//     timestamps: true
// });

// // Middleware pour générer une référence unique
// transactionSchema.pre('save', async function(next) {
//     if (this.isNew) {
//         const date = new Date();
//         const year = date.getFullYear();
//         const month = String(date.getMonth() + 1).padStart(2, '0');
//         const day = String(date.getDate()).padStart(2, '0');
//         const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
//         this.reference = `${this.type === 'don' ? 'DON' : 'COT'}-${year}${month}${day}-${random}`;
//     }
//     next();
// });

// // Méthode pour générer le numéro de reçu
// transactionSchema.methods.genererRecuNumero = function() {
//     const date = new Date();
//     const year = date.getFullYear();
//     const type = this.type === 'don' ? 'D' : 'C';
//     const sequence = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
//     return `${type}${year}-${sequence}`;
// };

// const Transaction = mongoose.model('Transaction', transactionSchema);

// module.exports = Transaction; 