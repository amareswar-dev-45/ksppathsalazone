import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Home, Eye, CheckCircle2, XCircle, MinusCircle, Trophy, Medal, Crown, Download, Printer, Target, BarChart2, Hash } from "lucide-react";
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ["result", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("student_responses").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["solutionQuestions", response?.exam_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("questions").select("*").eq("exam_id", response!.exam_id!).order("created_at");
      if (error) throw error;
      return data as Question[];
    },
    enabled: showSolutions && !!response?.exam_id,
  });

  // Leaderboard: fetch all responses for this exam, ranked by score desc then created_at asc (time tiebreaker)
  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useQuery({
    queryKey: ["leaderboard", response?.exam_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_responses")
        .select("id, name, final_score, correct_count, wrong_count, created_at, phone")
        .eq("exam_id", response!.exam_id!)
        .order("final_score", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!response?.exam_id,
  });

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  if (!response) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-destructive">Result not found</p></div>;

  const answers = response.answers as unknown as AnswerItem[];
  const unanswered = response.total_questions - response.correct_count - response.wrong_count;
  const attempted = response.correct_count + response.wrong_count;
  const accuracy = attempted > 0 ? ((response.correct_count / attempted) * 100).toFixed(1) : "0.0";

  // Rank: based on leaderboard
  const myRankIndex = leaderboard.findIndex(r => r.id === id);
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;


  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-slate-300" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs font-bold text-muted-foreground w-4 text-center">#{rank}</span>;
  };

  const generatePrintHTML = () => {
    let html = `
    <html><head><title>Solutions - ${response.name.replace(/^\[(live|advanced|pro)(?::.*?)?\]\s*/i, '')}</title>
    <style>
      @page { margin: 20mm; }
      body { 
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
        padding: 0; color: #000; line-height: 1.6; max-width: 800px; margin: 0 auto; 
      }
      h1 { text-align: center; color: #111; margin-bottom: 5px; font-size: 28px; }
      .header-sub { 
        text-align: center; color: #555; margin-bottom: 30px; font-size: 15px; 
        border-bottom: 2px solid #eee; padding-bottom: 20px; 
      }
      .question-container {
        margin-bottom: 35px; padding-bottom: 20px;
        border-bottom: 1px dashed #ccc; page-break-inside: avoid;
      }
      .question-text {
        color: #dc2626; /* RED */
        font-size: 17px; font-weight: bold; margin-bottom: 15px;
      }
      .options-list {
        list-style-type: none; padding-left: 0; margin-bottom: 15px;
      }
      .option-item {
        margin-bottom: 8px; font-size: 15px; color: #333; display: flex; align-items: flex-start;
      }
      .opt-label { font-weight: bold; margin-right: 10px; min-width: 20px; }
      .opt-correct { color: #16a34a; font-weight: bold; margin-left: 8px; }
      .opt-wrong { color: #dc2626; font-weight: bold; margin-left: 8px; }
      .solution-box {
        background-color: #f8fafc; border-left: 4px solid #3b82f6;
        padding: 16px; color: #000; /* BLACK */ font-size: 15px;
        border-radius: 4px; margin-top: 15px;
      }
      .solution-label { font-weight: bold; margin-bottom: 6px; display: block; color: #3b82f6; }
      .q-image { max-width: 400px; max-height: 300px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #ddd; object-fit: contain; }
    </style>
    </head><body>
    <h1>Test Solutions</h1>
    <div class="header-sub">
      <strong>Name:</strong> ${response.name.replace(/^\[(live|advanced|pro)(?::.*?)?\]\s*/i, '')} &nbsp;|&nbsp; 
      <strong>Score:</strong> ${response.final_score} &nbsp;|&nbsp; 
      <strong>Accuracy:</strong> ${accuracy}%
    </div>
    <div class="content">
    `;

    questions.forEach((q, i) => {
      const ans = answers.find(a => a.questionId === q.id);
      const selected = ans?.selected;
      const isCorrect = selected === q.correct_answer;
      
      let imgHtml = '';
      if (q.image_url) {
        imgHtml = `<img src="${q.image_url}" class="q-image" />`;
      }
      
      let optionsHtml = '';
      [q.option_1, q.option_2, q.option_3, q.option_4].forEach((opt, oi) => {
        const optNum = oi + 1;
        const isCorrectOpt = optNum === q.correct_answer;
        const isSelectedOpt = optNum === selected;
        
        let badge = '';
        if (isCorrectOpt) badge = '<span class="opt-correct"> ✓ Correct</span>';
        else if (isSelectedOpt && !isCorrect) badge = '<span class="opt-wrong"> ✗ Your Answer</span>';
        
        optionsHtml += `<li class="option-item"><span class="opt-label">${String.fromCharCode(65 + oi)}.</span> <span>${opt} ${badge}</span></li>`;
      });
      
      let solutionHtml = '';
      if (q.solution) {
        solutionHtml = `
          <div class="solution-box">
            <span class="solution-label">Solution / Explanation:</span>
            ${q.solution}
          </div>
        `;
      }
      
      html += `
      <div class="question-container">
        <div class="question-text">Q${i + 1}. ${q.question_text}</div>
        ${imgHtml}
        <ul class="options-list">
          ${optionsHtml}
        </ul>
        ${solutionHtml}
      </div>
      `;
    });

    html += `</div></body></html>`;
    return html;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto animate-fade-in">

        {/* Score Card */}
        <div className="glass-card rounded-2xl p-8 mb-4">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-1">Test Result</h1>
          <p className="text-muted-foreground text-sm mb-6">
            {response.name.replace(/^\[(live|advanced|pro)(?::.*?)?\]\s*/i, '')} • {response.email} • {response.phone}
          </p>

          <div className="text-center mb-8">
            <p className="text-6xl font-heading font-bold gradient-text">{response.final_score}</p>
            <p className="text-muted-foreground text-sm mt-1">Final Score</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Correct" value={response.correct_count} color="text-secondary" bg="bg-secondary/10" />
            <StatCard icon={<XCircle className="w-5 h-5" />} label="Wrong" value={response.wrong_count} color="text-destructive" bg="bg-destructive/10" />
            <StatCard icon={<MinusCircle className="w-5 h-5" />} label="Negative" value={`-${response.negative_marks_total}`} color="text-accent" bg="bg-accent/10" />
            <StatCard icon={<MinusCircle className="w-5 h-5" />} label="Unanswered" value={unanswered} color="text-muted-foreground" bg="bg-muted" />
          </div>
          {/* Extended Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Hash className="w-5 h-5" />} label="Attempted" value={attempted} color="text-primary" bg="bg-primary/10" />
            <StatCard icon={<Target className="w-5 h-5" />} label="Accuracy" value={`${accuracy}%`} color="text-yellow-400" bg="bg-yellow-400/10" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
            <Home className="w-4 h-4" /> Home
          </Button>
          <Button onClick={() => setShowSolutions(!showSolutions)} className="gap-2 gradient-primary border-0 text-primary-foreground">
            <Eye className="w-4 h-4" /> {showSolutions ? "Hide Solutions" : "View Solutions"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="gap-2 border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/10"
          >
            <Trophy className="w-4 h-4" /> {showLeaderboard ? "Hide Ranks" : "View Rank Card"}
          </Button>
        </div>

        {/* ── Rank Card / Leaderboard ── */}
        {showLeaderboard && (
          <div className="glass-card rounded-2xl p-6 mb-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h2 className="font-heading font-bold text-lg text-foreground">Leaderboard</h2>
              {myRank && (
                <span className="ml-auto bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/20">
                  Your Rank: #{myRank}
                </span>
              )}
            </div>

            {loadingLeaderboard ? (
              <p className="text-center text-muted-foreground py-4">Loading ranks...</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No data yet.</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((r, i) => {
                  const rank = i + 1;
                  const isMe = r.id === id;
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isMe
                          ? "bg-primary/10 border border-primary/30"
                          : rank <= 3
                          ? "bg-yellow-500/5 border border-yellow-500/10"
                          : "bg-muted/50"
                      }`}
                    >
                      <div className="w-6 flex items-center justify-center shrink-0">
                        {rankIcon(rank)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isMe ? "text-primary" : "text-foreground"}`}>
                          {r.name}{isMe && <span className="ml-1 text-xs">(You)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.correct_count}✅ {r.wrong_count}❌ · {r.phone}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-heading font-bold text-lg ${isMe ? "text-primary" : rank === 1 ? "text-yellow-400" : "text-foreground"}`}>
                          {r.final_score}
                        </p>
                        <p className="text-xs text-muted-foreground">pts</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Solutions ── */}
        {showSolutions && questions.length > 0 && (
          <div className="flex gap-2 mb-3 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => {
                const win = window.open("", "_blank");
                if (!win) return;
                win.document.write(generatePrintHTML());
                win.document.close();
                setTimeout(() => { win.print(); }, 500);
              }}
            >
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-secondary/30 text-secondary hover:bg-secondary/10"
              onClick={() => {
                const win = window.open("", "_blank");
                if (!win) return;
                win.document.write(generatePrintHTML());
                win.document.close();
                setTimeout(() => { win.print(); }, 500);
              }}
            >
              <Download className="w-4 h-4" /> Download PDF
            </Button>
          </div>
        )}
        {showSolutions && questions.length > 0 && (
          <div id="solutions-section" className="space-y-4">
            {questions.map((q, i) => {
              const ans = answers.find(a => a.questionId === q.id);
              const selected = ans?.selected;
              const isCorrect = selected === q.correct_answer;
              const isUnanswered = selected === null || selected === undefined;
              const options = [q.option_1, q.option_2, q.option_3, q.option_4];

              return (
                <div key={q.id} className="glass-card rounded-2xl p-6 animate-fade-in">
                  {q.subject && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 mb-3">
                      {q.subject}
                    </span>
                  )}
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
