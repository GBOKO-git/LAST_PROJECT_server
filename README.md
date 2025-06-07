# 🧠 AEEY — API Backend

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Express](https://img.shields.io/badge/express-5.1.0-black?logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/mongodb-Mongoose-47A248?logo=mongodb)](https://mongoosejs.com)
[![PayPal](https://img.shields.io/badge/paypal-sdk-003087?logo=paypal)](https://developer.paypal.com/docs/api/overview/)

Backend officiel de la plateforme **AEEY** — une application web pour la gestion associative (membres, dons, événements, cotisations, etc.).  
Cette API REST sécurisée alimente le client web [`aeey_client`](https://github.com/GBOKO-git/LAST_PROJECT) réalisé avec React + Vite.

> 🚧 Certaines fonctionnalités (Stripe, CinetPay, emailing, Cloudinary avancé) sont en cours de production.

---

## 🚀 Fonctionnalités principales

- ✅ Authentification avec JWT (connexion/inscription)
- ✅ Gestion des rôles : membre, admin, donateur, invité
- ✅ Validation des membres par les administrateurs
- ✅ Création & gestion des événements
- ✅ Paiement sécurisé via **PayPal**
- ✅ Upload d’images (profil, événements) via Multer
- ✅ Middleware `auth` & `isAdmin`, journalisation via Morgan
- 🚧 Paiement via **Stripe** (à venir)
- 🚧 Paiement via **CinetPay** (à venir)
- 🚧 Envoi d’e-mails (confirmation, notifications)
- 🚧 Intégration complète avec **Cloudinary** pour le stockage distant

---

## 🛠️ Stack technique

- **Node.js** + **Express v5**
- **MongoDB** + **Mongoose**
- **JWT** pour les tokens d’authentification
- **Multer** pour l'upload local (Cloudinary à venir)
- **PayPal SDK** pour les paiements
- **Nodemailer** pour les emails (intégration à venir)
- **express-validator**, **bcryptjs**

---

## 📦 Installation locale

### 1. Cloner le projet

```bash
git clone https://github.com/tonutilisateur/aeey_server.git
cd aeey_server
