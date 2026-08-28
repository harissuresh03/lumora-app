// backend/services/stressPredictionService.js

const Groq = require("groq-sdk");
const db = require("../db");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Get the latest PSS score for a user
 */
async function getLatestPSS(userId) {
  try {
    const [result] = await db.promise().query(
      `
      SELECT score, severity
      FROM assessments
      WHERE user_id = ?
      AND type = 'pss'
      ORDER BY taken_at DESC
      LIMIT 1
      `,
      [userId]
    );

    if (result.length === 0) {
      return null;
    }

    return {
      score: result[0].score,
      severity: result[0].severity,
    };
  } catch (error) {
    console.error("❌ Error fetching PSS:", error);
    return null;
  }
}

/**
 * Build the stress prediction prompt with PSS
 */
function buildStressPrompt(moodScore, deadlines, todayDate, pss) {
  // Format deadlines for the prompt
  const deadlinesFormatted = deadlines.map((d) => ({
    title: d.title,
    subject: d.subject || "General",
    type: d.type || "assignment",
    due_date: d.due_date.toISOString().split("T")[0],
    difficulty: d.difficulty || "medium",
    is_overdue: d.due_date < new Date(todayDate),
  }));

  // Build PSS section
  let pssSection = "";

  if (pss) {
    let pssLevel = "";

    if (pss.score <= 13) {
      pssLevel = "Low (0-13)";
    } else if (pss.score <= 26) {
      pssLevel = "Moderate (14-26)";
    } else {
      pssLevel = "High (27-40)";
    }

    pssSection = `
**Perceived Stress Scale (PSS-10) Score:** ${pss.score}/40 (${pss.severity} - ${pssLevel})

**PSS Scoring Guide:**
- 0-13: Low perceived stress
- 14-26: Moderate perceived stress
- 27-40: High perceived stress

**Note:** The student's PSS score indicates they generally perceive ${pss.severity.toLowerCase()} stress in their life.
This should be factored into the stress forecast as a baseline adjustment.

- Low PSS (0-13): Reduce stress scores by 10%
- Moderate PSS (14-26): No adjustment
- High PSS (27-40): Increase stress scores by 15%
`;
  } else {
    pssSection = `
**Perceived Stress Scale (PSS-10) Score:** Not available

The student has not completed the assessment.

Note:
Use mood score and academic deadlines for stress calculation.
Consider suggesting that the student complete the PSS assessment.
`;
  }

  return `
You are a stress analysis engine for a university student mental health web application.

Your role is to analyze a student's academic workload and daily mood data, then generate a personalized stress forecast.

IMPORTANT:
You must respond with ONLY valid JSON.

Do NOT include:
- Markdown
- Code blocks
- Explanations before the JSON
- Explanations after the JSON
- Comments

The response must start with { and end with }.

Analyze the following student data.

--- STUDENT DATA ---

Today's date: ${todayDate}

Today's mood log:
1 = Terrible
2 = Bad
3 = Okay
4 = Good
5 = Great

Today's mood score: ${moodScore}

If today's mood has not been logged yet, use a neutral modifier of 1.0.

${pssSection}

--- UPCOMING AND OVERDUE ACADEMIC DEADLINES ---

${JSON.stringify(deadlinesFormatted, null, 2)}

Each deadline has:

- title
- subject
- type
- due_date
- difficulty
- is_overdue

All deadlines provided are incomplete.

--- FORECAST PERIOD ---

Generate exactly 8 forecast data points:

- Day 0 = today (actual measured data)
- Day 1 = tomorrow
- Day 2
- Day 3
- Day 4
- Day 5
- Day 6
- Day 7 = seven days from today

Day 0 must have:

"is_actual": true

Days 1 through 7 must have:

"is_actual": false

--- SCORING RULES ---

1. DIFFICULTY WEIGHTS

easy = 1.0
medium = 1.5
hard = 2.0

If type is "exam":

Multiply the difficulty weight by 1.5.

---

2. DEADLINE PROXIMITY DECAY

For each incomplete deadline:

Calculate:

days_until_due = due_date minus the date being calculated.

If days_until_due > 14:

stress contribution = 0

If days_until_due is 8 to 14:

stress contribution = weight × 5

If days_until_due is 4 to 7:

stress contribution = weight × 15

If days_until_due is 1 to 3:

stress contribution = weight × 30

If days_until_due = 0:

stress contribution = weight × 40

If is_overdue = true:

stress contribution = weight × 35

regardless of how many days overdue.

---

3. CLUSTERING PENALTY

For each forecast day:

Check all incomplete deadlines.

Count how many deadlines have a due date within a 5-day window centered on that day.

If 2 deadlines fall within this window:

Multiply total workload score by 1.2

If 3 or more deadlines fall within this window:

Multiply total workload score by 1.4

---

4. MOOD MODIFIER

For Day 0 only:

Mood 1 = 1.4
Mood 2 = 1.2
Mood 3 = 1.0
Mood 4 = 0.8
Mood 5 = 0.6

For Days 1 through 7:

Use neutral modifier = 1.0

---

5. PSS BASELINE ADJUSTMENT

If PSS score is available:

Low PSS (0-13):

Multiply final score by 0.90

Moderate PSS (14-26):

Multiply final score by 1.0

High PSS (27-40):

Multiply final score by 1.15

If PSS score is unavailable:

Multiply final score by 1.0

---

6. FINAL DAILY SCORE

raw_score =
sum of all deadline stress contributions.

Apply clustering penalty.

score_with_mood =
raw_score × mood_modifier

final_score =
score_with_mood × pss_adjustment

Rules:

- Cap final_score at 100.
- Minimum score is 0.
- Round to nearest integer.

---

7. RISK LEVEL CLASSIFICATION

0 to 29 = "low"

30 to 59 = "moderate"

60 to 100 = "high"

---

8. CONTRIBUTING DEADLINES

For each day:

Include titles of deadlines that contribute to the stress score.

Example:

"contributing_deadlines": [
  "Software Engineering Assignment",
  "Database Exam"
]

If no deadlines contribute:

"contributing_deadlines": []

--- TIP CATEGORY RULES ---

Choose the tip category using these rules.

"burnout_warning":

Peak score is high AND today's mood score is 1 or 2.

"academic_triage":

3 or more deadlines are due within the next 5 days.

"clustering_alert":

Clustering penalty was triggered on any forecast day.

"high_energy_window":

Today's mood score is 4 or 5 AND at least one hard deadline is due within 7 days.

"pss_high":

PSS score is high (27-40).

"pss_moderate":

PSS score is moderate (14-26).

"pss_low":

PSS score is low (0-13).

"general_wellness":

None of the above conditions apply.

If multiple conditions apply, use this priority:

burnout_warning
→ academic_triage
→ pss_high
→ clustering_alert
→ high_energy_window
→ pss_moderate
→ pss_low
→ general_wellness

--- REQUIRED JSON FORMAT ---

Return EXACTLY this structure:

{
  "forecast": [
    {
      "day": 0,
      "date": "YYYY-MM-DD",
      "score": 0,
      "risk_level": "low",
      "is_actual": true,
      "contributing_deadlines": []
    },
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "score": 0,
      "risk_level": "low",
      "is_actual": false,
      "contributing_deadlines": []
    }
  ],
  "peak_stress_day": {
    "day": 0,
    "date": "YYYY-MM-DD",
    "score": 0,
    "reason": "One short sentence explaining why this day has the highest stress score."
  },
  "overdue_warning": null,
  "tip": {
    "category": "general_wellness",
    "headline": "A short action-oriented headline",
    "body": "Two or three sentences of specific, empathetic, and actionable advice based on the student's workload and mood."
  },
  "summary_sentence": "One encouraging sentence summarising the student's stress outlook for the next seven days."
}

IMPORTANT JSON REQUIREMENTS:

1. "forecast" must contain EXACTLY 8 objects.
2. The days must be 0, 1, 2, 3, 4, 5, 6, and 7.
3. All strings must use double quotes.
4. Do not include trailing commas.
5. Do not include markdown code blocks.
6. Ensure the JSON is complete and properly closed.
7. Keep "reason", "headline", "body", and "summary_sentence" concise to reduce response length.
8. Return ONLY the JSON object.
`;
}

/**
 * Fallback: Generate forecast using heuristics when AI fails
 */
function generateFallbackForecast(moodScore, deadlines, todayDate, pss) {
  const today = new Date(todayDate);
  const forecast = [];
  let peakDay = { day: 0, date: todayDate, score: 0, reason: "" };

  for (let i = 0; i < 8; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    let totalStress = 0;
    let contributing = [];

    deadlines.forEach(d => {
      const dueDate = new Date(d.due_date);
      const daysUntil = Math.ceil((dueDate - date) / (1000 * 60 * 60 * 24));
      let weight = d.difficulty === 'easy' ? 1 : d.difficulty === 'medium' ? 1.5 : 2;
      if (d.type === 'exam') weight *= 1.5;

      let contribution = 0;
      if (daysUntil > 14) contribution = 0;
      else if (daysUntil >= 8) contribution = weight * 5;
      else if (daysUntil >= 4) contribution = weight * 15;
      else if (daysUntil >= 1) contribution = weight * 30;
      else if (daysUntil === 0) contribution = weight * 40;
      else if (daysUntil < 0) contribution = weight * 35; // overdue

      if (contribution > 0) {
        totalStress += contribution;
        contributing.push(d.title);
      }
    });

    // Clustering penalty
    const deadlinesInWindow = deadlines.filter(d => {
      const diff = Math.abs(Math.ceil((new Date(d.due_date) - date) / (1000 * 60 * 60 * 24)));
      return diff <= 2;
    }).length;
    if (deadlinesInWindow >= 3) totalStress *= 1.4;
    else if (deadlinesInWindow >= 2) totalStress *= 1.2;

    // Mood modifier (only for day 0)
    const moodModifier = i === 0 ? (moodScore === 1 ? 1.4 : moodScore === 2 ? 1.2 : moodScore === 3 ? 1.0 : moodScore === 4 ? 0.8 : 0.6) : 1.0;
    let finalScore = Math.round(totalStress * moodModifier);

    // PSS adjustment if available
    if (pss) {
      const pssAdjust = pss.score <= 13 ? 0.9 : pss.score <= 26 ? 1.0 : 1.15;
      finalScore = Math.round(finalScore * pssAdjust);
    }

    finalScore = Math.min(Math.max(finalScore, 0), 100);

    forecast.push({
      day: i,
      date: dateStr,
      score: finalScore,
      risk_level: finalScore < 30 ? "low" : finalScore < 60 ? "moderate" : "high",
      is_actual: i === 0,
      contributing_deadlines: contributing
    });

    if (finalScore > peakDay.score) {
      peakDay = { day: i, date: dateStr, score: finalScore, reason: `Peak stress on ${dateStr}` };
    }
  }

  return {
    forecast,
    peak_stress_day: peakDay,
    overdue_warning: deadlines.some(d => new Date(d.due_date) < new Date(todayDate)) ? "You have overdue assignments. Please complete them soon." : null,
    tip: {
      category: "general_wellness",
      headline: "Stay on top of your deadlines",
      body: "Break down tasks into smaller steps and take short breaks to maintain productivity."
    },
    summary_sentence: "Your stress levels are manageable this week. Stay organized and take care of yourself."
  };
}

/**
 * Generate AI-powered stress forecast with fallback
 */
async function generateStressForecast(moodScore, deadlines, todayDate, userId) {
  try {
    const pss = await getLatestPSS(userId);
    const prompt = buildStressPrompt(moodScore, deadlines, todayDate, pss);

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-120b",
      temperature: 0.2,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const response = chatCompletion.choices[0]?.message?.content || "";
    let cleanResponse = response.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");

    if (!cleanResponse.startsWith("{") || !cleanResponse.endsWith("}")) {
      throw new Error("AI response is not valid JSON");
    }

    let forecast = JSON.parse(cleanResponse);
    if (!forecast.forecast || !Array.isArray(forecast.forecast) || forecast.forecast.length !== 8) {
      throw new Error("AI response missing expected forecast array");
    }

    return forecast;
  } catch (error) {
    console.error("❌ Stress forecast AI error:", error.message);
    // Return fallback forecast instead of throwing
    const fallback = generateFallbackForecast(moodScore, deadlines, todayDate, await getLatestPSS(userId));
    fallback._warning = "AI unavailable – using fallback forecast";
    return fallback;
  }
}

module.exports = {
  generateStressForecast,
  getLatestPSS,
};