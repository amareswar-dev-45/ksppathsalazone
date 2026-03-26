import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

const StudentResponses = () => {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ["adminResponses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("student_responses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete response from "${name}"?`)) return;
    const { error } = await supabase.from("student_responses").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Response deleted");
      queryClient.invalidateQueries({ queryKey: ["adminResponses"] });
    }
  };

  const filtered = responses.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search)
  );

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or phone..." className="pl-9" />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No responses found</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-foreground font-medium text-sm">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.email} • {r.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-heading font-bold gradient-text">{r.final_score}</span>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(r.id, r.name)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>✅ {r.correct_count} correct</span>
                <span>❌ {r.wrong_count} wrong</span>
                <span>➖ -{r.negative_marks_total} neg</span>
                <span>📝 {r.total_questions} total</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentResponses;
