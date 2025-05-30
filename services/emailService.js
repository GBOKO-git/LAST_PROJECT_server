const nodemailer = require('nodemailer');
const config = require('../config/config');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass
      }
    });
  }

  async sendEmail(to, subject, html) {
    try {
      const info = await this.transporter.sendMail({
        from: `"AEEY" <${config.email.auth.user}>`,
        to,
        subject,
        html
      });

      console.log('Email envoyé:', info.messageId);
      return info;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    const subject = 'Bienvenue à l\'AEEY !';
    const html = `
      <h1>Bienvenue ${user.firstName} !</h1>
      <p>Nous sommes ravis de vous accueillir dans l'Association des Étudiants et Élèves Yvelinois.</p>
      <p>Votre compte a été créé avec succès.</p>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${config.frontend.url}${config.frontend.resetPasswordPath}?token=${resetToken}`;
    const subject = 'Réinitialisation de votre mot de passe';
    const html = `
      <h1>Réinitialisation de votre mot de passe</h1>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
      <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
      <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendEventConfirmationEmail(user, event) {
    const subject = `Confirmation d'inscription : ${event.titre}`;
    const html = `
      <h1>Confirmation d'inscription à l'événement</h1>
      <p>Bonjour ${user.firstName},</p>
      <p>Votre inscription à l'événement "${event.titre}" a été confirmée.</p>
      <p>Détails de l'événement :</p>
      <ul>
        <li>Date : ${new Date(event.date).toLocaleDateString('fr-FR')}</li>
        <li>Heure : ${event.heure.debut} - ${event.heure.fin}</li>
        <li>Lieu : ${event.lieu.nom}</li>
      </ul>
    `;

    return this.sendEmail(user.email, subject, html);
  }
}

module.exports = new EmailService(); 