import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Home, Eye, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Question = Tables<"questions">;

interface AnswerItem {
  questionId: string;
  selected: number | null;
  correct: number;
}

const TestResult = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showSolutions, setShowSolutions] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ["result", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("student_responses").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["solutionQuestions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("questions").select("*").order("created_at");
      if (error) throw error;
      return data as Question[];
    },
    enabled: showSolutions,
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  if (!response) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-destructive">Result not found</p></div>;
  }

  const answers = response.answers as unknown as AnswerItem[];
  const unanswered = response.total_questions - response.correct_count - response.wrong_count;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="glass-card rounded-2xl p-8 mb-6">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Test Result</h1>
          <p className="text-muted-foreground text-sm mb-6">{response.name} • {response.email} • {response.phone}</p>

          <div className="text-center mb-8">
            <p className="text-6xl font-heading font-bold gradient-text">{response.final_score}</p>
            <p className="text-muted-foreground text-sm mt-1">Final Score</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Correct" value={response.correct_count} color="text-secondary" bg="bg-secondary/10" />
            <StatCard icon={<XCircle className="w-5 h-5" />} label="Wrong" value={response.wrong_count} color="text-destructive" bg="bg-destructive/10" />
            <StatCard icon={<MinusCircle className="w-5 h-5" />} label="Negative" value={`-${response.negative_marks_total}`} color="text-accent" bg="bg-accent/10" />
            <StatCard icon={<MinusCircle className="w-5 h-5" />} label="Unanswered" value={unanswered} color="text-muted-foreground" bg="bg-muted" />
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
            <Home className="w-4 h-4" /> Home
          </Button>
          <Button onClick={() => setShowSolutions(!showSolutions)} className="gap-2 flex-1 gradient-primary border-0 text-primary-foreground">
            <Eye className="w-4 h-4" /> {showSolutions ? "Hide Solutions" : "View Solutions"}
          </Button>
        </div>

        {showSolutions && questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((q, i) => {
              const ans = answers.find((a) => a.questionId === q.id);
              const selected = ans?.selected;
              const isCorrect = selected === q.correct_answer;
              const isUnanswered = selected === null;
              const options = [q.option_1, q.option_2, q.option_3, q.option_4];

              return (
                <div key={q.id} className="glass-card rounded-2xl p-6 animate-fade-in">
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isUnanswered ? "bg-muted text-muted-foreground" : isCorrect ? "bg-secondary/10 text-secondary" : "bg-destructive/10 text-destructive"
                    }`}>
                      {i + 1}
                    </span>
                    <p className="text-foreground font-medium">{q.question_text}</p>
                  </div>

                  {q.image_url && <img src={q.image_url} alt="" className="rounded-xl max-h-40 object-contain mb-3 ml-11" />}

                  <div className="space-y-2 ml-11">
                    {options.map((opt, oi) => {
                      const optNum = oi + 1;
                      const isCorrectOpt = optNum === q.correct_answer;
                      const isSelectedOpt = optNum === selected;
                      let cls = "border-border bg-card text-foreground";
                      if (isCorrectOpt) cls = "border-secondary bg-secondary/5 text-foreground";
                      if (isSelectedOpt && !isCorrect) cls = "border-destructive bg-destructive/5 text-foreground";

                      return (
                        <div key={oi} className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${cls}`}>
                          <span className="font-medium text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>
                          {opt}
                          {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-secondary ml-auto shrink-0" />}
                          {isSelectedOpt && !isCorrect && <XCircle className="w-4 h-4 text-destructive ml-auto shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {q.solution && (
                    <div className="mt-3 ml-11 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-sm text-foreground"><span className="font-semibold text-primary">Solution:</span> {q.solution}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: string | number; color: string; bg: string }) => (
  <div className={`${bg} rounded-xl p-3 text-center`}>
    <div className={`${color} flex justify-center mb-1`}>{icon}</div>
    <p className={`text-xl font-heading font-bold ${color}`}>{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default TestResult;
