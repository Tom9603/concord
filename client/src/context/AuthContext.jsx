import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, getToken } from '../api.js';
import { connectSocket, disconnectSocket } from '../socket.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reprise de session si un jeton est déjà stocké
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api('/auth/me')
      .then(({ user }) => {
        setUser(user);
        connectSocket();
      })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const { token, user } = await api('/auth/login', { method: 'POST', body: { username, password } });
    setToken(token);
    setUser(user);
    connectSocket();
  }

  async function register(username, password, display_name) {
    const { token, user } = await api('/auth/register', {
      method: 'POST',
      body: { username, password, display_name },
    });
    setToken(token);
    setUser(user);
    connectSocket();
  }

  function logout() {
    setToken(null);
    setUser(null);
    disconnectSocket();
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
