import Modal from './Modal.jsx';

/** Confirmation stylée (remplace window.confirm). */
export default function ConfirmModal({ title = 'Confirmer', message, confirmLabel = 'Confirmer', danger, onConfirm, onClose }) {
  return (
    <Modal onClose={onClose}>
      <h2>{title}</h2>
      {message && <p className="modal-sub" style={{ marginBottom: 8 }}>{message}</p>}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button className={`btn ${danger ? 'btn-danger' : ''}`} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
