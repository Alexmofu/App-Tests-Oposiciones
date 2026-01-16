import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type errorSchemas } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { fetchWrapper } from "@/lib/queryClient";

// Fetch list of local tests
export function useTests() {
  return useQuery({
    queryKey: [api.tests.list.path],
    queryFn: async () => {
      const res = await fetchWrapper(api.tests.list.path);
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
      const res = await fetchWrapper(url);
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
      const res = await fetchWrapper(api.tests.import.path, {
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
        title: "Importación Exitosa",
        description: `Se importaron ${data.count} preguntas correctamente.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error en la Importación",
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
      const res = await fetchWrapper(api.questions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(question),
      });
      if (!res.ok) throw new Error("Failed to create question");
      return api.questions.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.tests.get.path, data.testId] });
      queryClient.invalidateQueries({ queryKey: [api.tests.list.path] });
      toast({ title: "Pregunta Creada" });
    },
    onError: () => toast({ title: "Error al Crear", variant: "destructive" }),
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Record<string, any>) => {
      const url = buildUrl(api.questions.update.path, { id });
      const res = await fetchWrapper(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update question");
      return api.questions.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.tests.get.path, data.testId] });
      toast({ title: "Pregunta Actualizada" });
    },
    onError: () => toast({ title: "Error al Actualizar", variant: "destructive" }),
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.questions.delete.path, { id });
      const res = await fetchWrapper(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete question");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tests.get.path] });
      toast({ title: "Pregunta Eliminada" });
    },
    onError: () => toast({ title: "Error al Eliminar", variant: "destructive" }),
  });
}

// === TEST MANAGEMENT ===
export function useDeleteTest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (testId: string) => {
      const url = buildUrl(api.tests.delete.path, { id: testId });
      const res = await fetchWrapper(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete test");
      return testId;
    },
    onSuccess: (deletedTestId) => {
      queryClient.invalidateQueries({ queryKey: [api.tests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tests.get.path, deletedTestId] });
      toast({ title: "Test Eliminado" });
    },
    onError: () => toast({ title: "Error al Eliminar", variant: "destructive" }),
  });
}

export function useRenameTest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ testId, newName }: { testId: string; newName: string }) => {
      const url = buildUrl(api.tests.rename.path, { id: testId });
      const res = await fetchWrapper(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName }),
      });
      if (!res.ok) throw new Error("Failed to rename test");
      const result = api.tests.rename.responses[200].parse(await res.json());
      return { oldTestId: testId, ...result };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.tests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tests.get.path, data.oldTestId] });
      queryClient.invalidateQueries({ queryKey: [api.tests.get.path, data.newId] });
      toast({ title: "Test Renombrado" });
    },
    onError: () => toast({ title: "Error al Renombrar", variant: "destructive" }),
  });
}

// === REMOTE === (disabled in Electron - requires server)

export function useRemoteTests(url: string | null) {
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
  
  return useQuery({
    queryKey: [api.remote.list.path, url],
    queryFn: async () => {
      if (!url || isElectron) return [];
      const fetchUrl = `${api.remote.list.path}?url=${encodeURIComponent(url)}`;
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error("Failed to connect to remote server");
      return api.remote.list.responses[200].parse(await res.json());
    },
    enabled: !!url && !isElectron,
    retry: false,
  });
}

export function useFetchRemoteTest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const importMutation = useImportTest();
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

  return useMutation({
    mutationFn: async ({ url, filename }: { url: string; filename: string }) => {
      if (isElectron) {
        throw new Error("Descarga remota no disponible en modo offline");
      }
      const fetchUrl = `${api.remote.fetch.path}?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error("Failed to fetch remote file");
      const content = await res.json();
      
      return importMutation.mutateAsync({ filename, content });
    },
    onSuccess: () => {
      toast({ title: "Test Remoto Descargado e Importado" });
    },
    onError: (err) => {
      toast({ title: "Error al descargar", description: err.message, variant: "destructive" });
    },
  });
}
