// backend/services/stressPredictionService.js
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildStressPrompt(moodScore, deadlines, todayDate) {
  // Format deadlines for the prompt
  const deadlinesFormatted = deadlines.map(d => ({
    title: d.title,
    subject: d.subject || 'General',
    type: d.type || 'assignment',
    due_date: d.due_date.toISOString().split('T')[0],
    difficulty: d.difficulty || 'medium',
    is_overdue: d.due_date < new Date(todayDate)
  }));

  return `
You are a stress analysis engine for a university student mental health web application. Your role is to analyze a student's academic workload and daily mood data, then generate a personalized 7-day stress forecast with actionable, empathetic advice.

You must always respond in valid JSON only. No explanations, no markdown, no preamble. Return only the JSON object.

Analyze the following student data and generate a 7-day stress forecast.

--- STUDENT DATA ---

Today's date: ${todayDate}
Today's mood log (1=Terrible, 2=Bad, 3=Okay, 4=Good, 5=Great): ${moodScore}
Note: If today's mood has not been logged yet, use a neutral modifier of 1.0.

Upcoming and overdue academic deadlines:
${JSON.stringify(deadlinesFormatted, null, 2)}

Each deadline has these fields:
- title: assignment or exam name
- subject: subject name
- type: "assignment" or "exam"
- due_date: ISO date string (YYYY-MM-DD)
- difficulty: "easy", "medium", or "hard"
- is_overdue: true if due_date is before today and not yet completed
- is_complete: false (completed items are never sent to you)

--- SCORING RULES YOU MUST FOLLOW ---

1. DIFFICULTY WEIGHTS:
   - easy = 1.0
   - medium = 1.5
   - hard = 2.0
   - If type is "exam", multiply the difficulty weight by 1.5 additionally.

2. DEADLINE PROXIMITY DECAY (for each incomplete deadline):
   - days_until_due = due_date minus the date being calculated for
   - If days_until_due > 14: stress contribution = 0
   - If days_until_due is 8 to 14: stress contribution = weight × 5
   - If days_until_due is 4 to 7: stress contribution = weight × 15
   - If days_until_due is 1 to 3: stress contribution = weight × 30
   - If days_until_due = 0 (due today): stress contribution = weight × 40
   - If is_overdue = true (past due, not complete): fixed stress contribution = weight × 35 regardless of how many days overdue

3. CLUSTERING PENALTY:
   - For each day being calculated, check all incomplete deadlines.
   - Count how many deadlines have a due_date within a 5-day window centered on that day (2 days before to 2 days after, or adjust to fit the 5-day range).
   - If 2 deadlines fall within this 5-day window: multiply total workload score for that day by 1.2
   - If 3 or more deadlines fall within this 5-day window: multiply total workload score for that day by 1.4

4. MOOD MODIFIER:
   - Today (Day 0): convert today's mood score to a modifier as follows:
     mood 1 = 1.4, mood 2 = 1.2, mood 3 = 1.0, mood 4 = 0.8, mood 5 = 0.6
   - Days 1 through 7 (future days): use a neutral modifier of 1.0 for all future days since mood has not been logged yet.

5. FINAL DAILY SCORE:
   - raw_score = sum of all deadline stress contributions for that day (after clustering penalty applied)
   - final_score = raw_score × mood_modifier
   - Cap final_score at 100.
   - Round to nearest integer.

6. RISK LEVEL CLASSIFICATION:
   - 0 to 29: "low" (green)
   - 30 to 59: "moderate" (yellow)
   - 60 to 100: "high" (red)

7. CHART DISPLAY FLAG:
   - Day 0 is actual measured data. Set "is_actual": true for Day 0 only.
   - Days 1 through 7 are predicted. Set "is_actual": false.

--- WHAT TO RETURN ---

Return a single JSON object with this exact structure:

{
  "forecast": [
    {
      "day": 0,
      "date": "YYYY-MM-DD",
      "score": 0-100,
      "risk_level": "low" | "moderate" | "high",
      "is_actual": true,
      "contributing_deadlines": ["title1", "title2"]
    },
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "score": 0-100,
      "risk_level": "low" | "moderate" | "high",
      "is_actual": false,
      "contributing_deadlines": ["title1"]
    }
  ],
  "peak_stress_day": {
    "day": 0-7,
    "date": "YYYY-MM-DD",
    "score": 0-100,
    "reason": "One sentence explaining why this day peaks, mentioning specific assignment or exam titles."
  },
  "overdue_warning": "A short sentence listing any overdue incomplete assignments by title and urging the student to complete them. Return null if no overdue items exist.",
  "tip": {
    "category": "burnout_warning" | "academic_triage" | "high_energy_window" | "clustering_alert" | "general_wellness",
    "headline": "A short 6-8 word action-oriented headline.",
    "body": "2-3 sentences of specific, empathetic, actionable advice personalised to this student's exact workload pattern and mood. Reference specific assignment titles or subjects where relevant. Never use generic advice like 'take a break' without context. Tone: warm, supportive, never alarming."
  },
  "summary_sentence": "One plain-English sentence summarising the student's stress outlook for the next 7 days. Should be encouraging where possible."
}

--- TIP CATEGORY SELECTION RULES ---

Use these rules to choose the tip category before writing the tip body:

- "burnout_warning": peak score is high AND today's mood score is 1 or 2
- "academic_triage": 3 or more deadlines are due within the next 5 days
- "clustering_alert": clustering penalty was triggered on any day in the forecast
- "high_energy_window": today's mood score is 4 or 5 AND at least one high-difficulty deadline is due within 7 days
- "general_wellness": none of the above conditions are met

If multiple conditions are met, prioritise in this order: burnout_warning → academic_triage → clustering_alert → high_energy_window → general_wellness.
`;
}

async function generateStressForecast(moodScore, deadlines, todayDate) {
  try {
    const prompt = buildStressPrompt(moodScore, deadlines, todayDate);

    console.log("📊 Generating stress forecast...");
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1024,
    });
    
    const response = chatCompletion.choices[0]?.message?.content || "";

    // Clean response
    let cleanResponse = response.trim();
    cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const forecast = JSON.parse(cleanResponse);
    console.log("✅ Stress forecast generated successfully");
    return forecast;
  } catch (error) {
    console.error("❌ Stress forecast error:", error);
    throw new Error("Failed to generate stress forecast: " + error.message);
  }
}

module.exports = { generateStressForecast };