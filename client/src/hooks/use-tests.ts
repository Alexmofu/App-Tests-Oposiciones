import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type errorSchemas } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Fetch list of local tests
export function useTests() {
  return useQuery({
    queryKey: [api.tests.list.path],
    queryFn: async () => {
      const res = await fetch(api.tests.list.path);
      if (!res.ok) throw new Error("Failed to fetch tests");
      return api.tests.list.responses[200].parse(await res.json());
    },
  });
}

// Fetch a specific test by ID (filename)
export function useTest(id: string) {
  return useQuery({
    queryKey: [api.tests.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.tests.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch test details");
      return api.tests.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Import a local JSON file
export function useImportTest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ filename, content }: { filename: string; content: any[] }) => {
      const res = await fetch(api.tests.import.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, content }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to import test");
      }
      return api.tests.import.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.tests.list.path] });
      toast({
        title: "Import Successful",
        description: `Imported ${data.count} questions successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// === QUESTIONS ===

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (question: { testId: string; questionText: string; answers: Record<string, string>; correctAnswer: string; category?: string }) => {
      const res = await fetch(api.questions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(question),
      });
      if (!res.ok) throw new Error("Failed to create question");
      return api.questions.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      // Invalidate both the specific test query and test list
      queryClient.invalidateQueries({ queryKey: [api.tests.get.path, data.testId] });
      queryClient.invalidateQueries({ queryKey: [api.tests.list.path] });
      toast({ title: "Question Created" });
    },
    onError: () => toast({ title: "Create Failed", variant: "destructive" }),
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Record<string, any>) => {
      const url = buildUrl(api.questions.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update question");
      return api.questions.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      // Invalidate the specific test query using testId from the response
      queryClient.invalidateQueries({ queryKey: [api.tests.get.path, data.testId] });
      toast({ title: "Question Updated" });
    },
    onError: () => toast({ title: "Update Failed", variant: "destructive" }),
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.questions.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete question");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tests.get.path] });
      toast({ title: "Question Deleted" });
    },
    onError: () => toast({ title: "Delete Failed", variant: "destructive" }),
  });
}

// === REMOTE ===

export function useRemoteTests(url: string | null) {
  return useQuery({
    queryKey: [api.remote.list.path, url],
    queryFn: async () => {
      if (!url) return [];
      const fetchUrl = `${api.remote.list.path}?url=${encodeURIComponent(url)}`;
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error("Failed to connect to remote server");
      return api.remote.list.responses[200].parse(await res.json());
    },
    enabled: !!url,
    retry: false,
  });
}

export function useFetchRemoteTest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const importMutation = useImportTest();

  return useMutation({
    mutationFn: async ({ url, filename }: { url: string; filename: string }) => {
      // First fetch the content
      const fetchUrl = `${api.remote.fetch.path}?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error("Failed to fetch remote file");
      const content = await res.json();
      
      // Then import it locally
      return importMutation.mutateAsync({ filename, content });
    },
    onSuccess: () => {
      toast({ title: "Remote Test Downloaded & Imported" });
    },
    onError: (err) => {
      toast({ title: "Failed to download", description: err.message, variant: "destructive" });
    },
  });
}
