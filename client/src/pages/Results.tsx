import { useResults } from "@/hooks/use-results";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trophy, Calendar, CheckCircle } from "lucide-react";
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

export default function Results() {
  const { data: results, isLoading } = useResults();

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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold">Your Progress</h1>
        </header>

        {isLoading ? (
          <div className="h-64 bg-muted animate-pulse rounded-2xl" />
        ) : (
          <>
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
              <h2 className="text-2xl font-semibold">Recent Activity</h2>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
