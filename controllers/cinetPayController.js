const fetch = require('node-fetch'); // Assure-toi d'avoir installé node-fetch

const cinetPayTransaction = async (req, res) => {
  try {
    const { amount } = req.body;

    const apiKey = process.env.CINETPAY_API_KEY;
    const siteId = process.env.CINETPAY_SITE_ID;
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.BASE_URL;

    if (!apiKey || !siteId || !baseUrl) {
      console.error("❌ Variables d'environnement manquantes");
      return res.status(500).json({ error: "Configuration serveur incomplète" });
    }

    // Génération d'un transaction_id unique (peut être amélioré)
    const transaction_id = 'TXN_' + Date.now().toString(36);

    const payload = {
      apikey: apiKey,
      site_id: siteId,
      transaction_id,
      amount,
      currency: "XOF",
      channels: "ALL",
      description: "Don à l'association",
      customer_name: "Donateur",
      customer_email: "donateur@example.com",
      notify_url: `${baseUrl}/api/cinetpay/notify`,
      return_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/cancel`,
    };

    console.log("📦 Payload envoyé à CinetPay :", payload);

    const response = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let result;

    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("❌ Réponse non JSON :", text);
      return res.status(500).json({ error: "Réponse non JSON de CinetPay" });
    }

    console.log("📨 Réponse CinetPay :", result);

    // Vérifie le code et la présence de l'URL de paiement
    if (result.code !== "201" && result.code !== 201) {
      return res.status(400).json({
        error: "Erreur lors de la création du paiement",
        details: result,
      });
    }

    if (!result.data?.payment_url) {
      return res.status(400).json({
        error: "URL de paiement manquante dans la réponse CinetPay",
        details: result,
      });
    }

    // Renvoie l'URL au frontend
    return res.json({ 
      success: true,
      url: result.data.payment_url,
      transactionId: transaction_id,
      message: "Paiement initié avec succès"
    });

  } catch (error) {
    console.error("🔥 Erreur CinetPay :", error);
    return res.status(500).json({ error: "Erreur serveur CinetPay" });
  }
};

module.exports = cinetPayTransaction;
