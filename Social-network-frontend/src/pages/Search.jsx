import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        try {
          const response = await fetch(`http://localhost:3000/api/auth/search?q=${query}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success) setResults(data.users);
        } catch (err) {
          console.error("Search failed", err);
        }
      } else {
        setResults([]);
      }
    }, 300); // Wait 300ms before hitting the API

    return () => clearTimeout(delayDebounceFn);
  }, [query, token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/home')}
          className="text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-2 font-medium transition"
        >
          ← Back to Feed
        </button>

        <h1 className="text-3xl font-bold mb-6 text-gray-900">Search Users</h1>
        
        {/* Search Input */}
        <div className="relative mb-8">
          <input 
            type="text"
            placeholder="Type a username..."
            className="w-full p-4 pl-12 rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-900"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="absolute left-4 top-4 text-xl">🔍</span>
        </div>

        {/* Results List */}
        <div className="space-y-3">
          {results.length > 0 ? (
            results.map((u) => (
              <div 
                key={u.username}
                onClick={() => navigate(`/profile/${u.username}`)}
                className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition shadow-sm"
              >
                <div className="w-10 h-10 bg-gradient-to-tr from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-lg">👤</div>
                <span className="font-semibold text-gray-800">@{u.username}</span>
              </div>
            ))
          ) : query && (
            <p className="text-center text-gray-400 mt-10 font-medium">No users found for "{query}"</p>
          )}
        </div>
      </div>
    </div>
  );
}