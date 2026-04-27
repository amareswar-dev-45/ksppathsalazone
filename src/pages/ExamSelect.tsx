import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FileText, Clock, Award, Lock, Zap, BookOpen, Shield, Eye, EyeOff } from "lucide-react";

/**
 * VISIBILITY RULE:
 *   An exam is "published" (visible to students) when:
 *     total_time_minutes > 0
 *   An exam is a "draft" (hidden from students) when:
 *     total_time_minutes === 0  (set by Save Draft action)
 *
 * This is enforced at query level — drafts are never fetched.
 */

type TestType = null | "live" | "advanced" | "pro";

const ExamSelect = () => {
  const navigate = useNavigate();
  const studentInfo = JSON.parse(sessionStorage.getItem("studentInfo") || "null");
  const [testType, setTestType] = useState<TestType>(null);

  // Pro Test state
  const [proPassword, setProPassword] = useState("");
  const [proError, setProError] = useState("");
  const [proUnlocked, setProUnlocked] = useState(false);
  const [showProPwd, setShowProPwd] = useState(false);

  const [unlockedProPassword, setUnlockedProPassword] = useState("");

  const handleProUnlock = () => {
    // Find if any published pro exam has this exact password
    const matched = exams.find((e: any) => {
      const typeMatch = e.name.match(/^\[pro:(.*?)\]/i);
      return typeMatch && typeMatch[1] === proPassword;
    });

    if (matched) {
      setUnlockedProPassword(proPassword);
      setProUnlocked(true);
      setProError("");
    } else {
      setProError("Invalid Password. No test found.");
    }
  };

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["studentExams"],
    queryFn: async () => {
      // ✅ ONLY fetch published exams (total_time_minutes > 0)
      const { data: examData, error } = await supabase
        .from("exams")
        .select("*")
        .gt("total_time_minutes", 0)   // 🔴 DRAFT FILTER — drafts have total_time_minutes = 0
        .order("mock_number");
      if (error) throw error;

      // Get question data per exam
      const ids = (examData || []).map((e: any) => e.id);
      if (ids.length === 0) return [];

      const { data: questions } = await supabase
        .from("questions")
        .select("exam_id, marks, negative_marks")
        .in("exam_id", ids);

      const examInfo: Record<string, { count: number; totalMarks: number; marks: number; negMarks: number }> = {};
      (questions || []).forEach((q: any) => {
        if (!q.exam_id) return;
        if (!examInfo[q.exam_id]) examInfo[q.exam_id] = { count: 0, totalMarks: 0, marks: Number(q.marks), negMarks: Number(q.negative_marks) };
        examInfo[q.exam_id].count++;
        examInfo[q.exam_id].totalMarks += Number(q.marks);
      });

      return (examData || []).map((e: any) => ({
        ...e,
        questionCount: examInfo[e.id]?.count || 0,
        totalMarks: examInfo[e.id]?.totalMarks || 0,
        marksPerQ: examInfo[e.id]?.marks || 1,
        negMarks: examInfo[e.id]?.negMarks || 0.25,
      }));
    },
  });

  if (!studentInfo) { navigate("/student"); return null; }

  // ── Test Type Selection Screen ───────────────────────────────────────────
  if (!testType) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto animate-fade-in">
          <button
            onClick={() => navigate("/student")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="font-heading font-bold text-2xl text-foreground mb-1">Select Test Type</h1>
          <p className="text-muted-foreground text-sm mb-6">Welcome, {studentInfo.name} — choose which test you want to attempt</p>

          <div className="space-y-4">
            {/* Live Test */}
            <button
              onClick={() => setTestType("live")}
              className="w-full glass-card rounded-2xl p-6 text-left hover:shadow-xl transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                  <Zap className="w-6 h-6 text-red-400" />
                  {/* Blinking red indicator */}
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-heading font-semibold text-lg text-foreground">Live Test</h3>
                    <span className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full animate-pulse">● LIVE</span>
                  </div>
                  <p className="text-muted-foreground text-sm">Join ongoing live test session</p>
                </div>
              </div>
            </button>

            {/* Advanced Test */}
            <button
              onClick={() => setTestType("advanced")}
              className="w-full glass-card rounded-2xl p-6 text-left hover:shadow-xl transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-foreground">Advanced Test</h3>
                  <p className="text-muted-foreground text-sm">Practice with advanced MCQ questions</p>
                </div>
              </div>
            </button>

            {/* Pro Test */}
            <button
              onClick={() => setTestType("pro")}
              className="w-full glass-card rounded-2xl p-6 text-left hover:shadow-xl transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-foreground">Pro Test</h3>
                  <p className="text-muted-foreground text-sm">Premium test for serious aspirants</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Exam list (shown after selecting a test type) ─────────────────────────
  const isLive = testType === "live";

  if (testType === "pro" && !proUnlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-2xl text-foreground">Pro Test</h2>
            <button onClick={() => setTestType(null)} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          </div>
          <div className="glass-card rounded-2xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-5">
              <Shield className="w-7 h-7 text-yellow-400" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground text-center mb-1">Password Required</h3>
            <p className="text-muted-foreground text-sm text-center mb-6">Enter the Pro Test password to continue</p>
            <div className="relative mt-1 mb-4">
              <input
                type={showProPwd ? "text" : "password"}
                value={proPassword}
                onChange={e => { setProPassword(e.target.value); setProError(""); }}
                onKeyDown={e => e.key === "Enter" && handleProUnlock()}
                placeholder="Enter password..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowProPwd(!showProPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showProPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {proError && <p className="text-destructive text-sm mb-3">{proError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setTestType(null)} className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">Back</button>
              <button onClick={handleProUnlock} className="flex-1 gap-2 bg-yellow-500 hover:bg-yellow-600 text-black border-0 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2">
                <Shield className="w-4 h-4 mr-2" /> Unlock
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter exams by selected type and status
  const processedExams = exams.map((e: any) => {
    const typeMatch = e.name.match(/^\[(live|advanced|pro)(?::(.*?))?\]/i);
    const eType = typeMatch ? typeMatch[1].toLowerCase() : "advanced";
    const extraData = typeMatch ? typeMatch[2] : undefined;
    let isLiveExpired = false;

    if (eType === "live") {
      const liveDurationMinutes = extraData ? parseInt(extraData, 10) : 30; // fallback to 30 mins
      const createdTime = new Date(e.created_at).getTime();
      const nowTime = Date.now();
      const elapsedSeconds = Math.floor((nowTime - createdTime) / 1000);
      const remaining = (liveDurationMinutes * 60) - elapsedSeconds;
      if (remaining <= 0) isLiveExpired = true;
    }

    return { ...e, eType, isLiveExpired, pwd: extraData };
  });

  const filteredExams = processedExams.filter((e: any) => {
    if (e.eType !== testType) return false;
    if (e.eType === "pro" && e.pwd !== unlockedProPassword) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto animate-fade-in">
        <button
          onClick={() => setTestType(null)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-heading font-bold text-2xl text-foreground">
            {testType === "live" ? "Live Test" : testType === "advanced" ? "Advanced Test" : "Pro Test"}
          </h1>
          {isLive && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute" />
              <span className="w-2 h-2 rounded-full bg-red-500 relative" />
              <span className="text-xs font-bold text-red-400 ml-1">LIVE</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-sm mb-6">Welcome, {studentInfo.name}</p>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading exams...</p>
        ) : filteredExams.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No exams available yet.</p>
            <p className="text-muted-foreground text-sm mt-1">Please check back later.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExams.map((e: any) => {
              const cleanName = e.name.replace(/^\[(live|advanced|pro)(?::.*?)?\]\s*/i, '');
              return (
              <button
                key={e.id}
                onClick={() => navigate(`/student/exam/${e.id}`)}
                disabled={e.questionCount === 0 || e.isLiveExpired}
                className="w-full glass-card rounded-2xl p-6 text-left hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                {e.isLiveExpired && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <span className="bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full font-bold text-sm shadow-md flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Expired
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-heading font-semibold text-lg text-foreground">{cleanName}</h3>
                  {isLive && !e.isLiveExpired && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full animate-pulse shrink-0 ml-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      LIVE
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {e.questionCount} Qs</div>
                  <div className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {e.totalMarks} marks</div>
                  <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {e.total_time_minutes} min</div>
                  <div>Neg: -{e.negMarks}</div>
                </div>
              </button>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamSelect;
