import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import pool from '../db.ts';
import { GoogleGenAI } from '@google/genai';

const getRoleHelpText = (role: string) => {
  const normalizedRole = (role || '').toUpperCase();
  
  if (normalizedRole === 'STAFF' || normalizedRole === 'HOD' || normalizedRole === 'SCHOOL_ADMIN') {
    return `OmniAI Teacher Assistant is active.

📚 **Assignments:**
• **List assignments:** \`list assignments\` or \`show my assignments\`
• **Create assignment:** \`create assignment title:"..." class:"..." subject:"..." due:<YYYY-MM-DD> marks:<number> description:"..."\`
  *Example:* \`create assignment title:"Math Homework" class:"JSS 1" subject:"Algebra" due:2026-06-20 marks:50 description:"Chapter 5 exercises"\`

📖 **Lesson Notes:**
• **List lesson notes:** \`list lesson notes\` or \`my lesson notes\`
• **Create lesson note:** \`create lesson note subject:"..." topic:"..." class:"..." content:"..."\`
  *Example:* \`create lesson note subject:"Mathematics" topic:"Fractions" class:"JSS 1" content:"In this lesson, students will understand fractions."\`

🏫 **Class Scheduling & School Info:**
• **Next class:** \`next class\` or \`when is my next class\`
• **List classes:** \`list classes\`
• **List students:** \`list students\`
• **Get student details:** \`get student info name:"<student name>"\``;
  }

  if (normalizedRole === 'STUDENT') {
    return `OmniAI Student Assistant is active.

📚 **Academic Activities:**
• **My schedule:** \`next class\` or \`when is my next class\` or \`my schedule\` or \`show timetable\`
• **List assignments:** \`list assignments\` or \`show my assignments\`
• **My grades:** \`my grades\` or \`show my results\`
• **My attendance:** \`my attendance\` or \`check attendance\``;
  }

  if (normalizedRole === 'PARENT') {
    return `OmniAI Parent Assistant is active.

👶 **Ward Tracking:**
• **Ward schedule:** \`next class\` or \`ward next class\` or \`ward timetable\`
• **List assignments:** \`list assignments\` or \`show child assignments\`
• **Ward grades:** \`ward grades\` or \`show child results\`
• **Ward attendance:** \`ward attendance\` or \`check child attendance\``;
  }

  // Default fallback for general users
  return `OmniAI Assistant is active.

🏫 **General Info:**
• **List classes:** \`list classes\`
• **List students:** \`list students\``;
};

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
  if (normalized.includes('list assignments') || normalized.includes('show assignments') || normalized.includes('my assignments') || normalized.includes('child assignments')) return 'listAssignments';
  if (normalized.includes('create lesson note')) return 'createLessonNote';
  if (normalized.includes('list lesson notes') || normalized.includes('my lesson notes') || normalized.includes('show lesson notes')) return 'listLessonNotes';
  if (normalized.includes('list classes') || normalized.includes('show classes')) return 'listClasses';
  if (normalized.includes('list students') || normalized.includes('show students')) return 'listStudents';
  if (normalized.includes('performance predictions') || normalized.includes('analyze this school\'s academic data') || normalized.includes('student performance predictions')) return 'generatePerformancePredictions';
  
  if (
    normalized.includes('next class') || 
    normalized.includes('when is my class') || 
    normalized.includes('my schedule') || 
    normalized.includes('timetable') || 
    normalized.includes('ward schedule') ||
    normalized.includes('child schedule')
  ) return 'getNextClass';

  if (
    normalized.includes('grades') || 
    normalized.includes('results') || 
    normalized.includes('marks')
  ) return 'getGrades';

  if (normalized.includes('attendance')) return 'getAttendance';

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

const handleLocalPerformancePredictions = async (req: AuthRequest) => {
  const orgId = req.user.org_id;
  
  const studentsResult = await pool.query(
    'SELECT name, gpa FROM students WHERE org_id = $1 ORDER BY name ASC LIMIT 30',
    [orgId]
  );
  
  const students = studentsResult.rows;
  
  const predictions: Record<string, { trend: string; forecast: string }> = {};
  let totalGpa = 0;
  let passCount = 0;
  
  if (students.length === 0) {
    return JSON.stringify({
      insights: [
        { title: "Predicted Pass Rate", value: "85%", trend: "up", status: "success", icon_name: "TrendingUp" },
        { title: "Academic Trends", value: "Stable", trend: "stable", status: "info", icon_name: "AlertCircle" },
        { title: "AI Forecast", value: "Ready", trend: "stable", status: "info", icon_name: "Zap" }
      ],
      predictions: {
        "Sample Student": { trend: "Improving", forecast: "Showing positive grade acceleration." }
      }
    });
  }

  students.forEach((student: any) => {
    const gpa = parseFloat(student.gpa || '0') || 0.0;
    totalGpa += gpa;
    
    let trend = "Stable";
    let forecast = "Maintaining consistent performance. Keep practicing.";
    
    if (gpa >= 3.5) {
      trend = "Exceptional";
      forecast = `Likely to score 90%+ in final exams. Outstanding academic performance.`;
      passCount++;
    } else if (gpa >= 2.8) {
      trend = "Improving";
      forecast = `Showing steady progress. On track to score 80%+.`;
      passCount++;
    } else if (gpa >= 2.0) {
      trend = "Stable";
      forecast = `Consistently meeting expectations. Needs minor support in weaker subjects.`;
      passCount++;
    } else {
      trend = "At Risk";
      forecast = `Struggling to meet grade thresholds. Immediate tutoring recommended.`;
    }
    
    predictions[student.name] = { trend, forecast };
  });
  
  const avgGpa = totalGpa / students.length;
  const passRate = Math.round((passCount / students.length) * 100);
  
  const insights = [
    {
      title: "Predicted Pass Rate",
      value: `${passRate}%`,
      trend: passRate >= 75 ? "up" : "down",
      status: passRate >= 75 ? "success" : "warning",
      icon_name: "TrendingUp"
    },
    {
      title: "Academic Trends",
      value: avgGpa >= 3.0 ? "Excellent" : avgGpa >= 2.5 ? "Improving" : "Needs Attention",
      trend: avgGpa >= 2.8 ? "up" : "stable",
      status: avgGpa >= 2.8 ? "success" : "info",
      icon_name: "AlertCircle"
    },
    {
      title: "AI Forecast",
      value: avgGpa >= 3.0 ? "High Growth" : "Stable",
      trend: "stable",
      status: "info",
      icon_name: "Zap"
    }
  ];
  
  return JSON.stringify({ insights, predictions });
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
    return `I need title, class, subject, and due date to create an assignment.\n\n${getRoleHelpText(req.user.role)}`;
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
  
  let query = "";
  let params: any[] = [];
  let nameLabel = "your account";

  if (userRole === 'STAFF' || userRole === 'HOD') {
    query = `SELECT a.title, a.due_date, a.status, c.name AS class_name, s.name AS subject_name
             FROM assignments a
             LEFT JOIN classes c ON a.class_id = c.id
             LEFT JOIN subjects s ON a.subject_id = s.id
             WHERE a.org_id = $1 AND a.teacher_id = $2
             ORDER BY a.due_date ASC LIMIT 25`;
    params = [orgId, userId];
  } else if (userRole === 'STUDENT') {
    const studentQuery = await pool.query(
      `SELECT class_id, name FROM students WHERE org_id = $1 AND email = (SELECT email FROM users WHERE id = $2)`,
      [orgId, userId]
    );
    const classId = studentQuery.rows[0]?.class_id;
    if (!classId) return "You are currently not assigned to any class to view assignments.";
    
    query = `SELECT a.title, a.due_date, a.status, c.name AS class_name, s.name AS subject_name
             FROM assignments a
             LEFT JOIN classes c ON a.class_id = c.id
             LEFT JOIN subjects s ON a.subject_id = s.id
             WHERE a.org_id = $1 AND a.class_id = $2
             ORDER BY a.due_date ASC LIMIT 25`;
    params = [orgId, classId];
    nameLabel = studentQuery.rows[0]?.name;
  } else if (userRole === 'PARENT') {
    const childQuery = await pool.query(
      `SELECT id, name, class_id FROM students 
       WHERE org_id = $1 AND LOWER(parent_email) = LOWER((SELECT email FROM users WHERE id = $2))
       LIMIT 1`,
      [orgId, userId]
    );
    if (childQuery.rows.length === 0) return "We could not find any children registered under your email.";
    
    const ward = childQuery.rows[0];
    query = `SELECT a.title, a.due_date, a.status, c.name AS class_name, s.name AS subject_name
             FROM assignments a
             LEFT JOIN classes c ON a.class_id = c.id
             LEFT JOIN subjects s ON a.subject_id = s.id
             WHERE a.org_id = $1 AND a.class_id = $2
             ORDER BY a.due_date ASC LIMIT 25`;
    params = [orgId, ward.class_id];
    nameLabel = ward.name;
  } else {
    // Fallback for admins/others
    query = `SELECT a.title, a.due_date, a.status, c.name AS class_name, s.name AS subject_name
             FROM assignments a
             LEFT JOIN classes c ON a.class_id = c.id
             LEFT JOIN subjects s ON a.subject_id = s.id
             WHERE a.org_id = $1
             ORDER BY a.due_date ASC LIMIT 25`;
    params = [orgId];
  }

  const result = await pool.query(query, params);
  if (result.rows.length === 0) {
    return `No assignments found for ${nameLabel}.`;
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

const handleLocalNextClass = async (req: AuthRequest) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const role = req.user.role;

  const daysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = new Date().getDay();
  const nowTime = new Date().toTimeString().split(' ')[0];

  let timetableRows: any[] = [];
  let userIdentifier = "";

  if (role === 'STAFF' || role === 'HOD') {
    const teacherId = await getTeacherIdByUserId(orgId, userId);
    if (!teacherId) return "We could not locate your teacher record in the staff table.";
    
    const result = await pool.query(
      `SELECT t.day_of_week, t.start_time, t.end_time, t.room, t.type, c.name as class_name, s.name as subject_name
       FROM timetables t
       JOIN classes c ON t.class_id = c.id
       LEFT JOIN subjects s ON t.subject_id = s.id
       WHERE t.org_id = $1 AND t.teacher_id = $2`,
      [orgId, teacherId]
    );
    timetableRows = result.rows;
    userIdentifier = "Teacher";
  } else if (role === 'STUDENT') {
    const studentQuery = await pool.query(
      `SELECT id, class_id, name FROM students WHERE org_id = $1 AND email = (SELECT email FROM users WHERE id = $2)`,
      [orgId, userId]
    );
    if (studentQuery.rows.length === 0) return "We could not find your student record.";
    const classId = studentQuery.rows[0]?.class_id;
    if (!classId) return "You are currently not assigned to any class. Please contact your administrator.";
    
    const result = await pool.query(
      `SELECT t.day_of_week, t.start_time, t.end_time, t.room, t.type, s.name as subject_name, st.name as teacher_name
       FROM timetables t
       LEFT JOIN subjects s ON t.subject_id = s.id
       LEFT JOIN staff st ON t.teacher_id = st.id
       WHERE t.org_id = $1 AND t.class_id = $2`,
      [orgId, classId]
    );
    timetableRows = result.rows;
    userIdentifier = studentQuery.rows[0]?.name;
  } else if (role === 'PARENT') {
    const childQuery = await pool.query(
      `SELECT id, name, class_id FROM students 
       WHERE org_id = $1 AND LOWER(parent_email) = LOWER((SELECT email FROM users WHERE id = $2))
       LIMIT 1`,
      [orgId, userId]
    );
    if (childQuery.rows.length === 0) return "We could not find any children registered under your email.";
    
    const ward = childQuery.rows[0];
    const result = await pool.query(
      `SELECT t.day_of_week, t.start_time, t.end_time, t.room, t.type, s.name as subject_name, st.name as teacher_name
       FROM timetables t
       LEFT JOIN subjects s ON t.subject_id = s.id
       LEFT JOIN staff st ON t.teacher_id = st.id
       WHERE t.org_id = $1 AND t.class_id = $2`,
      [orgId, ward.class_id]
    );
    timetableRows = result.rows;
    userIdentifier = `your child (${ward.name})`;
  } else {
    return "This command is only available to Staff, Students, or Parents.";
  }

  if (timetableRows.length === 0) {
    return `No timetable scheduled classes were found for ${userIdentifier}.`;
  }

  const parsedTimetable = timetableRows.map(row => {
    const dayIndex = daysOrder.indexOf(row.day_of_week);
    return {
      ...row,
      dayIndex
    };
  });

  parsedTimetable.sort((a, b) => {
    let daysDiffA = a.dayIndex - todayIndex;
    if (daysDiffA < 0) daysDiffA += 7;
    
    let daysDiffB = b.dayIndex - todayIndex;
    if (daysDiffB < 0) daysDiffB += 7;

    if (daysDiffA !== daysDiffB) {
      return daysDiffA - daysDiffB;
    }
    return a.start_time.localeCompare(b.start_time);
  });

  const upcomingClasses = parsedTimetable.filter(c => {
    if (c.dayIndex === todayIndex) {
      return c.start_time >= nowTime;
    }
    return true;
  });

  const nextClass = upcomingClasses[0] || parsedTimetable[0];
  
  if (!nextClass) {
    return `There is no scheduled next class for ${userIdentifier}.`;
  }

  const isToday = nextClass.dayIndex === todayIndex;
  const dayStr = isToday ? "today" : `on ${nextClass.day_of_week}`;
  const startStr = nextClass.start_time.slice(0, 5);
  const endStr = nextClass.end_time.slice(0, 5);
  
  if (role === 'STAFF' || role === 'HOD') {
    return `🗓️ **Next Scheduled Class:**
👉 **${nextClass.subject_name || nextClass.type}**
• **Class:** ${nextClass.class_name}
• **Time:** ${startStr} - ${endStr} (${dayStr})
• **Room:** ${nextClass.room || 'N/A'}`;
  } else {
    return `🗓️ **Next Scheduled Class for ${userIdentifier}:**
👉 **${nextClass.subject_name || nextClass.type}**
• **Teacher:** ${nextClass.teacher_name || 'N/A'}
• **Time:** ${startStr} - ${endStr} (${dayStr})
• **Room:** ${nextClass.room || 'N/A'}`;
  }
};

const handleLocalGrades = async (req: AuthRequest) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const role = req.user.role;

  let query = "";
  let params: any[] = [];
  let identifier = "";

  if (role === 'STUDENT') {
    const studentQuery = await pool.query(
      `SELECT id, name FROM students WHERE org_id = $1 AND email = (SELECT email FROM users WHERE id = $2)`,
      [orgId, userId]
    );
    if (studentQuery.rows.length === 0) return "We could not find your student record.";
    const student = studentQuery.rows[0];
    
    query = `
      SELECT r.score, r.remarks, e.title as exam_title, s.name as subject_name
      FROM results r
      JOIN exams e ON r.exam_id = e.id
      LEFT JOIN subjects s ON e.subject_id = s.id
      WHERE r.org_id = $1 AND r.student_id = $2
      ORDER BY r.created_at DESC LIMIT 10
    `;
    params = [orgId, student.id];
    identifier = "your";
  } else if (role === 'PARENT') {
    const childQuery = await pool.query(
      `SELECT id, name FROM students 
       WHERE org_id = $1 AND LOWER(parent_email) = LOWER((SELECT email FROM users WHERE id = $2))
       LIMIT 1`,
      [orgId, userId]
    );
    if (childQuery.rows.length === 0) return "We could not find any children registered under your parent account.";
    const ward = childQuery.rows[0];
    
    query = `
      SELECT r.score, r.remarks, e.title as exam_title, s.name as subject_name
      FROM results r
      JOIN exams e ON r.exam_id = e.id
      LEFT JOIN subjects s ON e.subject_id = s.id
      WHERE r.org_id = $1 AND r.student_id = $2
      ORDER BY r.created_at DESC LIMIT 10
    `;
    params = [orgId, ward.id];
    identifier = `${ward.name}'s`;
  } else {
    return "This command is only available to Students or Parents.";
  }

  const result = await pool.query(query, params);
  if (result.rows.length === 0) {
    return `No academic grades or exam results were found for ${identifier} account.`;
  }

  return `📊 **Academic Grades & Results:**\n\n` + 
    result.rows.map((row: any) => `• **${row.subject_name || 'Exam'}** — Score: **${row.score}%** (${row.exam_title})${row.remarks ? ` — *"${row.remarks}"*` : ''}`).join('\n');
};

const handleLocalAttendance = async (req: AuthRequest) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const role = req.user.role;

  let query = "";
  let params: any[] = [];
  let identifier = "";

  if (role === 'STUDENT') {
    const studentQuery = await pool.query(
      `SELECT id, name FROM students WHERE org_id = $1 AND email = (SELECT email FROM users WHERE id = $2)`,
      [orgId, userId]
    );
    if (studentQuery.rows.length === 0) return "We could not find your student record.";
    const student = studentQuery.rows[0];
    
    query = `
      SELECT status, clock_in, clock_out, date
      FROM student_attendance
      WHERE org_id = $1 AND student_id = $2
      ORDER BY date DESC LIMIT 10
    `;
    params = [orgId, student.id];
    identifier = "your";
  } else if (role === 'PARENT') {
    const childQuery = await pool.query(
      `SELECT id, name FROM students 
       WHERE org_id = $1 AND LOWER(parent_email) = LOWER((SELECT email FROM users WHERE id = $2))
       LIMIT 1`,
      [orgId, userId]
    );
    if (childQuery.rows.length === 0) return "We could not find any children registered under your parent account.";
    const ward = childQuery.rows[0];
    
    query = `
      SELECT status, clock_in, clock_out, date
      FROM student_attendance
      WHERE org_id = $1 AND student_id = $2
      ORDER BY date DESC LIMIT 10
    `;
    params = [orgId, ward.id];
    identifier = `${ward.name}'s`;
  } else {
    return "This command is only available to Students or Parents.";
  }

  const result = await pool.query(query, params);
  if (result.rows.length === 0) {
    return `No attendance records were found for ${identifier} account.`;
  }

  return `📅 **Recent Attendance Record:**\n\n` + 
    result.rows.map((row: any) => `• **${formatDate(row.date)}** — Status: **${row.status}**${row.clock_in ? ` (In: ${row.clock_in.slice(0,5)})` : ''}${row.clock_out ? ` (Out: ${row.clock_out.slice(0,5)})` : ''}`).join('\n');
};

const buildSchoolContext = async (req: AuthRequest) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const role = req.user.role;
  const userName = req.user.name || 'User';
  const parts: string[] = [];

  parts.push(`User: ${userName}, Role: ${role}`);

  try {
    // Organization info
    const orgResult = await pool.query('SELECT name FROM organizations WHERE id = $1', [orgId]);
    if (orgResult.rows[0]) parts.push(`School: ${orgResult.rows[0].name}`);
  } catch {}

  try {
    // Class count
    const classResult = await pool.query('SELECT COUNT(*) as count FROM classes WHERE org_id = $1', [orgId]);
    parts.push(`Total classes in school: ${classResult.rows[0]?.count || 0}`);
  } catch {}

  try {
    // Student count
    const studentResult = await pool.query('SELECT COUNT(*) as count FROM students WHERE org_id = $1', [orgId]);
    parts.push(`Total students in school: ${studentResult.rows[0]?.count || 0}`);
  } catch {}

  if (role === 'STAFF' || role === 'HOD') {
    try {
      const teacherId = await getTeacherIdByUserId(orgId, userId);
      if (teacherId) {
        // Classes this teacher teaches
        const teachingResult = await pool.query(
          `SELECT DISTINCT c.name, c.section FROM timetables t
           JOIN classes c ON t.class_id = c.id
           WHERE t.org_id = $1 AND t.teacher_id = $2 AND t.type = 'Lesson'`,
          [orgId, teacherId]
        );
        parts.push(`Classes this teacher teaches: ${teachingResult.rows.length}`);
        if (teachingResult.rows.length > 0) {
          parts.push(`Class list: ${teachingResult.rows.map((r: any) => `${r.name}${r.section ? ' ' + r.section : ''}`).join(', ')}`);
        }

        // Subjects this teacher teaches
        const subjectsResult = await pool.query(
          `SELECT DISTINCT s.name FROM timetables t
           JOIN subjects s ON t.subject_id = s.id
           WHERE t.org_id = $1 AND t.teacher_id = $2`,
          [orgId, teacherId]
        );
        if (subjectsResult.rows.length > 0) {
          parts.push(`Subjects: ${subjectsResult.rows.map((r: any) => r.name).join(', ')}`);
        }

        // Timetable slots per week
        const slotsResult = await pool.query(
          `SELECT COUNT(*) as count FROM timetables WHERE org_id = $1 AND teacher_id = $2 AND type = 'Lesson'`,
          [orgId, teacherId]
        );
        parts.push(`Total teaching periods per week: ${slotsResult.rows[0]?.count || 0}`);

        // Assignment count
        const assignResult = await pool.query(
          `SELECT COUNT(*) as count FROM assignments WHERE org_id = $1 AND teacher_id = $2`,
          [orgId, userId]
        );
        parts.push(`Assignments created by teacher: ${assignResult.rows[0]?.count || 0}`);

        // Lesson notes
        const notesResult = await pool.query(
          `SELECT COUNT(*) as total, 
                  COUNT(*) FILTER (WHERE status = 'Draft') as draft,
                  COUNT(*) FILTER (WHERE status = 'Approved') as approved
           FROM lesson_notes WHERE org_id = $1 AND teacher_id = $2`,
          [orgId, teacherId]
        );
        const n = notesResult.rows[0];
        parts.push(`Lesson notes: ${n?.total || 0} total (${n?.draft || 0} draft, ${n?.approved || 0} approved)`);
      }
    } catch {}
  } else if (role === 'STUDENT') {
    try {
      const studentQuery = await pool.query(
        `SELECT id, name, class_id, gpa, admission_no FROM students WHERE org_id = $1 AND email = (SELECT email FROM users WHERE id = $2)`,
        [orgId, userId]
      );
      const student = studentQuery.rows[0];
      if (student) {
        parts.push(`Student name: ${student.name}, Admission No: ${student.admission_no || 'N/A'}, GPA: ${student.gpa || '0.0'}`);
        if (student.class_id) {
          const classInfo = await pool.query('SELECT name, section FROM classes WHERE id = $1', [student.class_id]);
          if (classInfo.rows[0]) parts.push(`Enrolled class: ${classInfo.rows[0].name} ${classInfo.rows[0].section || ''}`);
        }
      }
    } catch {}
  } else if (role === 'PARENT') {
    try {
      const children = await pool.query(
        `SELECT name, class_id, gpa, admission_no FROM students
         WHERE org_id = $1 AND LOWER(parent_email) = LOWER((SELECT email FROM users WHERE id = $2))`,
        [orgId, userId]
      );
      if (children.rows.length > 0) {
        parts.push(`Children: ${children.rows.map((c: any) => `${c.name} (GPA: ${c.gpa || '0.0'})`).join(', ')}`);
      }
    } catch {}
  } else if (role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN') {
    try {
      const staffResult = await pool.query('SELECT COUNT(*) as count FROM staff WHERE org_id = $1', [orgId]);
      parts.push(`Total staff: ${staffResult.rows[0]?.count || 0}`);
      const deptResult = await pool.query('SELECT COUNT(*) as count FROM departments WHERE org_id = $1', [orgId]);
      parts.push(`Total departments: ${deptResult.rows[0]?.count || 0}`);
      const subjectResult = await pool.query('SELECT COUNT(*) as count FROM subjects WHERE org_id = $1', [orgId]);
      parts.push(`Total subjects: ${subjectResult.rows[0]?.count || 0}`);
    } catch {}
  }

  return parts.join('\n');
};

const handleFreeformLocally = async (prompt: string, req: AuthRequest) => {
  const orgId = req.user.org_id;
  const userId = req.user.id;
  const role = req.user.role;
  const normalized = normalizeText(prompt);

  // How many classes do I teach?
  if ((role === 'STAFF' || role === 'HOD') && (normalized.includes('how many class') || normalized.includes('classes do i teach') || normalized.includes('classes i teach'))) {
    const teacherId = await getTeacherIdByUserId(orgId, userId);
    if (!teacherId) return "We could not locate your teacher profile in the staff records.";
    const result = await pool.query(
      `SELECT DISTINCT c.name, c.section FROM timetables t
       JOIN classes c ON t.class_id = c.id
       WHERE t.org_id = $1 AND t.teacher_id = $2 AND t.type = 'Lesson'`,
      [orgId, teacherId]
    );
    if (result.rows.length === 0) return "You currently have no classes assigned to you on the timetable.";
    const classList = result.rows.map((r: any) => `• ${r.name}${r.section ? ` (${r.section})` : ''}`).join('\n');
    return `You teach **${result.rows.length}** class(es):\n\n${classList}`;
  }

  // How many subjects do I teach?
  if ((role === 'STAFF' || role === 'HOD') && (normalized.includes('how many subject') || normalized.includes('subjects do i teach') || normalized.includes('subjects i teach') || normalized.includes('what subject'))) {
    const teacherId = await getTeacherIdByUserId(orgId, userId);
    if (!teacherId) return "We could not locate your teacher profile in the staff records.";
    const result = await pool.query(
      `SELECT DISTINCT s.name FROM timetables t
       JOIN subjects s ON t.subject_id = s.id
       WHERE t.org_id = $1 AND t.teacher_id = $2`,
      [orgId, teacherId]
    );
    if (result.rows.length === 0) return "You currently have no subjects assigned to you.";
    const subList = result.rows.map((r: any) => `• ${r.name}`).join('\n');
    return `You teach **${result.rows.length}** subject(s):\n\n${subList}`;
  }

  // How many students (school-wide or in my class)?
  if (normalized.includes('how many student')) {
    if (role === 'STUDENT') {
      const studentQuery = await pool.query(
        `SELECT class_id FROM students WHERE org_id = $1 AND email = (SELECT email FROM users WHERE id = $2)`,
        [orgId, userId]
      );
      const classId = studentQuery.rows[0]?.class_id;
      if (classId) {
        const result = await pool.query('SELECT COUNT(*) as count FROM students WHERE org_id = $1 AND class_id = $2', [orgId, classId]);
        return `There are **${result.rows[0]?.count || 0}** students in your class.`;
      }
    }
    const result = await pool.query('SELECT COUNT(*) as count FROM students WHERE org_id = $1', [orgId]);
    return `There are **${result.rows[0]?.count || 0}** students in the school.`;
  }

  // How many staff / teachers?
  if (normalized.includes('how many staff') || normalized.includes('how many teacher')) {
    const result = await pool.query('SELECT COUNT(*) as count FROM staff WHERE org_id = $1', [orgId]);
    return `There are **${result.rows[0]?.count || 0}** staff members in the school.`;
  }

  // What's my GPA / academic standing?
  if (role === 'STUDENT' && (normalized.includes('my gpa') || normalized.includes('academic standing'))) {
    const result = await pool.query(
      `SELECT name, gpa FROM students WHERE org_id = $1 AND email = (SELECT email FROM users WHERE id = $2)`,
      [orgId, userId]
    );
    const student = result.rows[0];
    if (!student) return "We could not find your student record.";
    return `Your current GPA is **${student.gpa || '0.0'}**.`;
  }

  return null; // Not handled locally
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
    case 'generatePerformancePredictions':
      return await handleLocalPerformancePredictions(req);
    case 'getNextClass':
      return await handleLocalNextClass(req);
    case 'getGrades':
      return await handleLocalGrades(req);
    case 'getAttendance':
      return await handleLocalAttendance(req);
    case 'listClasses':
      return await handleLocalListClasses(req);
    case 'listStudents':
      return await handleLocalListStudents(req);
    case 'getStudentInfo':
      return await handleLocalStudentInfo(prompt, req);
    default:
      return null; // Signal that we need freeform handling
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

    // 1. Try known local commands first
    const localText = await executeLocalAssistant(prompt, req);
    if (localText) {
      return res.json({ text: localText });
    }

    // 2. Try local freeform handler for common DB-answerable questions
    const freeformAnswer = await handleFreeformLocally(prompt, req);
    if (freeformAnswer) {
      return res.json({ text: freeformAnswer });
    }

    // 3. Try Gemini with rich school context for truly open-ended questions
    const schoolContext = await buildSchoolContext(req);
    const enrichedSystemPrompt = `You are OmniAI, an intelligent school management assistant for SchoolHub.
You have access to the following real-time school data about the current user and their school:

${schoolContext}

Answer the user's question based on this data. Be concise, friendly, and helpful. Use emoji where appropriate.
If the data doesn't contain enough info to answer, say so honestly and suggest what command they could try.
Do NOT make up data that isn't provided above.
${systemPrompt ? `\nAdditional context: ${systemPrompt}` : ''}`;

    const geminiText = await getGeminiResponse(prompt, orgId, enrichedSystemPrompt);
    if (geminiText) {
      return res.json({ text: geminiText });
    }

    // 4. Final fallback: role-aware help text
    return res.json({ text: getRoleHelpText(req.user.role) });
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
