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
const MAX_Y = PAGE_H - 50; // Max content Y before page break (leaves room for the footer)

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

// ─── Metric & Severity Color Helpers ───────────────────────────────────────────
// Small, reusable rules for color-coding at-a-glance metrics across every
// report so a reader can scan the page and immediately see what needs
// attention, without having to read every number.

function moodColor(avg) {
  if (avg === null || avg === undefined || isNaN(avg)) return COLORS.textMuted;
  return MOOD_COLORS[Math.round(avg)] || COLORS.primary;
}

function sleepQualityColor(avg) {
  if (avg === null || avg === undefined || isNaN(avg)) return COLORS.textMuted;
  return SLEEP_COLORS[Math.round(avg)] || COLORS.primary;
}

function sleepDurationColor(avg) {
  if (avg === null || avg === undefined || isNaN(avg)) return COLORS.textMuted;
  return (avg >= 7 && avg <= 9) ? COLORS.success : COLORS.warning;
}

function stressScoreColor(score) {
  if (score === null || score === undefined || isNaN(score)) return COLORS.textMuted;
  if (score >= 60) return COLORS.danger;
  if (score >= 30) return COLORS.warning;
  return COLORS.success;
}

function crisisCountColor(count) {
  return (count && count > 0) ? COLORS.danger : COLORS.success;
}

// Robust, case-insensitive severity → color mapping (handles "Moderately
// Severe" and similar multi-word PHQ-9/GAD-7 labels that a simple exact-match
// lookup would otherwise miss and silently fall back to gray).
function severityColor(severity) {
  if (!severity) return COLORS.textMuted;
  const key = severity.trim().split(' ')[0].toLowerCase();
  const map = {
    minimal: COLORS.success, low: COLORS.success, none: COLORS.success,
    mild: COLORS.warning, moderate: COLORS.warning,
    moderately: COLORS.danger, severe: COLORS.danger, high: COLORS.danger,
  };
  return map[key] || COLORS.textMuted;
}

// ─── Page Chrome (shared by every multi-page report) ───────────────────────────
// A branded hero header for each report's first page, a slim running header
// for continuation pages, a consistent footer with page numbers stamped on
// every page at the very end, and a page-break guard so a card, chart, or
// table row is never silently clipped at the bottom of a page.

function heroHeader(doc, title, tag) {
  const y = 40;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.textMuted).text('LUMORA', MARGIN, y);
  doc.fontSize(20).font('Helvetica-Bold').fillColor(COLORS.primary).text(title, MARGIN, y + 12);

  if (tag) {
    const tagW = 100;
    filledBox(doc, PAGE_W - MARGIN - tagW, y, tagW, 20, tag.bg, tag.border);
    doc.fontSize(7).font('Helvetica-Bold').fillColor(tag.text)
       .text(tag.label, PAGE_W - MARGIN - tagW, y + 6, { width: tagW, align: 'center' });
  }

  return y + 44;
}

function pageHeader(doc, reportLabel, contextLabel) {
  doc.save().rect(0, 0, PAGE_W, 34).fill(COLORS.primary).restore();
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.white)
     .text(reportLabel, MARGIN, 11);
  doc.fontSize(9).font('Helvetica').fillColor('#E0E7FF')
     .text(contextLabel, PAGE_W - MARGIN - 260, 12, { width: 260, align: 'right' });
  return 48;
}

function ensureSpace(doc, y, neededHeight, reportLabel, contextLabel) {
  if (y + neededHeight <= MAX_Y) return y;
  doc.addPage();
  return pageHeader(doc, reportLabel, contextLabel);
}

function stampFooter(doc, pageNum, totalPages, footerNote) {
  const fy = PAGE_H - 34;
  rule(doc, fy - 6);

  // PDFKit auto-inserts a new page for any .text() call placed below the
  // document's bottom margin — which is exactly where a footer belongs.
  // Suppress the margin for these two calls only, then restore it, so the
  // footer renders on the current page instead of silently pushing a blank
  // page onto the end of the document.
  const savedBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;

  doc.fontSize(7).font('Helvetica').fillColor(COLORS.textLight)
     .text(footerNote, MARGIN, fy, { width: CONTENT_W - 70, lineBreak: false });
  doc.fontSize(7).font('Helvetica').fillColor(COLORS.textLight)
     .text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN - 70, fy, { width: 70, align: 'right', lineBreak: false });

  doc.page.margins.bottom = savedBottom;
}

// Walks every buffered page and stamps a consistent footer + page number.
// Requires the PDFDocument to have been created with `bufferPages: true`.
function stampAllFooters(doc, footerNote) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    stampFooter(doc, i + 1, range.count, footerNote);
  }
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
      model: "openai/gpt-oss-120b",
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

  const doc = new PDFDocument({ margin: MARGIN, size: 'A4', autoFirstPage: false, bufferPages: true });
  const filename = `wellness_report_${student[0].name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

  const reportData = { student: student[0], stats, moods, sleep, assessments, deadlines, alerts, sessions, stressForecast, aiInsights, generatedAt: new Date().toISOString() };

  return { doc, filename, reportData };
}

// ─── PDF Builder (Counsellor Report) ───────────────────────────────────────────
function buildPDF(doc, reportData) {
  const { student, stats, moods, sleep, assessments, deadlines, alerts, sessions, stressForecast, aiInsights, generatedAt } = reportData;
  const risk = getRiskLevel(stressForecast);
  const REPORT_LABEL = 'Lumora Wellness Report';
  const footerNote = `Generated by Lumora AI • ${fmtDateTime(generatedAt)} • Confidential — For Counsellor Use Only`;

  // ── PAGE 1: Overview ─────────────────────────────────────────────────────────
  doc.addPage();
  let y = heroHeader(doc, 'Wellness Report', { label: 'CONFIDENTIAL', bg: COLORS.bg, border: COLORS.border, text: COLORS.textMuted });

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

  // Key Metrics — color-coded so risk areas are visible at a glance
  y = sectionHeading(doc, 'KEY METRICS', y);

  const metricItems = [
    { label: 'Avg Mood', value: stats.avg_mood ? `${fmt(stats.avg_mood)} / 5` : 'N/A', sub: '30-day average', color: moodColor(stats.avg_mood) },
    { label: 'Avg Sleep Quality', value: stats.avg_sleep_quality ? `${fmt(stats.avg_sleep_quality)} / 5` : 'N/A', sub: '30-day average', color: sleepQualityColor(stats.avg_sleep_quality) },
    { label: 'Avg Sleep Duration', value: stats.avg_sleep_duration ? `${fmt(stats.avg_sleep_duration)} hrs` : 'N/A', sub: '30-day average', color: sleepDurationColor(stats.avg_sleep_duration) },
    { label: 'Stress Score', value: stressForecast?.forecast?.[0]?.score ?? 'N/A', sub: 'Current / 100', color: stressScoreColor(stressForecast?.forecast?.[0]?.score) },
    { label: 'Crisis Alerts', value: stats.crisis_alerts ?? 0, sub: 'Unresolved', color: crisisCountColor(stats.crisis_alerts) },
    { label: 'Journal Entries', value: stats.journal_count ?? 0, sub: 'Last 7 days', color: COLORS.primary },
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
    doc.save().rect(cx, cy, 3, cardH).fill(m.color).restore();

    doc.fontSize(18).font('Helvetica-Bold').fillColor(m.color)
       .text(String(m.value), cx + 10, cy + 8, { width: cardW - 18 });
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.text)
       .text(m.label, cx + 10, cy + 30, { width: cardW - 18 });
    doc.fontSize(7).font('Helvetica').fillColor(COLORS.textLight)
       .text(m.sub, cx + 10, cy + 41, { width: cardW - 18 });
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
      y = ensureSpace(doc, y, 18, REPORT_LABEL, `${student.name} • Overview (continued)`);
      const rowBg = idx % 2 === 0 ? COLORS.white : COLORS.bg;
      filledBox(doc, MARGIN, y, CONTENT_W, 18, rowBg, null);
      rule(doc, y + 18);

      const sevColor = severityColor(a.severity);
      ax = MARGIN + 6;

      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(a.type?.toUpperCase() || '—', ax, y + 5, { width: aColW[0] });
      ax += aColW[0];
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(`${a.score}/27`, ax, y + 5, { width: aColW[1] });
      ax += aColW[1];
      doc.fontSize(8).font('Helvetica-Bold').fillColor(sevColor).text(a.severity || '—', ax, y + 5, { width: aColW[2] });
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
      y = ensureSpace(doc, y, 18, REPORT_LABEL, `${student.name} • Overview (continued)`);
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

  // ── PAGE 2: Trends & Charts ────────────────────────────────────────────────
  doc.addPage();
  y = pageHeader(doc, REPORT_LABEL, `${student.name} • Trends & Charts`);

  // Mood Chart
  const moodChartData = moods.slice(0, 30).reverse().map(m => ({
    value: m.mood,
    label: new Date(m.date).getDate().toString(),
    color: MOOD_COLORS[m.mood] || COLORS.primary,
  }));
  const moodCardH = moodChartData.length > 0 ? 134 : 34;

  y = ensureSpace(doc, y, 22 + moodCardH + 12, REPORT_LABEL, `${student.name} • Trends & Charts (continued)`);
  y = sectionHeading(doc, 'MOOD TREND — LAST 30 DAYS', y);
  filledBox(doc, MARGIN, y, CONTENT_W, moodCardH, COLORS.white, COLORS.border);
  if (moodChartData.length > 0) {
    [1,2,3,4,5].forEach((v, i) => {
      const lx = MARGIN + 10 + i * 70;
      doc.save().rect(lx, y + 8, 10, 8).fill(MOOD_COLORS[v]).restore();
      doc.fontSize(7).font('Helvetica').fillColor(COLORS.textMuted)
         .text(['Very Low','Low','Neutral','Good','Excellent'][i], lx + 13, y + 8);
    });
    barChart(doc, MARGIN + 10, y + 26, CONTENT_W - 20, 90, moodChartData, 5, 'Mood (1-5)');
  } else {
    doc.fontSize(9).fillColor(COLORS.textLight).text('No mood data recorded.', MARGIN + 10, y + 12);
  }
  y += moodCardH + 12;

  // Sleep Quality Chart
  const sleepChartData = sleep.slice(0, 30).reverse().map(s => ({
    value: s.quality,
    label: new Date(s.date).getDate().toString(),
    color: SLEEP_COLORS[s.quality] || COLORS.primary,
  }));
  const sleepCardH = sleepChartData.length > 0 ? 134 : 34;

  y = ensureSpace(doc, y, 22 + sleepCardH + 12, REPORT_LABEL, `${student.name} • Trends & Charts (continued)`);
  y = sectionHeading(doc, 'SLEEP QUALITY TREND — LAST 30 DAYS', y);
  filledBox(doc, MARGIN, y, CONTENT_W, sleepCardH, COLORS.white, COLORS.border);
  if (sleepChartData.length > 0) {
    [1,2,3,4,5].forEach((v, i) => {
      const lx = MARGIN + 10 + i * 70;
      doc.save().rect(lx, y + 8, 10, 8).fill(SLEEP_COLORS[v]).restore();
      doc.fontSize(7).font('Helvetica').fillColor(COLORS.textMuted)
         .text(['Very Poor','Poor','Fair','Good','Excellent'][i], lx + 13, y + 8);
    });
    barChart(doc, MARGIN + 10, y + 26, CONTENT_W - 20, 90, sleepChartData, 5, 'Quality (1-5)');
  } else {
    doc.fontSize(9).fillColor(COLORS.textLight).text('No sleep data recorded.', MARGIN + 10, y + 12);
  }
  y += sleepCardH + 12;

  // Sleep Duration Chart
  const durationData = sleep.slice(0, 30).reverse().map(s => ({
    value: Math.min(s.duration || 0, 12),
    label: new Date(s.date).getDate().toString(),
    color: (s.duration >= 7 && s.duration <= 9) ? COLORS.success : COLORS.warning,
  }));
  const durationCardH = durationData.length > 0 ? 124 : 34;

  y = ensureSpace(doc, y, 22 + durationCardH + 12, REPORT_LABEL, `${student.name} • Trends & Charts (continued)`);
  y = sectionHeading(doc, 'SLEEP DURATION TREND — LAST 30 DAYS', y);
  filledBox(doc, MARGIN, y, CONTENT_W, durationCardH, COLORS.white, COLORS.border);
  if (durationData.length > 0) {
    doc.save().rect(MARGIN + 10, y + 8, 10, 8).fill(COLORS.success).restore();
    doc.fontSize(7).fillColor(COLORS.textMuted).text('Recommended (7-9 hrs)', MARGIN + 23, y + 8);
    doc.save().rect(MARGIN + 150, y + 8, 10, 8).fill(COLORS.warning).restore();
    doc.fontSize(7).fillColor(COLORS.textMuted).text('Outside range', MARGIN + 163, y + 8);
    barChart(doc, MARGIN + 10, y + 26, CONTENT_W - 20, 80, durationData, 12, 'Hours');
  } else {
    doc.fontSize(9).fillColor(COLORS.textLight).text('No sleep duration data.', MARGIN + 10, y + 12);
  }
  y += durationCardH + 12;

  // ── PAGE 3: AI Insights ────────────────────────────────────────────────────
  doc.addPage();
  y = pageHeader(doc, REPORT_LABEL, `${student.name} • AI Insights`);
  const aiContinuedLabel = `${student.name} • AI Insights (continued)`;

  // AI Insights header
  filledBox(doc, MARGIN, y, CONTENT_W, 26, COLORS.primaryLight, COLORS.border);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary)
     .text('AI WELLNESS INSIGHTS', MARGIN + 10, y + 8);
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.textMuted)
     .text('Generated by Lumora AI', PAGE_W - MARGIN - 150, y + 9, { width: 140, align: 'right' });
  y += 36;

  // Overall Assessment
  filledBox(doc, MARGIN, y, CONTENT_W, 8, COLORS.primary, null);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.white).text('OVERALL ASSESSMENT', MARGIN + 8, y + 1);
  y += 14;

  const overallText = aiInsights.overallAssessment || 'Not available.';
  const overallHeight = doc.heightOfString(overallText, { width: CONTENT_W });
  y = ensureSpace(doc, y, overallHeight + 14, REPORT_LABEL, aiContinuedLabel);
  doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
     .text(overallText, MARGIN, y, { width: CONTENT_W, lineGap: 3 });
  y += overallHeight + 14;

  // Key Findings
  y = ensureSpace(doc, y, 22, REPORT_LABEL, aiContinuedLabel);
  filledBox(doc, MARGIN, y, CONTENT_W, 8, COLORS.primary, null);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.white).text('KEY FINDINGS', MARGIN + 8, y + 1);
  y += 14;

  (aiInsights.keyFindings || []).forEach((f) => {
    const fHeight = doc.heightOfString(f, { width: CONTENT_W - 14 });
    y = ensureSpace(doc, y, fHeight + 6, REPORT_LABEL, aiContinuedLabel);
    doc.save().circle(MARGIN + 5, y + 4, 3).fill(COLORS.primary).restore();
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
       .text(f, MARGIN + 14, y, { width: CONTENT_W - 14, lineGap: 2 });
    y += fHeight + 6;
  });
  y += 6;

  // Risk Factors
  y = ensureSpace(doc, y, 22, REPORT_LABEL, aiContinuedLabel);
  filledBox(doc, MARGIN, y, CONTENT_W, 8, COLORS.danger, null);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.white).text('RISK FACTORS', MARGIN + 8, y + 1);
  y += 14;

  (aiInsights.riskFactors || []).forEach((f) => {
    const textHeight = doc.heightOfString(f, { width: CONTENT_W - 28 });
    y = ensureSpace(doc, y, textHeight + 16, REPORT_LABEL, aiContinuedLabel);
    filledBox(doc, MARGIN, y, CONTENT_W, textHeight + 10, COLORS.dangerLight, null);
    doc.save().rect(MARGIN, y, 3, textHeight + 10).fill(COLORS.danger).restore();
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
       .text(f, MARGIN + 10, y + 5, { width: CONTENT_W - 18, lineGap: 2 });
    y += textHeight + 16;
  });
  y += 6;

  // Recommendations
  y = ensureSpace(doc, y, 22, REPORT_LABEL, aiContinuedLabel);
  filledBox(doc, MARGIN, y, CONTENT_W, 8, COLORS.success, null);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.white).text('RECOMMENDATIONS', MARGIN + 8, y + 1);
  y += 14;

  (aiInsights.recommendations || []).forEach((r, i) => {
    const textHeight = doc.heightOfString(r, { width: CONTENT_W - 40 });
    y = ensureSpace(doc, y, textHeight + 16, REPORT_LABEL, aiContinuedLabel);
    filledBox(doc, MARGIN, y, CONTENT_W, textHeight + 10, COLORS.successLight, null);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.success)
       .text(String(i + 1), MARGIN + 8, y + 5);
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
       .text(r, MARGIN + 22, y + 5, { width: CONTENT_W - 30, lineGap: 2 });
    y += textHeight + 16;
  });

  // ── PAGE 4: Session History ────────────────────────────────────────────────
  doc.addPage();
  y = pageHeader(doc, REPORT_LABEL, `${student.name} • Session History`);
  const sessionContinuedLabel = `${student.name} • Session History (continued)`;

  // Crisis Alerts
  y = sectionHeading(doc, 'CRISIS ALERTS', y);

  if (alerts.length === 0) {
    filledBox(doc, MARGIN, y, CONTENT_W, 22, COLORS.successLight, COLORS.border);
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.success)
       .text('No crisis alerts on record.', MARGIN + 10, y + 7);
    y += 30;
  } else {
    alerts.forEach((a) => {
      const rowH = 22;
      y = ensureSpace(doc, y, rowH + 3, REPORT_LABEL, sessionContinuedLabel);
      const rowBg = a.is_resolved ? COLORS.bg : COLORS.dangerLight;
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
  y = ensureSpace(doc, y, 40, REPORT_LABEL, sessionContinuedLabel);
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
      y = ensureSpace(doc, y, rowH + 3, REPORT_LABEL, sessionContinuedLabel);
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
  y = ensureSpace(doc, y, 130, REPORT_LABEL, sessionContinuedLabel);
  y = sectionHeading(doc, 'COUNSELLOR NOTES', y);
  filledBox(doc, MARGIN, y, CONTENT_W, 100, COLORS.bg, COLORS.border);
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.textLight)
     .text('Use this space for your own observations and notes after reviewing this report.', MARGIN + 10, y + 10, { width: CONTENT_W - 20 });

  y += 90;
  rule(doc, y);
  y += 10;
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.textMuted)
     .text(`Report reviewed by: ___________________________________    Date: _______________`, MARGIN, y);

  // ── Page numbers & consistent footer on every page ────────────────────────
  stampAllFooters(doc, footerNote);

  return doc;
}

/**
 * Generate parent-friendly PDF report
 * Similar to wellness report but without counsellor-specific sections
 */
async function generateParentReportPDF(studentId) {
  // Fetch student data
  const [student] = await db.promise().query(
    `SELECT u.id, u.name, u.nickname, u.email, u.created_at, un.name as university_name
     FROM users u
     LEFT JOIN universities un ON u.university_id = un.id
     WHERE u.id = ? AND u.role = 'student'`,
    [studentId]
  );

  if (!student.length) {
    throw new Error("Student not found");
  }

  const studentInfo = student[0];

  // Fetch mood data (last 30 days)
  const [moods] = await db.promise().query(
    `SELECT mood, DATE(created_at) as date, created_at 
     FROM moods 
     WHERE user_id = ? 
     ORDER BY created_at DESC LIMIT 30`,
    [studentId]
  );
  const moodData = moods.reverse(); // ascending order

  // Fetch sleep data (last 30 days)
  const [sleep] = await db.promise().query(
    `SELECT quality, duration, DATE(created_at) as date 
     FROM sleep 
     WHERE user_id = ? 
     ORDER BY created_at DESC LIMIT 30`,
    [studentId]
  );
  const sleepData = sleep.reverse();

  // Fetch assessments
  const [assessments] = await db.promise().query(
    `SELECT type, score, severity, taken_at 
     FROM assessments 
     WHERE user_id = ? 
     ORDER BY taken_at DESC LIMIT 5`,
    [studentId]
  );

  // Fetch stress forecast
  const [stressForecast] = await db.promise().query(
    `SELECT forecast_data, peak_stress_day, tip, summary_sentence, created_at
     FROM stress_forecast 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [studentId]
  );
  let forecast = null;
  if (stressForecast.length > 0) {
    forecast = {
      forecast: JSON.parse(stressForecast[0].forecast_data),
      peak_stress_day: JSON.parse(stressForecast[0].peak_stress_day),
      tip: JSON.parse(stressForecast[0].tip),
      summary_sentence: stressForecast[0].summary_sentence,
      created_at: stressForecast[0].created_at
    };
  }

  // Fetch upcoming deadlines
  const [deadlines] = await db.promise().query(
    `SELECT title, subject, type, due_date, difficulty
     FROM deadlines 
     WHERE user_id = ? AND is_complete = 0
     ORDER BY due_date ASC
     LIMIT 10`,
    [studentId]
  );

  // Build PDF — shares the same design system as the counsellor report
  // (branded header/footer, page numbers, cards, and charts) for a
  // consistent, professional look across every export Lumora produces.
  const doc = new PDFDocument({ margin: MARGIN, size: 'A4', autoFirstPage: false, bufferPages: true });
  const filename = `parent_report_${studentInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  const generatedAt = new Date().toISOString();
  const REPORT_LABEL = 'Lumora Parent Report';
  const footerNote = `Generated by Lumora • ${fmtDateTime(generatedAt)} • For informational purposes only — not a substitute for professional medical advice`;

  // ====== PAGE 1: Overview ======
  doc.addPage();
  let y = heroHeader(doc, 'Parent Wellness Report', { label: 'FAMILY COPY', bg: COLORS.primaryLight, border: COLORS.border, text: COLORS.primary });

  filledBox(doc, MARGIN, y, CONTENT_W, 62, COLORS.bg, COLORS.border);
  doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.text)
     .text(studentInfo.name, MARGIN + 12, y + 10);
  doc.fontSize(9).font('Helvetica').fillColor(COLORS.textMuted)
     .text(`${studentInfo.nickname ? `@${studentInfo.nickname}  |  ` : ''}${studentInfo.email}`, MARGIN + 12, y + 28);
  doc.fontSize(9).fillColor(COLORS.textMuted)
     .text(`University: ${studentInfo.university_name || 'N/A'}  |  Report generated: ${fmtDateTime(generatedAt)}`, MARGIN + 12, y + 44);

  y += 78;

  // Key Metrics
  const avgMoodNum = moodData.length > 0 ? (moodData.reduce((s, m) => s + m.mood, 0) / moodData.length) : null;
  const avgSleepQualityNum = sleepData.length > 0 ? (sleepData.reduce((s, sl) => s + sl.quality, 0) / sleepData.length) : null;
  const currentStress = forecast ? forecast.forecast[0]?.score : 'N/A';

  y = sectionHeading(doc, 'KEY METRICS', y);

  const parentMetricItems = [
    { label: 'Avg Mood', value: avgMoodNum !== null ? `${avgMoodNum.toFixed(1)} / 5` : 'N/A', sub: '30-day average', color: moodColor(avgMoodNum) },
    { label: 'Avg Sleep Quality', value: avgSleepQualityNum !== null ? `${avgSleepQualityNum.toFixed(1)} / 5` : 'N/A', sub: '30-day average', color: sleepQualityColor(avgSleepQualityNum) },
    { label: 'Current Stress Score', value: currentStress !== 'N/A' ? `${currentStress} / 100` : 'N/A', sub: '7-day forecast', color: stressScoreColor(currentStress) },
  ];

  const pCardW = Math.floor((CONTENT_W - 10) / 3);
  const pCardH = 52;

  parentMetricItems.forEach((m, i) => {
    const cx = MARGIN + i * (pCardW + 5);
    filledBox(doc, cx, y, pCardW, pCardH, COLORS.white, COLORS.border);
    doc.save().rect(cx, y, 3, pCardH).fill(m.color).restore();

    doc.fontSize(16).font('Helvetica-Bold').fillColor(m.color)
       .text(String(m.value), cx + 10, y + 8, { width: pCardW - 18 });
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.text)
       .text(m.label, cx + 10, y + 30, { width: pCardW - 18 });
    doc.fontSize(7).font('Helvetica').fillColor(COLORS.textLight)
       .text(m.sub, cx + 10, y + 41, { width: pCardW - 18 });
  });

  y += pCardH + 18;

  // Latest Assessments (table, matching the counsellor report's styling)
  y = sectionHeading(doc, 'RECENT ASSESSMENTS', y);

  if (assessments.length === 0) {
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.textMuted).text('No assessments taken yet.', MARGIN, y);
    y += 16;
  } else {
    const aColW = [80, 80, 100, 200];
    const aHeaders = ['Type', 'Score', 'Severity', 'Date'];

    filledBox(doc, MARGIN, y, CONTENT_W, 18, COLORS.primaryLight, null);
    let ax = MARGIN + 6;
    aHeaders.forEach((h, i) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.primary).text(h, ax, y + 5, { width: aColW[i] });
      ax += aColW[i];
    });
    y += 18;

    assessments.forEach((a, idx) => {
      y = ensureSpace(doc, y, 18, REPORT_LABEL, `${studentInfo.name} • Overview (continued)`);
      const rowBg = idx % 2 === 0 ? COLORS.white : COLORS.bg;
      filledBox(doc, MARGIN, y, CONTENT_W, 18, rowBg, null);
      rule(doc, y + 18);

      ax = MARGIN + 6;
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(a.type?.toUpperCase() || '—', ax, y + 5, { width: aColW[0] });
      ax += aColW[0];
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(String(a.score), ax, y + 5, { width: aColW[1] });
      ax += aColW[1];
      doc.fontSize(8).font('Helvetica-Bold').fillColor(severityColor(a.severity)).text(a.severity || '—', ax, y + 5, { width: aColW[2] });
      ax += aColW[2];
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(new Date(a.taken_at).toLocaleDateString(), ax, y + 5, { width: aColW[3] });

      y += 18;
    });
    y += 8;
  }

  // ====== PAGE 2: Charts ======
  doc.addPage();
  y = pageHeader(doc, REPORT_LABEL, `${studentInfo.name} • Trends & Charts`);

  const moodChartData = moodData.map(m => ({ value: m.mood, label: new Date(m.date).getDate().toString(), color: MOOD_COLORS[m.mood] || COLORS.primary }));
  const pMoodCardH = moodChartData.length > 0 ? 134 : 34;

  y = ensureSpace(doc, y, 22 + pMoodCardH + 12, REPORT_LABEL, `${studentInfo.name} • Trends & Charts (continued)`);
  y = sectionHeading(doc, 'MOOD TREND — LAST 30 DAYS', y);
  filledBox(doc, MARGIN, y, CONTENT_W, pMoodCardH, COLORS.white, COLORS.border);
  if (moodChartData.length > 0) {
    [1,2,3,4,5].forEach((v, i) => {
      const lx = MARGIN + 10 + i * 70;
      doc.save().rect(lx, y + 8, 10, 8).fill(MOOD_COLORS[v]).restore();
      doc.fontSize(7).font('Helvetica').fillColor(COLORS.textMuted)
         .text(['Very Low','Low','Neutral','Good','Excellent'][i], lx + 13, y + 8);
    });
    barChart(doc, MARGIN + 10, y + 26, CONTENT_W - 20, 90, moodChartData, 5, 'Mood (1-5)');
  } else {
    doc.fontSize(10).fillColor(COLORS.textLight).text('No mood data available.', MARGIN + 10, y + 12);
  }
  y += pMoodCardH + 12;

  const sleepChartData = sleepData.map(s => ({ value: s.quality, label: new Date(s.date).getDate().toString(), color: SLEEP_COLORS[s.quality] || COLORS.primary }));
  const pSleepCardH = sleepChartData.length > 0 ? 134 : 34;

  y = ensureSpace(doc, y, 22 + pSleepCardH + 12, REPORT_LABEL, `${studentInfo.name} • Trends & Charts (continued)`);
  y = sectionHeading(doc, 'SLEEP QUALITY TREND — LAST 30 DAYS', y);
  filledBox(doc, MARGIN, y, CONTENT_W, pSleepCardH, COLORS.white, COLORS.border);
  if (sleepChartData.length > 0) {
    [1,2,3,4,5].forEach((v, i) => {
      const lx = MARGIN + 10 + i * 70;
      doc.save().rect(lx, y + 8, 10, 8).fill(SLEEP_COLORS[v]).restore();
      doc.fontSize(7).font('Helvetica').fillColor(COLORS.textMuted)
         .text(['Very Poor','Poor','Fair','Good','Excellent'][i], lx + 13, y + 8);
    });
    barChart(doc, MARGIN + 10, y + 26, CONTENT_W - 20, 90, sleepChartData, 5, 'Quality (1-5)');
  } else {
    doc.fontSize(10).fillColor(COLORS.textLight).text('No sleep data available.', MARGIN + 10, y + 12);
  }
  y += pSleepCardH + 12;

  // ====== PAGE 3: Stress Forecast & Assessments ======
  doc.addPage();
  y = pageHeader(doc, REPORT_LABEL, `${studentInfo.name} • Stress Forecast`);
  const stressContinuedLabel = `${studentInfo.name} • Stress Forecast (continued)`;

  const stressChartData = (forecast && forecast.forecast.length > 0)
    ? forecast.forecast.map(d => ({ value: d.score, label: new Date(d.date).getDate().toString(), color: stressScoreColor(d.score) }))
    : [];
  const stressCardH = stressChartData.length > 0 ? 124 : 34;

  y = ensureSpace(doc, y, 22 + stressCardH + 12, REPORT_LABEL, stressContinuedLabel);
  y = sectionHeading(doc, 'STRESS FORECAST — NEXT 7 DAYS', y);
  filledBox(doc, MARGIN, y, CONTENT_W, stressCardH, COLORS.white, COLORS.border);
  if (stressChartData.length > 0) {
    barChart(doc, MARGIN + 10, y + 16, CONTENT_W - 20, 80, stressChartData, 100, 'Stress Score');
  } else {
    doc.fontSize(10).fillColor(COLORS.textLight).text('No stress forecast available.', MARGIN + 10, y + 12);
  }
  y += stressCardH + 12;

  if (forecast?.summary_sentence) {
    const summaryHeight = doc.heightOfString(forecast.summary_sentence, { width: CONTENT_W - 20 });
    y = ensureSpace(doc, y, summaryHeight + 20, REPORT_LABEL, stressContinuedLabel);
    filledBox(doc, MARGIN, y, CONTENT_W, summaryHeight + 16, COLORS.bg, COLORS.border);
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
       .text(forecast.summary_sentence, MARGIN + 10, y + 8, { width: CONTENT_W - 20, lineGap: 2 });
    y += summaryHeight + 24;
  }

  if (forecast?.tip?.headline) {
    const tipBody = forecast.tip.body || '';
    const tipHeight = doc.heightOfString(tipBody, { width: CONTENT_W - 20 });
    const tipBoxH = tipHeight + 34;
    y = ensureSpace(doc, y, tipBoxH + 8, REPORT_LABEL, stressContinuedLabel);
    filledBox(doc, MARGIN, y, CONTENT_W, tipBoxH, COLORS.warningLight, null);
    doc.save().rect(MARGIN, y, 3, tipBoxH).fill(COLORS.warning).restore();
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.warning)
       .text(`TIP: ${forecast.tip.headline}`, MARGIN + 10, y + 8, { width: CONTENT_W - 20 });
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
       .text(tipBody, MARGIN + 10, y + 22, { width: CONTENT_W - 20, lineGap: 2 });
    y += tipBoxH + 12;
  }

  // ====== PAGE 4: Deadlines & Notes ======
  doc.addPage();
  y = pageHeader(doc, REPORT_LABEL, `${studentInfo.name} • Deadlines`);
  const deadlinesContinuedLabel = `${studentInfo.name} • Deadlines (continued)`;

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

    deadlines.forEach((d, idx) => {
      y = ensureSpace(doc, y, 18, REPORT_LABEL, deadlinesContinuedLabel);
      const rowBg = idx % 2 === 0 ? COLORS.white : COLORS.bg;
      filledBox(doc, MARGIN, y, CONTENT_W, 18, rowBg, null);
      rule(doc, y + 18);

      const diffColor = { easy: COLORS.success, medium: COLORS.warning, hard: COLORS.danger }[d.difficulty] || COLORS.textMuted;
      dx = MARGIN + 6;

      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(d.title, dx, y + 5, { width: dColW[0] });
      dx += dColW[0];
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(d.subject || 'General', dx, y + 5, { width: dColW[1] });
      dx += dColW[1];
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(new Date(d.due_date).toLocaleDateString(), dx, y + 5, { width: dColW[2] });
      dx += dColW[2];
      doc.fontSize(8).font('Helvetica').fillColor(diffColor).text(d.difficulty || 'Medium', dx, y + 5, { width: dColW[3] });

      y += 18;
    });
    y += 12;
  }

  // Disclaimer
  y = ensureSpace(doc, y, 50, REPORT_LABEL, deadlinesContinuedLabel);
  filledBox(doc, MARGIN, y, CONTENT_W, 40, COLORS.bg, COLORS.border);
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.textMuted)
     .text('This report is for informational purposes only and does not replace professional medical advice. If you have concerns about your child\'s wellbeing, please reach out to their counsellor or a licensed mental health professional.',
           MARGIN + 10, y + 10, { width: CONTENT_W - 20, lineGap: 2 });

  // ── Page numbers & consistent footer on every page ────────────────────────
  stampAllFooters(doc, footerNote);

  return { doc, filename };
}

module.exports = {
  generateWellnessReport,
  buildPDF,
  generateParentReportPDF 
};