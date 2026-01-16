import { type Question, type AnswerMap } from "@shared/schema";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuestionCardProps {
  question: Question;
  selectedAnswer: string | null;
  onSelectAnswer: (key: string) => void;
  showFeedback: boolean;
}

export function QuestionCard({ 
  question, 
  selectedAnswer, 
  onSelectAnswer, 
  showFeedback 
}: QuestionCardProps) {
  const answers = question.answers as AnswerMap;
  const answerKeys = Object.keys(answers).sort(); // A, B, C, D...

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8">
        <h3 className="text-xl md:text-2xl font-display font-semibold leading-relaxed text-foreground">
          {question.questionText}
        </h3>
      </div>

      <div className="space-y-4">
        {answerKeys.map((key, index) => {
          const isSelected = selectedAnswer === key;
          const isCorrect = key === question.correctAnswer;
          const isWrongSelection = isSelected && !isCorrect;
          
          let stateStyles = "border-border hover:border-primary/50 bg-card";
          
          if (showFeedback) {
            if (isCorrect) {
              stateStyles = "border-green-500 bg-green-50/50 dark:bg-green-900/10 text-green-700 dark:text-green-300";
            } else if (isWrongSelection) {
              stateStyles = "border-red-500 bg-red-50/50 dark:bg-red-900/10 text-red-700 dark:text-red-300";
            } else {
              stateStyles = "border-border/50 opacity-50";
            }
          } else if (isSelected) {
            stateStyles = "border-primary bg-primary/5 ring-1 ring-primary";
          }

          return (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => !showFeedback && onSelectAnswer(key)}
              disabled={showFeedback}
              className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 relative group flex items-start gap-4",
                stateStyles,
                !showFeedback && "hover:shadow-md hover:-translate-y-0.5"
              )}
            >
              <span className={cn(
                "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border",
                showFeedback && isCorrect ? "bg-green-500 border-green-500 text-white" :
                showFeedback && isWrongSelection ? "bg-red-500 border-red-500 text-white" :
                isSelected ? "bg-primary border-primary text-primary-foreground" :
                "bg-muted border-border text-muted-foreground group-hover:border-primary/50 group-hover:text-primary"
              )}>
                {key}
              </span>
              <span className="flex-grow pt-1 font-medium">{answers[key]}</span>
              
              <AnimatePresence>
                {showFeedback && isCorrect && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </motion.div>
                )}
                {showFeedback && isWrongSelection && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <XCircle className="w-6 h-6 text-red-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
