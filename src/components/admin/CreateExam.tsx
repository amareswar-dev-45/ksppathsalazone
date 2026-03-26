import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Send, Plus, Image } from "lucide-react";
import { toast } from "sonner";

interface QuestionForm {
  subject: string;
  question_text: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  correct_answer: number;
  marks: number;
  negative_marks: number;
  solution: string;
  image_url: string;
}

const emptyQuestion: QuestionForm = {
  subject: "", question_text: "", option_1: "", option_2: "", option_3: "", option_4: "",
  correct_answer: 1, marks: 1, negative_marks: 0.25, solution: "", image_url: "",
};

type Step = "name" | "mock" | "questions" | "time";

const CreateExam = () => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("name");
  const [examName, setExamName] = useState("");
  const [mockNumber, setMockNumber] = useState<number>(1);
  const [questions, setQuestions] = useState<QuestionForm[]>([{ ...emptyQuestion }]);
  const [currentQ, setCurrentQ] = useState(0);
  const [totalTime, setTotalTime] = useState(60);
  const [uploading, setUploading] = useState(false);

  const updateQuestion = (key: keyof QuestionForm, value: any) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[currentQ] = { ...updated[currentQ], [key]: value };
      return updated;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("question-images").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data } = supabase.storage.from("question-images").getPublicUrl(path);
    updateQuestion("image_url", data.publicUrl);
    setUploading(false);
  };

  const addNextQuestion = () => {
    setQuestions(prev => [...prev, { ...emptyQuestion }]);
    setCurrentQ(questions.length);
  };

  const isCurrentValid = () => {
    const q = questions[currentQ];
    return q.question_text && q.option_1 && q.option_2 && q.option_3 && q.option_4 && q.subject;
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Create exam
      const { data: exam, error: examError } = await supabase.from("exams").insert({
        name: examName,
        mock_number: mockNumber,
        total_time_minutes: totalTime,
      }).select("id").single();
      if (examError) throw examError;

      // Insert all questions
      const questionPayloads = questions.map(q => ({
        exam_id: exam.id,
        subject: q.subject,
        question_text: q.question_text,
        option_1: q.option_1,
        option_2: q.option_2,
        option_3: q.option_3,
        option_4: q.option_4,
        correct_answer: q.correct_answer,
        marks: q.marks,
        negative_marks: q.negative_marks,
        solution: q.solution || null,
        image_url: q.image_url || null,
      }));

      const { error: qError } = await supabase.from("questions").insert(questionPayloads);
      if (qError) throw qError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["adminExams"] });
      toast.success(`Exam "${examName}" created with ${questions.length} questions!`);
      // Reset
      setStep("name");
      setExamName("");
      setMockNumber(1);
      setQuestions([{ ...emptyQuestion }]);
      setCurrentQ(0);
      setTotalTime(60);
    },
    onError: (e) => toast.error(e.message),
  });

  if (step === "name") {
    return (
      <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mt-6">
        <h2 className="font-heading font-bold text-xl text-foreground mb-4">Create Exam</h2>
        <Label>Exam Name</Label>
        <Input value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g., Mock Test, Final Test" className="mt-1 mb-4" />
        <Button onClick={() => setStep("mock")} disabled={!examName.trim()} className="w-full gap-2">
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (step === "mock") {
    return (
      <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mt-6">
        <h2 className="font-heading font-bold text-xl text-foreground mb-4">Select Mock</h2>
        <p className="text-sm text-muted-foreground mb-4">Exam: {examName}</p>
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <button
              key={n}
              onClick={() => setMockNumber(n)}
              className={`p-3 rounded-xl text-sm font-medium transition-all ${
                mockNumber === n
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Mock {n}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep("name")} className="flex-1">Back</Button>
          <Button onClick={() => setStep("questions")} className="flex-1 gap-2">
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (step === "time") {
    return (
      <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mt-6">
        <h2 className="font-heading font-bold text-xl text-foreground mb-4">Set Exam Duration</h2>
        <p className="text-sm text-muted-foreground mb-4">{examName} • Mock {mockNumber} • {questions.length} questions</p>
        <Label>Total Exam Time (in minutes)</Label>
        <Input type="number" min={1} value={totalTime} onChange={e => setTotalTime(parseInt(e.target.value) || 60)} className="mt-1 mb-6" />
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep("questions")} className="flex-1">Back</Button>
          <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} className="flex-1 gap-2 gradient-primary border-0 text-primary-foreground">
            {submitMutation.isPending ? "Creating..." : "Create Exam"}
          </Button>
        </div>
      </div>
    );
  }

  // Questions step
  const q = questions[currentQ];

  return (
    <div className="max-w-2xl mx-auto mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-heading font-bold text-lg text-foreground">{examName} • Mock {mockNumber}</h2>
          <p className="text-sm text-muted-foreground">Question {currentQ + 1} of {questions.length}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setStep("mock")}>Back</Button>
        </div>
      </div>

      {/* Question navigation pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            className={`w-8 h-8 rounded-lg text-xs font-medium shrink-0 transition-colors ${
              i === currentQ ? "gradient-primary text-primary-foreground"
              : questions[i].question_text ? "bg-secondary/20 text-secondary border border-secondary/30"
              : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div>
          <Label>Subject</Label>
          <Input value={q.subject} onChange={e => updateQuestion("subject", e.target.value)} placeholder="e.g., Physics, Math, Chemistry" className="mt-1" />
        </div>
        <div>
          <Label>Question</Label>
          <Textarea value={q.question_text} onChange={e => updateQuestion("question_text", e.target.value)} className="mt-1" rows={3} />
        </div>
        <div>
          <Label>Image (optional)</Label>
          <div className="mt-1 flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground hover:bg-muted/80">
              <Image className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload"}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            {q.image_url && <img src={q.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />}
          </div>
        </div>
        {[1, 2, 3, 4].map(n => (
          <div key={n}>
            <Label>Option {n}</Label>
            <Input value={(q as any)[`option_${n}`]} onChange={e => updateQuestion(`option_${n}` as keyof QuestionForm, e.target.value)} className="mt-1" />
          </div>
        ))}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Correct Answer</Label>
            <Select value={String(q.correct_answer)} onValueChange={v => updateQuestion("correct_answer", Number(v))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map(n => <SelectItem key={n} value={String(n)}>Option {n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Marks</Label>
            <Input type="number" min={1} value={q.marks} onChange={e => updateQuestion("marks", parseInt(e.target.value) || 1)} className="mt-1" />
          </div>
          <div>
            <Label>Negative Marks</Label>
            <Input type="number" step="0.25" min={0} value={q.negative_marks} onChange={e => updateQuestion("negative_marks", parseFloat(e.target.value) || 0)} className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Solution (explanation)</Label>
          <Textarea value={q.solution} onChange={e => updateQuestion("solution", e.target.value)} className="mt-1" rows={2} placeholder="Explain the answer..." />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4 gap-3">
        <Button variant="outline" onClick={addNextQuestion} disabled={!isCurrentValid()} className="gap-2">
          <Plus className="w-4 h-4" /> Add Next Question
        </Button>
        <Button onClick={() => { setStep("time"); }} disabled={questions.some(qq => !qq.question_text || !qq.option_1 || !qq.option_2 || !qq.option_3 || !qq.option_4 || !qq.subject)} className="gap-2">
          <Send className="w-4 h-4" /> Submit
        </Button>
      </div>
      {currentQ < questions.length - 1 && (
        <div className="flex justify-end mt-2">
          <Button variant="ghost" size="sm" onClick={() => setCurrentQ(currentQ + 1)} className="gap-1">
            Next Question <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CreateExam;
