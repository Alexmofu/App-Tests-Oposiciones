import { useResults } from "@/hooks/use-results";
import { useAttempts, useDeleteAttempt } from "@/hooks/use-attempts";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trophy, Calendar, CheckCircle, Play, Trash2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Badge } from "@/components/ui/badge";

export default function Results() {
  const { data: results, isLoading: resultsLoading } = useResults();
  const { data: attempts, isLoading: attemptsLoading } = useAttempts();
  const { mutate: deleteAttempt } = useDeleteAttempt();
  const [, setLocation] = useLocation();

  const inProgressAttempts = attempts?.filter(a => a.status === "in_progress") || [];
  
  // Prepare chart data - last 10 attempts
  const chartData = results?.slice(-10).map((r, i) => ({
    name: `Test ${i + 1}`,
    score: r.score,
    date: r.completedAt,
    testId: r.testId
  }));

  const averageScore = results?.length 
    ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length) 
    : 0;

  const isLoading = resultsLoading || attemptsLoading;

  const handleContinue = (attempt: typeof inProgressAttempts[0]) => {
    setLocation(`/test/${encodeURIComponent(attempt.testId)}?attempt=${attempt.id}`);
  };

  const handleDeleteAttempt = (id: number) => {
    if (confirm("Are you sure you want to delete this attempt?")) {
      deleteAttempt(id);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold">Your Progress</h1>
        </header>

        {isLoading ? (
          <div className="h-64 bg-muted animate-pulse rounded-2xl" />
        ) : (
          <>
            {/* In Progress Section */}
            {inProgressAttempts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <h2 className="text-2xl font-semibold">In Progress</h2>
                  <Badge variant="secondary" className="ml-2">{inProgressAttempts.length}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {inProgressAttempts.map((attempt) => {
                    const answered = Object.keys(attempt.answers as Record<string, string> || {}).length;
                    const total = attempt.totalQuestions;
                    const progressPercent = Math.round((answered / total) * 100);
                    
                    return (
                      <Card key={attempt.id} className="border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/10">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">{attempt.testId.replace('.json', '')}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="w-3 h-3" />
                                {attempt.startedAt && format(new Date(attempt.startedAt), "MMM d, yyyy HH:mm")}
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              In Progress
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{answered} / {total} questions</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-orange-500 h-2 rounded-full transition-all" 
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {total - answered} questions remaining
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            <Button 
                              className="flex-1" 
                              onClick={() => handleContinue(attempt)}
                              data-testid={`button-continue-${attempt.id}`}
                            >
                              <Play className="w-4 h-4 mr-2" /> Continue
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleDeleteAttempt(attempt.id)}
                              data-testid={`button-delete-attempt-${attempt.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6 flex flex-col items-center text-center">
                  <Trophy className="w-10 h-10 text-primary mb-2" />
                  <h3 className="text-4xl font-bold">{results?.length || 0}</h3>
                  <p className="text-muted-foreground">Tests Completed</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 mb-2 font-bold">%</div>
                  <h3 className="text-4xl font-bold">{averageScore}%</h3>
                  <p className="text-muted-foreground">Average Score</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center">
                  <CheckCircle className="w-10 h-10 text-blue-500 mb-2" />
                  <h3 className="text-4xl font-bold">
                    {results?.reduce((acc, curr) => acc + curr.correctCount, 0)}
                  </h3>
                  <p className="text-muted-foreground">Total Correct Answers</p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            {results && results.length > 0 && (
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Score History</CardTitle>
                </CardHeader>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{fontSize: 12}} />
                      <YAxis stroke="var(--muted-foreground)" tick={{fontSize: 12}} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--card)', 
                          borderColor: 'var(--border)',
                          borderRadius: '8px' 
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="var(--primary)" 
                        strokeWidth={3}
                        dot={{ fill: 'var(--background)', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* History Table */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Completed Tests</h2>
              {results && results.length > 0 ? (
                <div className="border rounded-xl overflow-hidden bg-card">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Test Name</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Score</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden sm:table-cell">Correct</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {results?.slice().reverse().map((result) => (
                        <tr key={result.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{result.testId.replace('.json', '')}</td>
                          <td className="px-4 py-3 text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {result.completedAt && format(new Date(result.completedAt), "MMM d, yyyy")}
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            <span className={result.score >= 50 ? "text-green-600" : "text-red-500"}>
                              {result.score}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                            {result.correctCount} / {result.totalQuestions}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No completed tests yet. Start practicing!</p>
                  <Link href="/">
                    <Button className="mt-4">Start a Test</Button>
                  </Link>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
