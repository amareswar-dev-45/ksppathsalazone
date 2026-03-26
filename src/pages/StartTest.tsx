import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlayCircle, Clock, HelpCircle } from "lucide-react";

const StartTest = () => {
  const navigate = useNavigate();
  const studentInfo = JSON.parse(sessionStorage.getItem("studentInfo") || "null");

  const { data: questionCount = 0 } = useQuery({
    queryKey: ["questionCount"],
    queryFn: async () => {
      const { count } = await supabase.from("questions").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  if (!studentInfo) {
    navigate("/student");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <button onClick={() => navigate("/student")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="glass-card rounded-2xl p-8 text-center">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-2">Ready to Start?</h1>
          <p className="text-muted-foreground text-sm mb-8">Welcome, {studentInfo.name}</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-muted rounded-xl p-4">
              <HelpCircle className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold text-foreground">{questionCount}</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
            <div className="bg-muted rounded-xl p-4">
              <Clock className="w-6 h-6 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold text-foreground">{questionCount}</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
          </div>

          <ul className="text-left text-sm text-muted-foreground space-y-2 mb-8">
            <li>• 1 minute per question</li>
            <li>• Negative marking applies</li>
            <li>• Auto-submit when timer ends</li>
            <li>• You can navigate between questions</li>
          </ul>

          {questionCount > 0 ? (
            <Button onClick={() => navigate("/student/test")} size="lg" className="w-full gap-2 gradient-primary border-0 text-primary-foreground">
              <PlayCircle className="w-5 h-5" /> Start Test
            </Button>
          ) : (
            <p className="text-destructive text-sm">No questions available yet. Please try later.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartTest;
