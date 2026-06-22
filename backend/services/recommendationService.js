// backend/services/recommendationService.js
const db = require("../db");
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  try {
    const path = require("path");
    const serviceAccount = require("../firebase-service-account.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized for recommendations");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error.message);
  }
}
const firestore = admin.firestore();

// Crisis keywords
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'want to die', 'self-harm', 
  'cut myself', 'overdose', 'end my life', 'hurt myself',
  'should just die', 'better off dead', 'want to disappear'
];

// Emotion keywords for journal analysis
const EMOTION_KEYWORDS = {
  anxiety: ['anxious', 'worried', 'fear', 'scared', 'nervous', 'stress', 'overwhelmed', 'panic', 'dread'],
  depression: ['sad', 'depressed', 'hopeless', 'empty', 'worthless', 'tired', 'exhausted', 'lonely', 'down'],
  anger: ['angry', 'frustrated', 'irritated', 'annoyed', 'rage', 'mad'],
  joy: ['happy', 'grateful', 'thankful', 'joy', 'excited', 'proud', 'blessed', 'wonderful'],
  stress: ['stress', 'pressure', 'deadline', 'exam', 'assignment', 'overwhelmed', 'busy'],
  sleep: ['sleep', 'tired', 'exhausted', 'rest', 'insomnia', 'nightmare'],
  social: ['friend', 'family', 'lonely', 'alone', 'miss', 'together', 'support'],
  academic: ['exam', 'study', 'assignment', 'class', 'lecture', 'grade', 'project', 'deadline']
};

const TIPS = {
  morning: [
    { title: 'Start Your Day with Mindfulness', description: 'Spend 5 minutes focusing on your breath and setting an intention for the day. This simple practice can reduce stress and improve focus.', category: 'mindfulness' },
    { title: 'Practice Daily Gratitude', description: 'Write down 3 things you\'re grateful for each morning. This rewires your brain to notice the positive things in life.', category: 'gratitude' },
    { title: 'Morning Sunlight Exposure', description: 'Get 10-15 minutes of sunlight in the morning to regulate your circadian rhythm and boost your mood naturally.', category: 'sleep' },
    { title: 'Plan Your Day Intentionally', description: 'Take 5 minutes to plan your day. Breaking down tasks reduces overwhelm and increases productivity.', category: 'productivity' }
  ],
  evening: [
    { title: 'Practice 4-7-8 Breathing', description: 'Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds. Repeat 4-5 times to calm your nervous system before bed.', category: 'anxiety' },
    { title: 'Digital Sunset', description: 'Turn off all screens 1 hour before bed. The blue light disrupts melatonin production and affects sleep quality.', category: 'sleep' },
    { title: 'Evening Reflection', description: 'Write down your thoughts and feelings from the day. This helps process emotions and clear your mind for sleep.', category: 'journaling' },
    { title: 'Prepare for Tomorrow', description: 'Lay out your clothes, pack your bag, and prepare breakfast. Reducing morning stress starts the night before.', category: 'productivity' }
  ],
  sleep: [
    { title: 'Create a Sleep Sanctuary', description: 'Keep your bedroom cool (18-22°C), dark, and quiet. Use blackout curtains and white noise if needed.', category: 'sleep' },
    { title: 'Consistent Sleep Schedule', description: 'Go to bed and wake up at the same time every day, even on weekends. This regulates your body\'s internal clock.', category: 'sleep' },
    { title: 'Evening Relaxation Routine', description: 'Read a physical book, take a warm bath, or practice gentle stretching before bed to signal your body it\'s time to sleep.', category: 'sleep' }
  ],
  anxiety: [
    { title: '5-4-3-2-1 Grounding Technique', description: 'Acknowledge 5 things you see, 4 things you touch, 3 things you hear, 2 things you smell, and 1 thing you taste. This brings you back to the present moment.', category: 'anxiety' },
    { title: 'Challenge Negative Thoughts', description: 'Ask yourself: Is this thought true? What evidence supports it? What would I tell a friend in this situation?', category: 'anxiety' },
    { title: 'Break Tasks into Smaller Steps', description: 'When feeling overwhelmed, break large tasks into small, manageable steps. Focus on completing one step at a time.', category: 'anxiety' }
  ],
  depression: [
    { title: 'Get Active Today', description: 'Even 10 minutes of walking can release endorphins and improve your mood. Start with a short walk outside.', category: 'depression' },
    { title: 'Reach Out to Someone You Trust', description: 'Connection is healing. Send a message to a friend, family member, or call someone who understands you.', category: 'social' },
    { title: 'Celebrate Small Wins', description: 'Write down one accomplishment today, no matter how small. Recognizing progress builds confidence and motivation.', category: 'self-care' }
  ],
  academic: [
    { title: 'Pomodoro Technique', description: 'Study for 25 minutes, take a 5-minute break. After 4 cycles, take a longer 15-30 minute break. This improves focus and prevents burnout.', category: 'productivity' },
    { title: 'Create a Study Schedule', description: 'Plan your study sessions in advance. Break large projects into smaller tasks and schedule them throughout the week.', category: 'productivity' }
  ],
  social: [
    { title: 'Reconnect with Someone', description: 'Message a friend you haven\'t spoken to in a while. Social connections are vital for mental health.', category: 'social' },
    { title: 'Join a Club or Group', description: 'Find a student organization or group that shares your interests. Shared activities build meaningful connections.', category: 'social' }
  ]
};

// Activities
const ACTIVITIES = {
  breathing: [
    { name: '4-7-8 Breathing Exercise', description: 'Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds. Repeat 4-5 times.', duration: '5 min', category: 'anxiety' },
    { name: 'Box Breathing', description: 'Inhale for 4 counts, hold for 4 counts, exhale for 4 counts, hold for 4 counts. Repeat.', duration: '5 min', category: 'anxiety' },
  ],
  mindfulness: [
    { name: 'Body Scan Meditation', description: 'Systematically relax each part of your body from head to toe. Notice sensations without judgment.', duration: '10 min', category: 'mindfulness' },
    { name: 'Mindful Walking', description: 'Walk slowly and focus on each step. Notice the sensation of your feet touching the ground.', duration: '10 min', category: 'mindfulness' },
  ],
  journaling: [
    { name: 'Gratitude Journal', description: 'Write 3 things you\'re grateful for today and why they matter to you.', duration: '5 min', category: 'gratitude' },
    { name: 'Emotional Processing', description: 'Write freely about your feelings without judgment. Let your thoughts flow onto the page.', duration: '10 min', category: 'journaling' },
  ],
  movement: [
    { name: '5-Minute Stretch', description: 'Stretch your neck, shoulders, back, arms, and legs. Release tension in your body.', duration: '5 min', category: 'movement' },
    { name: 'Quick Walk', description: 'Take a 10-minute walk outdoors. Notice your surroundings and breathe deeply.', duration: '10 min', category: 'movement' },
  ]
};

// ============================================
// MAIN FUNCTIONS
// ============================================

async function getArticlesFromDatabase() {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT id, title, category, content_type, summary, content, image_url, read_time, tags FROM educational_content WHERE is_active = 1 ORDER BY created_at DESC",
      (err, results) => {
        if (err) {
          console.error("Fetch articles error:", err);
          resolve([]);
        } else {
          resolve(results);
        }
      }
    );
  });
}

async function getUserProfile(userId) {
  const profile = {
    userId,
    moods: [],
    sleep: [],
    journals: [],
    assessments: [],
    moodCount: 0,
    sleepCount: 0,
    journalCount: 0,
    averageMood: null,
    moodTrend: null,
    averageSleepQuality: null,
    averageSleepDuration: null,
    sleepTrend: null,
    journalThemes: [],
    primaryEmotion: null,
    peerActivity: { posts: 0, comments: 0 },
    lastAssessment: null,
    isSociallyInactive: false,
    assessmentHistory: []
  };
  
  // Get moods (last 7 days)
  const moodQuery = await db.promise().query(
    `SELECT mood, DATE(created_at) as date, created_at 
     FROM moods 
     WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     ORDER BY created_at ASC`,
    [userId]
  );
  profile.moods = moodQuery[0];
  profile.moodCount = profile.moods.length;
  
  if (profile.moodCount > 0) {
    const moodSum = profile.moods.reduce((sum, m) => sum + m.mood, 0);
    profile.averageMood = parseFloat((moodSum / profile.moodCount).toFixed(1));
    
    if (profile.moodCount >= 3) {
      const firstHalf = profile.moods.slice(0, Math.ceil(profile.moodCount / 2));
      const secondHalf = profile.moods.slice(Math.ceil(profile.moodCount / 2));
      const firstAvg = firstHalf.reduce((s, m) => s + m.mood, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, m) => s + m.mood, 0) / secondHalf.length;
      profile.moodTrend = parseFloat((secondAvg - firstAvg).toFixed(1));
    } else {
      profile.moodTrend = 0;
    }
  }
  
  // Get sleep (last 7 days)
  const sleepQuery = await db.promise().query(
    `SELECT quality, duration, DATE(created_at) as date 
     FROM sleep 
     WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     ORDER BY created_at ASC`,
    [userId]
  );
  profile.sleep = sleepQuery[0];
  profile.sleepCount = profile.sleep.length;
  
  if (profile.sleepCount > 0) {
    const qualitySum = profile.sleep.reduce((s, sl) => s + sl.quality, 0);
    const durationSum = profile.sleep.reduce((s, sl) => s + parseFloat(sl.duration), 0);
    profile.averageSleepQuality = parseFloat((qualitySum / profile.sleepCount).toFixed(1));
    profile.averageSleepDuration = parseFloat((durationSum / profile.sleepCount).toFixed(1));
  }
  
  // Get journals (last 7 days)
  const journalQuery = await db.promise().query(
    `SELECT content, created_at 
     FROM journals 
     WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     ORDER BY created_at DESC`,
    [userId]
  );
  profile.journals = journalQuery[0];
  profile.journalCount = profile.journals.length;
  
  if (profile.journalCount > 0) {
    profile.journalThemes = analyzeJournalThemes(profile.journals);
    profile.primaryEmotion = getPrimaryEmotion(profile.journalThemes);
  }
  
  // Get all assessments (last 30 days)
  const assessmentQuery = await db.promise().query(
    `SELECT type, score, severity, taken_at 
     FROM assessments 
     WHERE user_id = ? 
     ORDER BY taken_at DESC`,
    [userId]
  );
  profile.assessmentHistory = assessmentQuery[0];
  if (assessmentQuery[0].length > 0) {
    profile.lastAssessment = assessmentQuery[0][0];
  }
  
  // Get peer support activity from Firebase
  try {
    const postsSnapshot = await firestore.collection("posts")
      .where("user_id", "==", userId)
      .where("createdAt", ">=", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .get();
    profile.peerActivity.posts = postsSnapshot.size;
    
    const allPostsSnapshot = await firestore.collection("posts").get();
    let commentCount = 0;
    for (const doc of allPostsSnapshot.docs) {
      const post = doc.data();
      if (post.comments && Array.isArray(post.comments)) {
        const userComments = post.comments.filter(c => c.user_id === userId);
        commentCount += userComments.length;
      }
    }
    profile.peerActivity.comments = commentCount;
    profile.isSociallyInactive = profile.peerActivity.posts === 0 && commentCount === 0;
    
  } catch (firebaseError) {
    console.error("Firebase peer activity error:", firebaseError);
    profile.isSociallyInactive = true;
  }
  
  return profile;
}

function analyzeJournalThemes(journals) {
  const themes = {};
  const allText = journals.map(j => j.content.toLowerCase()).join(' ');
  
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    let count = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'g');
      const matches = allText.match(regex);
      if (matches) count += matches.length;
    }
    if (count > 0) {
      themes[emotion] = count;
    }
  }
  
  return themes;
}

function getPrimaryEmotion(themes) {
  if (Object.keys(themes).length === 0) return 'neutral';
  const sorted = Object.entries(themes).sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

async function detectCrisis(userId) {
  const journalQuery = await db.promise().query(
    `SELECT content FROM journals WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
    [userId]
  );
  
  const journals = journalQuery[0];
  for (const journal of journals) {
    const content = journal.content.toLowerCase();
    for (const keyword of CRISIS_KEYWORDS) {
      if (content.includes(keyword)) {
        return {
          hasCrisis: true,
          message: "We're here for you. You're not alone. ❤️",
          resources: [
            { name: "Talian Kasih", number: "15999", hours: "24/7" },
            { name: "Befrienders KL", number: "03-7627 2929", hours: "24/7" },
            { name: "Talian HEAL", number: "15555", hours: "8.30 am – 11.59 pm" }
          ]
        };
      }
    }
  }
  
  return { hasCrisis: false };
}

async function generateRecommendations(profile, articles) {
  const recommendations = [];
  const scores = calculateNeedScores(profile);
  
  // Article recommendations from database
  const articleRecommendations = getArticleRecommendationsFromDB(profile, scores, articles);
  recommendations.push(...articleRecommendations);
  
  // Tip recommendations
  const tipRecommendations = getTipRecommendations(profile, scores);
  recommendations.push(...tipRecommendations);
  
  // Activity recommendations
  const activityRecommendations = getActivityRecommendations(profile, scores);
  recommendations.push(...activityRecommendations);
  
  recommendations.sort((a, b) => b.score - a.score);
  
  return recommendations.slice(0, 10);
}

function calculateNeedScores(profile) {
  const scores = {
    moodSupport: 0,
    sleepSupport: 0,
    anxietySupport: 0,
    depressionSupport: 0,
    socialSupport: 0,
    academicSupport: 0
  };
  
  if (profile.averageMood !== null) {
    scores.moodSupport = (5 - profile.averageMood) * 8;
    if (profile.moodTrend < -0.5) {
      scores.moodSupport += 10;
    }
  }
  
  if (profile.averageSleepQuality !== null) {
    scores.sleepSupport = (5 - profile.averageSleepQuality) * 6;
    if (profile.averageSleepDuration < 6) {
      scores.sleepSupport += 15;
    }
    if (profile.averageSleepDuration > 10) {
      scores.sleepSupport += 5;
    }
  }
  
  if (profile.primaryEmotion === 'anxiety') {
    scores.anxietySupport += 20;
  } else if (profile.primaryEmotion === 'depression') {
    scores.depressionSupport += 20;
  } else if (profile.primaryEmotion === 'stress') {
    scores.academicSupport += 15;
  }
  
  for (const [theme, count] of Object.entries(profile.journalThemes)) {
    if (theme === 'anxiety') scores.anxietySupport += count * 2;
    if (theme === 'depression') scores.depressionSupport += count * 2;
    if (theme === 'stress') scores.academicSupport += count * 2;
    if (theme === 'sleep') scores.sleepSupport += count * 2;
    if (theme === 'social') scores.socialSupport += count * 2;
  }
  
  if (profile.isSociallyInactive && profile.journalCount > 0) {
    scores.socialSupport += 15;
  }
  
  if (profile.averageMood !== null && profile.averageSleepQuality !== null) {
    if (profile.averageMood < 3 && profile.averageSleepQuality < 3) {
      scores.moodSupport += 10;
      scores.sleepSupport += 10;
    }
  }
  
  for (const key of Object.keys(scores)) {
    scores[key] = Math.min(scores[key], 100);
  }
  
  return scores;
}

function getArticleRecommendationsFromDB(profile, scores, articles) {
  const recommendations = [];
  
  if (!articles || articles.length === 0) {
    return recommendations;
  }
  
  // Map scores to categories
  const categoryScores = {
    anxiety: scores.anxietySupport,
    depression: scores.depressionSupport,
    sleep: scores.sleepSupport,
    stress: scores.academicSupport,
    social: scores.socialSupport,
    mindfulness: scores.moodSupport > 50 ? 70 : 30,
    academic: scores.academicSupport
  };
  
  // Sort categories by score
  const sortedCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  for (const [category, score] of sortedCategories) {
    if (score > 20) {
      // Find articles matching this category
      const matchingArticles = articles.filter(a => 
        a.category && a.category.toLowerCase() === category.toLowerCase()
      );
      
      if (matchingArticles.length > 0) {
        const article = matchingArticles[0];
        const reason = getArticleReason(category, profile, scores);
        recommendations.push({
          type: 'article',
          id: article.id,
          title: article.title,
          category: article.category,
          summary: article.summary,
          content: article.content,
          image_url: article.image_url,
          readTime: article.read_time || 3,
          score: score,
          reason: reason
        });
      }
    }
  }
  
  // If less than 2 recommendations, add general articles
  if (recommendations.length < 2) {
    const generalArticles = articles.filter(a => 
      !a.category || a.category.toLowerCase() === 'general' || a.category.toLowerCase() === 'wellness'
    );
    for (const article of generalArticles.slice(0, 2)) {
      if (!recommendations.find(r => r.id === article.id)) {
        recommendations.push({
          type: 'article',
          id: article.id,
          title: article.title,
          category: article.category || 'general',
          summary: article.summary,
          content: article.content,
          image_url: article.image_url,
          readTime: article.read_time || 3,
          score: 30,
          reason: 'Here\'s a helpful article to support your mental wellness journey.'
        });
      }
    }
  }
  
  return recommendations;
}

function getArticleReason(category, profile, scores) {
  const reasons = {
    anxiety: 'Your journal entries and mood patterns suggest you may be experiencing anxiety. This article offers practical coping strategies.',
    depression: 'Your recent journal entries or mood indicate you might be feeling down. This article can help you understand and manage these feelings.',
    sleep: `Your sleep quality (${profile.averageSleepQuality || 0}/5) and duration (${profile.averageSleepDuration || 0}h) need improvement. This article provides evidence-based sleep hygiene tips.`,
    stress: 'Your journal entries mention stress or academic pressure. This article offers proven stress management techniques for students.',
    social: 'You seem less active in the community. Social connection is vital for mental health. This article explores building meaningful relationships.',
    mindfulness: 'Practicing mindfulness can help improve your overall mental well-being. This article introduces simple mindfulness techniques.',
    academic: 'Your journal entries suggest academic stress or workload concerns. This article provides strategies for balancing academics and mental health.'
  };
  return reasons[category] || 'Based on your recent data, this article may be helpful for your current situation.';
}

function getTipRecommendations(profile, scores) {
  const recommendations = [];
  
  // Get relevant tips based on user's state
  let tipCategories = [];
  
  if (profile.averageMood < 3.5) {
    tipCategories.push('depression');
    tipCategories.push('anxiety');
  }
  
  if (profile.averageSleepQuality < 3.5 || profile.averageSleepDuration < 6) {
    tipCategories.push('sleep');
  }
  
  if (profile.primaryEmotion === 'stress' || scores.academicSupport > 40) {
    tipCategories.push('academic');
  }
  
  if (profile.isSociallyInactive) {
    tipCategories.push('social');
  }
  
  // Always include morning and evening tips
  let tipPool = [];
  
  // Morning tip
  const morningTip = TIPS.morning[Math.floor(Math.random() * TIPS.morning.length)];
  tipPool.push({ ...morningTip, type: 'morning', score: 60 });
  
  // Evening tip
  const eveningTip = TIPS.evening[Math.floor(Math.random() * TIPS.evening.length)];
  tipPool.push({ ...eveningTip, type: 'evening', score: 50 });
  
  // Category-specific tips
  for (const category of tipCategories) {
    if (TIPS[category]) {
      const tip = TIPS[category][Math.floor(Math.random() * TIPS[category].length)];
      let score = 70;
      if (category === 'anxiety' && scores.anxietySupport > 50) score = 85;
      if (category === 'depression' && scores.depressionSupport > 50) score = 85;
      if (category === 'sleep' && profile.averageSleepQuality < 3) score = 80;
      tipPool.push({ ...tip, type: category, score });
    }
  }
  
  // Sort by score and take top 3 unique tips
  const uniqueTips = [];
  const seenTitles = new Set();
  for (const tip of tipPool.sort((a, b) => b.score - a.score)) {
    if (!seenTitles.has(tip.title)) {
      seenTitles.add(tip.title);
      uniqueTips.push(tip);
    }
    if (uniqueTips.length >= 3) break;
  }
  
  for (const tip of uniqueTips) {
    const reason = getTipReason(tip.type, profile, scores);
    recommendations.push({
      type: 'tip',
      title: tip.title,
      description: tip.description,
      category: tip.category || tip.type,
      score: tip.score || 50,
      reason: reason
    });
  }
  
  return recommendations;
}

function getTipReason(type, profile, scores) {
  const reasons = {
    morning: 'Starting your day with intention sets a positive tone for the hours ahead.',
    evening: 'Ending your day with calm reflection improves sleep quality and reduces stress.',
    anxiety: 'Your recent patterns suggest you could benefit from anxiety management techniques.',
    depression: 'Small, intentional actions can help lift your mood and build momentum.',
    sleep: 'Your sleep data indicates room for improvement. These tips can help you rest better.',
    academic: 'Managing academic stress is crucial for maintaining mental well-being.',
    social: 'Building and maintaining social connections is essential for mental health.',
    gratitude: 'Practicing gratitude has been shown to improve mood and overall well-being.'
  };
  return reasons[type] || 'This tip is recommended based on your current state.';
}

function getActivityRecommendations(profile, scores) {
  const recommendations = [];
  let activities = [];
  
  if (scores.anxietySupport > 50) {
    activities.push(...ACTIVITIES.breathing.map(a => ({ ...a, score: 75, category: 'anxiety' })));
  }
  
  if (profile.averageMood < 3.5 || scores.depressionSupport > 40) {
    activities.push(...ACTIVITIES.journaling.map(a => ({ ...a, score: 70, category: 'depression' })));
  }
  
  if (scores.academicSupport > 40 || scores.anxietySupport > 40) {
    activities.push(...ACTIVITIES.mindfulness.map(a => ({ ...a, score: 65, category: 'mindfulness' })));
  }
  
  if (profile.averageMood < 4) {
    activities.push(...ACTIVITIES.movement.map(a => ({ ...a, score: 50, category: 'movement' })));
  }
  
  // If no specific activities, add general ones
  if (activities.length === 0) {
    activities.push({ ...ACTIVITIES.mindfulness[0], score: 40, category: 'mindfulness' });
    activities.push({ ...ACTIVITIES.movement[0], score: 40, category: 'movement' });
  }
  
  // Remove duplicates and sort by score
  const uniqueActivities = [];
  const seenNames = new Set();
  for (const activity of activities.sort((a, b) => b.score - a.score)) {
    if (!seenNames.has(activity.name)) {
      seenNames.add(activity.name);
      uniqueActivities.push(activity);
    }
    if (uniqueActivities.length >= 2) break;
  }
  
  for (const activity of uniqueActivities) {
    const reason = getActivityReason(activity.category, profile, scores);
    recommendations.push({
      type: 'activity',
      title: activity.name,
      description: activity.description,
      duration: activity.duration,
      category: activity.category,
      score: activity.score || 50,
      reason: reason
    });
  }
  
  return recommendations;
}

function getActivityReason(category, profile, scores) {
  const reasons = {
    anxiety: 'Breathing exercises can help calm your nervous system and reduce anxiety in moments of stress.',
    depression: 'Journaling helps process emotions and can improve mood over time.',
    mindfulness: 'Mindfulness practices reduce stress and improve focus and emotional regulation.',
    movement: 'Physical activity releases endorphins and boosts mood naturally.'
  };
  return reasons[category] || 'This activity is recommended to support your mental well-being.';
}

async function getAssessmentRecommendation(userId) {
  const query = await db.promise().query(
    `SELECT type, score, severity, taken_at FROM assessments 
     WHERE user_id = ? 
     ORDER BY taken_at DESC`,
    [userId]
  );
  
  const assessments = query[0];
  const now = new Date();
  
  const result = {
    phq9: { recommended: false, reason: '', lastScore: null, lastTaken: null },
    gad7: { recommended: false, reason: '', lastScore: null, lastTaken: null }
  };
  
  // Check PHQ-9
  const phq9History = assessments.filter(a => a.type === 'phq9');
  if (phq9History.length === 0) {
    result.phq9.recommended = true;
    result.phq9.reason = 'Take your first PHQ-9 depression screening to establish a baseline.';
  } else {
    const last = phq9History[0];
    result.phq9.lastScore = last.score;
    result.phq9.lastTaken = last.taken_at;
    const daysSince = Math.floor((now - new Date(last.taken_at)) / (1000 * 60 * 60 * 24));
    if (daysSince >= 14) {
      result.phq9.recommended = true;
      result.phq9.reason = `It\'s been ${daysSince} days since your last screening. Track your progress.`;
    }
  }
  
  // Check GAD-7
  const gad7History = assessments.filter(a => a.type === 'gad7');
  if (gad7History.length === 0) {
    result.gad7.recommended = true;
    result.gad7.reason = 'Take your first GAD-7 anxiety assessment to establish a baseline.';
  } else {
    const last = gad7History[0];
    result.gad7.lastScore = last.score;
    result.gad7.lastTaken = last.taken_at;
    const daysSince = Math.floor((now - new Date(last.taken_at)) / (1000 * 60 * 60 * 24));
    if (daysSince >= 30) {
      result.gad7.recommended = true;
      result.gad7.reason = `It\'s been ${daysSince} days since your last assessment. Check in with yourself.`;
    }
  }
  
  return result;
}

module.exports = {
  getUserProfile,
  generateRecommendations,
  getAssessmentRecommendation,
  detectCrisis,
  getArticlesFromDatabase,
  getArticleRecommendationsFromDB,
  getTipRecommendations,
  getActivityRecommendations
};