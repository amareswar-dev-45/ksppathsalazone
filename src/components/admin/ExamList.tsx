import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Clock } from "lucide-react";
import { toast } from "sonner";

const ExamList = () => {
  const queryClient = useQueryClient();

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["adminExams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exams").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      // Get question counts per exam
      const { data: questions } = await supabase.from("questions").select("exam_id");
      const counts: Record<string, number> = {};
      (questions || []).forEach((q: any) => { if (q.exam_id) counts[q.exam_id] = (counts[q.exam_id] || 0) + 1; });
      return (data || []).map((e: any) => ({ ...e, questionCount: counts[e.id] || 0 }));
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete exam "${name}" and all its questions?`)) return;
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Exam deleted");
    queryClient.invalidateQueries({ queryKey: ["adminExams"] });
    queryClient.invalidateQueries({ queryKey: ["adminStats"] });
  };

  if (isLoading) return <p className="text-muted-foreground text-center py-8">Loading...</p>;
  if (exams.length === 0) return <p className="text-muted-foreground text-center py-8">No exams created yet.</p>;

  return (
    <div className="space-y-3">
      {exams.map((e: any) => (
        <div key={e.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-foreground font-medium">{e.name}</p>
            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
              <span>Mock {e.mock_number}</span>
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {e.questionCount} questions</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {e.total_time_minutes} min</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(e.id, e.name)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default ExamList;
