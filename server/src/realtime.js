// Permet aux routes REST d'émettre des évènements temps réel via Socket.IO.
let io = null;

export function setIO(instance) {
  io = instance;
}

export function getIO() {
  return io;
}
