import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Question = Tables<"questions">;

const TestInterface = () => {
  const navigate = useNavigate();
  const studentInfo = JSON.parse(sessionStorage.getItem("studentInfo") || "null");

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["testQuestions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("questions").select("*").order("created_at");
      if (error) throw error;
      return data as Question[];
    },
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(-1);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (questions.length > 0 && timeLeft === -1) {
      setTimeLeft(questions.length * 60);
    }
  }, [questions.length, timeLeft]);

  const submitTest = useCallback(async () => {
    if (submitted || questions.length === 0) return;
    setSubmitted(true);

    let correct = 0;
    let wrong = 0;
    let negTotal = 0;
    const answerArray: { questionId: string; selected: number | null; correct: number }[] = [];

    questions.forEach((q) => {
      const selected = answers[q.id] || null;
      answerArray.push({ questionId: q.id, selected, correct: q.correct_answer });
      if (selected === q.correct_answer) {
        correct++;
      } else if (selected !== null) {
        wrong++;
        negTotal += Number(q.negative_marks);
      }
    });

    const finalScore = correct - negTotal;

    const { data, error } = await supabase.from("student_responses").insert({
      name: studentInfo.name,
      email: studentInfo.email,
      phone: studentInfo.phone,
      answers: answerArray,
      total_questions: questions.length,
      correct_count: correct,
      wrong_count: wrong,
      negative_marks_total: negTotal,
      final_score: finalScore,
    }).select("id").single();

    if (error) {
      toast.error("Failed to submit test");
      setSubmitted(false);
      return;
    }

    navigate(`/student/result/${data.id}`);
  }, [submitted, questions, answers, studentInfo, navigate]);

  useEffect(() => {
    if (timeLeft <= 0 && questions.length > 0 && !submitted) {
      submitTest();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, questions.length, submitted, submitTest]);

  if (!studentInfo) {
    navigate("/student");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 60;

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
          {questions.map((q, i) => (
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
              <p className="text-foreground font-medium text-lg leading-relaxed">{currentQ.question_text}</p>
              {currentQ.image_url && (
                <img src={currentQ.image_url} alt="Question" className="mt-4 rounded-xl max-h-60 object-contain w-full" />
              )}
            </div>

            <div className="space-y-3">
              {[currentQ.option_1, currentQ.option_2, currentQ.option_3, currentQ.option_4].map((opt, i) => {
                const optNum = i + 1;
                const isSelected = answers[currentQ.id] === optNum;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: optNum }))}
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

      {/* Navigation footer */}
      <div className="border-t border-border bg-card px-4 py-3 flex justify-between sticky bottom-0">
        <Button variant="outline" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        <Button variant="outline" onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))} disabled={currentIndex === questions.length - 1}>
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default TestInterface;
