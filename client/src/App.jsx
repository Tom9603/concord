import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import AppLayout from './pages/AppLayout.jsx';
import UpdateManager from './components/UpdateManager.jsx';
import Notices from './components/Notices.jsx';
import { startUpdateWatch } from './update.js';

export default function App() {
  const { user, loading } = useAuth();

  // Surveille les mises à jour dès l'ouverture (web et desktop).
  useEffect(() => { startUpdateWatch(); }, []);

  // Retire le loader plein écran une fois l'authentification résolue.
  useEffect(() => { if (!loading) window.__hidePulsarSplash?.(); }, [loading]);

  // Pendant le chargement initial, le splash HTML reste affiché.
  if (loading) return null;

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/forgot" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
        {/* Accessible même connecté : le lien arrive par email, souvent sur un autre appareil. */}
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/*" element={user ? <AppLayout /> : <Navigate to="/login" replace />} />
      </Routes>
      <UpdateManager />
      <Notices />
    </>
  );
}
