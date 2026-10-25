import nodemailer from 'nodemailer';

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendTransactionalEmail = async (payload: EmailPayload) => {
  const config = useRuntimeConfig();

  // Mode développement / sans configuration SMTP : affichage propre dans les logs
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    console.log('====================================================');
    console.log('📧 [EMAIL TRANSACTIONNEL SIMULÉ - SMTP NON CONFIGURÉ]');
    console.log(`À       : ${payload.to}`);
    console.log(`Sujet   : ${payload.subject}`);
    console.log(`Message :\n${payload.text}`);
    console.log('====================================================');
    return { simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort || 587),
      secure: Number(config.smtpPort) === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: config.smtpFrom || 'Ludoccase <noreply@ludoccase.fr>',
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html || payload.text.replace(/\n/g, '<br>'),
    });

    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email Error] Échec de l\'envoi de l\'email:', err);
    return { sent: false, error: err };
  }
};
