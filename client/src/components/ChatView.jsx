import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { getSocket } from '../socket.js';
import Avatar from './Avatar.jsx';

function formatTime(ts) {
  const d = new Date(ts.replace(' ', 'T') + 'Z');
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function shouldGroup(prev, cur) {
  if (!prev || prev.user_id !== cur.user_id) return false;
  const gap = new Date(cur.created_at.replace(' ', 'T')) - new Date(prev.created_at.replace(' ', 'T'));
  return gap < 5 * 60 * 1000;
}

export default function ChatView({ channel, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState({}); // { userId: displayName }
  const scrollRef = useRef(null);
  const typingTimers = useRef({});
  const lastTypingSent = useRef(0);

  // Historique à chaque changement de salon
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    api(`/channels/${channel.id}/messages`).then(({ messages }) => {
      if (!cancelled) setMessages(messages);
    });
    return () => {
      cancelled = true;
    };
  }, [channel.id]);

  // Réception temps réel
  useEffect(() => {
    const socket = getSocket();
    const onNew = ({ channelId, message }) => {
      if (channelId !== channel.id) return;
      setMessages((prev) => [...prev, message]);
      // l'auteur qui poste n'est plus "en train d'écrire"
      setTyping((prev) => {
        const next = { ...prev };
        delete next[message.user_id];
        return next;
      });
    };
    const onTyping = ({ channelId, user }) => {
      if (channelId !== channel.id || user.id === currentUser.id) return;
      setTyping((prev) => ({ ...prev, [user.id]: user.display_name }));
      clearTimeout(typingTimers.current[user.id]);
      typingTimers.current[user.id] = setTimeout(() => {
        setTyping((prev) => {
          const next = { ...prev };
          delete next[user.id];
          return next;
        });
      }, 4000);
    };

    socket.on('message:new', onNew);
    socket.on('typing', onTyping);
    return () => {
      socket.off('message:new', onNew);
      socket.off('typing', onTyping);
    };
  }, [channel.id, currentUser.id]);

  // Auto-scroll vers le bas
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  function handleChange(e) {
    setInput(e.target.value);
    const now = Date.now();
    if (now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      getSocket().emit('typing', { channelId: channel.id });
    }
  }

  function send(e) {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    getSocket().emit('message:send', { channelId: channel.id, content });
    setInput('');
  }

  const typingNames = Object.values(typing);

  return (
    <div className="chat-area">
      <div className="messages" ref={scrollRef}>
        <div className="spacer-top" />
        <div className="msg-welcome">
          <h2># {channel.name}</h2>
          <p>C’est le début du salon <strong>#{channel.name}</strong>. Envoie le premier message&nbsp;!</p>
        </div>

        {messages.map((m, i) => {
          const grouped = shouldGroup(messages[i - 1], m);
          return (
            <div className={`message ${grouped ? 'grouped' : ''}`} key={m.id}>
              {grouped ? (
                <div className="gutter gutter-time">{formatTime(m.created_at)}</div>
              ) : (
                <Avatar user={m} size={40} />
              )}
              <div className="msg-body">
                {!grouped && (
                  <div className="msg-head">
                    <span className="msg-author">{m.display_name}</span>
                    <span className="msg-time">{formatTime(m.created_at)}</span>
                  </div>
                )}
                <div className="msg-text">{m.content}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="typing-line">
        {typingNames.length > 0 &&
          (typingNames.length === 1
            ? `${typingNames[0]} est en train d’écrire…`
            : `${typingNames.join(', ')} sont en train d’écrire…`)}
      </div>

      <form className="composer" onSubmit={send}>
        <div className="composer-inner">
          <input
            value={input}
            onChange={handleChange}
            placeholder={`Envoyer un message dans #${channel.name}`}
            maxLength={2000}
          />
        </div>
      </form>
    </div>
  );
}
