import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlayCircle, FileText, Award, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const ExamDetails = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const studentInfo = JSON.parse(sessionStorage.getItem("studentInfo") || "null");

  const { data: exam } = useQuery({
    queryKey: ["examDetail", examId],
    queryFn: async () => {
      const { data, error } = await supabase.from("exams").select("*").eq("id", examId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["examStats", examId],
    queryFn: async () => {
      const { data: questions } = await supabase.from("questions").select("marks, negative_marks").eq("exam_id", examId!);
      const qs = questions || [];
      const totalMarks = qs.reduce((s, q) => s + Number(q.marks), 0);
      const negMarks = qs.length > 0 ? Number(qs[0].negative_marks) : 0;
      const marksPerQ = qs.length > 0 ? Number(qs[0].marks) : 1;
      return { count: qs.length, totalMarks, negMarks, marksPerQ };
    },
    enabled: !!examId,
  });

  if (!studentInfo) { navigate("/student"); return null; }
  if (!exam || !stats) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  const handleStart = () => {
    sessionStorage.setItem("currentExamId", examId!);
    navigate("/student/test");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <button onClick={() => navigate("/student/start")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="glass-card rounded-2xl p-8 text-center">
          {/* Exam Name */}
          <h1 className="font-heading font-bold text-2xl text-foreground mb-1">{exam.name}</h1>
          <p className="text-muted-foreground text-sm mb-6">Mock {exam.mock_number}</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-muted rounded-xl p-4">
              <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold text-foreground">{stats.count}</p>
              <p className="text-xs text-muted-foreground">Total Questions</p>
            </div>
            <div className="bg-muted rounded-xl p-4">
              <Award className="w-6 h-6 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold text-foreground">{stats.totalMarks}</p>
              <p className="text-xs text-muted-foreground">Total Marks</p>
            </div>
            <div className="bg-muted rounded-xl p-4">
              <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold text-foreground">+{stats.marksPerQ}</p>
              <p className="text-xs text-muted-foreground">Marks / Correct</p>
            </div>
            <div className="bg-muted rounded-xl p-4">
              <AlertTriangle className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold text-foreground">-{stats.negMarks}</p>
              <p className="text-xs text-muted-foreground">Neg Marks / Wrong</p>
            </div>
            <div className="bg-muted rounded-xl p-4 col-span-2">
              <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold text-foreground">{exam.total_time_minutes} min</p>
              <p className="text-xs text-muted-foreground">Time Duration</p>
            </div>
          </div>

          <ul className="text-left text-sm text-muted-foreground space-y-2 mb-8">
            <li>• {stats.marksPerQ} mark(s) per correct answer</li>
            <li>• -{stats.negMarks} marks for wrong answer</li>
            <li>• Auto-submit when timer ends</li>
          </ul>

          {stats.count > 0 ? (
            <Button onClick={handleStart} size="lg" className="w-full gap-2 gradient-primary border-0 text-primary-foreground">
              <PlayCircle className="w-5 h-5" /> Start Exam
            </Button>
          ) : (
            <p className="text-destructive text-sm">No questions in this exam yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamDetails;
