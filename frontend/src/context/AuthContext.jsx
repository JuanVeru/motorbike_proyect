import { createContext, useContext, useState, useEffect } from 'react';
import { client } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Intentar restaurar sesión activa al arrancar la app
  useEffect(() => {
    const storedUser = localStorage.getItem('motoboss_user');
    const storedToken = localStorage.getItem('motoboss_token');
    
    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error al restaurar sesión:', error);
        localStorage.removeItem('motoboss_user');
        localStorage.removeItem('motoboss_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (correo, password) => {
    setLoading(true);
    // POST /api/auth/login
    const result = await client.post('/auth/login', { correo, password });

    if (result.success) {
      const { token, user: loggedUser } = result.data;
      
      // Persistir token y datos del usuario
      localStorage.setItem('motoboss_token', token);
      localStorage.setItem('motoboss_user', JSON.stringify(loggedUser));
      
      setUser(loggedUser);
      setLoading(false);
      return { success: true };
    } else {
      setLoading(false);
      return { success: false, error: result.error };
    }
  };

  const logout = () => {
    localStorage.removeItem('motoboss_token');
    localStorage.removeItem('motoboss_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
