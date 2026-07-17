import { useEffect, useRef, useState } from 'react';
import { notify } from '../notice.js';
import { aiRewrite } from '../ai.js';
import { sendFiles, filesFromPaste } from '../attachments.js';
import { loadDraft, saveDraft, clearDraft } from '../drafts.js';
import Icon from './Icon.jsx';
import Avatar from './Avatar.jsx';
import GifPicker from './GifPicker.jsx';
import EmojiPicker from './EmojiPicker.jsx';
import VoiceRecorder from './VoiceRecorder.jsx';
import QuickMessages from './QuickMessages.jsx';
import ScheduleModal from './ScheduleModal.jsx';
import AiConfirmModal from './AiConfirmModal.jsx';

/**
 * Zone de saisie partagée (salons + DM).
 * - onSendText(text)                   : message texte
 * - onSendAttachment(url, text?, name?) : image, GIF, vocal ou fichier
 * - onTyping()                          : signale la frappe
 * - replyingTo / onClearReply           : réponse à un message
 * - draftKey                            : identifie la conversation (brouillon conservé)
 */
export default function Composer({ placeholder, onSendText, onSendAttachment, onTyping, replyingTo, onClearReply, onWatch, onPoll, mentionables, aiEnabled, scheduleScope, draftKey }) {
  const [input, setInput] = useState(() => loadDraft(draftKey));
  const [uploading, setUploading] = useState(false);
  const [panel, setPanel] = useState(null); // 'gif' | 'emoji' | null
  const [mention, setMention] = useState(null); // { items, index } — suggestions @ (serveur uniquement)
  const [rewrite, setRewrite] = useState(null); // { loading } | { text } — proposition de reformulation IA
  const [scheduling, setScheduling] = useState(false); // fenêtre "programmer un message" ouverte
  const [aiConfirm, setAiConfirm] = useState(false); // confirmation avant de consommer une action IA
  const inputRef = useRef(null);

  // Toute modification passe par ici : le brouillon suit la saisie.
  function updateInput(next) {
    setInput(next);
    saveDraft(draftKey, next);
  }

  // Changement de conversation : on récupère le brouillon de la nouvelle.
  useEffect(() => {
    setInput(loadDraft(draftKey));
    setMention(null);
  }, [draftKey]);

  async function doRewrite() {
    const t = input.trim();
    if (!t || rewrite?.loading) return;
    setRewrite({ loading: true });
    try {
      const { rewrite: text } = await aiRewrite(t);
      setRewrite({ text });
    } catch (e) { setRewrite(null); notify(e.message); }
  }

  function afterSend() {
    setInput('');
    clearDraft(draftKey);
    setMention(null);
    onClearReply?.();
  }

  // Autocomplétion des mentions : détecte « @requête » juste avant le curseur (serveurs seulement).
  function refreshMention(value, caret) {
    if (!mentionables || mentionables.length === 0) { setMention(null); return; }
    const before = value.slice(0, caret);
    const m = /(^|\s)@([\w.\-]*)$/.exec(before);
    if (!m) { setMention(null); return; }
    const q = m[2].toLowerCase();
    const items = mentionables
      .filter((u) => (u.display_name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q))
      .slice(0, 8);
    setMention(items.length ? { items, index: 0 } : null);
  }

  function applyMention(u) {
    const el = inputRef.current;
    const caret = el ? el.selectionStart : input.length;
    const before = input.slice(0, caret).replace(/@[\w.\-]*$/, `@${u.username} `);
    const after = input.slice(caret);
    const next = before + after;
    updateInput(next);
    setMention(null);
    requestAnimationFrame(() => { if (el) { el.focus(); el.selectionStart = el.selectionEnd = before.length; } });
  }

  function submit(e) {
    e.preventDefault();
    const t = input.trim();
    if (!t) return;
    onSendText(t);
    afterSend();
  }

  function change(e) {
    updateInput(e.target.value);
    refreshMention(e.target.value, e.target.selectionStart);
    onTyping?.();
  }

  function onKeyDown(e) {
    if (!mention) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setMention((m) => ({ ...m, index: (m.index + 1) % m.items.length })); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setMention((m) => ({ ...m, index: (m.index - 1 + m.items.length) % m.items.length })); }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); applyMention(mention.items[mention.index]); }
    else if (e.key === 'Escape') { e.preventDefault(); setMention(null); }
  }

  /** Envoi commun au bouton « Joindre » et au collage. */
  async function upload(files) {
    setUploading(true);
    try {
      if (await sendFiles(files, onSendAttachment, input.trim())) afterSend();
    } finally {
      setUploading(false);
    }
  }

  function onPickFile(e) {
    const files = e.target.files;
    e.target.value = '';
    if (files?.length) upload(files);
  }

  // Coller une capture d'écran ou une image copiée dans un navigateur.
  function onPaste(e) {
    const files = filesFromPaste(e);
    if (!files.length) return; // collage de texte : comportement normal
    e.preventDefault();
    upload(files);
  }

  return (
    <div className="composer">
      {scheduling && scheduleScope && (
        <ScheduleModal
          scope={scheduleScope}
          draft={input}
          onScheduled={() => { setScheduling(false); afterSend(); notify('Message programmé.', 'success'); }}
          onClose={() => setScheduling(false)}
        />
      )}
      {panel === 'gif' && (
        <GifPicker onSelect={(url) => { onSendAttachment(url, ''); afterSend(); setPanel(null); }} onClose={() => setPanel(null)} />
      )}
      {panel === 'emoji' && (
        <EmojiPicker onPick={(em) => { updateInput(input + em); inputRef.current?.focus(); }} onClose={() => setPanel(null)} />
      )}
      {panel === 'quick' && (
        <QuickMessages onSelect={(t) => { onSendText(t); afterSend(); }} onClose={() => setPanel(null)} />
      )}
      {aiConfirm && (
        <AiConfirmModal
          title="Reformuler mon message"
          description="L’assistant va réécrire votre message plus clairement, sans fautes. Vous pourrez garder l’original si la proposition ne vous convient pas."
          onConfirm={() => { setAiConfirm(false); doRewrite(); }}
          onClose={() => setAiConfirm(false)}
        />
      )}

      {panel === 'more' && (
        <div className="composer-more">
          <div className="composer-more-title">Actions</div>
          <div className="composer-more-grid">
            <label className="cm-item" title="Joindre un fichier">
              <Icon name="paperclip" /><span>Joindre un fichier</span>
              <input type="file" hidden onChange={(e) => { setPanel(null); onPickFile(e); }} />
            </label>
            <button type="button" className="cm-item" onClick={() => setPanel('quick')}>
              <Icon name="bolt" /><span>Messages express</span>
            </button>
            {onWatch && (
              <button type="button" className="cm-item" onClick={() => { setPanel(null); onWatch(); }}>
                <Icon name="tv" /><span>Regarder ensemble</span>
              </button>
            )}
            {onPoll && (
              <button type="button" className="cm-item" onClick={() => { setPanel(null); onPoll(); }}>
                <Icon name="chart-simple" /><span>Créer un sondage</span>
              </button>
            )}
            {scheduleScope && (
              <button type="button" className="cm-item" onClick={() => { setPanel(null); setScheduling(true); }}>
                <Icon name="clock" /><span>Programmer l’envoi</span>
              </button>
            )}
            {aiEnabled && (
              <button type="button" className="cm-item cm-ai" disabled={!input.trim() || rewrite?.loading} title={input.trim() ? '' : 'Écrivez d’abord un message'}
                onClick={() => { setPanel(null); setAiConfirm(true); }}>
                <Icon name="wand-magic-sparkles" /><span>Reformuler (assistant)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {mention && (
        <div className="mention-pop">
          <div className="mention-pop-title">Mentionner…</div>
          {mention.items.map((u, i) => (
            <button type="button" key={u.id} className={`mention-item ${i === mention.index ? 'active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); applyMention(u); }} onMouseEnter={() => setMention((m) => ({ ...m, index: i }))}>
              <Avatar user={u} size={24} />
              <span className="mi-name">{u.display_name}</span>
              <span className="mi-user">@{u.username}</span>
            </button>
          ))}
        </div>
      )}

      {rewrite?.text && (
        <div className="ai-rewrite">
          <div className="ai-rewrite-head"><span><Icon name="wand-magic-sparkles" /> Proposition de l'assistant</span><button title="Fermer" onClick={() => setRewrite(null)}><Icon name="xmark" /></button></div>
          <div className="ai-rewrite-text">{rewrite.text}</div>
          <div className="ai-rewrite-actions">
            <button className="btn btn-ghost" onClick={() => setRewrite(null)}>Garder l'original</button>
            <button className="btn" onClick={() => { updateInput(rewrite.text); setRewrite(null); inputRef.current?.focus(); }}>Utiliser</button>
          </div>
        </div>
      )}

      {replyingTo && (
        <div className="reply-bar">
          <span>Réponse à <strong>{replyingTo.display_name}</strong></span>
          <button type="button" title="Annuler" onClick={onClearReply}><Icon name="xmark" /></button>
        </div>
      )}

      <form onSubmit={submit}>
        <div className="composer-inner">
          <input
            ref={inputRef}
            value={input}
            onChange={change}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onBlur={() => setTimeout(() => setMention(null), 120)}
            placeholder={uploading ? 'Envoi…' : placeholder}
            maxLength={2000}
            disabled={uploading}
          />
          {/* Accès rapide à droite : le reste des actions est dans le panneau « Plus ». */}
          <button type="button" className={`composer-attach ${panel === 'more' ? 'active' : ''}`} title="Plus d’actions" onClick={() => setPanel((p) => (p === 'more' ? null : 'more'))}><Icon name="chevron-up" /></button>
          <button type="button" className={`composer-attach gif-btn ${panel === 'gif' ? 'active' : ''}`} title="GIF" onClick={() => setPanel((p) => (p === 'gif' ? null : 'gif'))}>GIF</button>
          <button type="button" className={`composer-attach ${panel === 'emoji' ? 'active' : ''}`} title="Emoji" onClick={() => setPanel((p) => (p === 'emoji' ? null : 'emoji'))}><Icon name="face-smile" /></button>
          <VoiceRecorder onSend={(url) => { onSendAttachment(url, ''); afterSend(); }} disabled={uploading} />
        </div>
      </form>
    </div>
  );
}
