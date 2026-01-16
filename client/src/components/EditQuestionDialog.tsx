import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Question, type AnswerMap } from "@shared/schema";
import { useUpdateQuestion, useCreateQuestion } from "@/hooks/use-tests";
import { useState, useEffect } from "react";
import { Edit2, Plus, Trash2, Check, GripVertical, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditQuestionDialogProps {
  question?: Question;
  testId?: string;
  mode?: "edit" | "create";
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const ANSWER_KEYS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export function EditQuestionDialog({ 
  question, 
  testId,
  mode = "edit", 
  trigger,
  onSuccess 
}: EditQuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [correct, setCorrect] = useState("");
  
  const { mutate: updateQuestion, isPending: isUpdating } = useUpdateQuestion();
  const { mutate: createQuestion, isPending: isCreating } = useCreateQuestion();
  
  const isPending = isUpdating || isCreating;

  useEffect(() => {
    if (open) {
      if (mode === "edit" && question) {
        setText(question.questionText);
        setAnswers(question.answers as AnswerMap);
        setCorrect(question.correctAnswer);
      } else {
        setText("");
        setAnswers({ A: "", B: "", C: "", D: "" });
        setCorrect("A");
      }
    }
  }, [open, question, mode]);

  const answerKeys = Object.keys(answers).sort();
  const canAddMore = answerKeys.length < ANSWER_KEYS.length;
  const canRemove = answerKeys.length > 2;

  const handleAddAnswer = () => {
    if (!canAddMore) return;
    const nextKey = ANSWER_KEYS.find(k => !answerKeys.includes(k));
    if (nextKey) {
      setAnswers(prev => ({ ...prev, [nextKey]: "" }));
    }
  };

  const handleRemoveAnswer = (key: string) => {
    if (!canRemove) return;
    const newAnswers = { ...answers };
    delete newAnswers[key];
    setAnswers(newAnswers);
    if (correct === key) {
      setCorrect(Object.keys(newAnswers).sort()[0] || "A");
    }
  };

  const handleSave = () => {
    const hasEmptyAnswers = Object.values(answers).some(v => !v.trim());
    if (!text.trim() || hasEmptyAnswers) return;

    if (mode === "edit" && question) {
      updateQuestion({
        id: question.id,
        questionText: text,
        answers,
        correctAnswer: correct
      }, {
        onSuccess: () => {
          setOpen(false);
          onSuccess?.();
        }
      });
    } else if (mode === "create" && testId) {
      createQuestion({
        testId,
        questionText: text,
        answers,
        correctAnswer: correct,
      }, {
        onSuccess: () => {
          setOpen(false);
          onSuccess?.();
        }
      });
    }
  };

  const isValid = text.trim() && Object.values(answers).every(v => v.trim()) && correct;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={mode === "edit" ? "button-edit-question" : "button-add-question"}>
            {mode === "edit" ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === "edit" ? "Editar Pregunta" : "Añadir Nueva Pregunta"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" 
              ? "Modifica el texto de la pregunta, las respuestas y la respuesta correcta."
              : "Crea una nueva pregunta con opciones de respuesta múltiple."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Texto de la Pregunta</Label>
            <Textarea 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              placeholder="Escribe la pregunta..."
              className="min-h-[120px] text-base resize-none"
              data-testid="input-question-text"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Opciones de Respuesta</Label>
              <Badge variant="secondary" className="text-xs">
                {answerKeys.length} opciones
              </Badge>
            </div>
            
            <div className="space-y-3">
              {answerKeys.map((key) => (
                <Card 
                  key={key} 
                  className={cn(
                    "p-3 transition-all",
                    correct === key && "ring-2 ring-green-500 bg-green-50/50 dark:bg-green-900/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 pt-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground/40" />
                      <div 
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all cursor-pointer",
                          correct === key 
                            ? "bg-green-500 text-white border-green-500" 
                            : "border-muted-foreground/30 text-muted-foreground hover:border-green-500 hover:text-green-500"
                        )}
                        onClick={() => setCorrect(key)}
                        title="Haz clic para marcar como respuesta correcta"
                        data-testid={`button-correct-${key}`}
                      >
                        {correct === key ? <Check className="w-4 h-4" /> : key}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <Input 
                        value={answers[key]} 
                        onChange={(e) => setAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={`Opción de respuesta ${key}...`}
                        className="text-base"
                        data-testid={`input-answer-${key}`}
                      />
                    </div>
                    
                    {canRemove && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveAnswer(key)}
                        data-testid={`button-remove-${key}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  {correct === key && (
                    <div className="mt-2 ml-14 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Respuesta Correcta
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {canAddMore && (
              <Button 
                variant="outline" 
                className="w-full border-dashed"
                onClick={handleAddAnswer}
                data-testid="button-add-answer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir Opción de Respuesta
              </Button>
            )}
          </div>

          {!isValid && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>Rellena la pregunta y todas las opciones de respuesta para guardar.</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-edit">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isPending || !isValid}
            className="min-w-[120px]"
            data-testid="button-save-question"
          >
            {isPending ? "Guardando..." : mode === "edit" ? "Guardar Cambios" : "Crear Pregunta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
