// backend/routes/peerSupport.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authmiddleware");
const db = require("../db");
const { moderatePost, createCrisisAlert, getUserWarningCount, incrementWarningCount } = require("../services/ModerationService");
const { logGamificationActivity } = require("../services/gamificationService");
const admin = require("firebase-admin");
const path = require("path");
const sendAdminNotification = require("../utilityAdmin/notificationHelper");

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, "../firebase-service-account.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath)
    });
    console.log("✅ Firebase Admin initialized successfully");
  } catch (error) {
    console.error("❌ Firebase Admin initialization error:", error.message);
  }
}

const firestore = admin.firestore();

// ============================================
// DAILY PROMPT
// ============================================

router.get("/daily-prompt", verifyToken, (req, res) => {
  const prompts = [
    "What's one small win you had today?",
    "What's something you're grateful for right now?",
    "What's a challenge you're currently facing?",
    "How are you really feeling today?",
    "What's something you'd tell your younger self?",
    "What's a goal you're working towards?",
    "What's something that made you smile recently?",
    "What's a fear you want to overcome?",
    "What's something you're proud of?",
    "What's a self-care act you did for yourself?"
  ];
  
  const today = new Date().toISOString().split('T')[0];
  const promptIndex = today.split('-').reduce((a, b) => a + parseInt(b), 0) % prompts.length;
  
  res.json({ prompt: prompts[promptIndex] });
});

// ============================================
// WARNING MANAGEMENT
// ============================================

router.get("/warnings/:user_id", verifyToken, async (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  try {
    const result = await getUserWarningCount(userId);
    res.json(result);
  } catch (error) {
    console.error("Error getting warnings:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/increment-warning", verifyToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const result = await incrementWarningCount(userId);
    res.json(result);
  } catch (error) {
    console.error("Error incrementing warnings:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================
// REPORTING - Firebase Only
// ============================================

// Report a post (Firebase only)
router.post("/report", verifyToken, async (req, res) => {
  const { reported_content, reason, post_id, reported_user_id } = req.body;
  const userId = req.user.id;
  
  if (!reported_content || !reason || !post_id) {
    return res.status(400).json({ msg: "Missing required fields" });
  }
  
  try {
    const postRef = firestore.collection("posts").doc(post_id);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      return res.status(404).json({ msg: "Post not found" });
    }
    
    const postData = postDoc.data();
    const reportedBy = postData.reportedBy || [];
    
    if (reportedBy.includes(userId)) {
      return res.status(400).json({ msg: "You have already reported this post" });
    }
    
    await postRef.update({
      reportedBy: admin.firestore.FieldValue.arrayUnion(userId),
      status: 'reported',
      reportedAt: new Date()
    });
    
    const reportRef = firestore.collection("reports").doc();
    await reportRef.set({
      postId: post_id,
      reportedBy: userId,
      reportedContent: reported_content,
      reason: reason,
      reportedUserId: reported_user_id || null,
      status: 'pending',
      createdAt: new Date(),
      postAuthorId: postData.user_id,
      postContent: postData.content
    });
    
    // Send admin notification
    await sendAdminNotification(
      'report_post',
      'New Post Report',
      `A post was reported. Reason: ${reason}`,
      '/admin/reports',
      post_id
    );
    
    console.log(`✅ Report submitted for post ${post_id} by user ${userId}`);
    
    res.json({ 
      msg: "Report submitted. Thank you for helping keep the community safe.",
      reportId: reportRef.id
    });
    
  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({ msg: "Failed to submit report" });
  }
});

// ============================================
// EMERGENCY CONTACTS
// ============================================

router.get("/emergency-contacts", verifyToken, (req, res) => {
  res.json({
    hotlines: [
      { name: "Talian Kasih", number: "15999", hours: "24/7", description: "General crisis support" },
      { name: "Befrienders KL", number: "03-7627 2929", hours: "24/7", description: "Emotional support" },
      { name: "Talian HEAL", number: "15555", hours: "8am - 12am", description: "Mental health crisis" }
    ],
    message: "You're not alone. Help is available 24/7."
  });
});

// ============================================
// FIREBASE HEALTH CHECK
// ============================================

router.get("/health", verifyToken, async (req, res) => {
  try {
    await firestore.collection("posts").limit(1).get();
    res.json({ status: "healthy", firebase: "connected" });
  } catch (error) {
    console.error("Firebase health check failed:", error);
    res.status(500).json({ status: "unhealthy", firebase: "disconnected", error: error.message });
  }
});

// ============================================
// COMMENT MODERATION
// ============================================

// Moderate a comment before adding (called from frontend)
router.post("/moderate-comment", verifyToken, async (req, res) => {
  const { content, post_id } = req.body;
  const userId = req.user.id;
  
  if (!content) {
    return res.status(400).json({ msg: "Comment content is required" });
  }
  
  if (!post_id) {
    return res.status(400).json({ msg: "Post ID is required" });
  }

  try {
    const moderationResult = await moderatePost(content);
    console.log("📝 Comment moderation result:", moderationResult);
    
    if (moderationResult.action === 'crisis' && moderationResult.isCrisis) {
      await createCrisisAlert(userId, content, null, 'comment');
      
      return res.json({
        action: 'crisis',
        reason: 'We noticed you might be going through a difficult time. Help is available.',
        crisisResources: [
          { name: "Talian Kasih", number: "15999", hours: "24/7" },
          { name: "Befrienders KL", number: "03-7627 2929", hours: "24/7" },
          { name: "Talian HEAL", number: "15555", hours: "8.30 am – 11.59 pm" }
        ]
      });
    }
    
    if (moderationResult.action === 'blocked') {
      const warningResult = await incrementWarningCount(userId);
      
      return res.json({
        action: 'blocked',
        reason: moderationResult.reason || 'Comment contains inappropriate content.',
        warningCount: warningResult.count,
        isBlocked: warningResult.isBlocked
      });
    }
    
    res.json({
      action: 'approved',
      reason: 'Comment approved',
      score: moderationResult.score || 0
    });
    
  } catch (error) {
    console.error("❌ Comment moderation error:", error);
    res.status(500).json({
      action: 'approved',
      reason: 'Moderation service unavailable, approved by default',
      score: 0
    });
  }
});

// ============================================
// ADD COMMENT WITH MODERATION & GAMIFICATION
// ============================================

router.post("/comment", verifyToken, async (req, res) => {
  const { post_id, content } = req.body;
  const userId = req.user.id;
  
  if (!post_id || !content) {
    return res.status(400).json({ msg: "Post ID and content are required" });
  }
  
  try {
    const moderationResult = await moderatePost(content);
    
    if (moderationResult.action === 'crisis' && moderationResult.isCrisis) {
      await createCrisisAlert(userId, content, null, 'comment');
      
      return res.json({
        action: 'crisis',
        reason: 'We noticed you might be going through a difficult time. Help is available.',
        crisisResources: [
          { name: "Talian Kasih", number: "15999", hours: "24/7" },
          { name: "Befrienders KL", number: "03-7627 2929", hours: "24/7" },
          { name: "Talian HEAL", number: "15555", hours: "8.30 am – 11.59 pm" }
        ]
      });
    }
    
    if (moderationResult.action === 'blocked') {
      const warningResult = await incrementWarningCount(userId);
      
      return res.status(403).json({
        action: 'blocked',
        reason: moderationResult.reason || 'Comment contains inappropriate content.',
        warningCount: warningResult.count,
        isBlocked: warningResult.isBlocked
      });
    }
    
    // ✅ Approved - Add comment to Firebase
    const postRef = firestore.collection("posts").doc(post_id);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      return res.status(404).json({ msg: "Post not found" });
    }
    
    const postData = postDoc.data();
    const newComment = {
      id: Date.now().toString(),
      user_id: userId,
      nickname: req.user.nickname || 'Anonymous',
      content: content,
      createdAt: new Date(),
      moderated: true,
      moderationScore: moderationResult.score || 0
    };
    
    const comments = postData.comments || [];
    comments.push(newComment);
    
    await postRef.update({ comments: comments });

    // ✅ GAMIFICATION: Log comment activity
    await logGamificationActivity(userId, 'comment');
    
    res.json({
      action: 'approved',
      comment: newComment,
      msg: "Comment added successfully"
    });
    
  } catch (error) {
    console.error("❌ Add comment error:", error);
    res.status(500).json({ msg: "Failed to add comment" });
  }
});

// ============================================
// ADD POST WITH GAMIFICATION
// ============================================

// Note: The frontend creates posts directly in Firebase.
// This route is for gamification logging after post creation.
// The frontend can call this after successfully creating a post.

router.post("/post-log", verifyToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    // ✅ GAMIFICATION: Log post activity
    await logGamificationActivity(userId, 'post');
    res.json({ success: true, msg: "Post activity logged" });
  } catch (error) {
    console.error("Post log error:", error);
    res.status(500).json({ msg: "Failed to log post activity" });
  }
});

module.exports = router;