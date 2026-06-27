import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile.jsx';
import Search from './pages/Search.jsx';

// 🚨 The Bouncer: If you don't have a token, you can't see the children components
const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Private Route */}
      <Route 
        path="/home" 
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } 
      />

      {/* Catch-all: If they type a random URL, send them to Home (which checks for a token) */}
      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route 
  path="/profile/:username" 
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/search" 
  element={
    <ProtectedRoute>
      <Search />
    </ProtectedRoute>
  } 
/>
    </Routes>
  );
}