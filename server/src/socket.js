import db from './db.js';
import { verifyToken, publicUser } from './auth.js';

// Présence : userId -> Set(socketId)
const onlineUsers = new Map();
// Vocal : channelId -> Map(socketId -> { socketId, userId, user, muted, speaking })
const voiceRooms = new Map();

function roomMembers(channelId) {
  return Array.from(voiceRooms.get(channelId)?.values() || []);
}

function serverIdOfChannel(channelId) {
  return db.prepare('SELECT server_id FROM channels WHERE id = ?').get(channelId)?.server_id;
}

function emitVoiceState(io, channelId) {
  const serverId = serverIdOfChannel(channelId);
  if (!serverId) return;
  io.to('server:' + serverId).emit('voice:state', {
    channelId: Number(channelId),
    members: roomMembers(channelId),
  });
}

/** Retire un socket de son salon vocal courant et prévient ses pairs. */
function removeSocketFromVoice(io, socket) {
  const channelId = socket.data.voiceChannelId;
  if (!channelId) return;
  const room = voiceRooms.get(channelId);
  if (room?.has(socket.id)) {
    room.delete(socket.id);
    if (room.size === 0) voiceRooms.delete(channelId);
    io.to('voice:' + channelId).emit('voice:peer-left', { socketId: socket.id });
  }
  socket.leave('voice:' + channelId);
  socket.data.voiceChannelId = null;
  emitVoiceState(io, channelId);
}

function broadcastPresence(io) {
  io.emit('presence', { online: Array.from(onlineUsers.keys()) });
}

export function setupSocket(io) {
  // Authentification à la connexion du socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const payload = token ? verifyToken(token) : null;
    if (!payload) return next(new Error('unauthorized'));
    socket.userId = payload.id;
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const user = publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(userId));
    if (!user) return socket.disconnect(true);

    socket.data.voiceChannelId = null;

    // Présence
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Salon personnel (DM, notifications ciblées)
    socket.join('user:' + userId);

    // Rejoindre les rooms de tous ses serveurs + envoyer l'état vocal courant
    for (const { server_id } of db.prepare('SELECT server_id FROM server_members WHERE user_id = ?').all(userId)) {
      socket.join('server:' + server_id);
      for (const { id } of db.prepare("SELECT id FROM channels WHERE server_id = ? AND type = 'voice'").all(server_id)) {
        socket.emit('voice:state', { channelId: id, members: roomMembers(id) });
      }
    }

    broadcastPresence(io);

    // S'abonner à un serveur fraîchement créé/rejoint (sans reconnecter le socket)
    socket.on('server:subscribe', ({ serverId }) => {
      const member = db.prepare('SELECT 1 FROM server_members WHERE server_id = ? AND user_id = ?').get(serverId, userId);
      if (member) socket.join('server:' + serverId);
    });

    // ------------------------------------------------------------------
    // Chat de serveur
    // ------------------------------------------------------------------
    socket.on('message:send', ({ channelId, content }) => {
      if (!content || !content.trim()) return;
      const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId);
      if (!channel || channel.type !== 'text') return;
      if (!db.prepare('SELECT 1 FROM server_members WHERE server_id = ? AND user_id = ?').get(channel.server_id, userId)) return;

      const info = db.prepare('INSERT INTO messages (channel_id, user_id, content) VALUES (?, ?, ?)')
        .run(channelId, userId, content.trim().slice(0, 2000));
      const message = db.prepare(`
        SELECT m.id, m.content, m.created_at, m.user_id,
               u.username, u.display_name, u.avatar_color, u.avatar_url
        FROM messages m JOIN users u ON u.id = m.user_id WHERE m.id = ?
      `).get(info.lastInsertRowid);

      io.to('server:' + channel.server_id).emit('message:new', { channelId: Number(channelId), message });
    });

    socket.on('typing', ({ channelId }) => {
      const serverId = serverIdOfChannel(channelId);
      if (!serverId) return;
      socket.to('server:' + serverId).emit('typing', { channelId: Number(channelId), user });
    });

    // ------------------------------------------------------------------
    // Messages privés (DM)
    // ------------------------------------------------------------------
    socket.on('dm:send', ({ toUserId, content }) => {
      if (!content || !content.trim() || !toUserId) return;
      const recipient = db.prepare('SELECT id FROM users WHERE id = ?').get(toUserId);
      if (!recipient || recipient.id === userId) return;

      const info = db.prepare('INSERT INTO dm_messages (sender_id, recipient_id, content) VALUES (?, ?, ?)')
        .run(userId, recipient.id, content.trim().slice(0, 2000));
      const message = db.prepare(`
        SELECT d.id, d.content, d.created_at, d.sender_id, d.recipient_id,
               u.username, u.display_name, u.avatar_color, u.avatar_url
        FROM dm_messages d JOIN users u ON u.id = d.sender_id WHERE d.id = ?
      `).get(info.lastInsertRowid);

      io.to('user:' + recipient.id).emit('dm:new', { message });
      io.to('user:' + userId).emit('dm:new', { message });
    });

    socket.on('dm:typing', ({ toUserId }) => {
      if (toUserId) io.to('user:' + toUserId).emit('dm:typing', { fromUserId: userId, user });
    });

    // ------------------------------------------------------------------
    // Vocal (WebRTC — audio réel en maillage peer-to-peer)
    // ------------------------------------------------------------------
    socket.on('voice:join', ({ channelId }) => {
      const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId);
      if (!channel || channel.type !== 'voice') return;
      if (!db.prepare('SELECT 1 FROM server_members WHERE server_id = ? AND user_id = ?').get(channel.server_id, userId)) return;

      removeSocketFromVoice(io, socket); // quitter un éventuel salon précédent

      const existing = roomMembers(channelId); // pairs déjà présents (avant de m'ajouter)
      if (!voiceRooms.has(channelId)) voiceRooms.set(channelId, new Map());
      voiceRooms.get(channelId).set(socket.id, { socketId: socket.id, userId, user, muted: false, speaking: false });
      socket.data.voiceChannelId = channelId;
      socket.join('voice:' + channelId);

      // Le nouveau venu initie les connexions vers les pairs existants
      socket.emit('voice:peers', { channelId: Number(channelId), peers: existing });
      emitVoiceState(io, channelId);
    });

    // Relais de signalisation WebRTC (offre / réponse / candidats ICE) vers un pair précis
    socket.on('voice:signal', ({ targetSocketId, data }) => {
      if (!targetSocketId) return;
      io.to(targetSocketId).emit('voice:signal', { fromSocketId: socket.id, data });
    });

    socket.on('voice:mute', ({ muted }) => {
      const room = voiceRooms.get(socket.data.voiceChannelId);
      const me = room?.get(socket.id);
      if (me) {
        me.muted = !!muted;
        emitVoiceState(io, socket.data.voiceChannelId);
      }
    });

    socket.on('voice:speaking', ({ speaking }) => {
      const room = voiceRooms.get(socket.data.voiceChannelId);
      const me = room?.get(socket.id);
      if (me && me.speaking !== !!speaking) {
        me.speaking = !!speaking;
        emitVoiceState(io, socket.data.voiceChannelId);
      }
    });

    socket.on('voice:leave', () => removeSocketFromVoice(io, socket));

    // ------------------------------------------------------------------
    socket.on('disconnect', () => {
      removeSocketFromVoice(io, socket);
      const set = onlineUsers.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) onlineUsers.delete(userId);
      }
      broadcastPresence(io);
    });
  });
}
