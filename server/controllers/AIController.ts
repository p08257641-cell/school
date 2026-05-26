import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import pool from '../db.ts';

const localAssistantHelpText = `I can help with the following commands:
- list assignments
- show my assignments
- list classes
- list students
- get student info name:<student name>
- create assignment title:"..." class:"..." subject:"..." due:<YYYY-MM-DD> marks:<number> description:"..."

Example: create assignment title:"Math Homework" class:"JSS 1" subject:"Algebra" due:2026-06-20 marks:50 description:"Chapter 5 exercises"`;

const parseKeyValuePairs = (text: string) => {
  const params: Record<string, string> = {};
  const regex = /(?:title|class|subject|due_date|due|marks|total_marks|description|name|student)\s*(?:=|:)\s*("([^"]+)"|'([^']+)'|([^\s,;]+))/gi;
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
  if (normalized.includes('list classes') || normalized.includes('show classes')) return 'listClasses';
  if (normalized.includes('list students') || normalized.includes('show students')) return 'listStudents';
  if (normalized.includes('student info') || normalized.includes('student details') || normalized.includes('find student') || normalized.includes('student')) return 'getStudentInfo';
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
    'SELECT full_name, email FROM students WHERE org_id = $1 ORDER BY full_name ASC LIMIT 50',
    [orgId]
  );
  if (result.rows.length === 0) {
    return 'No students were found for your organization.';
  }
  return result.rows.map((row: any) => `• ${row.full_name}${row.email ? ` — ${row.email}` : ''}`).join('\n');
};

const handleLocalStudentInfo = async (prompt: string, req: AuthRequest) => {
  const orgId = req.user.org_id;
  const params = parseKeyValuePairs(prompt);
  const searchName = params.name || prompt.match(/student\s+(?:named\s+)?(.+)/i)?.[1];
  if (!searchName) {
    return 'I need a student name to look up. Try: student info name:"John Doe"';
  }
  const query = `SELECT full_name, email, class_id, phone, admission_no FROM students WHERE org_id = $1 AND LOWER(full_name) LIKE LOWER($2) LIMIT 10`;
  const result = await pool.query(query, [orgId, `%${searchName.trim()}%`]);
  if (result.rows.length === 0) {
    return `No students found matching '${searchName.trim()}'.`;
  }
  return result.rows.map((row: any) => `• ${row.full_name}${row.admission_no ? ` (Admission No: ${row.admission_no})` : ''}${row.email ? ` — ${row.email}` : ''}${row.phone ? ` — ${row.phone}` : ''}`).join('\n');
};

const executeLocalAssistant = async (prompt: string, req: AuthRequest) => {
  const action = detectLocalAssistantAction(prompt);
  switch (action) {
    case 'createAssignment':
      return await handleLocalCreateAssignment(prompt, req);
    case 'listAssignments':
      return await handleLocalListAssignments(req);
    case 'listClasses':
      return await handleLocalListClasses(req);
    case 'listStudents':
      return await handleLocalListStudents(req);
    case 'getStudentInfo':
      return await handleLocalStudentInfo(prompt, req);
    default:
      return `Local assistant is active. ${localAssistantHelpText}`;
  }
};

export const generateResponse = async (req: AuthRequest, res: Response) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const localText = await executeLocalAssistant(prompt, req);
    return res.json({ text: localText });
  } catch (err: any) {
    console.error('Local AI Assistant Error:', err);
    return res.status(500).json({ error: 'Local AI processing failed', message: err.message || 'An internal error occurred while processing the local assistant command.' });
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
