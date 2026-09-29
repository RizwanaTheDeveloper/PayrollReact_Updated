
import { createContext, useContext, useState } from 'react';

import api from '../api';

const Ctx = createContext();

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');

      if (!storedUser || storedUser === 'undefined') {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (error) {
      console.error('Invalid stored user data:', error);

      // Remove corrupted data so it doesn't crash the app again
      localStorage.removeItem('user');

      return null;
    }
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', {
      email,
      password,
    });

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    setUser(data.user);

    return data.user;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}
