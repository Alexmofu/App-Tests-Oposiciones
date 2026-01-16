import { useTests, useTest, useDeleteQuestion } from "@/hooks/use-tests";
import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { EditQuestionDialog } from "@/components/EditQuestionDialog";
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Admin() {
  const { data: tests } = useTests();
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  
  const { data: questions, isLoading } = useTest(selectedTestId);
  const { mutate: deleteQuestion } = useDeleteQuestion();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Manage Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="w-full md:w-1/3">
              <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a test to edit" />
                </SelectTrigger>
                <SelectContent>
                  {tests?.map(test => (
                    <SelectItem key={test.id} value={test.id}>{test.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTestId && (
              <div className="border rounded-md">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading questions...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">ID</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions?.map((q) => (
                        <TableRow key={q.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{q.id}</TableCell>
                          <TableCell className="font-medium line-clamp-2 max-w-xl">
                            {q.questionText}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <EditQuestionDialog question={q} />
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete this question from the database.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteQuestion(q.id)} className="bg-destructive hover:bg-destructive/90">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
