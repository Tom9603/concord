import { useEffect, useRef } from 'react';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import RemoteAudio from './RemoteAudio.jsx';

function VideoEl({ stream, muted, className }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream || null; }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
}

const hasVideo = (s) => !!s && s.getVideoTracks && s.getVideoTracks().some((t) => t.readyState === 'live');

/** Affiche l'état d'un appel privé (entrant / sortant / en cours), l'audio, la caméra et le partage d'écran. */
export default function CallOverlay({ call }) {
  const { status, peer, muted, remoteStream, screenOn, localScreenStream,
    videoOn, localVideoStream, remoteVideoKind = 'none',
    remoteVolume = 1, setRemoteVolume, accept, decline, cancel, hangup, toggleMute, toggleScreen, toggleCamera } = call;
  if (status === 'idle' || !peer) return null;

  const remoteHasVideo = hasVideo(remoteStream);
  // Ce que montre la grande zone : en priorité la vidéo du correspondant, sinon
  // votre propre partage (écran ou caméra) pour vous voir aussi.
  const showPanel = status === 'connected' && (remoteHasVideo || (screenOn && localScreenStream) || (videoOn && localVideoStream));
  const main = remoteHasVideo
    ? { stream: remoteStream, muted: false, label: remoteVideoKind === 'camera' ? `Caméra de ${peer.display_name}` : `Écran de ${peer.display_name}`, icon: remoteVideoKind === 'camera' ? 'video' : 'display', isRemoteScreen: remoteVideoKind !== 'camera' }
    : (screenOn && localScreenStream)
      ? { stream: localScreenStream, muted: true, label: 'Vous partagez votre écran', icon: 'display', isRemoteScreen: false }
      : { stream: localVideoStream, muted: true, label: 'Votre caméra', icon: 'video', isRemoteScreen: false };
  // Vignette de sa propre caméra, sauf si elle occupe déjà la grande zone.
  const showSelfPip = videoOn && localVideoStream && main.stream !== localVideoStream;

  return (
    <>
      {remoteStream && <RemoteAudio stream={remoteStream} volume={remoteVolume} />}

      {/* Appel entrant et appel sortant : une vraie fenêtre au centre de
          l'écran, impossible à manquer, plutôt qu'une pastille en haut. */}
      {(status === 'incoming' || status === 'calling') && (
        <div className="call-modal-backdrop">
          <div className={`call-modal ${status}`}>
            <div className="call-ring">
              <Avatar user={peer} size={104} />
              <span className="call-ring-pulse" aria-hidden="true" />
            </div>
            <div className="call-name">{peer.display_name}</div>
            <div className="call-handle">@{peer.username}</div>
            <div className="call-sub">
              <span className="call-sub-dot" />
              {status === 'incoming' ? 'Appel entrant' : 'Appel en cours'}
              <span className="call-dots"><i /><i /><i /></span>
            </div>
            <div className="call-hint">
              {status === 'incoming'
                ? 'Répondez pour démarrer la conversation vocale.'
                : 'Le téléphone sonne chez votre correspondant. Vous pouvez raccrocher à tout moment.'}
            </div>
            <div className="call-actions">
              {status === 'incoming' ? (
                <>
                  <button className="call-btn decline" onClick={decline}><Icon name="phone-slash" /> Refuser</button>
                  <button className="call-btn accept" onClick={accept}><Icon name="phone" /> Accepter</button>
                </>
              ) : (
                <button className="call-btn decline" onClick={cancel}><Icon name="phone-slash" /> Annuler l’appel</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showPanel && (
        <div className="call-video">
          <div className="call-video-tag">
            <Icon name={main.icon} /> {main.label}
          </div>
          <VideoEl stream={main.stream} muted={main.muted} />
          {showSelfPip && (
            <div className="call-self-pip"><VideoEl stream={localVideoStream} muted /></div>
          )}
          {main.isRemoteScreen && (
            <div className="call-video-vol" title="Volume du partage (chez vous)">
              <Icon name={remoteVolume === 0 ? 'volume-xmark' : 'volume-high'} />
              <input type="range" min="0" max="1" step="0.05" value={remoteVolume} onChange={(e) => setRemoteVolume?.(Number(e.target.value))} />
            </div>
          )}
        </div>
      )}

      {status === 'connected' && (
        <div className="call-bar connected">
          <span className="call-live-dot" /> En appel avec <strong>{peer.display_name}</strong>
          <button className="call-icon" title={muted ? 'Réactiver le micro' : 'Couper le micro'} onClick={toggleMute}>
            <Icon name={muted ? 'microphone-slash' : 'microphone'} />
          </button>
          <button className={`call-icon ${videoOn ? 'on' : ''}`} title={videoOn ? 'Couper la caméra' : 'Activer la caméra'} onClick={toggleCamera}>
            <Icon name={videoOn ? 'video' : 'video-slash'} />
          </button>
          <button className={`call-icon ${screenOn ? 'on' : ''}`} title={screenOn ? 'Arrêter le partage d’écran' : 'Partager l’écran'} onClick={toggleScreen}>
            <Icon name="display" />
          </button>
          <button className="call-btn decline small" onClick={hangup}>Raccrocher</button>
        </div>
      )}
    </>
  );
}
