// backend/services/gamificationService.js
const db = require("../db");

// ============================================
// POINTS AND LEVELS
// ============================================

async function getUserPoints(userId) {
  const [result] = await db.promise().query(
    "SELECT total_points, level FROM gamification_points WHERE user_id = ?",
    [userId]
  );
  
  if (result.length === 0) {
    // Create initial record
    await db.promise().query(
      "INSERT INTO gamification_points (user_id, total_points, level) VALUES (?, 0, 1)",
      [userId]
    );
    return { total_points: 0, level: 1 };
  }
  
  return result[0];
}

async function addPoints(userId, points, activityType, metadata = null) {
  // Get current points
  const current = await getUserPoints(userId);
  const newTotal = current.total_points + points;
  
  // Calculate level (every 250 points = 1 level)
  const newLevel = Math.floor(newTotal / 250) + 1;
  
  // Update points
  await db.promise().query(
    "UPDATE gamification_points SET total_points = ?, level = ?, last_updated = NOW() WHERE user_id = ?",
    [newTotal, newLevel, userId]
  );
  
  // Log activity
  await db.promise().query(
    "INSERT INTO gamification_activity_log (user_id, activity_type, points_earned, metadata) VALUES (?, ?, ?, ?)",
    [userId, activityType, points, metadata ? JSON.stringify(metadata) : null]
  );
  
  // Check for level up
  if (newLevel > current.level) {
    return { points_added: points, new_total: newTotal, new_level: newLevel, leveled_up: true };
  }
  
  return { points_added: points, new_total: newTotal, new_level: newLevel, leveled_up: false };
}

// ============================================
// STREAKS
// ============================================

async function updateStreak(userId, type) {
  const today = new Date().toISOString().split('T')[0];
  
  // Get current streak
  const [result] = await db.promise().query(
    "SELECT * FROM gamification_streaks WHERE user_id = ? AND type = ?",
    [userId, type]
  );
  
  let currentStreak = 0;
  let longestStreak = 0;
  
  if (result.length === 0) {
    // Create new streak
    await db.promise().query(
      "INSERT INTO gamification_streaks (user_id, type, current_streak, longest_streak, last_date) VALUES (?, ?, 1, 1, ?)",
      [userId, type, today]
    );
    return { current_streak: 1, longest_streak: 1, is_new: true };
  }
  
  const streak = result[0];
  currentStreak = streak.current_streak;
  longestStreak = streak.longest_streak;
  const lastDate = streak.last_date ? new Date(streak.last_date) : null;
  
  // Check if already done today
  if (lastDate && lastDate.toISOString().split('T')[0] === today) {
    return { current_streak, longest_streak, is_new: false };
  }
  
  // Check if consecutive (yesterday)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (lastDate && lastDate.toISOString().split('T')[0] === yesterdayStr) {
    // Consecutive - increment
    currentStreak += 1;
  } else {
    // Reset
    currentStreak = 1;
  }
  
  // Update longest streak
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }
  
  await db.promise().query(
    "UPDATE gamification_streaks SET current_streak = ?, longest_streak = ?, last_date = ? WHERE id = ?",
    [currentStreak, longestStreak, today, streak.id]
  );
  
  // Bonus points for streak milestones
  if (currentStreak === 7) {
    await addPoints(userId, 20, 'streak_bonus', { streak_type: type, days: 7 });
  } else if (currentStreak === 14) {
    await addPoints(userId, 30, 'streak_bonus', { streak_type: type, days: 14 });
  } else if (currentStreak === 30) {
    await addPoints(userId, 50, 'streak_bonus', { streak_type: type, days: 30 });
  }
  
  return { current_streak: currentStreak, longest_streak: longestStreak, is_new: false };
}

async function getAllStreaks(userId) {
  const [result] = await db.promise().query(
    "SELECT * FROM gamification_streaks WHERE user_id = ?",
    [userId]
  );
  
  const streakTypes = ['mood', 'sleep', 'journal', 'chat', 'all_activity'];
  const streaks = {};
  
  for (const type of streakTypes) {
    const found = result.find(s => s.type === type);
    streaks[type] = found ? { current: found.current_streak, longest: found.longest_streak } : { current: 0, longest: 0 };
  }
  
  return streaks;
}

// ============================================
// BADGES
// ============================================

async function getAllBadges() {
  const [result] = await db.promise().query(
    "SELECT * FROM gamification_badges ORDER BY category, id"
  );
  return result;
}

async function getUserBadges(userId) {
  const [result] = await db.promise().query(
    `SELECT ub.*, b.name, b.icon, b.description, b.category 
     FROM user_badges ub 
     JOIN gamification_badges b ON ub.badge_id = b.id 
     WHERE ub.user_id = ? 
     ORDER BY ub.earned_at DESC`,
    [userId]
  );
  return result;
}

async function getEquippedBadge(userId) {
  const [result] = await db.promise().query(
    `SELECT ub.*, b.name, b.icon, b.description, b.category 
     FROM user_badges ub 
     JOIN gamification_badges b ON ub.badge_id = b.id 
     WHERE ub.user_id = ? AND ub.is_equipped = TRUE 
     LIMIT 1`,
    [userId]
  );
  return result.length > 0 ? result[0] : null;
}

async function equipBadge(userId, badgeId) {
  // Unequip all other badges
  await db.promise().query(
    "UPDATE user_badges SET is_equipped = FALSE WHERE user_id = ?",
    [userId]
  );
  
  // Equip the selected badge
  await db.promise().query(
    "UPDATE user_badges SET is_equipped = TRUE WHERE user_id = ? AND badge_id = ?",
    [userId, badgeId]
  );
  
  return true;
}

async function checkAndAwardBadges(userId, userData) {
  const allBadges = await getAllBadges();
  const earnedBadges = await getUserBadges(userId);
  const earnedIds = earnedBadges.map(b => b.badge_id);
  
  const awarded = [];
  
  for (const badge of allBadges) {
    if (earnedIds.includes(badge.id)) continue;
    
    let earned = false;
    
    switch (badge.requirement) {
      case 'first_mood':
        if (userData.moodCount > 0) earned = true;
        break;
      case 'first_chat':
        if (userData.chatCount > 0) earned = true;
        break;
      case 'mood_streak_7':
        if (userData.streaks?.mood?.current >= 7) earned = true;
        break;
      case 'sleep_streak_7':
        if (userData.streaks?.sleep?.current >= 7) earned = true;
        break;
      case 'journal_count_20':
        if (userData.journalCount >= 20) earned = true;
        break;
      case 'activity_count_10':
        if (userData.activityCount >= 10) earned = true;
        break;
      case 'comments_5':
        if (userData.commentCount >= 5) earned = true;
        break;
      case 'stress_forecast_7':
        if (userData.stressForecastCount >= 7) earned = true;
        break;
      case 'articles_10':
        if (userData.articleCount >= 10) earned = true;
        break;
      case 'chat_count_30':
        if (userData.chatCount >= 30) earned = true;
        break;
      case 'activities_5':
        if (userData.activityCount >= 5) earned = true;
        break;
      case 'assessments_all':
        if (userData.phq9Completed > 0 && userData.gad7Completed > 0 && userData.pssCompleted > 0) earned = true;
        break;
      case 'assessments_all_twice':
        if (userData.phq9Completed >= 2 && userData.gad7Completed >= 2 && userData.pssCompleted >= 2) earned = true;
        break;
      case 'all_streak_30':
        if (userData.streaks?.all_activity?.current >= 30) earned = true;
        break;
      case 'self_care_10':
        if (userData.selfCareDays >= 10) earned = true;
        break;
    }
    
    if (earned) {
      await db.promise().query(
        "INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)",
        [userId, badge.id]
      );
      awarded.push(badge);
      
      // Bonus points for earning a badge
      await addPoints(userId, 25, 'badge_earned', { badge: badge.name });
    }
  }
  
  return awarded;
}

// ============================================
// ACTIVITY LOGGING (To be called from routes)
// ============================================

async function logGamificationActivity(userId, activityType, metadata = null) {
  const pointMap = {
    'mood': 5,
    'sleep': 5,
    'journal': 10,
    'chat': 5,
    'assessment_phq9': 15,
    'assessment_gad7': 15,
    'assessment_pss': 10,
    'post': 5,
    'comment': 3,
    'article_read': 3,
    'activity_completed': 5,
    'stress_forecast_view': 3,
  };
  
  const points = pointMap[activityType] || 0;
  
  if (points > 0) {
    await addPoints(userId, points, activityType, metadata);
  }
  
  // Update relevant streak
  const streakMap = {
    'mood': 'mood',
    'sleep': 'sleep',
    'journal': 'journal',
    'chat': 'chat',
  };
  
  if (streakMap[activityType]) {
    await updateStreak(userId, streakMap[activityType]);
  }
  
  // Update all-activity streak if any activity logged
  await updateStreak(userId, 'all_activity');
  
  return { points_earned: points };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  getUserPoints,
  addPoints,
  updateStreak,
  getAllStreaks,
  getAllBadges,
  getUserBadges,
  getEquippedBadge,
  equipBadge,
  checkAndAwardBadges,
  logGamificationActivity
};