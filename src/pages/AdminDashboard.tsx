import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, HelpCircle, BarChart3, PlusCircle, Zap, BookOpen, Shield, X, Clock, Eye, EyeOff } from "lucide-react";
import CreateExam from "@/components/admin/CreateExam";
import ExamList from "@/components/admin/ExamList";
import StudentResponses from "@/components/admin/StudentResponses";

type CreateTestMode = null | "menu" | "live" | "advanced" | "pro";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [createMode, setCreateMode] = useState<CreateTestMode>(null);

  // Live Test state
  const [liveDurationMinutes, setLiveDurationMinutes] = useState<number>(30);
  const [liveConfirmed, setLiveConfirmed] = useState(false);
  const [liveEndsAt, setLiveEndsAt] = useState<Date | null>(null);
  const [liveTimeLeft, setLiveTimeLeft] = useState<string>("");

  // Pro Test state
  const [proPassword, setProPassword] = useState("");
  const [proError, setProError] = useState("");
  const [proUnlocked, setProUnlocked] = useState(false);
  const [showProPwd, setShowProPwd] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      if (!s) navigate("/admin/login");
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) navigate("/admin/login");
    });
  }, [navigate]);

  // Live countdown timer
  useEffect(() => {
    if (!liveEndsAt) return;
    const interval = setInterval(() => {
      const diff = liveEndsAt.getTime() - Date.now();
      if (diff <= 0) {
        setLiveTimeLeft("Test has ended");
        clearInterval(interval);
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setLiveTimeLeft(`${m}m ${s}s remaining`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [liveEndsAt]);

  const { data: stats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const [eRes, qRes, sRes] = await Promise.all([
        supabase.from("exams").select("*", { count: "exact", head: true }),
        supabase.from("questions").select("*", { count: "exact", head: true }),
        supabase.from("student_responses").select("final_score"),
      ]);
      const scores = sRes.data || [];
      const avg = scores.length > 0 ? scores.reduce((s, r) => s + Number(r.final_score), 0) / scores.length : 0;
      return { exams: eRes.count || 0, questions: qRes.count || 0, students: scores.length, avgScore: avg.toFixed(1) };
    },
    enabled: !!session,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const closeCreateMode = () => {
    setCreateMode(null);
    setLiveConfirmed(false);
    setLiveEndsAt(null);
    setLiveTimeLeft("");
    setLiveDurationMinutes(30);
    setProPassword("");
    setProError("");
    setProUnlocked(false);
  };

  const handleLiveConfirm = () => {
    setLiveConfirmed(true);
  };

  const handleExamPublished = () => {
    if (createMode === "live") {
      const end = new Date(Date.now() + liveDurationMinutes * 60 * 1000);
      setLiveEndsAt(end);
    }
  };

  const handleProUnlock = () => {
    if (proPassword.trim() === "") {
      setProError("Please create a password.");
    } else {
      setProUnlocked(true);
      setProError("");
    }
  };

  if (!session) return null;

  // ── Create Test Menu overlay ─────────────────────────────────────────────
  if (createMode === "menu") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-2xl text-foreground">Create Test</h2>
            <button onClick={closeCreateMode} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {/* Live Test */}
            <button
              onClick={() => setCreateMode("live")}
              className="w-full glass-card rounded-2xl p-6 text-left hover:shadow-xl transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-foreground">Live Test</h3>
                  <p className="text-muted-foreground text-sm">Set a time limit — auto-locks when time ends</p>
                </div>
              </div>
            </button>

            {/* Advanced Test */}
            <button
              onClick={() => setCreateMode("advanced")}
              className="w-full glass-card rounded-2xl p-6 text-left hover:shadow-xl transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-foreground">Advanced Test</h3>
                  <p className="text-muted-foreground text-sm">Go directly to Create Exam / MCQ section</p>
                </div>
              </div>
            </button>

            {/* Pro Test */}
            <button
              onClick={() => setCreateMode("pro")}
              className="w-full glass-card rounded-2xl p-6 text-left hover:shadow-xl transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-foreground">Pro Test</h3>
                  <p className="text-muted-foreground text-sm">Password protected access</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Live Test ─────────────────────────────────────────────────────────────
  if (createMode === "live") {
    if (!liveConfirmed) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-2xl text-foreground">Live Test Setup</h2>
              <button onClick={closeCreateMode} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping absolute" />
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="font-semibold text-red-400 ml-4">Live Session</span>
              </div>
              <Label className="text-base font-semibold">For how long do you want to keep this test live?</Label>
              <p className="text-muted-foreground text-sm mt-1 mb-4">After the selected time ends, the test will automatically lock and become unavailable to students.</p>
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-5 h-5 text-primary" />
                <Input
                  type="number"
                  min={1}
                  max={1440}
                  value={liveDurationMinutes}
                  onChange={e => setLiveDurationMinutes(parseInt(e.target.value) || 30)}
                  className="w-32"
                />
                <span className="text-muted-foreground text-sm">minutes</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">
                Test will auto-lock at: {new Date(Date.now() + liveDurationMinutes * 60000).toLocaleTimeString()}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCreateMode("menu")} className="flex-1">Back</Button>
                <Button onClick={handleLiveConfirm} className="flex-1 gap-2 bg-red-500 hover:bg-red-600 text-white border-0">
                  <Zap className="w-4 h-4" /> Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    // Live test is active — show timer banner + CreateExam
    const isExpired = liveEndsAt && liveEndsAt.getTime() <= Date.now();
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <h1 className="font-heading font-bold text-lg text-foreground">Live Test</h1>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${isExpired ? "bg-muted text-muted-foreground" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
              <span className={`w-2 h-2 rounded-full ${isExpired ? "bg-muted-foreground" : "bg-red-500 animate-ping"}`} />
              {isExpired ? "Test Locked" : liveTimeLeft || "Starting..."}
            </div>
            <Button variant="outline" size="sm" onClick={closeCreateMode} className="gap-2"><X className="w-4 h-4" /> Close</Button>
          </div>
        </header>
        {isExpired ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <p className="text-2xl font-heading font-bold text-muted-foreground mb-2">⏰ Live Test Expired</p>
              <p className="text-muted-foreground">This test has automatically locked.</p>
              <Button onClick={closeCreateMode} className="mt-4">Back to Dashboard</Button>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto p-4">
            <CreateExam testType="live" duration={liveDurationMinutes} onExamPublished={handleExamPublished} onEditDone={closeCreateMode} />
          </div>
        )}
      </div>
    );
  }

  // ── Advanced Test → straight to CreateExam ───────────────────────────────
  if (createMode === "advanced") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <h1 className="font-heading font-bold text-lg text-foreground">Advanced Test</h1>
          <Button variant="outline" size="sm" onClick={closeCreateMode} className="gap-2"><X className="w-4 h-4" /> Close</Button>
        </header>
        <div className="max-w-6xl mx-auto p-4">
          <CreateExam testType="advanced" onExamPublished={handleExamPublished} onEditDone={closeCreateMode} />
        </div>
      </div>
    );
  }

  // ── Pro Test ──────────────────────────────────────────────────────────────
  if (createMode === "pro") {
    if (!proUnlocked) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-2xl text-foreground">Pro Test</h2>
              <button onClick={closeCreateMode} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="glass-card rounded-2xl p-8">
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-5">
                <Shield className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-foreground text-center mb-1">Create a Password</h3>
              <p className="text-muted-foreground text-sm text-center mb-6">Set a password for this specific Pro Test</p>
              <Label>Set Password</Label>
              <div className="relative mt-1 mb-4">
                <Input
                  type={showProPwd ? "text" : "password"}
                  value={proPassword}
                  onChange={e => { setProPassword(e.target.value); setProError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleProUnlock()}
                  placeholder="Create a new password..."
                  className="pr-10"
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
                <Button variant="outline" onClick={() => setCreateMode("menu")} className="flex-1">Back</Button>
                <Button onClick={handleProUnlock} className="flex-1 gap-2 bg-yellow-500 hover:bg-yellow-600 text-black border-0">
                  <Shield className="w-4 h-4" /> Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-yellow-400" />
            <h1 className="font-heading font-bold text-lg text-foreground">Pro Test</h1>
          </div>
          <Button variant="outline" size="sm" onClick={closeCreateMode} className="gap-2"><X className="w-4 h-4" /> Close</Button>
        </header>
        <div className="max-w-6xl mx-auto p-4">
          <CreateExam testType="pro" proPassword={proPassword} onExamPublished={handleExamPublished} onEditDone={closeCreateMode} />
        </div>
      </div>
    );
  }

  // ── Main Dashboard ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="font-heading font-bold text-lg text-foreground">Admin Dashboard</h1>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-card rounded-xl p-4 text-center">
            <HelpCircle className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold text-foreground">{stats?.exams ?? "-"}</p>
            <p className="text-xs text-muted-foreground">Exams</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-secondary mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold text-foreground">{stats?.students ?? "-"}</p>
            <p className="text-xs text-muted-foreground">Attempts</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <BarChart3 className="w-6 h-6 text-accent mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold text-foreground">{stats?.avgScore ?? "-"}</p>
            <p className="text-xs text-muted-foreground">Avg Score</p>
          </div>
        </div>

        {/* Create Test Button */}
        <button
          onClick={() => setCreateMode("menu")}
          className="w-full glass-card rounded-2xl p-5 text-left hover:shadow-xl transition-all hover:-translate-y-0.5 mb-6 group border border-primary/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusCircle className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg text-foreground">Create Test</h2>
              <p className="text-muted-foreground text-sm">Choose Live, Advanced, or Pro test</p>
            </div>
          </div>
        </button>

        <Tabs defaultValue="exams">
          <TabsList className="w-full">
            <TabsTrigger value="exams" className="flex-1">Exams</TabsTrigger>
            <TabsTrigger value="responses" className="flex-1">Student Responses</TabsTrigger>
          </TabsList>
          <TabsContent value="exams">
            <ExamList />
          </TabsContent>
          <TabsContent value="responses">
            <StudentResponses />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
