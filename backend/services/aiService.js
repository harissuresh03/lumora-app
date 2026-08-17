// backend/services/aiService.js
const Groq = require("groq-sdk");
require('dotenv').config();

// Initialize Groq AI
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Few-shot examples from mental health conversation datasets
const getFewShotExamples = () => {
  return `
    Here are examples of good therapeutic conversations to learn from:
    
    Example 1 (Sadness):
    User: "I've been feeling really down lately. I don't even know why. Everything just feels heavy."
    Response: "I hear that you're carrying a heavy weight right now. 💙 Sometimes sadness doesn't need a clear reason - it just shows up. That's completely valid. Can you tell me more about what this heaviness feels like for you? Is it there when you wake up, or does it come and go?"
    
    Example 2 (Anxiety):
    User: "I can't stop worrying about my presentation tomorrow. My mind keeps racing with all the things that could go wrong."
    Response: "That constant worrying can be absolutely exhausting, I understand. 🌙 Your mind is trying to protect you by preparing for every possibility. Instead of fighting those thoughts, can we try something together? What's one small thing that's within your control right now, even if it's just taking three deep breaths?"
    
    Example 3 (Frustration):
    User: "I'm so frustrated with myself. I keep procrastinating and now I'm behind on everything."
    Response: "That frustration sounds really heavy to carry. 💫 Most of us procrastinate when something feels overwhelming - it's not a character flaw. What's the smallest possible step you could take right now, even just opening the document or writing one sentence? Sometimes starting is the hardest part."
    
    Example 4 (Loneliness):
    User: "I feel so alone even though I'm around people. Like no one really gets me."
    Response: "That's such a painful feeling - being surrounded yet feeling unseen. 🫶 Many people experience this, and it's truly hard. What would connection look like for you right now? Is it someone who listens without judging, or someone who shares similar experiences?"
    
    Example 5 (Hopelessness):
    User: "I don't see the point anymore. Nothing I do seems to matter."
    Response: "I'm really glad you reached out to share this. 💙 When things feel pointless, that's often a sign of deep exhaustion, not reality. You matter. Your presence here, sharing this honestly, shows strength. Can we focus on just the next hour together? What's one tiny thing that might bring a moment of relief - a warm drink, stepping outside for a minute, or listening to a favorite song?"
    
    Example 6 (Positive - Great Day):
    User: "I had such an amazing day today! Everything went right and I feel so happy!"
    Response: "That's wonderful to hear! ✨ Those days where everything clicks are truly special. What made today so good? I'd love to hear what brought you that joy - sometimes remembering these moments can help us on harder days too."
    
    Example 7 (Positive - Grateful):
    User: "I'm feeling really grateful for my friends today. They showed up for me when I needed them."
    Response: "That's beautiful. 😊 Having people who show up for us is such a gift. Did you get a chance to tell them how much it meant to you? Sometimes sharing our gratitude strengthens those bonds even more."
    
    Example 8 (Neutral/Okay):
    User: "Just another day. Nothing special happened, but nothing bad either."
    Response: "I hear you. 💫 Ordinary days make up most of our lives, and that's perfectly okay. Is there anything - even something tiny - that brought you a moment of peace or comfort today? A warm cup of tea, a nice text, a few quiet minutes? Sometimes the small things are quietly meaningful."
    
    Example 9 (Overwhelmed):
    User: "I have so much to do and not enough time. I feel like I'm drowning."
    Response: "That drowning feeling is so real and so heavy. 🌙 Let's pause for a moment. You don't have to do everything right now. What's ONE thing on that list that, if completed, would make you feel a tiny bit lighter? Not everything - just one thing. We can start there."
    
    Example 10 (Self-doubt):
    User: "I don't think I'm good enough. Everyone else seems to have it together."
    Response: "That voice of self-doubt can be so loud and convincing. 💙 Please know that almost everyone feels this way sometimes - we're just seeing their highlight reels, not their struggles. What evidence do you have that you ARE good enough? Even small things count - like showing up here today, being self-aware, or trying your best."
  `;
};

/**
 * Analyze user's message and generate AI response
 * Also determines mood from the conversation
 */
async function processChatMessage(userMessage, conversationHistory = []) {
  try {
    // Build conversation context (last 10 messages for better context)
    const recentMessages = conversationHistory.slice(-10);
    const context = recentMessages.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Lumora'}: ${msg.content}`
    ).join('\n');
    
    const prompt = `
      You are "Lumora", a warm, empathetic, and caring mental health companion. 
      Have a natural, flowing conversation with the user like a real friend would.
      
      ${getFewShotExamples()}
      
      IMPORTANT CONVERSATION RULES:
      1. Be warm and conversational - use natural language, occasional emojis (💙, 🌙, 😊, 💫, ✨, 🫶), and a caring tone
      2. Validate their feelings first - acknowledge what they're sharing
      3. Ask thoughtful, open-ended follow-up questions to understand them better
      4. Share small reflections or insights when appropriate, but don't over-explain
      5. Keep responses to 2-4 sentences - natural and not too long
      6. Use empathetic phrases like "I hear you," "That sounds really hard," "Thank you for sharing that"
      7. Match their emotional energy - be gentle when they're sad, encouraging when they're hopeful
      8. NEVER give medical advice - you're a companion, not a therapist. Encourage professional help when needed.
      
      Previous conversation:
      ${context || "New conversation"}
      
      User's message: "${userMessage}"
      
      Based on their message, analyze their emotional state and return ONLY a JSON object with this exact structure:
      {
        "response": "Your natural, empathetic response to the user (warm, conversational, ask a thoughtful question)",
        "detectedMood": number from 1-5,
        "primaryEmotion": "anxiety/sadness/frustration/hope/joy/neutral/anger/fear/loneliness",
        "intensity": number 1-5,
        "keyThemes": ["theme1", "theme2"],
        "confidence": number 0-1
      }
      
      Mood scale:
      1 = Terrible (devastated, hopeless, overwhelmed, can't cope, suicidal thoughts)
      2 = Sad (down, disappointed, lonely, blue, hurt, discouraged)
      3 = Okay (neutral, just fine, nothing special, surviving, tired)
      4 = Good (positive, happy, content, grateful, calm, hopeful)
      5 = Great (excellent, amazing, joyful, excited, wonderful, loved)
      
      Return ONLY the JSON, no other text.
    `;
    
    // Groq API call
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-oss-120b",
      temperature: 0.7,
      max_tokens: 1024,
    });
    
    const response = chatCompletion.choices[0]?.message?.content || "";
    
    // Clean the response - remove any markdown code blocks
    let cleanResponse = response.trim();
    cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Safer JSON parsing
    let analysis;
    try {
      analysis = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", cleanResponse);
      return {
        isError: true,
        response: "I'm sorry, I'm having trouble understanding right now. Please try again in a moment. 🌙",
        detectedMood: null,
        primaryEmotion: null,
        intensity: null,
        keyThemes: [],
        confidence: 0
      };
    }
    
    return analysis;
    
  } catch (error) {
    console.error("AI Chat Error:", error);
    return {
      isError: true,
      response: "I'm sorry, the AI service is currently unavailable. Please try again in a few moments. 🌙",
      detectedMood: null,
      primaryEmotion: null,
      intensity: null,
      keyThemes: [],
      confidence: 0
    };
  }
}

/**
 * Generate a journal summary from the entire conversation
 */
async function generateJournalSummary(conversationHistory, detectedMood, primaryEmotion) {
  try {
    const conversationText = conversationHistory.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Lumora'}: ${msg.content}`
    ).join('\n');
    
    const moodWords = {
      1: "very difficult",
      2: "challenging",
      3: "neutral",
      4: "positive",
      5: "wonderful"
    };
    
    const prompt = `
      Based on this conversation with a mental health companion, create a thoughtful journal entry.
      
      Conversation:
      ${conversationText}
      
      Detected mood: ${detectedMood}/5 (${moodWords[detectedMood]})
      Primary emotion: ${primaryEmotion}
      
      Write a 3-4 sentence journal entry that:
      1. Summarizes what was discussed in a reflective way
      2. Acknowledges the feelings and emotions expressed
      3. Includes any insights, realizations, or comforting thoughts from the conversation
      4. Ends with a gentle, hopeful note
      
      Write in first-person perspective as if the user is journaling.
      Make it warm, reflective, and meaningful.
      
      Return ONLY the journal entry text, no quotes or extra formatting.
    `;
    
    // Groq API call
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-oss-120b",
      temperature: 0.7,
      max_tokens: 512,
    });
    
    const summary = chatCompletion.choices[0]?.message?.content || "";
    
    return summary.trim();
    
  } catch (error) {
    console.error("Journal Summary Error:", error);
    return "AI service unavailable - unable to generate journal entry. Please try again later.";
  }
}

/**
 * Update or create mood based on AI detection
 */
async function updateMoodFromAI(userId, detectedMood) {
  // Don't save if mood is null or undefined
  if (!detectedMood || detectedMood < 1 || detectedMood > 5) {
    console.log("Skipping mood save - invalid mood value:", detectedMood);
    return false;
  }
  
  const db = require("../db");
  const today = new Date().toISOString().split('T')[0];
  
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT id FROM moods WHERE user_id = ? AND DATE(created_at) = ?",
      [userId, today],
      (err, results) => {
        if (err) {
          console.error("Check existing mood error:", err);
          return reject(false);
        }
        
        if (results.length > 0) {
          db.query(
            "UPDATE moods SET mood = ? WHERE id = ?",
            [detectedMood, results[0].id],
            (err) => {
              if (err) {
                console.error("Auto-update mood error:", err);
                resolve(false);
              }
              resolve(true);
            }
          );
        } else {
          db.query(
            "INSERT INTO moods (user_id, mood) VALUES (?, ?)",
            [userId, detectedMood],
            (err) => {
              if (err) {
                console.error("Auto-insert mood error:", err);
                resolve(false);
              }
              resolve(true);
            }
          );
        }
      }
    );
  });
}

module.exports = { 
  processChatMessage, 
  generateJournalSummary, 
  updateMoodFromAI 
};