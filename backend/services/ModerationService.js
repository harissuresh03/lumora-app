// backend/services/ModerationService.js
const Groq = require("groq-sdk");
const db = require("../db");

// Initialize Groq
let groq;
try {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("❌ GROQ_API_KEY is not set in .env file");
  } else {
    groq = new Groq({ apiKey });
    console.log("✅ Groq AI initialized successfully");
  }
} catch (error) {
  console.error("❌ Failed to initialize Groq AI:", error.message);
}

// Crisis keywords - used for quick initial detection
const crisisKeywords = [
  'suicide', 'kill myself', 'end my life', 'want to die', 
  'hurt myself', 'self harm', 'cut myself', 'overdose',
  'hopeless', 'worthless', 'no reason to live', 'give up',
  'i want to die', 'i feel like killing myself', 'i should just die',
  'better off dead', 'want to disappear', 'i cant do this anymore',
  'kill me', 'i want to kill myself', 'i just want to die'
];

function quickCrisisCheck(content) {
  const lowerContent = content.toLowerCase();
  const foundCrisisKeywords = [];
  
  for (const keyword of crisisKeywords) {
    if (lowerContent.includes(keyword)) {
      foundCrisisKeywords.push(keyword);
    }
  }
  
  return {
    hasCrisis: foundCrisisKeywords.length > 0,
    crisisKeywords: foundCrisisKeywords
  };
}

// ============================================
// AI-BASED CRISIS DETECTION
// ============================================

/**
 * AI-based crisis detection (without blocking)
 * This is similar to moderatePost but only checks for crisis,
 * without blocking content
 */
async function detectCrisisWithAI(content) {
  try {
    if (!groq) {
      console.log("⚠️ Groq not initialized, falling back to keyword matching");
      return quickCrisisCheck(content);
    }

    const prompt = `
      You are a crisis detection system for a mental health support platform.
      Analyze the following content and determine if it indicates a personal crisis.

      IMPORTANT: 
      - A personal crisis includes expressions of suicidal thoughts, self-harm, severe hopelessness, or extreme distress.
      - DO NOT flag general sadness, stress, or anxiety as a crisis.
      - ONLY flag content that suggests immediate danger to the person's well-being.

      Content to analyze: "${content}"

      Return ONLY JSON with this exact structure:
      {
        "isCrisis": true/false,
        "confidence": 0-100,
        "reason": "Brief explanation of why this is or isn't a crisis",
        "severity": "low" | "medium" | "high" | "critical"
      }
    `;

    console.log("🤖 Calling Groq API for crisis detection...");
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-120b",
      temperature: 0.2,
      max_tokens: 256,
    });
    
    const response = chatCompletion.choices[0]?.message?.content || "";
    console.log("📝 Groq crisis detection response:", response);
    
    let cleanResponse = response.trim();
    cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    let analysis;
    try {
      analysis = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse Groq response:', cleanResponse);
      return quickCrisisCheck(content);
    }

    return {
      hasCrisis: analysis.isCrisis || false,
      confidence: analysis.confidence || 0,
      reason: analysis.reason || '',
      severity: analysis.severity || 'medium',
      crisisKeywords: analysis.isCrisis ? ['AI-detected crisis'] : []
    };

  } catch (error) {
    console.error('❌ AI crisis detection error:', error.message);
    // Fallback to keyword matching
    return quickCrisisCheck(content);
  }
}

// ============================================
// CONTENT MODERATION (with AI)
// ============================================

async function moderatePost(content) {
  console.log("🔍 Starting AI moderation for:", content);
  
  // Step 1: Quick crisis check (NOT blocking - just detection)
  const crisisCheck = quickCrisisCheck(content);
  
  if (crisisCheck.hasCrisis) {
    console.log("🚨 Crisis detected! Keywords:", crisisCheck.crisisKeywords);
    return {
      action: 'crisis',
      reason: 'Crisis-related content detected. Help is available.',
      safeScore: 100,
      crisisKeywords: crisisCheck.crisisKeywords,
      isCrisis: true
    };
  }

  // Step 2: AI moderation for everything else
  try {
    if (!groq) {
      console.log("⚠️ Groq not initialized, approving by default");
      return {
        action: 'approved',
        reason: 'AI service unavailable, approved by default',
        safeScore: 100
      };
    }

    const prompt = `
      You are a content moderator for a mental health support community.
      Analyze the following post and determine if it's appropriate.

      IMPORTANT CONTEXT: This is a mental health support platform where users share their feelings.
      
      CRITICAL RULES:
      1. DO NOT BLOCK posts that express personal struggles, sadness, depression, anxiety, or thoughts of suicide.
         These are expressions of the user's OWN feelings and should be ALLOWED.
      2. ONLY BLOCK posts that are HARASSMENT, BULLYING, or DIRECT ATTACKS on others.
      3. ALLOW: "I feel like killing myself" - this is a cry for help, not a threat to others
      4. ALLOW: "I want to die" - personal expression, needs support
      5. ALLOW: "I'm so sad I can't take it anymore" - personal expression
      6. BLOCK: "You should kill yourself" - direct attack on someone else
      7. BLOCK: "Everyone hates you" - bullying
      8. BLOCK: "You're worthless and should die" - targeted harassment
      
      SAFE SCORE GUIDELINES (0-100, where 100 = completely safe):
      - 90-100: Completely safe, supportive content
      - 70-89: Generally safe, minor concerns
      - 50-69: Moderately safe, some concerns but not harmful
      - 30-49: Somewhat unsafe, needs review
      - 0-29: Unsafe, should be blocked
      
      Post to analyze: "${content}"
      
      Return ONLY JSON with this exact structure:
      {
        "isAppropriate": true/false,
        "isToxic": true/false,
        "isPersonalCrisis": true/false,
        "isHarassment": true/false,
        "isBullying": true/false,
        "reason": "Brief explanation of the decision",
        "safeScore": 0-100
      }
      
      IMPORTANT: The safeScore should reflect how safe the content is for the community.
      - Personal crisis expressions should have HIGH safeScore (80-100) because we want to support them
      - Harassment/bullying should have LOW safeScore (0-20) because they harm others
      - Neutral/positive content should have HIGH safeScore (90-100)
    `;

    console.log("🤖 Calling Groq API...");
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
      max_tokens: 512,
    });
    
    const response = chatCompletion.choices[0]?.message?.content || "";
    console.log("📝 Groq response:", response);
    
    let cleanResponse = response.trim();
    cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    let analysis;
    try {
      analysis = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse Groq response:', cleanResponse);
      return {
        action: 'approved',
        reason: 'Unable to analyze, approved by default',
        safeScore: 100
      };
    }

    const safeScore = Math.min(Math.max(analysis.safeScore || 100, 0), 100);
    
    console.log(`📊 Content analysis: Safe Score = ${safeScore}%`);

    // Decision logic based on safe score and flags
    if (analysis.isPersonalCrisis) {
      return {
        action: 'crisis',
        reason: 'Personal crisis content detected. Support is available.',
        safeScore: safeScore,
        isCrisis: true,
        aiAnalysis: analysis
      };
    }

    if (analysis.isHarassment || analysis.isBullying || analysis.isToxic) {
      return {
        action: 'blocked',
        reason: analysis.reason || 'Harassment or bullying detected',
        safeScore: safeScore,
        aiAnalysis: analysis
      };
    }

    if (safeScore < 30) {
      return {
        action: 'blocked',
        reason: analysis.reason || 'Content deemed unsafe for the community',
        safeScore: safeScore,
        aiAnalysis: analysis
      };
    }

    return {
      action: 'approved',
      reason: analysis.reason || 'Content approved',
      safeScore: safeScore,
      aiAnalysis: analysis
    };

  } catch (error) {
    console.error('❌ AI moderation error:', error.message);
    return {
      action: 'approved',
      reason: 'Moderation service unavailable, approved by default',
      safeScore: 100
    };
  }
}

// ============================================
// CRISIS ALERT FUNCTIONS
// ============================================

// Helper function to create crisis alert for counsellor
async function createCrisisAlert(studentId, content, counsellorId = null, source = 'unknown') {
  try {
    // Get student info
    const [student] = await db.promise().query(
      "SELECT name, nickname, university_id FROM users WHERE id = ?",
      [studentId]
    );
    
    if (!student.length) {
      console.log("⚠️ Student not found for crisis alert:", studentId);
      return;
    }
    
    const studentInfo = student[0];
    
    // Find counsellor for this student
    let counsellorInfo = null;
    
    if (counsellorId) {
      const [counsellor] = await db.promise().query(
        "SELECT id, email, name FROM users WHERE id = ? AND role = 'counsellor'",
        [counsellorId]
      );
      if (counsellor.length) {
        counsellorInfo = counsellor[0];
      }
    } else {
      // Auto-find counsellor by university
      const [counsellor] = await db.promise().query(
        "SELECT id, email, name FROM users WHERE role = 'counsellor' AND university_id = ? LIMIT 1",
        [studentInfo.university_id]
      );
      if (counsellor.length) {
        counsellorInfo = counsellor[0];
      }
    }
    
    if (!counsellorInfo) {
      console.log("⚠️ No counsellor found for student:", studentId);
      return;
    }
    
    // ✅ SEND EMAIL TO COUNSELLOR
    try {
      const { sendCrisisAlertEmail } = require("./emailService");
      const emailResult = await sendCrisisAlertEmail(
        counsellorInfo.email,
        counsellorInfo.name,
        studentInfo.name,
        studentInfo.nickname || null,
        content.substring(0, 500),
        'Crisis Alert',
        studentId,
        source // 'journal', 'chat', 'post', or 'comment'
      );
      
      if (emailResult.success) {
        console.log(`✅ Crisis alert email sent to ${counsellorInfo.email}`);
      } else {
        console.log(`❌ Failed to send crisis alert email: ${emailResult.error}`);
      }
    } catch (emailError) {
      console.error("❌ Crisis email error:", emailError);
      // Continue execution even if email fails
    }
    
    // ✅ CREATE DASHBOARD NOTIFICATION
    const [alertResult] = await db.promise().query(
      `INSERT INTO crisis_alerts 
       (student_id, counsellor_id, alert_type, severity, message, is_resolved, created_at) 
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [
        studentId, 
        counsellorInfo.id, 
        'Crisis Alert', 
        'high', 
        content.substring(0, 500)
      ]
    );
    
    console.log(`✅ Crisis alert created for student ${studentId} (ID: ${alertResult.insertId})`);
    
    // ✅ ALSO CREATE USER NOTIFICATION FOR COUNSELLOR
    await db.promise().query(
      `INSERT INTO user_notifications 
       (user_id, title, message, type, related_id, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        counsellorInfo.id,
        `🚨 Crisis Alert: ${studentInfo.name}`,
        `Student ${studentInfo.name} ${studentInfo.nickname ? `(@${studentInfo.nickname})` : ''} needs immediate attention. Source: ${source}`,
        'crisis',
        studentId
      ]
    );
    
    console.log(`✅ Dashboard notification created for counsellor ${counsellorInfo.id}`);
    
  } catch (error) {
    console.error("❌ Create crisis alert error:", error);
  }
}

// ============================================
// WARNING FUNCTIONS
// ============================================

async function getUserWarningCount(userId) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT warning_count, is_blocked FROM users WHERE id = ?",
      [userId],
      (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) return resolve({ count: 0, isBlocked: false });
        resolve({ count: results[0].warning_count || 0, isBlocked: results[0].is_blocked || false });
      }
    );
  });
}

async function incrementWarningCount(userId) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT warning_count FROM users WHERE id = ?",
      [userId],
      (err, results) => {
        if (err) return reject(err);
        
        const currentCount = results[0]?.warning_count || 0;
        const newCount = currentCount + 1;
        const isBlocked = newCount >= 3;
        
        db.query(
          "UPDATE users SET warning_count = ?, is_blocked = ? WHERE id = ?",
          [newCount, isBlocked, userId],
          (err) => {
            if (err) return reject(err);
            resolve({ count: newCount, isBlocked });
          }
        );
      }
    );
  });
}

// ============================================
// EXPORTS
// ============================================

module.exports = { 
  moderatePost, 
  quickCrisisCheck,
  detectCrisisWithAI,   // ✅ Added
  createCrisisAlert,
  getUserWarningCount, 
  incrementWarningCount 
};