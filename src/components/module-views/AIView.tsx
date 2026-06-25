import React from 'react';
import {
  Brain,
  Search,
  Bot,
  Users,
  Settings,
  Zap,
  Sparkles,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DataTable } from '../DataTable';
import { safeAiFetch, extractJsonFromAiResponse } from '../../lib/aiUtils';
import { 
  fetchAIInsights, 
  saveAIInsights, 
  generateAIResponse 
} from '../../lib/api';
import { API_BASE_URL } from '../../constants';


export const AIModules = {
  PerformancePrediction: ({
    role,
    organization,
    results,
    students,
    onSave,
    onDelete
  }: {
    role?: string,
    organization?: any,
    results?: any[],
    students?: any[],
    onSave?: (data: any) => void,
    onDelete?: (item: any) => void
  }) => {
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [aiInsights, setAiInsights] = React.useState<any[]>([]);
    const [studentPredictions, setStudentPredictions] = React.useState<Record<string, any>>({});
    const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);

    const isStaff = role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN' || role === 'STAFF' || role === 'HOD';

    React.useEffect(() => {
      fetchStoredInsights();
    }, []);

    const fetchStoredInsights = async () => {
      try {
        const data = await fetchAIInsights();
        if (data.insights) setAiInsights(data.insights);
        if (data.predictions) setStudentPredictions(data.predictions);
        if (data.last_updated) setLastUpdated(data.last_updated);
      } catch (err) {
        console.error('Failed to fetch stored insights:', err);
      }
    };

    const saveGeneratedInsights = async (insights: any[], predictions: any) => {
      try {
        await saveAIInsights({
          type: 'performance',
          insights,
          predictions
        });
        setLastUpdated(new Date().toISOString());
      } catch (err) {
        console.error('Failed to save insights:', err);
      }
    };

    const handleAnalysis = async () => {
      if (!isStaff) return;
      setIsAnalyzing(true);
      try {
        // Sample students for detailed analysis (avoiding token limits)
        const studentSample = (students || []).slice(0, 30).map(s => {
          const studentResults = (results || []).filter(r => String(r.student_id) === String(s.id));
          
          // Calculate an actual average from their results to help the AI
          const avgScore = studentResults.length > 0 
            ? studentResults.reduce((acc, r) => acc + (Number(r.score) || 0), 0) / studentResults.length
            : 0;

          return {
            name: s.name,
            currentGpa: s.gpa && s.gpa !== '0.0' ? s.gpa : avgScore.toFixed(2),
            scores: studentResults.slice(-5).map(r => ({ subject: r.subject || r.subject_name, score: r.score })),
            attendance: s.attendance || '90%'
          };
        });

        const dataSummary = {
          schoolAverage: results && results.length > 0
            ? (results.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / results.length).toFixed(2)
            : 0,
          sample: studentSample
        };

        const prompt = `Analyze this school's academic data and provide student performance predictions.
        
        DATA: ${JSON.stringify(dataSummary)}
        
        REQUIRED JSON STRUCTURE:
        {
          "insights": [
            {"title": "Predicted Pass Rate", "value": "85%", "trend": "up", "status": "success", "icon_name": "TrendingUp"}
          ],
          "predictions": {
            "Student Name": { "trend": "Improving", "forecast": "Likely to score 90%+" }
          }
        }
        
        Respond ONLY with the JSON object. No conversational text. No preamble.`;

        const result = await generateAIResponse(prompt, { 
          systemPrompt: "You are a senior education consultant. Analyze student scores and predict their final outcomes. Respond only with JSON.",
          model: 'llama-3.3-70b-versatile'
        });
        
        // Wrap result to match expected safeAiFetch format if necessary, 
        // but generateAIResponse returns data directly. 
        // We'll normalize it here.
        const normalizedResult = { success: true, data: result };

        if (!normalizedResult.success) {
          throw new Error('AI analysis failed');
        }

        const aiText = normalizedResult.data?.text || "{}";
        const parsed = extractJsonFromAiResponse(aiText);

        if (!parsed || (!parsed.insights && !parsed.predictions)) {
          throw new Error('AI analysis produced invalid data format. Please try again.');
        }

        if (parsed.insights) setAiInsights(parsed.insights);
        if (parsed.predictions) setStudentPredictions(parsed.predictions);
        
        // Persist to DB
        await saveGeneratedInsights(parsed.insights || [], parsed.predictions || {});
        
        (window as any).showToast?.('AI Forecast successfully generated!', 'success');
      } catch (err: any) {
        console.error('AI Analysis Error:', err);
        (window as any).showToast?.(err, 'error');
      } finally {
        setIsAnalyzing(false);
      }
    };

    const displayInsights = aiInsights.length > 0 ? aiInsights : [
      { title: 'Predicted Pass Rate', value: '--', trend: 'stable', status: 'info', icon_name: 'TrendingUp' },
      { title: 'Academic Trends', value: 'Pending', trend: 'stable', status: 'info', icon_name: 'AlertCircle' },
      { title: 'AI Forecast', value: 'Ready', trend: 'stable', status: 'info', icon_name: 'Zap' },
    ];

    const getIcon = (name: string) => {
      switch (name) {
        case 'TrendingUp': return TrendingUp;
        case 'AlertCircle': return AlertCircle;
        case 'Users': return Users;
        case 'Zap': return Zap;
        default: return Info;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 dark:border-indigo-500/20 flex items-center justify-center bg-indigo-500/5 dark:bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)] shrink-0">
              <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Performance Insights</h2>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI-driven academic predictions and student performance tracking</p>
                {lastUpdated && isStaff && (
                  <span className="text-[10px] text-indigo-400 font-black uppercase tracking-tighter">
                    • Last Analysis: {new Date(lastUpdated).toLocaleDateString()} {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          </div>
          {isStaff && (
            <button
              onClick={handleAnalysis}
              disabled={isAnalyzing}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none hover:scale-105 active:scale-95"
            >
              {isAnalyzing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              {isAnalyzing ? 'Analyzing Data...' : 'Run Prediction Engine'}
            </button>
          )}
        </div>

        {isStaff && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayInsights.map((stat, i) => {
              const Icon = getIcon(stat.icon_name);
              return (
                <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:border-indigo-500 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      stat.status === 'success' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" :
                        stat.status === 'warning' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600" :
                          "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest",
                      stat.trend === 'up' ? "bg-emerald-50 text-emerald-600" :
                        stat.trend === 'down' ? "bg-amber-50 text-amber-600" :
                          "bg-zinc-100 text-zinc-600"
                    )}>
                      {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : stat.trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                      {stat.trend}
                    </div>
                  </div>
                  <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{stat.title}</h3>
                  <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{stat.value}</p>
                </div>
              );
            })}
          </div>
        )}

        {role === 'PARENT' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {students?.map((ward: any) => {
              const predictionData = studentPredictions[ward.name] as any;
              const trend = (predictionData?.trend || '').toLowerCase();
              const forecast = predictionData?.forecast || '';
              const isHighRisk = trend.includes('risk') || trend.includes('drop') || trend.includes('concern');
              const isImproving = trend.includes('impro') || trend.includes('grow') || trend.includes('excep');

              return (
                <div key={ward.id} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm group hover:shadow-xl transition-all duration-500">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:scale-110 transition-transform duration-500">
                      {ward.profile_pic ? (
                        <img src={ward.profile_pic} alt={ward.name} className="w-full h-full object-cover rounded-3xl" />
                      ) : (
                        <Users className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{ward.name}</h4>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{ward.class || 'Class Unknown'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Current GPA</p>
                      <p className="text-2xl font-black text-indigo-600">{ward.gpa || '0.00'}</p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Growth Index</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div className={cn(
                            "h-full transition-all duration-1000",
                            isImproving ? "bg-emerald-500" : isHighRisk ? "bg-rose-500" : "bg-indigo-500"
                          )} style={{ width: isImproving ? '90%' : isHighRisk ? '30%' : '65%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {predictionData ? (
                    <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className={cn(
                            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            isHighRisk ? "bg-rose-100 text-rose-600" : isImproving ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
                          )}>
                            {isImproving ? <Sparkles className="w-3 h-3" /> : isHighRisk ? <AlertCircle className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                            {trend}
                          </div>
                        </div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed italic">
                          "{forecast}"
                        </p>
                      </div>
                      <Bot className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-600/5 rotate-12" />
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                      <Bot className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Awaiting AI Analysis</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-800/20">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Student Academic Predictions
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">AI-analyzed growth potential and risk assessment</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Prediction Status:</span>
                {Object.keys(studentPredictions).length > 0 ? (
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] text-emerald-500 font-bold uppercase">Generated</span></div>
                ) : (
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /><span className="text-[10px] text-amber-500 font-bold uppercase">Pending Analysis</span></div>
                )}
              </div>
            </div>
            <DataTable
              title="Student Academic Predictions"
              data={students || []}
              autoModal={false}
              columns={[
                { header: 'Student Name', accessor: (item: any) => <span className="font-bold text-zinc-900 dark:text-white">{item.name}</span> },
                { header: 'Admission No', accessor: (item: any) => <span className="font-mono text-zinc-500">{item.admission_no || item.id?.substring(0, 8)}</span> },
                { header: 'Current GPA', accessor: (item: any) => <span className="text-indigo-600 font-black">{item.gpa || '0.00'}</span> },
                {
                  header: 'AI Prediction', 
                  accessor: (item: any) => {
                    const predictionData = studentPredictions[item.name] as any;
                    if (!predictionData) return <span className="text-zinc-400 italic text-[10px]">Run engine to predict</span>;
                    
                    const trend = (predictionData.trend || '').toLowerCase();
                    const forecast = predictionData.forecast || '';
                    
                    const isHighRisk = trend.includes('risk') || trend.includes('drop') || trend.includes('concern');
                    const isImproving = trend.includes('impro') || trend.includes('grow') || trend.includes('excep');
                    
                    return (
                      <div className="space-y-1">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest",
                          isHighRisk ? "bg-rose-50 text-rose-600 border border-rose-100" :
                          isImproving ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          "bg-blue-50 text-blue-600 border border-blue-100"
                        )}>
                          {isImproving ? <Sparkles className="w-3 h-3" /> : isHighRisk ? <AlertCircle className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                          {trend}
                        </div>
                        <p className="text-[9px] text-zinc-500 font-medium leading-tight max-w-[150px]">{forecast}</p>
                      </div>
                    );
                  }
                },
                {
                  header: 'Growth Potential', 
                  accessor: (item: any) => {
                    const predictionData = studentPredictions[item.name] as any;
                    const trend = (predictionData?.trend || '').toLowerCase();
                    const isImproving = trend.includes('impro') || trend.includes('grow') || trend.includes('excep');
                    const isRisk = trend.includes('risk') || trend.includes('drop');
                    
                    return (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={cn(
                            "h-full transition-all duration-1000",
                            isImproving ? "bg-emerald-500" : isRisk ? "bg-rose-500" : "bg-indigo-500"
                          )} style={{ width: isImproving ? '90%' : isRisk ? '30%' : '65%' }} />
                        </div>
                      </div>
                    );
                  }
                },
              ]}
            />
          </div>
        )}
      </div>
    );
  },
  PatternDetection: () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">AI Pattern Detection</h2>
          <p className="text-zinc-500">Automated identification of attendance and behavioral anomalies.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold">Refresh</button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm">Configure Alerts</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-600" />
            Detected Anomalies
          </h3>
          <div className="space-y-4">
            {[
              { title: 'Friday Slump', desc: '15% drop in attendance every Friday in Grade 10.', severity: 'Medium' },
              { title: 'Grade Inflation', desc: 'Unusual spike in English scores for Section B.', severity: 'High' },
              { title: 'Late Arrivals', desc: 'Bus Route 4 consistently arriving 10 mins late.', severity: 'Low' },
            ].map((a, i) => (
              <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{a.title}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    a.severity === 'High' ? "bg-red-50 text-red-600" :
                      a.severity === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                  )}>{a.severity}</span>
                </div>
                <p className="text-xs text-zinc-500">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-4" />
          <h3 className="font-bold">Real-time Scanning</h3>
          <p className="text-sm text-zinc-500 mt-2">AI is currently analyzing the last 24 hours of system activity for new patterns.</p>
        </div>
      </div>
    </div>
  ),
  AIChatbot: ({ organization, currentUser, role }: { organization?: any, currentUser?: any, role?: string }) => {
    const [messages, setMessages] = React.useState<any[]>([]);
    const [input, setInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (messages.length === 0) {
        const userName = currentUser?.name || currentUser?.full_name || 'User';
        const roleName = role ? role.replace(/_/g, ' ').toLowerCase() : 'user';
        
        setMessages([
          {
            role: 'ai',
            content: `Hello ${userName}! I'm your Skoola AI assistant. I see you are logged in as a ${roleName}. How can I help you manage ${organization?.name || 'your school'} today?`,
            timestamp: new Date()
          }
        ]);
      }
    }, [currentUser, role, organization]);

    React.useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [messages]);

    const handleSend = async () => {
      const prompt = input.trim();
      if (!prompt || isLoading) return;

      setMessages(prev => [...prev, { role: 'user', content: prompt }]);
      setInput('');
      setIsLoading(true);

      try {
        const result = await generateAIResponse(prompt, {
          systemPrompt: `You are OmniAI, a helpful assistant for Skoola school management system. 
          You are currently assisting ${currentUser?.name || 'a user'} who is logged in as a ${role || 'user'}. 
          The school is ${organization?.name || 'Skoola'}.
          Keep responses concise, professional, and aware of the user's role.`
        });

        const aiMessage = {
          role: 'ai',
          content: result?.text || "I'm sorry, I couldn't process that request.",
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      } catch (error: any) {
        console.error("AI Error:", error);
        setMessages(prev => [...prev, {
          role: 'ai',
          content: `Sorry, I encountered an error (Error: ${error?.message || 'Unknown'}). Please try again later.`,
          timestamp: new Date()
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="h-[600px] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">OmniAI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Always Online</span>
              </div>
            </div>
          </div>
          <button className="p-2 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-200">
            <Settings className="w-5 h-5" />
          </button>
        </div>
        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3 max-w-[80%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                msg.role === 'ai' ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
              )}>
                {msg.role === 'ai' ? <Bot className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm shadow-sm whitespace-pre-wrap",
                msg.role === 'ai' ? "bg-zinc-100 dark:bg-zinc-800 rounded-tl-none text-zinc-800 dark:text-zinc-200" : "bg-indigo-600 text-white rounded-tr-none"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-none flex gap-1">
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className="w-full pl-4 pr-12 py-3 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-600 transition-all dark:text-white outline-none"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  },
};
