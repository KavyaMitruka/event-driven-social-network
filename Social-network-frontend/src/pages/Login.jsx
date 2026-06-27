import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Bring in our global auth tools
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Dynamically choose the route
    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();

      if (data.success) {
        if (isLoginMode) {
          // 🚨 LOGIN: We have a token! Save it globally and go to Home.
          login(data.token, username);
          navigate('/home'); 
        } else {
          // 🚨 REGISTER: Backend doesn't give a token yet. Switch to login mode.
          setIsLoginMode(true);
          setPassword(''); // Clear password for security
          alert("Account created successfully! Please log in to continue.");
        }
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Could not connect to the API Gateway. Is Docker running?');
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        
        {/* Header */}
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 italic tracking-tight">SocialApp</h2>
          <p className="mt-4 text-sm text-gray-600">
            {isLoginMode ? 'Welcome back! Please login.' : 'Join the network today.'}
          </p>
        </div>

        {/* The Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200 text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4 shadow-sm">
            <input
              type="text"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-gray-50"
              placeholder="Username (e.g., km_1)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-gray-50"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md"
          >
            {isLoginMode ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle Mode Button */}
        <div className="text-center mt-4 border-t pt-6 border-gray-100">
          <p className="text-sm text-gray-600">
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} 
              className="font-semibold text-blue-600 hover:text-blue-500"
            >
              {isLoginMode ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}