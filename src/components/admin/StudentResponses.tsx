import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const StudentResponses = () => {
  const [search, setSearch] = useState("");

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ["adminResponses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("student_responses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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
                <span className="text-xl font-heading font-bold gradient-text">{r.final_score}</span>
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
