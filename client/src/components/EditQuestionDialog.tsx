import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Question, type AnswerMap } from "@shared/schema";
import { useUpdateQuestion } from "@/hooks/use-tests";
import { useState } from "react";
import { Edit2 } from "lucide-react";

interface EditQuestionDialogProps {
  question: Question;
}

export function EditQuestionDialog({ question }: EditQuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(question.questionText);
  const [answers, setAnswers] = useState<AnswerMap>(question.answers as AnswerMap);
  const [correct, setCorrect] = useState(question.correctAnswer);
  
  const { mutate, isPending } = useUpdateQuestion();

  const handleSave = () => {
    mutate({
      id: question.id,
      questionText: text,
      answers,
      correctAnswer: correct
    }, {
      onSuccess: () => setOpen(false)
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Question Text</Label>
            <Textarea 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-4">
            <Label>Answers</Label>
            {Object.keys(answers).sort().map((key) => (
              <div key={key} className="flex gap-4 items-center">
                <div className="w-8 font-bold text-center">{key}</div>
                <Input 
                  value={answers[key]} 
                  onChange={(e) => setAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Correct Answer</Label>
            <Select value={correct} onValueChange={setCorrect}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(answers).sort().map((key) => (
                  <SelectItem key={key} value={key}>{key}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
