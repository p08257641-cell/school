import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import pool from '../db.ts';
import { GoogleGenAI } from '@google/genai';

const localAssistantHelpText = `Here is a list of commands I can help you with:

📚 **Assignments:**
• **List/Show assignments:** \`list assignments\` or \`show my assignments\`
• **Create assignment:** \`create assignment title:"..." class:"..." subject:"..." due:<YYYY-MM-DD> marks:<number> description:"..."\`
  *Example:* \`create assignment title:"Math Homework" class:"JSS 1" subject:"Algebra" due:2026-06-20 marks:50 description:"Chapter 5 exercises"\`

📖 **Lesson Notes (for Staff):**
• **List lesson notes:** \`list lesson notes\` or \`my lesson notes\`
• **Create lesson note:** \`create lesson note subject:"..." topic:"..." class:"..." content:"..."\`
  *Example:* \`create lesson note subject:"Mathematics" topic:"Fractions" class:"JSS 1" content:"In this lesson, students will understand fractions."\`

🏫 **School Info:**
• **List classes:** \`list classes\`
• **List students:** \`list students\`
• **Get student details:** \`get student info name:"<student name>"\``;

const parseKeyValuePairs = (text: string) => {
  const params: Record<string, string> = {};
  const regex = /(?:title|class|subject|due_date|due|marks|total_marks|description|name|student|topic|content)\s*(?:=|:)\s*("([^"]+)"|'([^']+)'|([^\s,;]+))/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2] || match[3] || match[4] || '';
    switch (key) {
      case 'due_date':
      case 'due':
        params.due = value;
        break;
      case 'marks':
      case 'total_marks':
        params.total_marks = value;
        break;
      case 'student':
        params.name = value;
        break;
      default:
        params[key] = value;
    }
  }
  return params;
};

const normalizeText = (text: string) => text.trim().toLowerCase();

const detectLocalAssistantAction = (prompt: string) => {
  const normalized = normalizeText(prompt);
  if (normalized.includes('create assignment')) return 'createAssignment';
  if (normalized.includes('list assignments') || normalized.includes('show assignments') || normalized.includes('my assignments')) return 'listAssignments';
  if (normalized.includes('create lesson note')) return 'createLessonNote';
  if (normalized.includes('list lesson notes') || normalized.includes('my lesson notes') || normalized.includes('show lesson notes')) return 'listLessonNotes';
  if (normalized.includes('list classes') || normalized.includes('show classes')) return 'listClasses';
  if (normalized.includes('list students') || normalized.includes('show students')) return 'listStudents';
  if (
    normalized.includes('student info') || 
    normalized.includes('student details') || 
    normalized.includes('find student') || 
    normalized.startsWith('get student') ||
    normalized.startsWith('student ')
  ) return 'getStudentInfo';
  return 'unknown';
};

const formatDate = (value: string) => {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString().split('T')[0];
  } catch {
    return value;
  }
};

const getClassIdByName = async (orgId: string, className: string) => {
  const result = await pool.query(
    `SELECT id FROM classes WHERE org_id = $1 AND (LOWER(name) = LOWER($2) OR LOWER(section) = LOWER($2)) LIMIT 1`,
    [orgId, className]
  );
  return result.rows[0]?.id;
};

const getSubjectIdByName = async (orgId: string, subjectName: string) => {
  const result = await pool.query(
    `SELECT id FROM subjects WHERE org_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
    [orgId, subjectName]
  );
  return result.rows[0]?.id;
};

const getTeacherIdByUserId = async (orgId: string, userId: string) => {
  const result = await pool.query(
    `SELECT id FROM staff WHERE org_id = $1 AND email = (SELECT email FROM users WHERE id = $2)`,
    [orgId, userId]
  );
  return result.rows[0]?.id;
};

const getGeminiResponse = async (prompt: string, orgId: string, systemPrompt?: string) => {
  const result = await pool.query('SELECT api_key FROM gemini_api_keys WHERE org_id = $1 LIMIT 1', [orgId]);
  const apiKey = result.rows[0]?.api_key;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt || "You are OmniAI, a helpful assistant for SchoolHub school management system."
      }
    });
    return response.text || null;
  } catch (err) {
    console.error('Gemini API Error:', err);
    return null;
  }
};

const handleLocalCreateAssignment = async (prompt: string, req: AuthRequest) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const params = parseKeyValuePairs(prompt);
  const title = params.title;
  const className = params.class;
  const subjectName = params.subject;
  const dueDate = params.due;
  const totalMarks = parseInt(params.total_marks || '100', 10) || 100;
  const description = params.description || '';

  if (!title || !className || !subjectName || !dueDate) {
    return `I need title, class, subject, and due date to create an assignment.\n${localAssistantHelpText}`;
  }

  const classId = await getClassIdByName(orgId, className);
  if (!classId) {
    return `I could not find class '${className}'. Please check the class name and try again.`;
  }

  const subjectId = await getSubjectIdByName(orgId, subjectName);
  if (!subjectId) {
    return `I could not find subject '${subjectName}'. Please check the subject name and try again.`;
  }

  const result = await pool.query(
    `INSERT INTO assignments (org_id, teacher_id, class_id, subject_id, title, description, due_date, total_marks, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Active') RETURNING id, title, due_date`,
    [orgId, userId, classId, subjectId, title, description, formatDate(dueDate), totalMarks]
  );

  const created = result.rows[0];
  return `Assignment created successfully: ${created.title} (Due: ${formatDate(created.due_date)})`;
};

const handleLocalListAssignments = async (req: AuthRequest) => {
  const orgId = req.user.org_id;
  const userRole = req.user.role;
  const userId = req.user.id;
  let query = `SELECT a.title, a.due_date, a.status, c.name AS class_name, s.name AS subject_name
               FROM assignments a
               LEFT JOIN classes c ON a.class_id = c.id
               LEFT JOIN subjects s ON a.subject_id = s.id
               WHERE a.org_id = $1`;
  const params: any[] = [orgId];

  if (userRole === 'STAFF') {
    query += ' AND a.teacher_id = $2';
    params.push(userId);
  }

  query += ' ORDER BY a.due_date ASC LIMIT 25';

  const result = await pool.query(query, params);
  if (result.rows.length === 0) {
    return 'No assignments found for your account.';
  }

  return result.rows.map((row: any) => `• ${row.title} — ${row.class_name}/${row.subject_name} due ${formatDate(row.due_date)} (${row.status})`).join('\n');
};

const handleLocalCreateLessonNote = async (prompt: string, req: AuthRequest) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const params = parseKeyValuePairs(prompt);
  const subjectName = params.subject;
  const topic = params.topic;
  const className = params.class;
  const content = params.content || '';

  if (!subjectName || !topic || !className || !content) {
    return `I need subject, topic, class, and content to create a lesson note.\nExample: create lesson note subject:"Mathematics" topic:"Fractions" class:"JSS 1" content:"In this lesson, students will understand fractions."`;
  }

  const teacherId = await getTeacherIdByUserId(orgId, userId);
  if (!teacherId) {
    return 'Only registered staff members can create lesson notes.';
  }

  const classId = await getClassIdByName(orgId, className);
  if (!classId) {
    return `I could not find class '${className}'. Please check the class name and try again.`;
  }

  const result = await pool.query(
    `INSERT INTO lesson_notes (org_id, teacher_id, subject, topic, content, class_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'Draft') RETURNING id, subject, topic`,
    [orgId, teacherId, subjectName, topic, content, classId]
  );

  const created = result.rows[0];
  return `Lesson note created successfully as Draft: ${created.topic} under ${created.subject}.`;
};

const handleLocalListLessonNotes = async (req: AuthRequest) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  
  const teacherId = await getTeacherIdByUserId(orgId, userId);
  if (!teacherId) {
    return 'Only registered staff members can view lesson notes.';
  }

  const result = await pool.query(
    `SELECT ln.topic, ln.subject, ln.status, c.name AS class_name
     FROM lesson_notes ln
     LEFT JOIN classes c ON ln.class_id = c.id
     WHERE ln.org_id = $1 AND ln.teacher_id = $2
     ORDER BY ln.created_at DESC LIMIT 25`,
    [orgId, teacherId]
  );

  if (result.rows.length === 0) {
    return 'No lesson notes found for your account.';
  }

  return result.rows.map((row: any) => `• ${row.topic} (${row.subject}) — Class: ${row.class_name || 'N/A'} [${row.status}]`).join('\n');
};

const handleLocalListClasses = async (req: AuthRequest) => {
  const orgId = req.user.org_id;
  const result = await pool.query(
    'SELECT name, section FROM classes WHERE org_id = $1 ORDER BY name ASC LIMIT 50',
    [orgId]
  );
  if (result.rows.length === 0) {
    return 'No classes were found for your organization.';
  }
  return result.rows.map((row: any) => `• ${row.name}${row.section ? ` (${row.section})` : ''}`).join('\n');
};

const handleLocalListStudents = async (req: AuthRequest) => {
  const orgId = req.user.org_id;
  const result = await pool.query(
    'SELECT name, email FROM students WHERE org_id = $1 ORDER BY name ASC LIMIT 50',
    [orgId]
  );
  if (result.rows.length === 0) {
    return 'No students were found for your organization.';
  }
  return result.rows.map((row: any) => `• ${row.name}${row.email ? ` — ${row.email}` : ''}`).join('\n');
};

const handleLocalStudentInfo = async (prompt: string, req: AuthRequest) => {
  const orgId = req.user.org_id;
  const params = parseKeyValuePairs(prompt);
  const searchName = params.name || prompt.match(/student\s+(?:named\s+)?(.+)/i)?.[1];
  if (!searchName) {
    return 'I need a student name to look up. Try: student info name:"John Doe"';
  }
  const query = `SELECT name, email, class_id, phone, admission_no FROM students WHERE org_id = $1 AND LOWER(name) LIKE LOWER($2) LIMIT 10`;
  const result = await pool.query(query, [orgId, `%${searchName.trim()}%`]);
  if (result.rows.length === 0) {
    return `No students found matching '${searchName.trim()}'.`;
  }
  return result.rows.map((row: any) => `• ${row.name}${row.admission_no ? ` (Admission No: ${row.admission_no})` : ''}${row.email ? ` — ${row.email}` : ''}${row.phone ? ` — ${row.phone}` : ''}`).join('\n');
};

const executeLocalAssistant = async (prompt: string, req: AuthRequest) => {
  const action = detectLocalAssistantAction(prompt);
  switch (action) {
    case 'createAssignment':
      return await handleLocalCreateAssignment(prompt, req);
    case 'listAssignments':
      return await handleLocalListAssignments(req);
    case 'createLessonNote':
      return await handleLocalCreateLessonNote(prompt, req);
    case 'listLessonNotes':
      return await handleLocalListLessonNotes(req);
    case 'listClasses':
      return await handleLocalListClasses(req);
    case 'listStudents':
      return await handleLocalListStudents(req);
    case 'getStudentInfo':
      return await handleLocalStudentInfo(prompt, req);
    default:
      return `OmniAI Local Assistant is active.\n\n${localAssistantHelpText}`;
  }
};

export const generateResponse = async (req: AuthRequest, res: Response) => {
  const { prompt, context } = req.body;
  const systemPrompt = context?.systemPrompt;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const orgId = req.user.org_id;
    const action = detectLocalAssistantAction(prompt);

    if (action === 'unknown') {
      const geminiText = await getGeminiResponse(prompt, orgId, systemPrompt);
      if (geminiText) {
        return res.json({ text: geminiText });
      }
    }

    const localText = await executeLocalAssistant(prompt, req);
    return res.json({ text: localText });
  } catch (err: any) {
    console.error('AI Assistant Error:', err);
    return res.status(500).json({ error: 'AI processing failed', message: err.message || 'An internal error occurred while processing the AI response.' });
  }
};

export const getStoredInsights = async (req: AuthRequest, res: Response) => {
  const { type = 'performance' } = req.query;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'SELECT insights, predictions, last_updated FROM ai_insights WHERE org_id = $1 AND type = $2',
      [orgId, type]
    );
    res.json(result.rows[0] || { insights: [], predictions: {} });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const saveInsights = async (req: AuthRequest, res: Response) => {
  const { type = 'performance', insights, predictions } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      `INSERT INTO ai_insights (org_id, type, insights, predictions, last_updated)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (org_id, type)
       DO UPDATE SET 
          insights = EXCLUDED.insights,
          predictions = EXCLUDED.predictions,
          last_updated = CURRENT_TIMESTAMP
       RETURNING *`,
      [orgId, type, JSON.stringify(insights || []), JSON.stringify(predictions || {})]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
