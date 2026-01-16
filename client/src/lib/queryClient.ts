import { QueryClient, QueryFunction } from "@tanstack/react-query";

const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

if (isElectron) {
  console.log("[Electron] Modo Electron detectado");
}

function unwrapIpcResult(result: any): any {
  // Si es null o undefined, devolver tal cual
  if (result === null || result === undefined) {
    return result;
  }
  
  // Si tiene estructura de respuesta envuelta
  if (typeof result === "object" && "success" in result) {
    if (result.success === false) {
      const error = new Error(result.error || "IPC Error");
      (error as any).status = 401;
      throw error;
    }
    // Extraer datos de la envoltura
    if (result.user !== undefined) return result.user;
    if (result.data !== undefined) return result.data;
  }
  
  // Datos directos (sin envoltura)
  return result;
}

async function electronRequest(method: string, url: string, data?: unknown): Promise<any> {
  const api = (window as any).electronAPI;
  console.log("[Electron IPC]", method, url, data);
  
  let result: any;
  
  if (url === "/api/auth/me" || url.includes("/api/auth/me")) {
    result = await api.auth.me();
    return unwrapIpcResult(result);
  }
  if (url === "/api/auth/login" && method === "POST") {
    result = await api.auth.login(data);
    return unwrapIpcResult(result);
  }
  if (url === "/api/auth/register" && method === "POST") {
    result = await api.auth.register(data);
    return unwrapIpcResult(result);
  }
  if (url === "/api/auth/logout" && method === "POST") {
    return api.auth.logout();
  }
  if (url === "/api/tests" && method === "GET") {
    result = await api.tests.list();
    return unwrapIpcResult(result);
  }
  if (url.match(/\/api\/tests\/[^/]+\/questions/) && method === "GET") {
    const testId = url.split("/")[3];
    result = await api.tests.questions(testId);
    return unwrapIpcResult(result);
  }
  if (url.match(/\/api\/tests\/[^/]+$/) && method === "DELETE") {
    const testId = url.split("/")[3];
    result = await api.tests.delete(testId);
    return unwrapIpcResult(result);
  }
  if (url === "/api/tests/rename" && method === "POST") {
    result = await api.tests.rename((data as any).oldTestId, (data as any).newTestId);
    return unwrapIpcResult(result);
  }
  if (url === "/api/tests/import" && method === "POST") {
    result = await api.tests.import((data as any).testId, (data as any).questions, (data as any).category);
    return unwrapIpcResult(result);
  }
  if (url === "/api/questions" && method === "POST") {
    result = await api.questions.create(data);
    return unwrapIpcResult(result);
  }
  if (url.match(/\/api\/questions\/\d+/) && (method === "PATCH" || method === "PUT")) {
    const id = parseInt(url.split("/")[3]);
    result = await api.questions.update(id, data);
    return unwrapIpcResult(result);
  }
  if (url.match(/\/api\/questions\/\d+/) && method === "DELETE") {
    const id = parseInt(url.split("/")[3]);
    result = await api.questions.delete(id);
    return unwrapIpcResult(result);
  }
  if (url === "/api/results" && method === "GET") {
    result = await api.results.list();
    return unwrapIpcResult(result);
  }
  if (url === "/api/results" && method === "POST") {
    result = await api.results.create(data);
    return unwrapIpcResult(result);
  }
  if (url.match(/\/api\/results\/\d+/) && method === "DELETE") {
    const id = parseInt(url.split("/")[3]);
    result = await api.results.delete(id);
    return unwrapIpcResult(result);
  }
  if (url === "/api/attempts" && method === "GET") {
    result = await api.attempts.list();
    return unwrapIpcResult(result);
  }
  if (url === "/api/attempts" && method === "POST") {
    result = await api.attempts.create(data);
    return unwrapIpcResult(result);
  }
  if (url.match(/\/api\/attempts\/\d+$/) && method === "GET") {
    const id = parseInt(url.split("/")[3]);
    result = await api.attempts.get(id);
    return unwrapIpcResult(result);
  }
  if (url.match(/\/api\/attempts\/\d+/) && method === "PATCH") {
    const id = parseInt(url.split("/")[3]);
    result = await api.attempts.update(id, data);
    return unwrapIpcResult(result);
  }
  if (url.match(/\/api\/attempts\/\d+/) && method === "DELETE") {
    const id = parseInt(url.split("/")[3]);
    result = await api.attempts.delete(id);
    return unwrapIpcResult(result);
  }
  if (url === "/api/config" && method === "GET") {
    result = await api.config.get();
    return unwrapIpcResult(result);
  }
  
  console.warn("Unhandled Electron API request:", method, url);
  throw new Error(`No Electron handler for ${method} ${url}`);
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function fetchWrapper(url: string, options?: RequestInit): Promise<Response> {
  const method = options?.method || "GET";
  const data = options?.body ? JSON.parse(options.body as string) : undefined;
  
  if (isElectron) {
    console.log("[fetchWrapper] Electron mode:", method, url);
    const result = await electronRequest(method, url, data);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  return fetch(url, options);
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  if (isElectron) {
    const result = await electronRequest(method, url, data);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    if (queryKey.length > 1) {
      url = queryKey.join("/");
    }
    
    console.log("[QueryFn] isElectron:", isElectron, "url:", url, "queryKey:", queryKey);
    
    if (isElectron) {
      try {
        const result = await electronRequest("GET", url);
        console.log("[QueryFn] Electron result:", result);
        return result;
      } catch (error: any) {
        console.error("[QueryFn] Electron error:", error);
        if (unauthorizedBehavior === "returnNull" && error.message?.includes("401")) {
          return null;
        }
        throw error;
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
