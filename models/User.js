// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const userSchema = new mongoose.Schema(
//   {
//     nom: {
//       type: String,
//       required: [true, "Le nom est requis"],
//       trim: true,
//     },
//     prenom: {
//       type: String,
//       required: [true, "Le prénom est requis"],
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: [true, "L'email est requis"],
//       trim: true,
//       lowercase: true,
//       match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email invalide"],
//     },
//     password: {
//       type: String,
//       required: [true, "Le mot de passe est requis"],
//       minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"],
//     },
//     role: {
//       type: String,
//       enum: ["user", "member", "admin", "donateur"],
      
//     },
//     telephone: {
//       type: String,
//       trim: true,
//     },
//     adresse: {
//       rue: String,
//       ville: String,
//       codePostal: String,
//       pays: String,
//     },
//     dateInscription: {
//       type: Date,
//       default: Date.now,
//     },
//     estValide: {
//       type: Boolean,
//       default: false,
//     },
//     isAdmin: {
//       type: Boolean,
//       default: false,
//     },
//     isSuperAdmin: {
//       type: Boolean,
//       default: false,
//     },
//     cotisations: [
//       {
//         montant: Number,
//         date: Date,
//         statut: {
//           type: String,
//           enum: ["en attente", "payée", "annulée"],
//           default: "en attente",
//         },
//       },
//     ],
//     dons: [
//       {
//         montant: Number,
//         date: Date,
//         description: String,
//       },
//     ],
//   },
//   {
//     timestamps: true,
//   }
// );

// // Création de l'index email unique au niveau du schéma
// userSchema.index({ email: 1 }, { unique: true, background: true });

// // Hash du mot de passe avant sauvegarde
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Méthode pour comparer les mots de passe
// userSchema.methods.comparePassword = async function (candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// const User = mongoose.model("User", userSchema);

// module.exports = User;
