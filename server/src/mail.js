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

// Identité de marque jointe en ligne (CID) : les images distantes sont souvent
// bloquées par les messageries, une pièce jointe interne s'affiche toujours.
const ASSETS = path.join(__dirname, '..', '..', 'client', 'src', 'assets');
const BRAND = [
  { filename: 'pulsar.png', file: 'pulsar-logo.png', cid: 'pulsarlogo' },
  { filename: 'pulsar-nom.png', file: 'pulsar-wordmark.png', cid: 'pulsarword' },
];
const brandAttachments = () =>
  BRAND.map((b) => ({ ...b, path: path.join(ASSETS, b.file) })).filter((b) => fs.existsSync(b.path));

/** Durée de validité du code, en minutes (aligné sur le serveur). */
export const CODE_TTL_MIN = 15;

function codeHtml(name, code) {
  const digits = code
    .split('')
    .map(
      (d) =>
        `<td style="padding:0 5px;"><div style="width:46px;height:58px;line-height:58px;background:#1b1b28;border:1px solid rgba(139,92,246,0.35);border-radius:12px;color:#fff;font-size:28px;font-weight:700;text-align:center;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${d}</div></td>`,
    )
    .join('');
  return `
  <div style="margin:0;padding:0;background:#0a0a11;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a11;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#12121c;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
          <tr><td align="center" style="padding:32px 32px 0;">
            <img src="cid:pulsarlogo" width="56" height="56" alt="" style="display:block;border-radius:13px;" />
            <img src="cid:pulsarword" width="132" alt="Pulsar" style="display:block;margin:14px auto 0;" />
          </td></tr>
          <tr><td align="center" style="padding:22px 32px 0;">
            <h1 style="margin:0 0 8px;color:#fff;font-size:21px;font-weight:600;">Votre code de confirmation</h1>
            <p style="margin:0;color:#9797ad;font-size:15px;line-height:1.55;">
              Bonjour ${name}, vous venez de créer un compte sur Pulsar, la messagerie de votre équipe.
              Saisissez le code ci-dessous dans l'application pour confirmer votre adresse et terminer votre inscription.
            </p>
          </td></tr>
          <tr><td align="center" style="padding:26px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>${digits}</tr></table>
          </td></tr>
          <tr><td align="center" style="padding:18px 32px 0;">
            <p style="margin:0;color:#55556a;font-size:13px;">Ce code est valable ${CODE_TTL_MIN} minutes et ne sert qu'une fois.</p>
          </td></tr>
          <tr><td style="padding:24px 32px 32px;">
            <div style="height:1px;background:rgba(255,255,255,0.08);margin-bottom:18px;"></div>
            <p style="margin:0;color:#55556a;font-size:12px;line-height:1.6;">
              Vous recevez cet email parce qu'une inscription à Pulsar a été faite avec cette adresse.
              Si ce n'est pas vous, ignorez ce message : sans ce code, aucun compte ne sera activé.
              Ne communiquez ce code à personne, l'équipe Pulsar ne vous le demandera jamais.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </div>`;
}

/** Version texte (messageries sans HTML, et meilleure délivrabilité). */
const codeText = (name, code) =>
  `Bonjour ${name},\n\nVous venez de créer un compte sur Pulsar, la messagerie de votre équipe.\n\nVotre code de confirmation : ${code}\n\nSaisissez-le dans l'application pour terminer votre inscription. Il est valable ${CODE_TTL_MIN} minutes et ne sert qu'une fois.\n\nSi vous n'êtes pas à l'origine de cette inscription, ignorez ce message : sans ce code, aucun compte ne sera activé. Ne communiquez ce code à personne.\n\nPulsar`;

/** Coquille commune à tous les emails Pulsar (logo, nom de la marque, pied de page). */
function shell(title, intro, body, footer) {
  return `
  <div style="margin:0;padding:0;background:#0a0a11;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a11;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#12121c;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
          <tr><td align="center" style="padding:32px 32px 0;">
            <img src="cid:pulsarlogo" width="56" height="56" alt="" style="display:block;border-radius:13px;" />
            <img src="cid:pulsarword" width="132" alt="Pulsar" style="display:block;margin:14px auto 0;" />
          </td></tr>
          <tr><td align="center" style="padding:22px 32px 0;">
            <h1 style="margin:0 0 8px;color:#fff;font-size:21px;font-weight:600;">${title}</h1>
            <p style="margin:0;color:#9797ad;font-size:15px;line-height:1.55;">${intro}</p>
          </td></tr>
          ${body}
          <tr><td style="padding:24px 32px 32px;">
            <div style="height:1px;background:rgba(255,255,255,0.08);margin-bottom:18px;"></div>
            <p style="margin:0;color:#55556a;font-size:12px;line-height:1.6;">${footer}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </div>`;
}

/** Envoi générique (identité de marque jointe). */
async function send(to, subject, text, html) {
  if (!mailEnabled || !to) return false;
  await getTransport().sendMail({ from: FROM, to, subject, text, html, attachments: brandAttachments() });
  return true;
}

/** Durée de validité du lien de réinitialisation, en minutes. */
export const RESET_TTL_MIN = 60;

/** Lien « mot de passe oublié ». */
export function sendResetEmail(to, name, link) {
  const body = `
    <tr><td align="center" style="padding:26px 32px 0;">
      <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 28px;border-radius:12px;">Choisir un nouveau mot de passe</a>
    </td></tr>
    <tr><td align="center" style="padding:18px 32px 0;">
      <p style="margin:0;color:#55556a;font-size:12px;">Ou copiez ce lien&nbsp;:<br/><span style="color:#8b5cf6;word-break:break-all;">${link}</span></p>
      <p style="margin:12px 0 0;color:#55556a;font-size:13px;">Ce lien est valable ${RESET_TTL_MIN} minutes et ne sert qu'une fois.</p>
    </td></tr>`;
  return send(
    to,
    'Réinitialisez votre mot de passe Pulsar',
    `Bonjour ${name},\n\nVous avez demandé à changer le mot de passe de votre compte Pulsar.\n\nOuvrez ce lien pour en choisir un nouveau : ${link}\n\nIl est valable ${RESET_TTL_MIN} minutes et ne sert qu'une fois.\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe actuel reste valable.\n\nPulsar`,
    shell(
      'Réinitialisez votre mot de passe',
      `Bonjour ${name}, vous avez demandé à changer le mot de passe de votre compte Pulsar.`,
      body,
      "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe actuel reste valable, et ce lien expirera tout seul.",
    ),
  );
}

/** Notification après un changement de mot de passe réussi (sécurité). */
export function sendPasswordChangedEmail(to, name) {
  const when = new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' });
  const body = `
    <tr><td align="center" style="padding:24px 32px 0;">
      <div style="background:#1b1b28;border:1px solid rgba(34,197,94,0.3);border-radius:12px;padding:16px 20px;">
        <p style="margin:0;color:#22c55e;font-size:15px;font-weight:600;">Mot de passe modifié</p>
        <p style="margin:6px 0 0;color:#9797ad;font-size:13px;">Le ${when}</p>
      </div>
      <p style="margin:16px 0 0;color:#9797ad;font-size:13px;line-height:1.6;">Par précaution, toutes vos sessions ouvertes ont été fermées. Reconnectez-vous avec votre nouveau mot de passe.</p>
    </td></tr>`;
  return send(
    to,
    'Votre mot de passe Pulsar a été modifié',
    `Bonjour ${name},\n\nLe mot de passe de votre compte Pulsar a été modifié le ${when}.\n\nPar précaution, toutes vos sessions ouvertes ont été fermées.\n\nSi vous n'êtes pas à l'origine de ce changement, votre compte est peut-être compromis : demandez immédiatement un nouveau mot de passe depuis la page de connexion.\n\nPulsar`,
    shell(
      'Votre mot de passe a été modifié',
      `Bonjour ${name}, nous vous confirmons que le mot de passe de votre compte Pulsar vient d'être changé.`,
      body,
      "Vous recevez cet email pour votre sécurité. Si vous n'êtes pas à l'origine de ce changement, votre compte est peut-être compromis : demandez immédiatement un nouveau mot de passe depuis la page de connexion.",
    ),
  );
}

/** Envoie le code de confirmation. Ne fait rien si l'email n'est pas configuré. */
export async function sendActivationCode(to, name, code) {
  if (!mailEnabled || !to) return false;
  await getTransport().sendMail({
    from: FROM,
    to,
    subject: `${code} est votre code de confirmation Pulsar`,
    text: codeText(name || 'et bienvenue', code),
    html: codeHtml(name || 'et bienvenue', code),
    attachments: brandAttachments(),
  });
  return true;
}
