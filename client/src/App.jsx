import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AppLayout from './pages/AppLayout.jsx';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Chargement…</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/*" element={user ? <AppLayout /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
