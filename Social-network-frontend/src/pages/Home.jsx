import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext' 
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const [feed, setFeed] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null); // 🚨 Tracks the attached file
  const [newPostContent, setNewPostContent] = useState(''); 
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { token, user, logout } = useAuth(); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/feed', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}` 
          }
        });
        
        const result = await response.json();
        if (result.success) setFeed(result.data); 
      } catch (error) {
        console.error("Failed to fetch feed:", error);
      }
    };

    if (token) fetchFeed(); 
  }, [refreshTrigger, token]);


  // 🚨 UPDATED: Now uses FormData to send files + text
  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedImage) return; 

    // When sending files, we MUST use FormData instead of JSON
    const formData = new FormData();
    // If they only upload an image without text, send a blank space to satisfy the database
    formData.append('content', newPostContent.trim() ? newPostContent : ' '); 
    
    if (selectedImage) {
      formData.append('image', selectedImage); 
    }

    try {
      const response = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` 
          // 🚨 IMPORTANT: Do NOT manually set 'Content-Type' when using FormData!
          // The browser automatically sets it to 'multipart/form-data' with the correct boundary.
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setNewPostContent(''); 
        setSelectedImage(null); // Clear the attached image
        setRefreshTrigger(prev => prev + 1); 
      }
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans">
      
      {/* SIDEBAR */}
      <nav className="hidden md:flex flex-col w-64 border-r border-gray-800 bg-gray-900 px-4 py-8">
        <h1 className="text-2xl font-bold mb-10 italic pl-2 text-white">SocialApp</h1>
        
        {/* Navigation Links */}
        <ul className="space-y-4">
          <li 
            className="font-semibold text-lg p-2 hover:bg-gray-800 rounded-md cursor-pointer transition text-gray-300"
            onClick={() => {
              navigate('/home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setRefreshTrigger(prev => prev + 1); 
            }}
          >
            🏠 Home
          </li>
          <li 
            className="font-semibold text-lg p-2 hover:bg-gray-800 rounded-md cursor-pointer transition text-gray-300"
            onClick={() => navigate('/search')}
          >
            🔍 Search
          </li>
          <li 
            className="font-semibold text-lg p-2 hover:bg-gray-800 rounded-md cursor-pointer transition text-gray-300"
            onClick={() => navigate(`/profile/${user}`)} 
          >
            👤 Profile
          </li>
        </ul>

        {/* User Info & Logout */}
        <div className="mt-auto p-2 text-sm text-gray-400 font-medium border-t border-gray-800 pt-4">
          Logged in as: <span className="text-blue-400 font-bold">{user}</span> 
          <button 
            onClick={handleLogout} 
            className="block mt-3 text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-wider transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* MAIN FEED AREA */}
      <main className="flex-1 overflow-y-auto flex justify-center w-full">
        <div className="w-full max-w-lg py-10 px-4 space-y-6">
          
          {/* 🚨 UPDATED: Create Post Input Box with Photo Upload */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3 items-start shadow-sm">
            <div className="flex w-full gap-4 items-center">
              <img 
                src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user}`} 
                alt="avatar" 
                className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex-shrink-0"
              />
              <input 
                type="text" 
                placeholder="What's on your mind?" 
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePost()}
                className="flex-1 bg-gray-800 text-gray-100 placeholder-gray-500 rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700"
              />
            </div>
            
            {/* Image Upload Row */}
            <div className="flex w-full justify-between items-center pl-14 pt-1">
              <div className="flex items-center gap-4">
                <label className="cursor-pointer text-gray-400 hover:text-blue-400 transition flex items-center gap-1 font-medium">
                  <span>📎 Add Photo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => setSelectedImage(e.target.files[0])}
                  />
                </label>
                {selectedImage && <span className="text-xs text-green-400 truncate max-w-[120px]">{selectedImage.name}</span>}
              </div>

              <button 
                onClick={handleCreatePost}
                className="bg-blue-600 text-white px-6 py-1.5 rounded-full font-semibold hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 transition"
                disabled={!newPostContent.trim() && !selectedImage}
              >
                Post
              </button>
            </div>
          </div>

          {/* Feed Mapping & Anti-Doomscroll Logic */}
          {feed.length === 0 ? (
            <div className="bg-gray-900 border border-blue-900/50 rounded-xl p-8 text-center shadow-sm">
              <h2 className="text-xl font-bold text-gray-100 mb-2">Welcome to SocialApp! 🚀</h2>
              <p className="text-gray-400 mb-4">Your feed is currently empty because you aren't following anyone yet.</p>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <p className="text-sm font-semibold text-blue-400">Suggestions to follow:</p>
                <ul className="mt-2 space-y-2">
                  <li className="text-blue-400 hover:underline cursor-pointer" onClick={() => navigate('/profile/km_1')}>@km_1</li>
                  <li className="text-blue-400 hover:underline cursor-pointer" onClick={() => navigate('/profile/km_2')}>@km_2</li>
                </ul>
              </div>
            </div>
          ) : (
            feed.map((post, index) => {
              
              let alert = null;
              if (index === 2) {
                alert = <SystemAlertCard key={`alert-1`} message="You've read a few posts! Remember to blink and check your posture." />;
              } else if (index === 9) {
                alert = <SystemAlertCard key={`alert-2`} message="You're scrolling deep! Take a 5-minute screen break." />;
              }

              return (
                <div key={post.postId || index} className="space-y-6">
                  <PostCard post={post} />
                  {alert}
                </div>
              )
            })
          )}

        </div>
      </main>
    </div>
  )
}

function PostCard({ post }) {
  const navigate = useNavigate();
  const { token, user } = useAuth(); 
  
const [isLiked, setIsLiked] = useState(post.has_liked || false);
  const [likeAnimation, setLikeAnimation] = useState('');
  
  // 🚨 NEW: State for tracking the counts!
  // It checks if the backend sent a count, otherwise defaults to 0
  const [likesCount, setLikesCount] = useState(parseInt(post.likes_count) || 0);
  const [commentsCount, setCommentsCount] = useState(parseInt(post.comments_count) || 0);
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const formattedDate = post.timestamp ? new Date(post.timestamp).toLocaleDateString() : "Just now";

  const handleLike = async () => {
    // 🚨 UPDATED: Optimistically update the heart AND the number
    const newlyLiked = !isLiked;
    setIsLiked(newlyLiked);
    setLikesCount(prev => newlyLiked ? prev + 1 : prev - 1);
    
    setLikeAnimation('scale-125'); 
    setTimeout(() => setLikeAnimation(''), 200);

    try {
      await fetch(`http://localhost:3000/api/posts/${post.postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      // Revert if it fails
      setIsLiked(!newlyLiked);
      setLikesCount(prev => newlyLiked ? prev - 1 : prev + 1);
    }
  };

  const toggleComments = async () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      setIsLoadingComments(true);
      try {
        const response = await fetch(`http://localhost:3000/api/posts/${post.postId}/comments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        // If the database has comments, update the array AND the count to ensure accuracy
        if (data.success) {
            setComments(data.comments);
            setCommentsCount(data.comments.length); 
        }
      } catch (error) {
        console.error("Failed to fetch comments");
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`http://localhost:3000/api/posts/${post.postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      const data = await response.json();
      
      if (data.success) {
        setComments([...comments, data.comment]);
        setCommentsCount(prev => prev + 1); // 🚨 NEW: Make the comment counter go up!
        setNewComment('');
      }
    } catch (error) {
      console.error("Failed to add comment");
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col shadow-sm overflow-hidden transition-all duration-300">
      <div className="p-3 flex items-center gap-3">
        <img 
          src={`https://api.dicebear.com/7.x/identicon/svg?seed=${post.authorId}`} 
          alt="avatar" 
          className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 cursor-pointer hover:opacity-80 transition"
          onClick={() => navigate(`/profile/${post.authorId}`)}
        />
        <div>
          <p 
            className="font-semibold text-sm cursor-pointer hover:underline text-gray-200"
            onClick={() => navigate(`/profile/${post.authorId}`)}
          >
            {post.authorId}
          </p>
          <p className="text-xs text-gray-500">{formattedDate}</p>
        </div>
      </div>
      
      <div className="px-4 py-5 bg-gray-800/40 border-y border-gray-800 min-h-[80px] flex flex-col items-start gap-4">
        {post.content && post.content.trim() !== '' && (
          <p className="text-lg text-gray-200 whitespace-pre-wrap">{post.content}</p>
        )}
        {post.image_url && (
          <img 
            src={`http://localhost:3000${post.image_url}`} 
            alt="Post content" 
            className="w-full rounded-lg object-cover max-h-[500px] border border-gray-700 shadow-md"
          />
        )}
      </div>

      <div className="p-3 flex gap-6 text-gray-500 font-medium">
        <button 
          onClick={handleLike}
          className={`flex items-center gap-2 transition-all duration-200 ${isLiked ? 'text-red-500' : 'hover:text-red-400'} ${likeAnimation}`}
        >
          {isLiked ? '❤️' : '🤍'} 
          {/* 🚨 UPDATED: Display the Likes count! */}
          <span className="text-sm">{likesCount > 0 ? likesCount : 'Like'}</span>
        </button>
        
        <button 
          onClick={toggleComments}
          className={`flex items-center gap-2 hover:text-blue-400 transition ${showComments ? 'text-blue-400' : ''}`}
        >
          💬 
          {/* 🚨 UPDATED: Display the Comments count! */}
          <span className="text-sm">{commentsCount > 0 ? commentsCount : 'Comment'}</span>
        </button>
      </div>

      {/* Slide-Down Comment Section */}
      {showComments && (
        <div className="border-t border-gray-800 bg-gray-900/50 p-4">
          <div className="max-h-60 overflow-y-auto space-y-4 mb-4 pr-2">
            {isLoadingComments ? (
              <p className="text-xs text-gray-500 text-center py-2">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">No comments yet. Be the first!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${c.username}`} className="w-8 h-8 rounded-full border border-gray-700" alt="avatar" />
                  <div className="bg-gray-800 px-4 py-2 rounded-2xl rounded-tl-none">
                    <p className="text-xs font-bold text-gray-300 cursor-pointer hover:underline" onClick={() => navigate(`/profile/${c.username}`)}>{c.username}</p>
                    <p className="text-sm text-gray-200">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3 items-center mt-2">
             <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user}`} className="w-8 h-8 rounded-full border border-gray-700 hidden sm:block" alt="avatar" />
             <input 
                type="text" 
                placeholder="Write a comment..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                className="flex-1 bg-gray-800 text-sm text-gray-100 placeholder-gray-500 rounded-full px-4 py-2 outline-none border border-gray-700 focus:ring-1 focus:ring-blue-500"
             />
             <button 
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="text-blue-400 font-bold text-sm hover:text-blue-300 disabled:text-gray-600 transition"
             >
                Post
             </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SystemAlertCard({ message }) {
  return (
    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-[2px] shadow-lg my-6 opacity-90 hover:opacity-100 transition duration-300">
      <div className="bg-gray-950 rounded-lg p-6 text-center">
        <h3 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 mb-2">
          🧘 Mindful Scrolling
        </h3>
        <p className="text-gray-300 font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}