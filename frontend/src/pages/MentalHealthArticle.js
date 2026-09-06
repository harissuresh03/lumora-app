// pages/MentalHealthArticle.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";
import Layout from "./components/Layout";
import { showSuccessToast } from "./components/ToastNotification";
import { formatArticleContent } from "../utils/articleFormatter";
import { 
  BookOpen, 
  ArrowLeft,  
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Globe,
  ExternalLink
} from "lucide-react";

function MentalHealthArticle() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [articles, setArticles] = useState([]);
  const [onlineResources, setOnlineResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userNickname, setUserNickname] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get(`/profile/${user_id}`);
        if (res.data.nickname) setUserNickname(res.data.nickname);
        else setUserNickname(res.data.name.split(" ")[0]);
      } catch (err) { console.log("Profile fetch error:", err); }
    };
    
    fetchUserProfile();
    fetchArticles();
    fetchOnlineResources();
  }, [user_id]);

  const fetchArticles = async () => {
    try {
      const res = await api.get("/educational/content");
      console.log("Articles response:", res.data);
      
      let articlesData = [];
      if (Array.isArray(res.data)) {
        articlesData = res.data;
      }
      
      setArticles(articlesData);
    } catch (err) {
      console.error("Fetch articles error:", err);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnlineResources = async () => {
  try {
    // Use public endpoint (no token needed)
    const res = await api.get("/public/online-resources");
    console.log("Online resources response:", res.data);
    
    if (Array.isArray(res.data)) {
      setOnlineResources(res.data);
    } else {
      setOnlineResources([]);
    }
  } catch (err) {
    console.error("Fetch online resources error:", err);
    setOnlineResources([]);
  }
};

  const openArticle = (article) => {
    setSelectedArticle(article);
    setShowArticleModal(true);
  };

  const closeArticle = () => {
    setShowArticleModal(false);
    setSelectedArticle(null);
  };

  const nextArticle = () => {
    if (currentIndex < articles.length - 3) {
      setCurrentIndex(currentIndex + 3);
    }
  };

  const prevArticle = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 3);
    }
  };

  const getVisibleArticles = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      const index = currentIndex + i;
      if (index < articles.length) {
        visible.push(articles[index]);
      }
    }
    return visible;
  };

  const visibleArticles = getVisibleArticles();

  const openExternalLink = (url) => {
    if (url) window.open(url, "_blank", "noopener noreferrer");
  };

  return (
    <Layout>

      {/* Page Header */}
      <div className="page-header">
        <button onClick={() => navigate("/dashboard")} className="back-arrow-btn">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Wellness Library</h1>
          <p className="page-subtitle">Explore articles and resources to support your mental well-being</p>
        </div>
      </div>

      {/* Article Carousel */}
      {loading ? (
        <div className="loading-container" style={{ padding: "40px" }}>
          <div className="spinner"></div>
          <p>Loading articles...</p>
        </div>
      ) : (
        <>
          {articles.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "60px", 
              background: "var(--card-bg-glass)", 
              borderRadius: "24px",
              border: "1px solid var(--border-glass)"
            }}>
              <BookOpen size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
              <p>No articles available yet. Check back soon!</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ position: "relative", padding: "0 10px" }}
            >
              <div style={{ 
                display: "flex", 
                gap: "24px", 
                justifyContent: "center",
                overflow: "hidden",
                alignItems: "stretch"
              }}>
                {visibleArticles.map((article, idx) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -8 }}
                    onClick={() => openArticle(article)}
                    style={{
                      flex: "0 0 320px",
                      background: "var(--card-bg-glass)",
                      backdropFilter: "var(--glass-blur)",
                      borderRadius: "24px",
                      padding: "24px",
                      border: "1px solid var(--border-glass)",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "var(--shadow-md)"
                    }}
                  >
                    {/* Article Icon */}
                    <div style={{ 
                      fontSize: "48px", 
                      marginBottom: "16px",
                      background: "var(--accent-soft)",
                      width: "64px",
                      height: "64px",
                      borderRadius: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {article.image_url || "📖"}
                    </div>

                    {/* Category Tag */}
                    <div style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "var(--accent-primary)",
                      background: "var(--accent-soft)",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      display: "inline-block",
                      marginBottom: "12px",
                      width: "fit-content",
                      textTransform: "capitalize"
                    }}>
                      {article.category || "General"}
                    </div>

                    {/* Title */}
                    <h3 style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      marginBottom: "10px",
                      lineHeight: "1.3",
                      color: "var(--text-primary)"
                    }}>
                      {article.title}
                    </h3>

                    {/* Summary */}
                    <p style={{
                      fontSize: "14px",
                      color: "var(--text-secondary)",
                      lineHeight: "1.5",
                      flex: 1,
                      marginBottom: "16px"
                    }}>
                      {article.summary}
                    </p>

                    {/* Footer */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "16px",
                      borderTop: "1px solid var(--border-light)",
                      fontSize: "12px",
                      color: "var(--text-muted)"
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={14} /> {article.read_time || 3} min read
                      </span>
                      <span style={{ color: "var(--accent-primary)" }}>Read →</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Navigation Arrows */}
              {articles.length > 3 && (
                <>
                  <button
                    onClick={prevArticle}
                    disabled={currentIndex === 0}
                    style={{
                      position: "absolute",
                      left: "-10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "var(--card-bg-glass)",
                      backdropFilter: "var(--glass-blur)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "50%",
                      width: "44px",
                      height: "44px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                      opacity: currentIndex === 0 ? 0.4 : 1,
                      transition: "all 0.2s",
                      boxShadow: "var(--shadow-md)"
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    onClick={nextArticle}
                    disabled={currentIndex >= articles.length - 3}
                    style={{
                      position: "absolute",
                      right: "-10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "var(--card-bg-glass)",
                      backdropFilter: "var(--glass-blur)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "50%",
                      width: "44px",
                      height: "44px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: currentIndex >= articles.length - 3 ? "not-allowed" : "pointer",
                      opacity: currentIndex >= articles.length - 3 ? 0.4 : 1,
                      transition: "all 0.2s",
                      boxShadow: "var(--shadow-md)"
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* Dots Indicator */}
          {articles.length > 3 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px", marginBottom: "40px" }}>
              {Array.from({ length: Math.ceil(articles.length / 3) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx * 3)}
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: Math.floor(currentIndex / 3) === idx ? "var(--accent-primary)" : "var(--border-light)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s"
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Online Resources Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: "var(--card-bg-glass)",
          backdropFilter: "var(--glass-blur)",
          borderRadius: "24px",
          padding: "28px",
          border: "1px solid var(--border-glass)",
          marginBottom: "24px"
        }}
      >
        <h2 style={{ 
          fontSize: "20px", 
          fontWeight: 600, 
          marginBottom: "20px", 
          display: "flex", 
          alignItems: "center", 
          gap: "10px" 
        }}>
          <Globe size={22} color="var(--accent-primary)" />
          Online Resources
        </h2>
        
        {onlineResources.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
            No online resources available.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {onlineResources.map((resource) => (
              <div
                key={resource.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  background: "var(--bg-secondary)",
                  borderRadius: "12px",
                  border: "1px solid var(--border-light)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent-soft)";
                  e.currentTarget.style.borderColor = "var(--accent-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-secondary)";
                  e.currentTarget.style.borderColor = "var(--border-light)";
                }}
              >
                <div>
                  <strong style={{ fontSize: "14px" }}>{resource.name}</strong>
                  {resource.description && (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                      {resource.description}
                    </p>
                  )}
                </div>
                {resource.url && (
                  <button
                    onClick={() => openExternalLink(resource.url)}
                    style={{
                      padding: "8px 16px",
                      background: "var(--accent-gradient)",
                      border: "none",
                      borderRadius: "30px",
                      color: "white",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      whiteSpace: "nowrap",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <ExternalLink size={14} /> Visit
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Article Detail Modal */}
      <AnimatePresence>
        {showArticleModal && selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={closeArticle}
            style={{ 
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              zIndex: 2000,
              padding: "20px"
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                maxWidth: "700px", 
                maxHeight: "85vh",
                overflow: "auto",
                borderRadius: "28px",
                padding: "0",
                background: "var(--card-bg-glass)",
                backdropFilter: "var(--glass-blur-lg)"
              }}
            >
              {/* Close Button */}
              <button
                onClick={closeArticle}
                style={{
                  position: "sticky",
                  top: "16px",
                  right: "16px",
                  marginLeft: "auto",
                  display: "block",
                  background: "var(--card-bg-glass)",
                  backdropFilter: "var(--glass-blur)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  cursor: "pointer",
                  zIndex: 10,
                  boxShadow: "var(--shadow-md)"
                }}
              >
                <X size={20} />
              </button>

              {/* Article Content */}
              <div style={{ padding: "0 32px 32px 32px", marginTop: "-20px" }}>
                {/* Category Badge */}
                <div style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "var(--accent-primary)",
                  background: "var(--accent-soft)",
                  padding: "6px 16px",
                  borderRadius: "20px",
                  display: "inline-block",
                  marginBottom: "16px",
                  textTransform: "capitalize"
                }}>
                  {selectedArticle.category || "General"}
                </div>

                {/* Title */}
                <h1 style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  marginBottom: "16px",
                  lineHeight: "1.2",
                  color: "var(--text-primary)"
                }}>
                  {selectedArticle.title}
                </h1>

                {/* Meta Info */}
                <div style={{
                  display: "flex",
                  gap: "20px",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginBottom: "24px",
                  paddingBottom: "24px",
                  borderBottom: "1px solid var(--border-light)"
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={14} /> {selectedArticle.read_time || 3} min read
                  </span>
                </div>

                {/* Formatted Content - Using the new formatter */}
                <div 
                  className="article-content"
                  style={{
                    fontSize: "15px",
                    lineHeight: "1.8",
                    color: "var(--text-secondary)"
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: formatArticleContent(selectedArticle.content || selectedArticle.summary) 
                  }}
                />

                {/* Footer */}
                <div style={{
                  marginTop: '32px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    📖 {selectedArticle.read_time || 3} min read
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

export default MentalHealthArticle;