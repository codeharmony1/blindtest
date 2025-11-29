import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    // Configuration SMTP Hostinger
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(env.SMTP_PORT || '465'),
      secure: env.SMTP_SECURE === 'true' || env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
      // Options additionnelles pour améliorer la délivrabilité
      tls: {
        // Ne pas échouer sur certificats invalides (peut être utile en dev)
        rejectUnauthorized: env.NODE_ENV === 'production'
      }
    });

    this.fromEmail = env.EMAIL_FROM || env.SMTP_USER || 'support@codeharmony.com';
    this.fromName = env.EMAIL_FROM_NAME || 'Blind Test Musical';

    // Vérifier la connexion SMTP au démarrage seulement si les credentials sont configurés
    if (env.SMTP_USER && env.SMTP_PASS) {
      this.verifyConnection();
    } else if (env.NODE_ENV === 'development') {
      console.log('⚠️  SMTP not configured - Email service running in development mode (emails will not be sent)');
    }
  }

  /**
   * Vérifier que la connexion SMTP fonctionne
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified - Email service ready');
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      if (env.NODE_ENV === 'production') {
        throw new Error('Email service configuration error');
      }
    }
  }

  /**
   * Envoyer un email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });

      console.log('✉️  Email sent:', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId
      });

      return true;
    } catch (error) {
      console.error('❌ Email send failed:', error);

      // En développement, on ne throw pas pour ne pas bloquer l'app
      if (env.NODE_ENV === 'development') {
        console.warn('⚠️  Email not sent (dev mode) - would have sent:', options.subject);
        return false;
      }

      throw error;
    }
  }

  /**
   * Email de bienvenue après inscription
   */
  async sendWelcomeEmail(email: string, displayName?: string): Promise<boolean> {
    const name = displayName || email.split('@')[0];

    return this.sendEmail({
      to: email,
      subject: '🎵 Bienvenue sur Blind Test Musical !',
      html: this.getWelcomeTemplate(name),
    });
  }

  /**
   * Email de confirmation d'inscription avec plan d'abonnement
   */
  async sendRegistrationConfirmationEmail(
    email: string,
    fullName: string,
    plan: string
  ): Promise<boolean> {
    const name = fullName || email.split('@')[0];

    return this.sendEmail({
      to: email,
      subject: '🎉 Inscription confirmée - Blind Test Musical',
      html: this.getRegistrationConfirmationTemplate(name, plan),
    });
  }

  /**
   * Email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    displayName?: string
  ): Promise<boolean> {
    const name = displayName || email.split('@')[0];
    const resetUrl = `${env.APP_BASE_URL}/auth/reset-password?token=${resetToken}`;

    return this.sendEmail({
      to: email,
      subject: '🔐 Réinitialisation de votre mot de passe',
      html: this.getPasswordResetTemplate(name, resetUrl),
    });
  }

  /**
   * Email de confirmation de paiement
   */
  async sendPaymentConfirmationEmail(
    email: string,
    amount: number,
    plan: string,
    displayName?: string
  ): Promise<boolean> {
    const name = displayName || email.split('@')[0];

    return this.sendEmail({
      to: email,
      subject: '✅ Confirmation de paiement - Blind Test Musical',
      html: this.getPaymentConfirmationTemplate(name, amount, plan),
    });
  }

  /**
   * Email d'activation d'abonnement
   */
  async sendSubscriptionActivatedEmail(
    email: string,
    plan: string,
    displayName?: string
  ): Promise<boolean> {
    const name = displayName || email.split('@')[0];

    return this.sendEmail({
      to: email,
      subject: '🎉 Votre abonnement est activé !',
      html: this.getSubscriptionActivatedTemplate(name, plan),
    });
  }

  /**
   * Email d'échec de paiement
   */
  async sendPaymentFailedEmail(
    email: string,
    reason: string,
    displayName?: string
  ): Promise<boolean> {
    const name = displayName || email.split('@')[0];

    return this.sendEmail({
      to: email,
      subject: '⚠️ Échec de paiement - Action requise',
      html: this.getPaymentFailedTemplate(name, reason),
    });
  }

  /**
   * Email d'expiration d'abonnement (rappel)
   */
  async sendSubscriptionExpiringEmail(
    email: string,
    daysRemaining: number,
    displayName?: string
  ): Promise<boolean> {
    const name = displayName || email.split('@')[0];

    return this.sendEmail({
      to: email,
      subject: `⏰ Votre abonnement expire dans ${daysRemaining} jours`,
      html: this.getSubscriptionExpiringTemplate(name, daysRemaining),
    });
  }

  /**
   * Enlever les balises HTML pour version texte
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  // ==================== TEMPLATES HTML ====================

  /**
   * Template de base pour tous les emails
   */
  private getBaseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blind Test Musical</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎵 Blind Test Musical</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                Vous recevez cet email car vous êtes inscrit sur Blind Test Musical.
              </p>
              <p style="color: #6c757d; font-size: 14px; margin: 0;">
                <a href="${env.APP_BASE_URL}" style="color: #667eea; text-decoration: none;">blindtest.codeharmony.fr</a> |
                <a href="mailto:support@codeharmony.com" style="color: #667eea; text-decoration: none;">Support</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Template email de bienvenue
   */
  private getWelcomeTemplate(name: string): string {
    const content = `
      <h2 style="color: #333; margin-top: 0;">Bienvenue ${name} !</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Nous sommes ravis de vous accueillir sur <strong>Blind Test Musical</strong>,
        la plateforme qui transforme vos événements en expériences musicales inoubliables !
      </p>

      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
        <h3 style="color: #667eea; margin-top: 0;">🎮 Pour commencer :</h3>
        <ol style="color: #555; line-height: 1.8;">
          <li>Créez votre premier événement</li>
          <li>Ajoutez vos chansons préférées</li>
          <li>Partagez le code événement avec vos joueurs</li>
          <li>Lancez le jeu et amusez-vous !</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${env.APP_BASE_URL}/admin"
           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff;
                  text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Créer mon premier événement
        </a>
      </div>

      <p style="color: #555; font-size: 14px; margin-top: 30px;">
        Besoin d'aide ? Notre équipe est là pour vous :
        <a href="mailto:support@codeharmony.com" style="color: #667eea;">support@codeharmony.com</a>
      </p>
    `;

    return this.getBaseTemplate(content);
  }

  /**
   * Template email de confirmation d'inscription
   */
  private getRegistrationConfirmationTemplate(name: string, plan: string): string {
    const planNames: Record<string, string> = {
      'DEMO': 'Plan DÉMO - Gratuit',
      'PER_EVENT': 'Paiement par événement - 19€',
      'MONTHLY': 'Plan Mensuel - 49€/mois'
    };

    const planFeatures: Record<string, string[]> = {
      'DEMO': [
        '✓ Événements illimités',
        '✓ Joueurs illimités',
        '✓ Maximum 5 chansons par événement',
        '✓ Interface complète'
      ],
      'PER_EVENT': [
        '✓ 1 événement simultané',
        '✓ Chansons illimitées',
        '✓ Joueurs illimités',
        '✓ Support standard'
      ],
      'MONTHLY': [
        '✓ Événements illimités',
        '✓ Chansons illimitées',
        '✓ Joueurs illimités',
        '✓ Support prioritaire'
      ]
    };

    const planName = planNames[plan] || planNames['DEMO'];
    const features = planFeatures[plan] || planFeatures['DEMO'];

    const content = `
      <h2 style="color: #333; margin-top: 0;">Bienvenue ${name} !</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Votre inscription sur <strong>Blind Test Musical</strong> a été confirmée avec succès !
      </p>

      <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
        <h3 style="color: #155724; margin-top: 0;">📋 Récapitulatif de votre inscription</h3>
        <p style="color: #155724; margin: 5px 0; font-size: 15px;">
          <strong>Nom complet :</strong> ${name}
        </p>
        <p style="color: #155724; margin: 5px 0; font-size: 15px;">
          <strong>Plan d'abonnement :</strong> ${planName}
        </p>
      </div>

      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
        <h3 style="color: #667eea; margin-top: 0;">✨ Vos avantages :</h3>
        <ul style="color: #555; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
          ${features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <h3 style="color: #856404; margin-top: 0;">🎮 Premiers pas :</h3>
        <ol style="color: #856404; line-height: 1.8;">
          <li>Connectez-vous à votre espace admin</li>
          <li>Créez votre premier événement</li>
          <li>Ajoutez vos chansons préférées</li>
          <li>Partagez le code événement avec vos joueurs</li>
          <li>Lancez le jeu et amusez-vous !</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${env.APP_BASE_URL}/admin"
           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff;
                  text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Accéder à mon espace admin
        </a>
      </div>

      <p style="color: #555; font-size: 14px; margin-top: 30px;">
        Besoin d'aide ? Notre équipe est là pour vous :
        <a href="mailto:support@codeharmony.com" style="color: #667eea;">support@codeharmony.com</a>
      </p>
    `;

    return this.getBaseTemplate(content);
  }

  /**
   * Template email reset password
   */
  private getPasswordResetTemplate(name: string, resetUrl: string): string {
    const content = `
      <h2 style="color: #333; margin-top: 0;">Réinitialisation de mot de passe</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Bonjour ${name},
      </p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}"
           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff;
                  text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Réinitialiser mon mot de passe
        </a>
      </div>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <p style="color: #856404; margin: 0; font-size: 14px;">
          ⚠️ Ce lien est valable pendant <strong>1 heure</strong> seulement.
        </p>
      </div>

      <p style="color: #555; font-size: 14px;">
        Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
      </p>

      <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #e9ecef; padding-top: 15px;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
      </p>
    `;

    return this.getBaseTemplate(content);
  }

  /**
   * Template confirmation de paiement
   */
  private getPaymentConfirmationTemplate(name: string, amount: number, plan: string): string {
    const planNames: Record<string, string> = {
      'PER_EVENT': 'Paiement par événement',
      'MONTHLY': 'Abonnement mensuel'
    };

    const content = `
      <h2 style="color: #333; margin-top: 0;">✅ Paiement confirmé</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Bonjour ${name},
      </p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Nous avons bien reçu votre paiement. Merci pour votre confiance !
      </p>

      <table width="100%" cellpadding="10" style="background-color: #f8f9fa; border-radius: 5px; margin: 20px 0;">
        <tr>
          <td style="color: #666; font-weight: bold;">Plan :</td>
          <td style="color: #333; text-align: right;">${planNames[plan] || plan}</td>
        </tr>
        <tr>
          <td style="color: #666; font-weight: bold;">Montant :</td>
          <td style="color: #333; text-align: right; font-size: 18px; font-weight: bold;">${amount.toFixed(2)} €</td>
        </tr>
      </table>

      <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
        <p style="color: #155724; margin: 0;">
          ✨ Votre compte est maintenant activé avec toutes les fonctionnalités !
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${env.APP_BASE_URL}/admin"
           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff;
                  text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Accéder à mon compte
        </a>
      </div>

      <p style="color: #555; font-size: 14px;">
        Votre facture est disponible dans votre espace client.
      </p>
    `;

    return this.getBaseTemplate(content);
  }

  /**
   * Template activation abonnement
   */
  private getSubscriptionActivatedTemplate(name: string, plan: string): string {
    const planDetails: Record<string, { name: string; features: string[] }> = {
      'PER_EVENT': {
        name: 'Paiement par événement',
        features: ['1 événement simultané', 'Chansons illimitées', 'Joueurs illimités']
      },
      'MONTHLY': {
        name: 'Abonnement mensuel',
        features: ['Événements illimités', 'Chansons illimitées', 'Joueurs illimités', 'Support prioritaire']
      }
    };

    const details = planDetails[plan] || planDetails['MONTHLY'];

    const content = `
      <h2 style="color: #333; margin-top: 0;">🎉 Votre abonnement est activé !</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Bonjour ${name},
      </p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Félicitations ! Votre abonnement <strong>${details.name}</strong> est maintenant actif.
      </p>

      <div style="background-color: #f8f9fa; border-radius: 5px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #667eea; margin-top: 0;">✨ Vos avantages :</h3>
        <ul style="color: #555; line-height: 1.8;">
          ${details.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${env.APP_BASE_URL}/admin"
           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff;
                  text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Créer un événement
        </a>
      </div>

      <p style="color: #555; font-size: 14px;">
        Gérez votre abonnement à tout moment depuis votre
        <a href="${env.APP_BASE_URL}/admin/billing" style="color: #667eea;">espace client</a>.
      </p>
    `;

    return this.getBaseTemplate(content);
  }

  /**
   * Template échec de paiement
   */
  private getPaymentFailedTemplate(name: string, reason: string): string {
    const content = `
      <h2 style="color: #dc3545; margin-top: 0;">⚠️ Échec de paiement</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Bonjour ${name},
      </p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Nous n'avons pas pu traiter votre paiement.
      </p>

      <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
        <p style="color: #721c24; margin: 0; font-weight: bold;">Raison :</p>
        <p style="color: #721c24; margin: 5px 0 0 0;">${reason}</p>
      </div>

      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Pour continuer à profiter de nos services, veuillez mettre à jour vos informations de paiement.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${env.APP_BASE_URL}/admin/billing"
           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff;
                  text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Mettre à jour mes informations
        </a>
      </div>

      <p style="color: #555; font-size: 14px;">
        Si vous avez des questions, contactez-nous à
        <a href="mailto:support@codeharmony.com" style="color: #667eea;">support@codeharmony.com</a>
      </p>
    `;

    return this.getBaseTemplate(content);
  }

  /**
   * Template expiration abonnement
   */
  private getSubscriptionExpiringTemplate(name: string, daysRemaining: number): string {
    const content = `
      <h2 style="color: #ffc107; margin-top: 0;">⏰ Votre abonnement expire bientôt</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Bonjour ${name},
      </p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Votre abonnement expire dans <strong>${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}</strong>.
      </p>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <p style="color: #856404; margin: 0;">
          Pour continuer à profiter de toutes les fonctionnalités, pensez à renouveler votre abonnement.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${env.APP_BASE_URL}/admin/billing"
           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff;
                  text-decoration: none; padding: 14px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Renouveler mon abonnement
        </a>
      </div>

      <p style="color: #555; font-size: 14px;">
        Des questions ? Notre équipe est à votre disposition :
        <a href="mailto:support@codeharmony.com" style="color: #667eea;">support@codeharmony.com</a>
      </p>
    `;

    return this.getBaseTemplate(content);
  }
}

// Export singleton
export const emailService = new EmailService();
