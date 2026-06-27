import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { username } = useParams(); 
  const navigate = useNavigate(); 
  const { token, user: currentUser } = useAuth();
  
  const [loading, setLoading] = useState(false); 
  const [status, setStatus] = useState({ type: '', message: '' });

  // 🚨 NEW: State for stats and the popup modal
  const [stats, setStats] = useState({ followers: [], following: [] });
  const [activeModal, setActiveModal] = useState(null); // 'followers' | 'following' | null

  // 🚨 NEW: Fetch stats when profile loads
  const fetchStats = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/auth/stats/${username}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats({ followers: data.followers, following: data.following });
      }
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  // Re-run the fetch if the URL username changes
  useEffect(() => {
    fetchStats();
  }, [username]);

  const handleFollow = async () => {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('http://localhost:3000/api/auth/follow', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ following_username: username }) 
      });

      const data = await response.json();
      
      if (data.success) {
        setStatus({ type: 'success', message: `You are now following @${username}!` });
        fetchStats(); // 🚨 Refresh stats instantly to update the counter
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to follow.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: "Server is unreachable." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 relative">
      
      {/* 🔙 Back to Home Button */}
      <div className="w-full max-w-md mb-6">
        <button 
          onClick={() => navigate('/home')}
          className="text-gray-500 hover:text-gray-900 flex items-center gap-2 font-medium transition"
        >
          ← Back to Feed
        </button>
      </div>

    <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
        
        {/* 🚨 NEW: Dynamic DiceBear Avatar */}
        <div className="w-28 h-28 mx-auto mb-6 p-1 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 shadow-sm">
          <img 
            src={`https://api.dicebear.com/7.x/identicon/svg?seed=${username}`} 
            alt="avatar" 
            className="w-full h-full rounded-full bg-white"
          />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-1">@{username}</h2>
        <p className="text-gray-400 text-sm mb-8 font-medium">IIIT ALLAHABAD STUDENT</p>
        
        {/* 🚨 NEW: Stats Bar */}
        <div className="flex justify-center gap-8 mb-8 border-y py-4">
          <div className="cursor-pointer hover:opacity-70 transition" onClick={() => setActiveModal('followers')}>
            <p className="text-xl font-bold text-gray-900">{stats.followers.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Followers</p>
          </div>
          <div className="cursor-pointer hover:opacity-70 transition" onClick={() => setActiveModal('following')}>
            <p className="text-xl font-bold text-gray-900">{stats.following.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Following</p>
          </div>
        </div>

        {/* Action Button */}
        {currentUser !== username ? (
          <button 
            onClick={handleFollow}
            disabled={loading || status.type === 'success' || stats.followers.includes(currentUser)}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${
              stats.followers.includes(currentUser) || status.type === 'success' 
                ? 'bg-gray-200 text-gray-600 cursor-default shadow-none' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50'
            }`}
          >
            {loading ? 'Processing...' : (stats.followers.includes(currentUser) || status.type === 'success') ? 'Following ✓' : 'Follow User'}
          </button>
        ) : (
          <div className="bg-gray-100 py-3 rounded-xl text-gray-500 font-semibold italic">
            This is your profile
          </div>
        )}

        {/* Feedback Message */}
        {status.message && (
          <div className={`mt-6 p-3 rounded-lg text-sm font-medium ${
            status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {status.message}
          </div>
        )}
      </div>

      {/* 🚨 NEW: The Pop-up Modal for lists */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            
            <div className="border-b p-4 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg capitalize">{activeModal}</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-800 font-bold text-2xl">&times;</button>
            </div>
            
            <div className="max-h-64 overflow-y-auto p-4 space-y-3">
              {stats[activeModal].length === 0 ? (
                <p className="text-center text-gray-500 py-4 font-medium">No {activeModal} yet.</p>
              ) : (
                stats[activeModal].map((user) => (
                  <div 
                    key={user} 
                    onClick={() => { setActiveModal(null); navigate(`/profile/${user}`); }} 
                    className="flex items-center gap-3 p-3 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg cursor-pointer transition"
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm">👤</div>
                    <span className="font-semibold text-gray-800">@{user}</span>
                  </div>
                ))
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}