import { createContext, useState, useEffect, useContext } from 'react';

// 1. Create the Context
const AuthContext = createContext();

// 2. Create the Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  // When a user successfully logs in, we save their info to LocalStorage so they survive page refreshes
  const login = (newToken, username) => {
    setToken(newToken);
    setUser(username);
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', username);
  };

  // When they log out, we wipe the data
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };

  // Check memory on initial load
  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername && token) {
      setUser(savedUsername);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Create a custom hook so any file can easily say: const { user, token } = useAuth();
export const useAuth = () => useContext(AuthContext);