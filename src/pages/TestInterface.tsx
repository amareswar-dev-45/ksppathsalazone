import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronRight, Send } from "lucide-react";
import { toast } from "sonner";

const TestInterface = () => {
  const navigate = useNavigate();
  const studentInfo = JSON.parse(sessionStorage.getItem("studentInfo") || "null");
  const examId = sessionStorage.getItem("currentExamId");

  const { data: exam } = useQuery({
    queryKey: ["testExam", examId],
    queryFn: async () => {
      const { data, error } = await supabase.from("exams").select("*").eq("id", examId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!examId,
  });

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["testQuestions", examId],
    queryFn: async () => {
      const { data, error } = await supabase.from("questions").select("*").eq("exam_id", examId!).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!examId,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(-1);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (exam && timeLeft === -1) {
      setTimeLeft(exam.total_time_minutes * 60);
    }
  }, [exam, timeLeft]);

  const submitTest = useCallback(async () => {
    if (submitted || questions.length === 0) return;
    setSubmitted(true);

    let correct = 0;
    let wrong = 0;
    let negTotal = 0;
    let totalScore = 0;
    const answerArray: { questionId: string; selected: number | null; correct: number }[] = [];

    questions.forEach((q: any) => {
      const selected = answers[q.id] || null;
      answerArray.push({ questionId: q.id, selected, correct: q.correct_answer });
      if (selected === q.correct_answer) {
        correct++;
        totalScore += Number(q.marks);
      } else if (selected !== null) {
        wrong++;
        negTotal += Number(q.negative_marks);
      }
    });

    const finalScore = totalScore - negTotal;

    const { data, error } = await supabase.from("student_responses").insert({
      name: studentInfo.name,
      email: studentInfo.email,
      phone: studentInfo.phone,
      exam_id: examId,
      answers: answerArray,
      total_questions: questions.length,
      correct_count: correct,
      wrong_count: wrong,
      negative_marks_total: negTotal,
      final_score: finalScore,
    }).select("id").single();

    if (error) { toast.error("Failed to submit test"); setSubmitted(false); return; }
    navigate(`/student/result/${data.id}`);
  }, [submitted, questions, answers, studentInfo, examId, navigate]);

  useEffect(() => {
    if (timeLeft < 0) return;
    if (timeLeft === 0 && questions.length > 0 && !submitted) { submitTest(); return; }
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, questions.length, submitted, submitTest]);

  if (!studentInfo) { navigate("/student"); return null; }
  if (!examId) { navigate("/student/start"); return null; }

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading questions...</p></div>;
  }

  const currentQ = questions[currentIndex];
  const minutes = Math.floor(Math.max(0, timeLeft) / 60);
  const seconds = Math.max(0, timeLeft) % 60;
  const isUrgent = timeLeft >= 0 && timeLeft < 60;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="text-sm text-muted-foreground font-medium">
          Q {currentIndex + 1} / {questions.length}
        </span>
        <div className={`font-heading font-bold text-lg px-4 py-1 rounded-full ${isUrgent ? "bg-destructive/10 text-destructive animate-pulse" : "bg-primary/10 text-primary"}`}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
        <Button size="sm" variant="destructive" onClick={submitTest} disabled={submitted} className="gap-1">
          <Send className="w-3 h-3" /> Submit
        </Button>
      </div>

      {/* Question navigation pills */}
      <div className="border-b border-border bg-card px-4 py-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {questions.map((q: any, i: number) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                i === currentIndex
                  ? "gradient-primary text-primary-foreground"
                  : answers[q.id]
                  ? "bg-secondary/20 text-secondary border border-secondary/30"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question body */}
      <div className="flex-1 p-4 max-w-3xl mx-auto w-full animate-fade-in" key={currentIndex}>
        {currentQ && (
          <>
            <div className="glass-card rounded-2xl p-6 mb-6">
              <p className="text-foreground font-medium text-lg leading-relaxed">{(currentQ as any).question_text}</p>
              {(currentQ as any).image_url && (
                <img src={(currentQ as any).image_url} alt="Question" className="mt-4 rounded-xl max-h-60 object-contain w-full" />
              )}
            </div>

            <div className="space-y-3">
              {[(currentQ as any).option_1, (currentQ as any).option_2, (currentQ as any).option_3, (currentQ as any).option_4].map((opt: string, i: number) => {
                const optNum = i + 1;
                const isSelected = answers[(currentQ as any).id] === optNum;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers(prev => ({ ...prev, [(currentQ as any).id]: optNum }))}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/30"
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full mr-3 text-sm font-medium ${
                      isSelected ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {String.fromCharCode(64 + optNum)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Navigation footer - Next only */}
      <div className="border-t border-border bg-card px-4 py-3 flex justify-between sticky bottom-0">
        <Button variant="outline" onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0} className="gap-1">
          <ChevronRight className="w-4 h-4 rotate-180" /> Previous
        </Button>
        <Button onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))} disabled={currentIndex === questions.length - 1} className="gap-1">
          Save & Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default TestInterface;
