const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Import des routes
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const paypalRoutes = require("./routes/paypalRoutes");
const eventRoutes = require("./routes/eventRoutes");
const donorRoutes = require("./routes/donorRoutes");
const mongodbConnect = require("./config/config");
const imageRoutes = require("./routes/imageRoutes")
const cinetPayroutes = require("./routes/cinetPayRoutes")
const paymentRoutes = require("./routes/paymentRoutes")


// Routes
app.get("/", (req, res) => {
  res.json({ message: "Bienvenue sur l'API AEEY" });
});

// Utilisation des routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/paypal", paypalRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/donors", donorRoutes);

// Utilisation des routes pour les images
app.use("/api/images", imageRoutes);

// route pour le paiement strype
app.use("/api/payment", paymentRoutes);

// route pour le paiement cinetPay
app.use("/api/cinetPay", cinetPayroutes);

// route pour le paiement strype
// app.use("/api/strype", paymentRoutes);

const port = process.env.PORT || 9000;

mongodbConnect();

app.listen(port, () => {
  console.log(`Le server tourne sur le port:${port}`);
});
