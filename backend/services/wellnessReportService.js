// backend/services/wellnessReportService.js

const Groq = require("groq-sdk");
const PDFDocument = require('pdfkit');
const db = require("../db");

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Design Tokens ────────────────────────────────────────────────────────────
const COLORS = {
  primary:    '#4F46E5',
  primaryLight:'#EEF2FF',
  danger:     '#DC2626',
  dangerLight:'#FEF2F2',
  warning:    '#D97706',
  warningLight:'#FFFBEB',
  success:    '#16A34A',
  successLight:'#F0FDF4',
  text:       '#111827',
  textMuted:  '#6B7280',
  textLight:  '#9CA3AF',
  border:     '#E5E7EB',
  bg:         '#F9FAFB',
  white:      '#FFFFFF',
};

const MOOD_COLORS  = { 1:'#EF4444', 2:'#F97316', 3:'#EAB308', 4:'#22C55E', 5:'#16A34A' };
const SLEEP_COLORS = { 1:'#EF4444', 2:'#F97316', 3:'#EAB308', 4:'#22C55E', 5:'#16A34A' };

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;
const MAX_Y = PAGE_H - 40; // Max content Y before page break

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val, decimals = 1) {
  if (val === null || val === undefined || val === 'N/A') return 'N/A';
  const n = parseFloat(val);
  return isNaN(n) ? 'N/A' : n.toFixed(decimals);
}

function fmtDate(val) {
  if (!val) return '—';
  try { return new Date(val).toLocaleDateString('en-GB'); } catch { return '—'; }
}

function fmtDateTime(val) {
  if (!val) return '—';
  try { return new Date(val).toLocaleString('en-GB'); } catch { return '—'; }
}

function getRiskLevel(stressForecast) {
  const score = stressForecast?.forecast?.[0]?.score ?? 0;
  if (score >= 60) return { label: 'High Risk', color: COLORS.danger, bg: COLORS.dangerLight };
  if (score >= 30) return { label: 'Moderate Risk', color: COLORS.warning, bg: COLORS.warningLight };
  return { label: 'Low Risk', color: COLORS.success, bg: COLORS.successLight };
}

function rule(doc, y, color = COLORS.border) {
  doc.save()
     .lineWidth(0.5)
     .strokeColor(color)
     .moveTo(MARGIN, y)
     .lineTo(PAGE_W - MARGIN, y)
     .stroke()
     .restore();
}

function sectionHeading(doc, text, y) {
  doc.save().rect(MARGIN, y, 3, 14).fill(COLORS.primary).restore();
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.text).text(text, MARGIN + 10, y + 1);
  return y + 22;
}

function filledBox(doc, x, y, w, h, fillColor, strokeColor) {
  doc.save().rect(x, y, w, h).fill(fillColor);
  if (strokeColor) doc.rect(x, y, w, h).stroke(strokeColor);
  doc.restore();
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function barChart(doc, x, y, w, h, data, maxVal, yLabel) {
  const axisX = x + 28;
  const axisW = w - 32;
  const axisY = y;
  const axisH = h;
  const bottomY = axisY + axisH;

  const ticks = [0, maxVal / 2, maxVal];
  ticks.forEach(tick => {
    const ty = bottomY - (tick / maxVal) * axisH;
    doc.save()
       .lineWidth(0.4)
       .strokeColor(COLORS.border)
       .moveTo(axisX, ty)
       .lineTo(axisX + axisW, ty)
       .stroke()
       .restore();
    doc.fontSize(7).font('Helvetica').fillColor(COLORS.textLight)
       .text(String(tick), x, ty - 3, { width: 25, align: 'right' });
  });

  if (yLabel) {
    doc.fontSize(7).font('Helvetica').fillColor(COLORS.textMuted)
       .text(yLabel, x, y - 10, { width: 60 });
  }

  if (!data || data.length === 0) {
    doc.fontSize(9).fillColor(COLORS.textLight)
       .text('No data available', axisX + axisW / 2 - 30, axisY + axisH / 2);
    return;
  }

  const totalBars = data.length;
  const barMaxW = 14;
  const gap = Math.max(1, (axisW - totalBars * barMaxW) / (totalBars + 1));
  const barW = Math.min(barMaxW, (axisW - gap * (totalBars + 1)) / totalBars);

  data.forEach((item, i) => {
    const bh = Math.max(1, (item.value / maxVal) * axisH);
    const bx = axisX + gap + i * (barW + gap);
    const by = bottomY - bh;

    doc.save().rect(bx, by, barW, bh).fill(item.color || COLORS.primary).restore();

    if (item.label) {
      doc.fontSize(6).font('Helvetica').fillColor(COLORS.textLight)
         .text(item.label, bx - 2, bottomY + 3, { width: barW + 4, align: 'center' });
    }
  });

  doc.save()
     .lineWidth(0.8)
     .strokeColor(COLORS.textLight)
     .moveTo(axisX, axisY)
     .lineTo(axisX, bottomY)
     .lineTo(axisX + axisW, bottomY)
     .stroke()
     .restore();
}

// ─── AI Insights ──────────────────────────────────────────────────────────────
async function generateAIInsights(studentId, studentName, stats, moods, sleep, assessments, deadlines, stressForecast) {
  try {
    const moodData = moods.slice(0, 30).reverse();
    const sleepData = sleep.slice(0, 30).reverse();
    const moodValues = moodData.map(m => m.mood);
    const sleepValues = sleepData.map(s => s.quality);
    const moodTrend = moodValues.length > 1 ? moodValues[moodValues.length - 1] - moodValues[0] : 0;
    const sleepTrend = sleepValues.length > 1 ? sleepValues[sleepValues.length - 1] - sleepValues[0] : 0;

    const prompt = `
You are a mental health wellness analyst. Generate a comprehensive wellness summary for a student based on their data.

Student: ${studentName}

Key Metrics:
- Average Mood (30 days): ${stats.avg_mood || 'N/A'}/5
- Mood Trend: ${moodTrend > 0 ? 'Improving' : moodTrend < 0 ? 'Declining' : 'Stable'} (${moodTrend > 0 ? '+' : ''}${moodTrend.toFixed(1)})
- Average Sleep Quality (30 days): ${stats.avg_sleep_quality || 'N/A'}/5
- Sleep Trend: ${sleepTrend > 0 ? 'Improving' : sleepTrend < 0 ? 'Declining' : 'Stable'} (${sleepTrend > 0 ? '+' : ''}${sleepTrend.toFixed(1)})
- Average Sleep Duration: ${stats.avg_sleep_duration || 'N/A'} hours
- Journal Entries (7 days): ${stats.journal_count || 0}
- Crisis Alerts: ${stats.crisis_alerts || 0}
- Total Assessments: ${stats.assessment_count || 0}

Latest Assessment:
${assessments.length > 0 ? `- Type: ${assessments[0].type.toUpperCase()}, Score: ${assessments[0].score}, Severity: ${assessments[0].severity}` : 'No assessments taken yet'}

Upcoming Deadlines (${deadlines.length}):
${deadlines.map(d => `- ${d.title} (${d.subject || 'No subject'}) - Due: ${d.due_date}, Difficulty: ${d.difficulty}`).join('\n') || 'No deadlines'}

Current Stress Score: ${stressForecast ? stressForecast.forecast[0]?.score || 'N/A' : 'N/A'}/100
Peak Stress Day: ${stressForecast ? stressForecast.peak_stress_day?.date || 'N/A' : 'N/A'}

Based on this data, provide a professional wellness summary with:
1. Overall Assessment: 2-3 sentences on the student's current mental health status
2. Key Findings: 3-4 key observations about patterns, risks, or strengths
3. Risk Factors: Specific risk factors (academic, emotional, social, sleep-related)
4. Recommendations: 4 specific, actionable recommendations for the counsellor

Keep the tone professional, empathetic, and non-alarming. Be specific using the data provided.

Return ONLY valid JSON (no markdown fences):
{
  "overallAssessment": "string",
  "keyFindings": ["string", "string", "string"],
  "riskFactors": ["string", "string", "string"],
  "recommendations": ["string", "string", "string", "string"]
}
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-oss-120b",
      temperature: 0.4,
      max_tokens: 1024,
    });
    
    let text = chatCompletion.choices[0]?.message?.content?.trim() || "";
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    return JSON.parse(text);
  } catch (err) {
    console.error("AI insights error:", err);
    return {
      overallAssessment: "AI insights temporarily unavailable. Please review the data below manually.",
      keyFindings: ["Unable to analyze patterns at this time."],
      riskFactors: ["Data could not be processed automatically."],
      recommendations: ["Please review student data and conduct a direct assessment."]
    };
  }
}

// ─── Data Fetching ────────────────────────────────────────────────────────────
async function generateWellnessReport(studentId, counsellorId) {
  const [student] = await db.promise().query(
    `SELECT u.id, u.name, u.nickname, u.email, u.counsellor_consent,
            u.created_at, u.last_login, un.name as university_name
     FROM users u
     LEFT JOIN universities un ON u.university_id = un.id
     WHERE u.id = ? AND u.role = 'student'`,
    [studentId]
  );
  if (!student.length) throw new Error("Student not found");

  const [statsResult] = await db.promise().query(`
    SELECT
      (SELECT AVG(mood)     FROM moods  WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as avg_mood,
      (SELECT AVG(quality)  FROM sleep  WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as avg_sleep_quality,
      (SELECT AVG(duration) FROM sleep  WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as avg_sleep_duration,
      (SELECT COUNT(*)      FROM journals WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as journal_count,
      (SELECT COUNT(*)      FROM assessments WHERE user_id = ?) as assessment_count,
      (SELECT COUNT(*)      FROM crisis_alerts WHERE student_id = ? AND is_resolved = 0) as crisis_alerts
  `, [studentId, studentId, studentId, studentId, studentId, studentId]);

  const [moods] = await db.promise().query(`SELECT mood, DATE(created_at) as date FROM moods WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`, [studentId]);
  const [sleep] = await db.promise().query(`SELECT quality, duration, DATE(created_at) as date FROM sleep WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`, [studentId]);
  const [assessments] = await db.promise().query(`SELECT type, score, severity, taken_at FROM assessments WHERE user_id = ? ORDER BY taken_at DESC LIMIT 5`, [studentId]);
  const [deadlines] = await db.promise().query(`SELECT title, subject, type, due_date, difficulty, is_complete FROM deadlines WHERE user_id = ? AND is_complete = 0 ORDER BY due_date ASC`, [studentId]);
  const [alerts] = await db.promise().query(`SELECT alert_type, severity, message, created_at, is_resolved FROM crisis_alerts WHERE student_id = ? ORDER BY created_at DESC LIMIT 5`, [studentId]);
  const [sessions] = await db.promise().query(`SELECT session_date, duration, status, notes FROM counselling_sessions WHERE student_id = ? ORDER BY session_date DESC LIMIT 5`, [studentId]);

  const [stressResult] = await db.promise().query(`SELECT forecast_data, peak_stress_day FROM stress_forecast WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`, [studentId]);
  let stressForecast = null;
  if (stressResult.length > 0) {
    stressForecast = {
      forecast: JSON.parse(stressResult[0].forecast_data),
      peak_stress_day: JSON.parse(stressResult[0].peak_stress_day)
    };
  }

  const stats = statsResult[0];
  const aiInsights = await generateAIInsights(studentId, student[0].name, stats, moods, sleep, assessments, deadlines, stressForecast);

  const doc = new PDFDocument({ margin: MARGIN, size: 'A4', autoFirstPage: false });
  const filename = `wellness_report_${student[0].name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

  const reportData = { student: student[0], stats, moods, sleep, assessments, deadlines, alerts, sessions, stressForecast, aiInsights, generatedAt: new Date().toISOString() };

  return { doc, filename, reportData };
}

// ─── PDF Builder ──────────────────────────────────────────────────────────────
function buildPDF(doc, reportData) {
  const { student, stats, moods, sleep, assessments, deadlines, alerts, sessions, stressForecast, aiInsights, generatedAt } = reportData;
  const risk = getRiskLevel(stressForecast);

  let y = 40;

  // ── PAGE 1 ──────────────────────────────────────────────────────────────────
  doc.addPage();
  y = 40;

  // Title
  doc.fontSize(18).font('Helvetica-Bold').fillColor(COLORS.primary)
     .text('Wellness Report', MARGIN, y);
  y += 30;

  // Student Info Block
  filledBox(doc, MARGIN, y, CONTENT_W, 70, COLORS.bg, COLORS.border);

  const badgeW = 110;
  filledBox(doc, PAGE_W - MARGIN - badgeW, y + 10, badgeW, 24, risk.color, null);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.white)
     .text(risk.label.toUpperCase(), PAGE_W - MARGIN - badgeW, y + 16, { width: badgeW, align: 'center' });

  doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text)
     .text(student.name, MARGIN + 12, y + 10);
  doc.fontSize(9).font('Helvetica').fillColor(COLORS.textMuted)
     .text(`@${student.nickname || '—'}  |  ${student.email}`, MARGIN + 12, y + 28);
  doc.fontSize(9).fillColor(COLORS.textMuted)
     .text(`University: ${student.university_name || '—'}  |  Joined: ${fmtDate(student.created_at)}`, MARGIN + 12, y + 44);

  y += 82;

  // Key Metrics
  y = sectionHeading(doc, 'KEY METRICS', y);

  const metricItems = [
    { label: 'Avg Mood', value: stats.avg_mood ? `${fmt(stats.avg_mood)} / 5` : 'N/A', sub: '30-day average' },
    { label: 'Avg Sleep Quality', value: stats.avg_sleep_quality ? `${fmt(stats.avg_sleep_quality)} / 5` : 'N/A', sub: '30-day average' },
    { label: 'Avg Sleep Duration', value: stats.avg_sleep_duration ? `${fmt(stats.avg_sleep_duration)} hrs` : 'N/A', sub: '30-day average' },
    { label: 'Stress Score', value: stressForecast?.forecast?.[0]?.score ?? 'N/A', sub: 'Current / 100' },
    { label: 'Crisis Alerts', value: stats.crisis_alerts ?? 0, sub: 'Unresolved' },
    { label: 'Journal Entries', value: stats.journal_count ?? 0, sub: 'Last 7 days' },
  ];

  const cardW = Math.floor((CONTENT_W - 10) / 3);
  const cardH = 52;
  const cardGap = 5;

  metricItems.forEach((m, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = MARGIN + col * (cardW + cardGap);
    const cy = y + row * (cardH + cardGap);

    filledBox(doc, cx, cy, cardW, cardH, COLORS.white, COLORS.border);

    doc.fontSize(18).font('Helvetica-Bold').fillColor(COLORS.primary)
       .text(String(m.value), cx + 8, cy + 8, { width: cardW - 16 });
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.text)
       .text(m.label, cx + 8, cy + 30, { width: cardW - 16 });
    doc.fontSize(7).font('Helvetica').fillColor(COLORS.textLight)
       .text(m.sub, cx + 8, cy + 41, { width: cardW - 16 });
  });

  y += 2 * (cardH + cardGap) + 16;

  // Latest Assessments
  y = sectionHeading(doc, 'LATEST ASSESSMENTS', y);

  if (assessments.length === 0) {
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.textMuted).text('No assessments on record.', MARGIN, y);
    y += 16;
  } else {
    const aColW = [60, 60, 80, 200, 80];
    const aHeaders = ['Type', 'Score', 'Severity', 'Date', ''];

    filledBox(doc, MARGIN, y, CONTENT_W, 18, COLORS.primaryLight, null);
    let ax = MARGIN + 6;
    aHeaders.forEach((h, i) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.primary).text(h, ax, y + 5, { width: aColW[i] });
      ax += aColW[i];
    });
    y += 18;

    assessments.slice(0, 4).forEach((a, idx) => {
      const rowBg = idx % 2 === 0 ? COLORS.white : COLORS.bg;
      filledBox(doc, MARGIN, y, CONTENT_W, 18, rowBg, null);
      rule(doc, y + 18);

      const sevColor = { 'Minimal': COLORS.success, 'Mild': COLORS.warning, 'Moderate': COLORS.warning, 'Severe': COLORS.danger }[a.severity?.split(' ')[0]] || COLORS.textMuted;
      ax = MARGIN + 6;
      
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(a.type?.toUpperCase() || '—', ax, y + 5, { width: aColW[0] });
      ax += aColW[0];
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(`${a.score}/27`, ax, y + 5, { width: aColW[1] });
      ax += aColW[1];
      doc.fontSize(8).font('Helvetica').fillColor(sevColor).text(a.severity || '—', ax, y + 5, { width: aColW[2] });
      ax += aColW[2];
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(fmtDate(a.taken_at), ax, y + 5, { width: aColW[3] });
      
      y += 18;
    });
    y += 8;
  }

  // Upcoming Deadlines
  y = sectionHeading(doc, 'UPCOMING DEADLINES', y);

  if (deadlines.length === 0) {
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.textMuted).text('No upcoming deadlines.', MARGIN, y);
    y += 16;
  } else {
    const dHeaders = ['Title', 'Subject', 'Due Date', 'Difficulty'];
    const dColW = [200, 130, 90, 75];

    filledBox(doc, MARGIN, y, CONTENT_W, 18, COLORS.primaryLight, null);
    let dx = MARGIN + 6;
    dHeaders.forEach((h, i) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.primary).text(h, dx, y + 5, { width: dColW[i] });
      dx += dColW[i];
    });
    y += 18;

    deadlines.slice(0, 5).forEach((d, idx) => {
      const rowBg = idx % 2 === 0 ? COLORS.white : COLORS.bg;
      filledBox(doc, MARGIN, y, CONTENT_W, 18, rowBg, null);
      rule(doc, y + 18);

      const diffColor = { easy: COLORS.success, medium: COLORS.warning, hard: COLORS.danger }[d.difficulty] || COLORS.textMuted;
      dx = MARGIN + 6;
      
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(d.title, dx, y + 5, { width: dColW[0] });
      dx += dColW[0];
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(d.subject || '—', dx, y + 5, { width: dColW[1] });
      dx += dColW[1];
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(fmtDate(d.due_date), dx, y + 5, { width: dColW[2] });
      dx += dColW[2];
      doc.fontSize(8).font('Helvetica').fillColor(diffColor).text(d.difficulty || '—', dx, y + 5, { width: dColW[3] });
      
      y += 18;
    });
    y += 8;
  }

  // ── PAGE 2: Charts ─────────────────────────────────────────────────────────
  doc.addPage();
  y = 40;

  // Mood Chart
  y = sectionHeading(doc, 'MOOD TREND — LAST 30 DAYS', y);

  const moodChartData = moods.slice(0, 30).reverse().map(m => ({
    value: m.mood,
    label: new Date(m.date).getDate().toString(),
    color: MOOD_COLORS[m.mood] || COLORS.primary,
  }));

  if (moodChartData.length > 0) {
    [1,2,3,4,5].forEach((v, i) => {
      const lx = MARGIN + i * 70;
      doc.save().rect(lx, y, 10, 8).fill(MOOD_COLORS[v]).restore();
      doc.fontSize(7).font('Helvetica').fillColor(COLORS.textMuted)
         .text(['Very Low','Low','Neutral','Good','Excellent'][i], lx + 13, y);
    });
    y += 14;
    barChart(doc, MARGIN, y, CONTENT_W, 90, moodChartData, 5, 'Mood (1-5)');
    y += 110;
  } else {
    doc.fontSize(9).fillColor(COLORS.textLight).text('No mood data recorded.', MARGIN, y);
    y += 24;
  }

  // Sleep Quality Chart
  y = sectionHeading(doc, 'SLEEP QUALITY TREND — LAST 30 DAYS', y);

  const sleepChartData = sleep.slice(0, 30).reverse().map(s => ({
    value: s.quality,
    label: new Date(s.date).getDate().toString(),
    color: SLEEP_COLORS[s.quality] || COLORS.primary,
  }));

  if (sleepChartData.length > 0) {
    [1,2,3,4,5].forEach((v, i) => {
      const lx = MARGIN + i * 70;
      doc.save().rect(lx, y, 10, 8).fill(SLEEP_COLORS[v]).restore();
      doc.fontSize(7).font('Helvetica').fillColor(COLORS.textMuted)
         .text(['Very Poor','Poor','Fair','Good','Excellent'][i], lx + 13, y);
    });
    y += 14;
    barChart(doc, MARGIN, y, CONTENT_W, 90, sleepChartData, 5, 'Quality (1-5)');
    y += 110;
  } else {
    doc.fontSize(9).fillColor(COLORS.textLight).text('No sleep data recorded.', MARGIN, y);
    y += 24;
  }

  // Sleep Duration Chart
  y = sectionHeading(doc, 'SLEEP DURATION TREND — LAST 30 DAYS', y);

  const durationData = sleep.slice(0, 30).reverse().map(s => ({
    value: Math.min(s.duration || 0, 12),
    label: new Date(s.date).getDate().toString(),
    color: (s.duration >= 7 && s.duration <= 9) ? COLORS.success : COLORS.warning,
  }));

  if (durationData.length > 0) {
    doc.save().rect(MARGIN, y, 10, 8).fill(COLORS.success).restore();
    doc.fontSize(7).fillColor(COLORS.textMuted).text('Recommended (7-9 hrs)', MARGIN + 13, y);
    doc.save().rect(MARGIN + 130, y, 10, 8).fill(COLORS.warning).restore();
    doc.fontSize(7).fillColor(COLORS.textMuted).text('Outside range', MARGIN + 143, y);
    y += 14;
    barChart(doc, MARGIN, y, CONTENT_W, 80, durationData, 12, 'Hours');
    y += 100;
  } else {
    doc.fontSize(9).fillColor(COLORS.textLight).text('No sleep duration data.', MARGIN, y);
    y += 24;
  }

  // ── PAGE 3: AI Insights ────────────────────────────────────────────────────
  doc.addPage();
  y = 40;

  // AI Insights header
  filledBox(doc, MARGIN, y, CONTENT_W, 26, COLORS.primaryLight, COLORS.border);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary)
     .text('AI WELLNESS INSIGHTS', MARGIN + 10, y + 8);
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.textMuted)
     .text('Generated by Groq AI', PAGE_W - MARGIN - 150, y + 9);
  y += 36;

  // Overall Assessment
  filledBox(doc, MARGIN, y, CONTENT_W, 8, COLORS.primary, null);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.white).text('OVERALL ASSESSMENT', MARGIN + 8, y + 1);
  y += 14;
  
  const overallText = aiInsights.overallAssessment || 'Not available.';
  doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
     .text(overallText, MARGIN, y, { width: CONTENT_W, lineGap: 3 });
  y += doc.heightOfString(overallText, { width: CONTENT_W }) + 14;

  // Key Findings
  filledBox(doc, MARGIN, y, CONTENT_W, 8, COLORS.primary, null);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.white).text('KEY FINDINGS', MARGIN + 8, y + 1);
  y += 14;
  
  (aiInsights.keyFindings || []).forEach((f) => {
    doc.save().circle(MARGIN + 5, y + 4, 3).fill(COLORS.primary).restore();
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
       .text(f, MARGIN + 14, y, { width: CONTENT_W - 14, lineGap: 2 });
    y += doc.heightOfString(f, { width: CONTENT_W - 14 }) + 6;
  });
  y += 6;

  // Risk Factors
  filledBox(doc, MARGIN, y, CONTENT_W, 8, COLORS.danger, null);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.white).text('RISK FACTORS', MARGIN + 8, y + 1);
  y += 14;
  
  (aiInsights.riskFactors || []).forEach((f) => {
    const textHeight = doc.heightOfString(f, { width: CONTENT_W - 28 });
    filledBox(doc, MARGIN, y, CONTENT_W, textHeight + 10, COLORS.dangerLight, null);
    doc.save().rect(MARGIN, y, 3, textHeight + 10).fill(COLORS.danger).restore();
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
       .text(f, MARGIN + 10, y + 5, { width: CONTENT_W - 18, lineGap: 2 });
    y += textHeight + 16;
  });
  y += 6;

  // Recommendations
  filledBox(doc, MARGIN, y, CONTENT_W, 8, COLORS.success, null);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.white).text('RECOMMENDATIONS', MARGIN + 8, y + 1);
  y += 14;
  
  (aiInsights.recommendations || []).forEach((r, i) => {
    const textHeight = doc.heightOfString(r, { width: CONTENT_W - 40 });
    filledBox(doc, MARGIN, y, CONTENT_W, textHeight + 10, COLORS.successLight, null);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.success)
       .text(String(i + 1), MARGIN + 8, y + 5);
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
       .text(r, MARGIN + 22, y + 5, { width: CONTENT_W - 30, lineGap: 2 });
    y += textHeight + 16;
  });

  // ── PAGE 4: Session History ────────────────────────────────────────────────
  doc.addPage();
  y = 40;

  // Crisis Alerts
  y = sectionHeading(doc, 'CRISIS ALERTS', y);

  if (alerts.length === 0) {
    filledBox(doc, MARGIN, y, CONTENT_W, 22, COLORS.successLight, COLORS.border);
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.success)
       .text('No crisis alerts on record.', MARGIN + 10, y + 7);
    y += 30;
  } else {
    alerts.forEach((a) => {
      const rowBg = a.is_resolved ? COLORS.bg : COLORS.dangerLight;
      const rowH = 22;
      filledBox(doc, MARGIN, y, CONTENT_W, rowH, rowBg, COLORS.border);
      if (!a.is_resolved) {
        doc.save().rect(MARGIN, y, 3, rowH).fill(COLORS.danger).restore();
      }
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.text)
         .text(a.alert_type || 'Alert', MARGIN + 8, y + 7, { width: 120 });
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.textMuted)
         .text(`Severity: ${a.severity || '—'}`, MARGIN + 130, y + 7, { width: 100 });
      doc.fontSize(8).fillColor(COLORS.textMuted)
         .text(fmtDateTime(a.created_at), MARGIN + 250, y + 7, { width: 140 });
      const statusColor = a.is_resolved ? COLORS.success : COLORS.danger;
      doc.fontSize(8).font('Helvetica-Bold').fillColor(statusColor)
         .text(a.is_resolved ? 'Resolved' : 'Active', MARGIN + 410, y + 7, { width: 70 });
      y += rowH + 3;
    });
    y += 8;
  }

  // Counselling Sessions
  y = sectionHeading(doc, 'COUNSELLING SESSION HISTORY', y);

  if (sessions.length === 0) {
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.textMuted).text('No sessions recorded.', MARGIN, y);
    y += 16;
  } else {
    const sHeaders = ['Date', 'Duration', 'Status', 'Notes'];
    const sColW = [100, 80, 90, 225];

    filledBox(doc, MARGIN, y, CONTENT_W, 18, COLORS.primaryLight, null);
    let sx = MARGIN + 6;
    sHeaders.forEach((h, i) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.primary).text(h, sx, y + 5, { width: sColW[i] });
      sx += sColW[i];
    });
    y += 18;

    sessions.forEach((s, idx) => {
      const rowH = s.notes ? 30 : 18;
      const rowBg = idx % 2 === 0 ? COLORS.white : COLORS.bg;
      filledBox(doc, MARGIN, y, CONTENT_W, rowH, rowBg, null);
      rule(doc, y + rowH);

      const statusColor = { pending: COLORS.warning, confirmed: COLORS.primary, completed: COLORS.success, cancelled: COLORS.danger }[s.status] || COLORS.textMuted;
      sx = MARGIN + 6;
      
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(fmtDate(s.session_date), sx, y + 5, { width: sColW[0] });
      sx += sColW[0];
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(`${s.duration || 60} min`, sx, y + 5, { width: sColW[1] });
      sx += sColW[1];
      doc.fontSize(8).font('Helvetica-Bold').fillColor(statusColor).text(s.status || '—', sx, y + 5, { width: sColW[2] });
      sx += sColW[2];
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(s.notes || '—', sx, y + 5, { width: sColW[3] });
      
      y += rowH + 3;
    });
    y += 12;
  }

  // Counsellor Notes
  y = sectionHeading(doc, 'COUNSELLOR NOTES', y);
  filledBox(doc, MARGIN, y, CONTENT_W, 100, COLORS.bg, COLORS.border);
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.textLight)
     .text('Use this space for your own observations and notes after reviewing this report.', MARGIN + 10, y + 10, { width: CONTENT_W - 20 });

  y += 90;
  rule(doc, y);
  y += 10;
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.textMuted)
     .text(`Report reviewed by: ___________________________________    Date: _______________`, MARGIN, y);

  // Footer on last page only
  y += 20;
  doc.fontSize(7).font('Helvetica').fillColor(COLORS.textLight)
     .text(`Generated by Lumora AI • ${fmtDateTime(generatedAt)} • Confidential — For Counsellor Use Only`,
           MARGIN, y, { align: 'center', width: CONTENT_W });

  return doc;
}

module.exports = { generateWellnessReport, buildPDF };