// frontend/src/pages/PeerSupport.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../utils/firebase";
import api from "../utils/api";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  increment,
  arrayUnion,
  arrayRemove,
  limit,
  deleteDoc
} from "firebase/firestore";
import Layout from "./components/Layout";
import ModerationStatus from "./components/ModerationStatus";
import {
  User,
  Heart,
  AlertTriangle,
  Send,
  Sparkles,
  Flag,
  MessageCircle,
  Home,
  MoreHorizontal,
  ThumbsUp,
  Trash2,
  Award,
  Sun,
  Moon,
  BookOpen,
  Brain,
  ShieldCheck,
  Flame,
  Leaf,
  Rocket,
  Sprout,
  Trophy,
  Star,
  Smile,
  Flower2,
  TreePine,
  Rainbow,
  Dumbbell,
  Scale,
} from "lucide-react";
import { showSuccessToast, showErrorToast, showWarningToast } from "./components/ToastNotification";

// ============================================
// ICON MAPPING (for badges)
// ============================================
const ICON_MAP = {
  Sun,
  Moon,
  BookOpen,
  Brain,
  ShieldCheck,
  MessageCircle,
  Flame,
  Leaf,
  Rocket,
  Sprout,
  Award,
  Heart,
  Trophy,
  Star,
  Smile,
};

// Helper to render a Lucide badge icon
const renderBadgeIcon = (iconName, size = 20, props = {}) => {
  const IconComponent = ICON_MAP[iconName] || Star;
  return <IconComponent size={size} {...props} />;
};

// ============================================
// MODERATION FUNCTION (Calls Backend API)
// ============================================

async function moderatePost(content) {
  try {
    const response = await api.post('/ai/moderate', { content });
    console.log('✅ Moderation API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ AI moderation error:', error);
    return {
      action: 'blocked',
      reason: 'Moderation service unavailable. Please try again.',
      score: 1.0,
      isError: true
    };
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

function PeerSupport() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const userIdNumber = parseInt(user_id, 10);

  const [userNickname, setUserNickname] = useState("");
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dailyPrompt, setDailyPrompt] = useState("");
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingPost, setReportingPost] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [showComments, setShowComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);

  // Moderation State
  const [moderationStatus, setModerationStatus] = useState(null);
  const [moderationScore, setModerationScore] = useState(0);
  const [moderationReason, setModerationReason] = useState("");
  const [commentModeration, setCommentModeration] = useState({});
  const [commentModerationStatus, setCommentModerationStatus] = useState({});
  const [commentModerationReason, setCommentModerationReason] = useState({});
  const [commentModerationScore, setCommentModerationScore] = useState({});

  // ✅ Gamification data cache for users (to avoid repeated API calls)
  const [gamificationCache, setGamificationCache] = useState({});
  const [hoveredUser, setHoveredUser] = useState(null);
  const [hoveredUserData, setHoveredUserData] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  // Generate random avatar color based on nickname
  const getAvatarColor = (nickname) => {
    const colors = [
      "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a",
      "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#06b6d4"
    ];
    const index = (nickname?.length || 0) % colors.length;
    return colors[index];
  };

  // Get initial letter for avatar
  const getInitial = (name) => {
    return name?.charAt(0).toUpperCase() || "?";
  };

  // ✅ Fetch user gamification data
  const fetchUserGamification = async (userId) => {
    // Check cache first
    if (gamificationCache[userId]) {
      return gamificationCache[userId];
    }

    try {
      const res = await api.get(`/gamification/stats/${userId}`);
      const data = {
        level: res.data.points?.level || 1,
        points: res.data.points?.total_points || 0,
        equippedBadge: res.data.equipped_badge || null,
        totalBadges: res.data.total_badges || 0
      };
      
      // Cache the data
      setGamificationCache(prev => ({ ...prev, [userId]: data }));
      return data;
    } catch (err) {
      console.error(`Failed to fetch gamification for user ${userId}:`, err);
      // Return default level 1
      return { level: 1, points: 0, equippedBadge: null, totalBadges: 0 };
    }
  };

  // ✅ Handle user hover - show gamification data
  const handleUserHover = async (userId, e) => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }

    // Set a small delay to avoid flickering
    const timeout = setTimeout(async () => {
      const data = await fetchUserGamification(userId);
      setHoveredUser(userId);
      setHoveredUserData(data);
    }, 300);
    
    setHoverTimeout(timeout);
  };

  // ✅ Handle user leave
  const handleUserLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setHoveredUser(null);
    setHoveredUserData(null);
  };

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get(`/profile/${user_id}`);
        if (res.data.nickname) setUserNickname(res.data.nickname);
        else setUserNickname(res.data.name.split(" ")[0]);
      } catch (err) { console.log("Profile fetch error:", err); }
    };
    
    const fetchWarningStatus = async () => {
      try {
        const res = await api.get(`/peer-support/warnings/${user_id}`);
        setWarningCount(res.data.count);
        setIsBlocked(res.data.isBlocked);
      } catch (err) { console.error("Warning fetch error:", err); }
    };
    
    const fetchDailyPrompt = async () => {
      try {
        const res = await api.get("/peer-support/daily-prompt");
        setDailyPrompt(res.data.prompt);
      } catch (err) { console.error("Prompt fetch error:", err); }
    };
    
    fetchUserProfile();
    fetchWarningStatus();
    fetchDailyPrompt();
  }, [user_id]);

  // Fetch posts
  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const postsData = [];
        snapshot.forEach((doc) => {
          const postData = {
            id: doc.id,
            ...doc.data()
          };
          const reportedBy = Array.isArray(postData.reportedBy)
            ? postData.reportedBy.filter(Boolean).map(Number)
            : [];
          if (!reportedBy.includes(userIdNumber)) {
            postsData.push(postData);
          }
        });
        setPosts(postsData);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userIdNumber]);

  // ============================================
  // HANDLE ADD POST WITH MODERATION
  // ============================================
  const handleAddPost = async () => {
    if (!newPost.trim() || sending || isBlocked) return;
    
    setModerationStatus('checking');
    setModerationReason('Analyzing your post content...');
    setSending(true);

    try {
      const moderationResult = await moderatePost(newPost);
      
      if (moderationResult.isError) {
        showErrorToast(moderationResult.reason || 'Moderation service unavailable. Please try again.');
        setModerationStatus(null);
        setSending(false);
        return;
      }
      
      setModerationScore(moderationResult.score || 0);
      setModerationReason(moderationResult.reason || '');

      if (moderationResult.action === 'blocked') {
        setModerationStatus('blocked');
        
        const res = await api.post("/peer-support/increment-warning", { user_id: userIdNumber });
        setWarningCount(res.data.count);
        if (res.data.isBlocked) {
          setIsBlocked(true);
          setSending(false);
          showErrorToast('Your account has been blocked for multiple violations.');
          return;
        }
        
        showErrorToast(`Your post was not approved: ${moderationResult.reason}. Warning ${res.data.count}/3.`);
        setSending(false);
        
        setTimeout(() => {
          setModerationStatus(null);
        }, 8000);
        return;
      }
      
      if (moderationResult.action === 'crisis') {
        setModerationStatus('crisis');
        setModerationReason(moderationResult.reason || 'We noticed you might be going through a difficult time. Help is available.');
        setShowCrisisAlert(true);
        showWarningToast('We noticed you might be going through a difficult time. Support is available.');
        setSending(false);
        
        setTimeout(() => {
          setModerationStatus(null);
        }, 8000);
        return;
      }
      
      if (moderationResult.action === 'flagged') {
        setModerationStatus('flagged');
        showWarningToast('Your post has been flagged for review by our moderators.');
      } else {
        setModerationStatus('approved');
        showSuccessToast('Your post has been shared! 💙');
      }
      
      await addDoc(collection(db, "posts"), {
        content: newPost.trim(),
        user_id: userIdNumber,
        nickname: userNickname,
        avatarColor: getAvatarColor(userNickname),
        createdAt: new Date(),
        reactions: { relate: 0, strength: 0 },
        usersRelated: [],
        usersStrengthened: [],
        comments: [],
        status: moderationResult.action === 'flagged' ? 'flagged' : 'active',
        moderationReason: moderationResult.action === 'flagged' ? moderationResult.reason : null,
        moderationScore: moderationResult.score || 0,
        reportedBy: []
      });
      
      setNewPost("");
      
      setTimeout(() => {
        setModerationStatus(null);
      }, 3000);
      
    } catch (error) {
      console.error("Error posting:", error);
      showErrorToast("Failed to post. Please try again.");
      setModerationStatus(null);
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (postId, reactionType) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const hasRelated = post.usersRelated?.includes(userIdNumber);
    const hasStrengthened = post.usersStrengthened?.includes(userIdNumber);
    
    let updateData = {};
    
    if (reactionType === 'relate') {
      if (hasRelated) {
        updateData = { 'usersRelated': arrayRemove(userIdNumber), 'reactions.relate': increment(-1) };
      } else {
        updateData = { 'usersRelated': arrayUnion(userIdNumber), 'reactions.relate': increment(1) };
        if (hasStrengthened) {
          updateData['usersStrengthened'] = arrayRemove(userIdNumber);
          updateData['reactions.strength'] = increment(-1);
        }
      }
    } else if (reactionType === 'strength') {
      if (hasStrengthened) {
        updateData = { 'usersStrengthened': arrayRemove(userIdNumber), 'reactions.strength': increment(-1) };
      } else {
        updateData = { 'usersStrengthened': arrayUnion(userIdNumber), 'reactions.strength': increment(1) };
        if (hasRelated) {
          updateData['usersRelated'] = arrayRemove(userIdNumber);
          updateData['reactions.relate'] = increment(-1);
        }
      }
    }
    
    try {
      await updateDoc(doc(db, "posts", postId), updateData);
    } catch (error) { console.error("Error reacting:", error); }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "posts", postId));
        setOpenDropdown(null);
      } catch (error) { console.error("Error deleting post:", error); alert("Failed to delete post."); }
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    const post = posts.find(p => p.id === postId);

    if (!post) {
      showErrorToast("Post not found");
      return;
    }

    const comment = (post.comments || []).find(c => c.id === commentId);

    if (!comment) {
      showErrorToast("Comment not found");
      return;
    }

    const canDelete = post.user_id === userIdNumber || comment.user_id === userIdNumber;

    if (!canDelete) {
      showErrorToast("You are not allowed to delete this comment.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this comment?");

    if (!confirmed) return;

    try {
      const updatedComments = (post.comments || []).filter(c => c.id !== commentId);
      await updateDoc(doc(db, "posts", postId), { comments: updatedComments });
      showSuccessToast("Comment deleted successfully");
    } catch (error) {
      console.error("Delete comment error:", error);
      showErrorToast("Failed to delete comment");
    }
  };

  const handleReportPost = async (post) => {
    setReportingPost(post);
    setShowReportModal(true);
    setOpenDropdown(null);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      showErrorToast("Please provide a reason for reporting");
      return;
    }
    
    try {
      await api.post("/peer-support/report", {
        reported_content: reportingPost?.content,
        reason: reportReason,
        post_id: reportingPost?.id,
        reported_user_id: reportingPost?.user_id
      });
      
      showSuccessToast("Report submitted. Thank you for helping keep the community safe.");
      setShowReportModal(false);
      setReportingPost(null);
      setReportReason("");
    } catch (err) {
      console.error("Report error:", err);
      showErrorToast(err.response?.data?.msg || "Failed to submit report");
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText[postId]?.trim()) return;
    
    const commentContent = commentText[postId].trim();
    
    setCommentModerationStatus(prev => ({ ...prev, [postId]: 'checking' }));
    setCommentModerationReason(prev => ({ ...prev, [postId]: 'Analyzing your comment...' }));
    setCommentModeration(prev => ({ ...prev, [postId]: true }));
    
    try {
      const moderationResponse = await api.post('/peer-support/moderate-comment', {
        content: commentContent,
        post_id: postId
      });
      
      const moderationResult = moderationResponse.data;
      
      setCommentModerationScore(prev => ({ ...prev, [postId]: moderationResult.score || 0 }));
      
      if (moderationResult.action === 'crisis') {
        setCommentModerationStatus(prev => ({ ...prev, [postId]: 'crisis' }));
        setCommentModerationReason(prev => ({ ...prev, [postId]: moderationResult.reason || 'We noticed you might be going through a difficult time.' }));
        setShowCrisisAlert(true);
        showWarningToast('We noticed you might be going through a difficult time. Support is available.');
        setCommentText(prev => ({ ...prev, [postId]: "" }));
        
        setTimeout(() => {
          setCommentModeration(prev => ({ ...prev, [postId]: false }));
        }, 5000);
        return;
      }
      
      if (moderationResult.action === 'blocked') {
        setCommentModerationStatus(prev => ({ ...prev, [postId]: 'blocked' }));
        setCommentModerationReason(prev => ({ ...prev, [postId]: moderationResult.reason || 'Comment contains inappropriate content.' }));
        
        showErrorToast(`Comment blocked: ${moderationResult.reason || 'Inappropriate content'}`);
        
        if (moderationResult.warningCount >= 3) {
          setIsBlocked(true);
          showErrorToast('Your account has been blocked for multiple violations.');
        }
        setCommentText(prev => ({ ...prev, [postId]: "" }));
        
        setTimeout(() => {
          setCommentModeration(prev => ({ ...prev, [postId]: false }));
        }, 5000);
        return;
      }
      
      setCommentModerationStatus(prev => ({ ...prev, [postId]: 'approved' }));
      setCommentModerationReason(prev => ({ ...prev, [postId]: 'Comment approved!' }));
      
      const postRef = doc(db, "posts", postId);
      const post = posts.find(p => p.id === postId);
      
      if (!post) {
        showErrorToast("Post not found");
        setCommentModeration(prev => ({ ...prev, [postId]: false }));
        return;
      }
      
      const newComment = {
        id: Date.now(),
        user_id: userIdNumber,
        nickname: userNickname,
        avatarColor: getAvatarColor(userNickname),
        content: commentContent,
        createdAt: new Date(),
        reactions: { like: 0 }
      };
      
      const updatedComments = [...(post.comments || []), newComment];
      await updateDoc(postRef, { comments: updatedComments });
      
      setCommentText(prev => ({ ...prev, [postId]: "" }));
      showSuccessToast("Comment added!");
      
      setTimeout(() => {
        setCommentModeration(prev => ({ ...prev, [postId]: false }));
      }, 3000);
      
    } catch (error) {
      console.error("Error adding comment:", error);
      setCommentModerationStatus(prev => ({ ...prev, [postId]: 'blocked' }));
      setCommentModerationReason(prev => ({ ...prev, [postId]: error.response?.data?.reason || 'Failed to add comment' }));
      
      showErrorToast(error.response?.data?.reason || "Failed to add comment");
      setCommentText(prev => ({ ...prev, [postId]: "" }));
      
      setTimeout(() => {
        setCommentModeration(prev => ({ ...prev, [postId]: false }));
      }, 5000);
    }
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const formatTimeAgo = (date) => {
    if (!date) return "";
    const seconds = Math.floor((new Date() - date.toDate()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return date.toDate().toLocaleDateString();
  };

  // ✅ Get level title
  const getLevelTitle = (level) => {
    const titles = {
      1: "Well-being Starter",
      2: "Mindful Beginner",
      3: "Self-Care Explorer",
      4: "Wellness Adventurer",
      5: "Emotional Navigator",
      6: "Resilience Builder",
      7: "Balance Seeker",
      8: "Growth Achiever",
      9: "Mental Health Advocate",
      10: "Lumora Champion"
    };
    return titles[level] || `Level ${level}`;
  };

  // ✅ Get level icon component (matching GamificationDisplay)
  const getLevelIcon = (level) => {
    const icons = {
      1: Sprout,
      2: Leaf,
      3: Flower2,
      4: TreePine,
      5: Rainbow,
      6: Dumbbell,
      7: Scale,
      8: Rocket,
      9: ShieldCheck,
      10: Trophy
    };
    return icons[level] || Star;
  };

  if (loading) return <Layout><div className="loading-container"><div className="spinner"></div><p className="loading-text">Loading community...</p></div></Layout>;

  if (isBlocked) {
    return (
      <Layout>
        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
          <AlertTriangle size={64} color="var(--accent-primary)" style={{ marginBottom: "20px" }} />
          <h2>Account Restricted</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "10px" }}>You have been blocked from posting due to multiple violations of community guidelines.</p>
          <button className="primary-btn" onClick={() => navigate("/dashboard")} style={{ marginTop: "30px", width: "auto", padding: "10px 30px" }}>Return to Dashboard</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 className="peer-title" style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Community Connect</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Connect, share, and grow together in a safe, supportive community</p>
      </div>

      {/* Warning Banner - Now uses CSS class */}
      {warningCount > 0 && warningCount < 3 && (
        <div className="warning-banner">
          <AlertTriangle size={14} />
          <span>Warning: {warningCount}/3. Please follow community guidelines.</span>
        </div>
      )}

      {/* Crisis Alert Modal */}
      {showCrisisAlert && (
        <div className="modal-overlay" onClick={() => setShowCrisisAlert(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
              <h3>We're here for you ❤️</h3><button className="modal-close" onClick={() => setShowCrisisAlert(false)}>✕</button>
            </div>
            <div className="modal-content">
              <p>Your message contains words that suggest you might be going through a difficult time.</p>
              <p style={{ marginTop: "16px" }}>You're not alone. Help is available:</p>
              <div className="crisis-hotlines">
                <p><strong>📞 Talian Kasih:</strong> 15999 (24/7)</p>
                <p><strong>📞 Befrienders KL:</strong> 03-7627 2929 (24/7)</p>
                <p><strong>📞 Talian HEAL:</strong> 15555 (8am - 12am)</p>
              </div>
              <button className="primary-btn" onClick={() => setShowCrisisAlert(false)} style={{ marginTop: "20px" }}>I understand, close</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && reportingPost && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Report Post</h3><button className="modal-close" onClick={() => setShowReportModal(false)}>✕</button></div>
            <div className="modal-content">
              <p style={{ marginBottom: "16px" }}>Why are you reporting this post?</p>
              <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="e.g., Harassment, inappropriate content, spam..." className="peer-textarea" rows="3" />
              <div className="modal-actions"><button className="peer-btn-primary" onClick={submitReport}>Submit Report</button><button className="peer-btn-secondary" onClick={() => setShowReportModal(false)}>Cancel</button></div>
            </div>
          </div>
        </div>
      )}

      {/* FEED TAB - Only Feed, No Groups */}
      <div>
        <div className="create-post-card">
          <div className="create-post-header">
            <div className="peer-avatar" style={{ backgroundColor: getAvatarColor(userNickname) }}>{getInitial(userNickname)}</div>
            <div className="create-post-input" onClick={() => document.getElementById("postInput").focus()}>
              <input id="postInput" type="text" value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder={`What's on your mind, ${userNickname || "there"}?`} className="create-post-field" disabled={sending} />
            </div>
          </div>
          <div className="create-post-actions">
            <div className="daily-prompt-chip"><Sparkles size={14} /><span>{dailyPrompt}</span></div>
            <button className="post-btn" onClick={handleAddPost} disabled={!newPost.trim() || sending}><Send size={16} /> {sending ? "Posting..." : "Post"}</button>
          </div>

          {/* Moderation Status */}
          {moderationStatus && (
            <ModerationStatus 
              status={moderationStatus}
              reason={moderationReason}
              score={moderationScore}
            />
          )}
        </div>

        <div className="peer-feed">
          {posts.length === 0 ? (
            <div className="empty-feed"><MessageCircle size={48} /><h3>No posts yet</h3><p>Be the first to share something with the community</p></div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="feed-post">
                <div className="post-header">
                  <div 
                    className="post-user"
                    style={{ position: 'relative', cursor: 'pointer' }}
                    onMouseEnter={(e) => handleUserHover(post.user_id, e)}
                    onMouseLeave={handleUserLeave}
                  >
                    <div className="post-avatar" style={{ backgroundColor: post.avatarColor || getAvatarColor(post.nickname) }}>
                      {getInitial(post.nickname)}
                    </div>
                    <div className="post-user-info">
                      <span className="post-username">{post.nickname || "Anonymous"}</span>
                      <span className="post-time">{formatTimeAgo(post.createdAt)}</span>
                    </div>

                    {/* ✅ Hover Tooltip - Show Level and Badge */}
                    {hoveredUser === post.user_id && hoveredUserData && (() => {
                      const LevelIcon = getLevelIcon(hoveredUserData.level);
                      return (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: '0',
                            background: 'var(--card-bg-glass)',
                            backdropFilter: 'var(--glass-blur-lg)',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            border: '1px solid var(--border-glass)',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 1000,
                            minWidth: '180px',
                            animation: 'fadeIn 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <LevelIcon size={24} strokeWidth={1.75} style={{ color: 'var(--accent-primary)' }} />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600 }}>
                                Level {hoveredUserData.level}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {getLevelTitle(hoveredUserData.level)}
                              </div>
                            </div>
                          </div>
                          {hoveredUserData.equippedBadge && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              background: 'var(--accent-soft)',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}>
                              {renderBadgeIcon(hoveredUserData.equippedBadge.icon, 16)}
                              <span>{hoveredUserData.equippedBadge.name}</span>
                            </div>
                          )}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginTop: '6px'
                          }}>
                            <Award size={12} />
                            <span>{hoveredUserData.totalBadges} badges • {hoveredUserData.points} pts</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="dropdown-container">
                    <button className="post-more" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === post.id ? null : post.id); }}><MoreHorizontal size={18} /></button>
                    {openDropdown === post.id && (
                      <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                        <button className="dropdown-item" onClick={() => handleReportPost(post)}><Flag size={16} /><span>Report</span></button>
                        {post.user_id === userIdNumber && <button className="dropdown-item delete" onClick={() => handleDeletePost(post.id)}><Trash2 size={16} /><span>Delete</span></button>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="post-content"><p>{post.content}</p></div>
                <div className="post-stats">
                  <button className={`reaction-btn relate-btn ${post.usersRelated?.includes(userIdNumber) ? "active" : ""}`} onClick={() => handleReact(post.id, 'relate')}><ThumbsUp size={16} /><span>{post.reactions?.relate || 0}</span></button>
                  <button className={`reaction-btn strength-btn ${post.usersStrengthened?.includes(userIdNumber) ? "active" : ""}`} onClick={() => handleReact(post.id, 'strength')}><Heart size={16} /><span>{post.reactions?.strength || 0}</span></button>
                  <button className="stats-btn" onClick={() => toggleComments(post.id)}><MessageCircle size={16} /><span>{(post.comments?.length || 0)}</span></button>
                </div>
                <div className="post-actions">
                  <button className={`action-btn relate-action ${post.usersRelated?.includes(userIdNumber) ? "active" : ""}`} onClick={() => handleReact(post.id, 'relate')}><ThumbsUp size={18} /><span>Relate</span></button>
                  <button className={`action-btn strength-action ${post.usersStrengthened?.includes(userIdNumber) ? "active" : ""}`} onClick={() => handleReact(post.id, 'strength')}><Heart size={18} /><span>Strength</span></button>
                  <button className="action-btn" onClick={() => toggleComments(post.id)}><MessageCircle size={18} /><span>Comment</span></button>
                </div>

                {showComments[post.id] && (
                  <div className="comments-section">
                    <div className="comment-input-wrapper">
                      <div className="comment-avatar" style={{ backgroundColor: getAvatarColor(userNickname) }}>
                        {getInitial(userNickname)}
                      </div>
                      <div className="comment-input-container">
                        <input 
                          type="text" 
                          value={commentText[post.id] || ""}
                          onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder="Write a comment..." 
                          className="comment-input" 
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          disabled={commentModeration[post.id]}
                        />
                        <button 
                          className="comment-send" 
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentText[post.id]?.trim() || commentModeration[post.id]}
                        >
                          {commentModeration[post.id] ? (
                            <span className="spinning" style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                          ) : (
                            <Send size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    {commentModeration[post.id] && (
                      <ModerationStatus 
                        status={commentModerationStatus[post.id]}
                        reason={commentModerationReason[post.id]}
                        score={commentModerationScore[post.id]}
                      />
                    )}

                    {(post.comments || []).slice().reverse().map((comment) => {
                      const canDeleteComment = post.user_id === userIdNumber || comment.user_id === userIdNumber;

                      return (
                        <div 
                          key={comment.id} 
                          className="comment-item" 
                          style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}
                          onMouseEnter={(e) => handleUserHover(comment.user_id, e)}
                          onMouseLeave={handleUserLeave}
                        >
                          <div className="comment-avatar small" style={{ backgroundColor: comment.avatarColor || getAvatarColor(comment.nickname) }}>
                            {getInitial(comment.nickname)}
                          </div>
                          <div className="comment-bubble" style={{ flex: 1, position: "relative" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                              <div className="comment-username">{comment.nickname}</div>
                              {canDeleteComment && (
                                <button onClick={() => handleDeleteComment(post.id, comment.id)} title="Delete Comment" style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", padding: "2px", display: "flex", alignItems: "center" }}>
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                            <div className="comment-text">{comment.content}</div>
                            <div className="comment-time">{formatTimeAgo(comment.createdAt)}</div>
                          </div>

                          {/* ✅ Hover Tooltip for Comments */}
                          {hoveredUser === comment.user_id && hoveredUserData && (() => {
                            const LevelIcon = getLevelIcon(hoveredUserData.level);
                            return (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 'calc(100% + 8px)',
                                  left: '0',
                                  background: 'var(--card-bg-glass)',
                                  backdropFilter: 'var(--glass-blur-lg)',
                                  borderRadius: '12px',
                                  padding: '12px 16px',
                                  border: '1px solid var(--border-glass)',
                                  boxShadow: 'var(--shadow-lg)',
                                  zIndex: 1000,
                                  minWidth: '180px',
                                  animation: 'fadeIn 0.2s ease'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                  <LevelIcon size={24} strokeWidth={1.75} style={{ color: 'var(--accent-primary)' }} />
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 600 }}>
                                      Level {hoveredUserData.level}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                      {getLevelTitle(hoveredUserData.level)}
                                    </div>
                                  </div>
                                </div>
                                {hoveredUserData.equippedBadge && (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 10px',
                                    background: 'var(--accent-soft)',
                                    borderRadius: '12px',
                                    fontSize: '12px'
                                  }}>
                                    {renderBadgeIcon(hoveredUserData.equippedBadge.icon, 16)}
                                    <span>{hoveredUserData.equippedBadge.name}</span>
                                  </div>
                                )}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  color: 'var(--text-muted)',
                                  marginTop: '6px'
                                }}>
                                  <Award size={12} />
                                  <span>{hoveredUserData.totalBadges} badges • {hoveredUserData.points} pts</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="mobile-bottom-nav">
        <button className="mobile-nav-item" onClick={() => navigate("/dashboard")}><Home size={22} /></button>
        <button className="mobile-nav-item active" onClick={() => {}}><MessageCircle size={22} /></button>
        <button className="mobile-nav-item" onClick={() => navigate("/profile")}><User size={22} /></button>
      </div>

      {/* Style for fadeIn animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
}

export default PeerSupport;