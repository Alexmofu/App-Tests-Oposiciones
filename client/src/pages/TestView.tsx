import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useTest } from "@/hooks/use-tests";
import { useCreateResult } from "@/hooks/use-results";
import { QuestionCard } from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Flag, Shuffle, Home } from "lucide-react";
import { type Question } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default function TestView() {
  const [, params] = useRoute("/test/:id");
  const [, setLocation] = useLocation();
  const testId = decodeURIComponent(params?.id || "");
  
  const { data: questions, isLoading } = useTest(testId);
  const { mutate: saveResult } = useCreateResult();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [randomize, setRandomize] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Initialize questions
  useEffect(() => {
    if (questions) {
      setActiveQuestions(randomize ? shuffleArray(questions) : questions);
    }
  }, [questions, randomize]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading test...</p>
      </div>
    </div>
  );

  if (!questions || questions.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-4">Test Not Found</h2>
      <Button onClick={() => setLocation("/")}>Back Home</Button>
    </div>
  );

  const currentQuestion = activeQuestions[currentIndex];
  const progress = ((currentIndex + 1) / activeQuestions.length) * 100;
  
  const handleAnswer = (key: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: key }));
  };

  const calculateScore = () => {
    let correct = 0;
    activeQuestions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    return Math.round((correct / activeQuestions.length) * 100);
  };

  const handleFinish = () => {
    const score = calculateScore();
    const correctCount = activeQuestions.filter(q => answers[q.id] === q.correctAnswer).length;
    
    saveResult({
      testId,
      score,
      correctCount,
      totalQuestions: activeQuestions.length
    });
    
    setIsFinished(true);
  };

  // Intro Screen
  if (!isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 shadow-xl">
            <div className="text-center mb-8 space-y-2">
              <h1 className="text-3xl font-display font-bold">{testId.replace('.json', '')}</h1>
              <p className="text-muted-foreground">{questions.length} Questions</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Shuffle className="w-5 h-5 text-primary" />
                  <Label htmlFor="random" className="font-medium cursor-pointer">Randomize Order</Label>
                </div>
                <Switch id="random" checked={randomize} onCheckedChange={setRandomize} />
              </div>

              <Button size="lg" className="w-full text-lg h-12" onClick={() => setIsStarted(true)}>
                Start Test
              </Button>
              
              <Button variant="ghost" className="w-full" onClick={() => setLocation("/")}>
                Cancel
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Result Screen
  if (isFinished) {
    const score = calculateScore();
    const isPass = score >= 50;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center"
        >
          <Card className="p-8 shadow-xl border-t-8 border-t-primary">
            <div className="mb-6">
              <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold border-4 ${isPass ? 'border-green-500 text-green-600 bg-green-50' : 'border-red-500 text-red-600 bg-red-50'}`}>
                {score}%
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{isPass ? "Great Job!" : "Keep Practicing"}</h2>
            <p className="text-muted-foreground mb-8">
              You answered {activeQuestions.filter(q => answers[q.id] === q.correctAnswer).length} out of {activeQuestions.length} correctly.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => setLocation("/")}>
                <Home className="w-4 h-4 mr-2" /> Home
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Test Interface
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Exit
          </Button>
          <div className="font-mono font-medium text-sm text-muted-foreground">
            {currentIndex + 1} / {activeQuestions.length}
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Flag className="w-4 h-4" />
          </Button>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      {/* Main Content */}
      <div className="flex-1 container max-w-4xl mx-auto px-4 py-8 md:py-12 flex flex-col justify-center min-h-[60vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <QuestionCard
              question={currentQuestion}
              selectedAnswer={answers[currentQuestion.id] || null}
              onSelectAnswer={handleAnswer}
              showFeedback={!!answers[currentQuestion.id]}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Nav */}
      <div className="border-t bg-card py-6">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>

          {currentIndex === activeQuestions.length - 1 ? (
            <Button size="lg" onClick={handleFinish} className="px-8 bg-green-600 hover:bg-green-700">
              Finish Test
            </Button>
          ) : (
            <Button 
              size="lg" 
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="px-8"
              // Optional: Disable next until answered
              // disabled={!answers[currentQuestion.id]} 
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
