import nodemailer from 'nodemailer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Config SMTP par variables d'environnement (aucun secret en dur) ---
const HOST = process.env.PULSAR_SMTP_HOST || '';
const PORT = Number(process.env.PULSAR_SMTP_PORT) || 587;
const USER = process.env.PULSAR_SMTP_USER || '';
const PASS = process.env.PULSAR_SMTP_PASS || '';
const FROM = process.env.PULSAR_MAIL_FROM || (USER ? `Pulsar <${USER}>` : '');

/** L'envoi d'email est-il configuré ? (sinon on active les comptes directement). */
export const mailEnabled = !!(HOST && USER && PASS);

let transporter = null;
function getTransport() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: HOST, port: PORT, secure: PORT === 465,
      auth: { user: USER, pass: PASS },
    });
  }
  return transporter;
}

// Logo Pulsar joint en ligne (CID), affiché en tête de l'email.
const LOGO_PATH = path.join(__dirname, '..', '..', 'client', 'src', 'assets', 'pulsar-logo.png');
const logoAttachment = () => (fs.existsSync(LOGO_PATH) ? [{ filename: 'pulsar.png', path: LOGO_PATH, cid: 'pulsarlogo' }] : []);

function activationHtml(name, link) {
  return `
  <div style="margin:0;padding:0;background:#0a0a11;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a11;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#12121c;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
          <tr><td align="center" style="padding:32px 32px 8px;">
            <img src="cid:pulsarlogo" width="64" height="64" alt="Pulsar" style="display:block;border-radius:14px;" />
          </td></tr>
          <tr><td align="center" style="padding:0 32px;">
            <h1 style="margin:14px 0 6px;color:#fff;font-size:22px;">Bienvenue sur Pulsar</h1>
            <p style="margin:0;color:#9797ad;font-size:15px;">Bonjour ${name}, il ne reste qu'une étape.</p>
          </td></tr>
          <tr><td align="center" style="padding:26px 32px 8px;">
            <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 28px;border-radius:12px;">Activer mon compte</a>
          </td></tr>
          <tr><td align="center" style="padding:16px 32px 32px;">
            <p style="margin:0;color:#55556a;font-size:12px;">Ou copiez ce lien&nbsp;: <br/><span style="color:#8b5cf6;word-break:break-all;">${link}</span></p>
            <p style="margin:16px 0 0;color:#55556a;font-size:12px;">Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </div>`;
}

/** Envoie l'email d'activation. Ne fait rien si l'email n'est pas configuré. */
export async function sendActivationEmail(to, name, link) {
  if (!mailEnabled || !to) return false;
  await getTransport().sendMail({
    from: FROM,
    to,
    subject: 'Activez votre compte Pulsar',
    html: activationHtml(name || 'et bienvenue', link),
    attachments: logoAttachment(),
  });
  return true;
}
