/** Avatar générique : image si avatar_url, sinon initiale sur fond coloré. */
export default function Avatar({ user, size = 40, status }) {
  const initial = (user?.display_name || user?.username || '?').charAt(0).toUpperCase();
  const style = {
    width: size,
    height: size,
    background: user?.avatar_color || '#5865F2',
    fontSize: size * 0.4,
  };
  return (
    <div className="avatar-wrap" style={{ width: size, height: size }}>
      <div className="avatar" style={style}>
        {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : initial}
      </div>
      {status && <span className={`status-dot ${status}`} />}
    </div>
  );
}
