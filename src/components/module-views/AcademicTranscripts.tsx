import React, { useState, useMemo } from 'react';
import { fetchTranscriptsData } from '../../lib/api';
import { 
  FileText, Search, Printer, Check, ChevronDown, 
  RotateCcw, AlertCircle, Settings, User, Calendar
} from 'lucide-react';

interface AcademicTranscriptsProps {
  students: any[];
  classes: any[];
  organization: any;
}

export default function AcademicTranscripts({ students, classes, organization }: AcademicTranscriptsProps) {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Settings customizable before print
  const [principalName, setPrincipalName] = useState<string>('');
  const [generationDate, setGenerationDate] = useState<string>(
    new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  );
  const [showSignature, setShowSignature] = useState<boolean>(true);
  const [showGradingKey, setShowGradingKey] = useState<boolean>(true);

  // Filter students based on class selection and search query
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesClass = selectedClass === 'all' || student.class_id === selectedClass;
      const matchesSearch = 
        student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.admission_no?.toLowerCase().includes(searchQuery.toLowerCase());
      const isNotAlumniOrWithdrawn = student.status !== 'Alumni' && student.status !== 'Withdrawn';
      return matchesClass && matchesSearch && isNotAlumniOrWithdrawn;
    });
  }, [students, selectedClass, searchQuery]);

  // Toggle student selection
  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Toggle select all on currently filtered list
  const isAllSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false;
    return filteredStudents.every(student => !!selectedStudents[student.id]);
  }, [filteredStudents, selectedStudents]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all in the filtered list
      const updated = { ...selectedStudents };
      filteredStudents.forEach(student => {
        updated[student.id] = false;
      });
      setSelectedStudents(updated);
    } else {
      // Select all in the filtered list
      const updated = { ...selectedStudents };
      filteredStudents.forEach(student => {
        updated[student.id] = true;
      });
      setSelectedStudents(updated);
    }
  };

  const selectedCount = useMemo(() => {
    return Object.values(selectedStudents).filter(Boolean).length;
  }, [selectedStudents]);

  const handleGenerateTranscripts = async () => {
    const idsToGenerate = Object.keys(selectedStudents).filter(id => selectedStudents[id]);
    if (idsToGenerate.length === 0) {
      alert('Please select at least one student to generate transcripts.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchTranscriptsData(idsToGenerate);
      printTranscripts(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to retrieve academic history for transcripts.');
    } finally {
      setLoading(false);
    }
  };

  const printTranscripts = (data: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is preventing opening print preview. Please allow pop-ups for this website.');
      return;
    }

    const { students: transcriptStudents, results, gradingScales, organization: org } = data;
    const brandColor = org?.brand_color || '#4f46e5';

    let htmlContent = `
      <html>
        <head>
          <title>Academic Transcripts</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            
            body {
              font-family: 'Inter', sans-serif;
              color: #1f2937;
              line-height: 1.4;
              margin: 0;
              padding: 0;
              background-color: #f3f4f6;
            }

            .transcript-page {
              background-color: #ffffff;
              width: 210mm;
              min-height: 297mm;
              box-sizing: border-box;
              padding: 20mm;
              margin: 10px auto;
              position: relative;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              page-break-after: always;
            }

            .transcript-page:last-child {
              page-break-after: avoid;
            }

            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }

            .header-logo {
              width: 70px;
              height: 70px;
              object-fit: contain;
              margin-right: 15px;
            }

            .school-name {
              font-size: 24px;
              font-weight: 900;
              margin: 0;
              color: #111827;
              text-transform: uppercase;
              letter-spacing: -0.025em;
            }

            .school-meta {
              font-size: 11px;
              color: #4b5563;
              margin: 3px 0 0 0;
              font-weight: 500;
            }

            .transcript-banner {
              text-align: center;
              border-top: 3px solid ${brandColor};
              border-bottom: 1px solid #e5e7eb;
              padding: 12px 0;
              margin-bottom: 25px;
            }

            .transcript-banner h2 {
              font-size: 18px;
              font-weight: 800;
              margin: 0;
              letter-spacing: 0.1em;
              color: #111827;
              text-transform: uppercase;
            }

            .info-grid {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }

            .info-grid td {
              padding: 5px 8px;
              font-size: 12px;
              vertical-align: top;
            }

            .info-label {
              font-weight: 600;
              color: #4b5563;
              width: 150px;
            }

            .info-value {
              font-weight: 700;
              color: #111827;
            }

            .academic-section {
              margin-bottom: 30px;
            }

            .term-title {
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              background-color: #f9fafb;
              border-left: 4px solid ${brandColor};
              padding: 8px 12px;
              margin-bottom: 10px;
              color: #1f2937;
              display: flex;
              justify-content: space-between;
            }

            .results-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }

            .results-table th {
              background-color: #f3f4f6;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #4b5563;
              text-align: left;
              padding: 8px 12px;
              border-bottom: 1px solid #e5e7eb;
            }

            .results-table td {
              font-size: 12px;
              padding: 8px 12px;
              border-bottom: 1px solid #f3f4f6;
              color: #1f2937;
            }

            .text-center {
              text-align: center !important;
            }

            .font-mono {
              font-family: monospace;
              font-weight: 700;
            }

            .term-summary {
              display: flex;
              justify-content: flex-end;
              gap: 20px;
              font-size: 11px;
              font-weight: 700;
              color: #4b5563;
              padding-right: 12px;
            }

            .summary-item span {
              color: #111827;
              font-weight: 800;
            }

            .legend-section {
              margin-top: 40px;
              border-top: 1px dashed #d1d5db;
              padding-top: 20px;
            }

            .legend-title {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #6b7280;
              margin-bottom: 10px;
            }

            .legend-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
            }

            .legend-item {
              font-size: 10px;
              color: #4b5563;
              background-color: #f9fafb;
              padding: 6px 10px;
              border-radius: 6px;
              border: 1px solid #f3f4f6;
            }

            .legend-item strong {
              color: #111827;
              font-weight: 700;
            }

            .footer-section {
              margin-top: 50px;
              width: 100%;
              border-collapse: collapse;
            }

            .footer-section td {
              width: 50%;
              vertical-align: bottom;
              font-size: 12px;
            }

            .signature-area {
              border-top: 1px solid #d1d5db;
              width: 200px;
              text-align: center;
              padding-top: 8px;
              margin-top: 10px;
              font-weight: 600;
              color: #4b5563;
            }

            .signature-img {
              max-height: 50px;
              max-width: 180px;
              display: block;
              margin: 0 auto 5px auto;
              object-fit: contain;
            }

            .stamp-box {
              width: 100px;
              height: 100px;
              border: 2px dashed #d1d5db;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9px;
              font-weight: 800;
              color: #9ca3af;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin: 0 auto;
            }

            @media print {
              body {
                background-color: #ffffff;
                margin: 0;
                padding: 0;
              }

              .transcript-page {
                box-shadow: none;
                margin: 0;
                page-break-after: always;
                page-break-inside: avoid;
                width: 100%;
                height: 100%;
                padding: 10mm;
              }

              .transcript-page:last-child {
                page-break-after: avoid;
              }
            }
          </style>
        </head>
        <body>
    `;

    transcriptStudents.forEach((student: any) => {
      // Filter results for this student
      const studentResults = results.filter((r: any) => r.student_id === student.id);
      
      // Group results by academic year and term
      const academicHistory: Record<string, any[]> = {};
      studentResults.forEach((res: any) => {
        const key = `${res.academic_year} | ${res.term}`;
        if (!academicHistory[key]) {
          academicHistory[key] = [];
        }
        academicHistory[key].push(res);
      });

      htmlContent += `
        <div class="transcript-page">
          <!-- Header -->
          <table class="header-table">
            <tr>
              <td style="width: 80px; vertical-align: middle;">
                ${org?.logo ? `<img src="${org.logo}" class="header-logo" alt="Logo" />` : ''}
              </td>
              <td style="vertical-align: middle;">
                <h1 class="school-name">${org?.name || 'Academic Institution'}</h1>
                <p class="school-meta">
                  ${org?.address ? `${org.address} &nbsp;|&nbsp; ` : ''}
                  ${org?.contact_number ? `Tel: ${org.contact_number} &nbsp;|&nbsp; ` : ''}
                  ${org?.email ? `Email: ${org.email}` : ''}
                </p>
              </td>
            </tr>
          </table>

          <!-- Transcript Banner -->
          <div class="transcript-banner">
            <h2>Official Academic Transcript</h2>
          </div>

          <!-- Student Information Details -->
          <table class="info-grid">
            <tr>
              <td class="info-label">Student Name:</td>
              <td class="info-value">${student.name}</td>
              <td class="info-label">Admission No:</td>
              <td class="info-value font-mono">${student.admission_no || 'N/A'}</td>
            </tr>
            <tr>
              <td class="info-label">Gender:</td>
              <td class="info-value">${student.gender || 'N/A'}</td>
              <td class="info-label">Date of Birth:</td>
              <td class="info-value">${student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</td>
            </tr>
            <tr>
              <td class="info-label">Current / Final Class:</td>
              <td class="info-value">${student.current_class_name || 'N/A'}</td>
              <td class="info-label">Date of Admission:</td>
              <td class="info-value">${student.admission_date ? new Date(student.admission_date).toLocaleDateString('en-GB') : 'N/A'}</td>
            </tr>
          </table>

          <!-- Academic History Records -->
          <div class="academic-records">
      `;

      const sortedHistoryKeys = Object.keys(academicHistory).sort();

      if (sortedHistoryKeys.length === 0) {
        htmlContent += `
          <div style="padding: 40px; text-align: center; color: #9ca3af; font-size: 14px; font-weight: 500;">
            No published results found in student's academic history.
          </div>
        `;
      } else {
        sortedHistoryKeys.forEach(key => {
          const termResults = academicHistory[key];
          const [academicYear, termName] = key.split(' | ');
          const className = termResults[0]?.class_name || 'N/A';

          // Calculate average
          let totalScore = 0;
          let count = 0;
          termResults.forEach(r => {
            const scoreVal = parseFloat(r.score);
            if (!isNaN(scoreVal)) {
              totalScore += scoreVal;
              count++;
            }
          });
          const termAverage = count > 0 ? (totalScore / count).toFixed(2) : 'N/A';

          htmlContent += `
            <div class="academic-section">
              <div class="term-title">
                <span>${academicYear} - ${termName}</span>
                <span>Class: ${className}</span>
              </div>
              <table class="results-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th style="width: 120px;" class="text-center">Score / Marks</th>
                    <th style="width: 120px;" class="text-center">Grade</th>
                  </tr>
                </thead>
                <tbody>
          `;

          termResults.forEach(r => {
            htmlContent += `
              <tr>
                <td style="font-weight: 600;">${r.subject_name || r.subject || 'N/A'}</td>
                <td class="text-center font-mono">${r.score || 'N/A'}</td>
                <td class="text-center font-mono" style="color: ${brandColor};">${r.grade || 'N/A'}</td>
              </tr>
            `;
          });

          htmlContent += `
                </tbody>
              </table>
              <div class="term-summary">
                <div class="summary-item">Subjects Offered: <span>${count}</span></div>
                <div class="summary-item">Total Marks: <span>${totalScore.toFixed(1)}</span></div>
                <div class="summary-item">Term Average: <span>${termAverage}%</span></div>
              </div>
            </div>
          `;
        });
      }

      htmlContent += `
          </div>
      `;

      // Grading Scale Legend
      if (showGradingKey && gradingScales.length > 0) {
        // Find grading scale for current class if possible
        const classScale = gradingScales[0]; // Fallback to first
        htmlContent += `
          <div class="legend-section">
            <div class="legend-title">Grading Legend: ${classScale.name}</div>
            <div class="legend-grid">
              ${classScale.levels.map((lvl: any) => `
                <div class="legend-item">
                  <strong>${lvl.grade}</strong>: ${lvl.min_score} - ${lvl.max_score}% &nbsp;<span style="color: #9ca3af;">(${lvl.description || ''})</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      // Footer - Signatures and Stamps
      htmlContent += `
          <!-- Footer section -->
          <table class="footer-section">
            <tr>
              <td>
                <p style="margin: 0 0 40px 0; color: #4b5563;">Date Generated: <strong>${generationDate}</strong></p>
                <div class="signature-area">
                  Registrar / School Administrator
                </div>
              </td>
              <td style="text-align: center;">
                <div class="stamp-box">
                  Official Seal
                </div>
              </td>
              <td>
                <div style="display: flex; flex-direction: column; align-items: flex-end;">
                  ${showSignature && org?.signature ? `
                    <img src="${org.signature}" class="signature-img" alt="Principal Signature" />
                  ` : '<div style="height: 55px;"></div>'}
                  <div class="signature-area" style="margin-top: 0;">
                    ${principalName ? `${principalName} <br/>` : ''}
                    Head Teacher / Principal
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </div>
      `;
    });

    htmlContent += `
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Trigger printing
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Header and Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" /> Academic Transcripts
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Generate and print complete academic history records for students in bulk or individually.
          </p>
        </div>
        
        <button
          onClick={handleGenerateTranscripts}
          disabled={loading || selectedCount === 0}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-100 active:scale-95 whitespace-nowrap"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Printer className="w-4 h-4" />
              Generate Transcripts {selectedCount > 0 && `(${selectedCount})`}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-sm text-red-600 font-medium">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Configuration Settings */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6 h-fit">
          <div className="flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-200 text-sm border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <Settings className="w-4 h-4 text-zinc-500" /> Transcript Styling & Settings
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Head Teacher / Principal Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  placeholder="e.g. Dr. Isaac Arthur"
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Transcript Issue Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={generationDate}
                  onChange={(e) => setGenerationDate(e.target.value)}
                  placeholder="e.g. 15th July 2026"
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showSignature}
                  onChange={(e) => setShowSignature(e.target.checked)}
                  className="w-4.5 h-4.5 text-indigo-600 bg-zinc-100 border-zinc-300 rounded focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Include Digital Principal Signature</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showGradingKey}
                  onChange={(e) => setShowGradingKey(e.target.checked)}
                  className="w-4.5 h-4.5 text-indigo-600 bg-zinc-100 border-zinc-300 rounded focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Show Grading Scale Legend</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Side: Student Selection List */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col min-h-[500px]">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            
            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by student name or admission no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Class Dropdown */}
            <div className="relative w-full sm:w-60">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-zinc-700 dark:text-zinc-300"
              >
                <option value="all">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>

            {/* Clear Filters Button */}
            {(selectedClass !== 'all' || searchQuery !== '') && (
              <button
                onClick={() => { setSelectedClass('all'); setSearchQuery(''); }}
                className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl border border-zinc-200 text-zinc-500"
                title="Reset Filters"
              >
                <RotateCcw className="w-4.5 h-4.5" />
              </button>
            )}
          </div>

          {/* Student Table list */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  <th className="py-3 px-4 w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-indigo-600 bg-zinc-50 border-zinc-300 rounded focus:ring-indigo-500"
                    />
                  </th>
                  <th className="py-3 px-2">Student Name</th>
                  <th className="py-3 px-2">Admission No</th>
                  <th className="py-3 px-2">Class</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(student => (
                    <tr 
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 cursor-pointer transition-colors ${
                        selectedStudents[student.id] ? 'bg-indigo-50/10 dark:bg-indigo-900/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={!!selectedStudents[student.id]}
                          onChange={() => toggleStudent(student.id)}
                          className="w-4 h-4 text-indigo-600 bg-zinc-50 border-zinc-300 rounded focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-3.5 px-2 font-bold text-zinc-800 dark:text-zinc-200">{student.name}</td>
                      <td className="py-3.5 px-2 font-mono text-zinc-500 text-xs">{student.admission_no || '—'}</td>
                      <td className="py-3.5 px-2 text-zinc-600 dark:text-zinc-400 text-xs font-semibold">
                        {classes.find(c => c.id === student.class_id)?.name || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                          {student.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400 font-medium">
                      No active students found matching the filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Selection Stats */}
          {selectedCount > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-medium">
              <div>
                Selected <span className="font-bold text-indigo-600">{selectedCount}</span> of <span className="font-bold text-zinc-700 dark:text-zinc-300">{filteredStudents.length}</span> students
              </div>
              <button 
                onClick={() => setSelectedStudents({})}
                className="text-zinc-400 hover:text-zinc-600 font-bold"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
