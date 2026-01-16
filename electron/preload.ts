import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  auth: {
    register: (data: { username: string; password: string }) => 
      ipcRenderer.invoke("auth:register", data),
    login: (data: { username: string; password: string }) => 
      ipcRenderer.invoke("auth:login", data),
    logout: () => ipcRenderer.invoke("auth:logout"),
    me: () => ipcRenderer.invoke("auth:me"),
  },
  tests: {
    list: () => ipcRenderer.invoke("tests:list"),
    questions: (testId: string) => ipcRenderer.invoke("tests:questions", testId),
    delete: (testId: string) => ipcRenderer.invoke("tests:delete", testId),
    rename: (oldTestId: string, newTestId: string) => 
      ipcRenderer.invoke("tests:rename", { oldTestId, newTestId }),
    import: (testId: string, questions: any[], category?: string) =>
      ipcRenderer.invoke("tests:import", { testId, questions, category }),
  },
  questions: {
    create: (question: any) => ipcRenderer.invoke("questions:create", question),
    update: (id: number, update: any) => 
      ipcRenderer.invoke("questions:update", { id, update }),
    delete: (id: number) => ipcRenderer.invoke("questions:delete", id),
  },
  results: {
    list: () => ipcRenderer.invoke("results:list"),
    create: (result: any) => ipcRenderer.invoke("results:create", result),
    delete: (id: number) => ipcRenderer.invoke("results:delete", id),
  },
  attempts: {
    list: () => ipcRenderer.invoke("attempts:list"),
    get: (id: number) => ipcRenderer.invoke("attempts:get", id),
    create: (attempt: any) => ipcRenderer.invoke("attempts:create", attempt),
    update: (id: number, update: any) => 
      ipcRenderer.invoke("attempts:update", { id, update }),
    delete: (id: number) => ipcRenderer.invoke("attempts:delete", id),
  },
  dialog: {
    openFile: () => ipcRenderer.invoke("dialog:openFile"),
  },
  config: {
    get: () => ipcRenderer.invoke("config:get"),
  },
});

declare global {
  interface Window {
    electronAPI: {
      auth: {
        register: (data: { username: string; password: string }) => Promise<any>;
        login: (data: { username: string; password: string }) => Promise<any>;
        logout: () => Promise<any>;
        me: () => Promise<any>;
      };
      tests: {
        list: () => Promise<any>;
        questions: (testId: string) => Promise<any>;
        delete: (testId: string) => Promise<any>;
        rename: (oldTestId: string, newTestId: string) => Promise<any>;
        import: (testId: string, questions: any[], category?: string) => Promise<any>;
      };
      questions: {
        create: (question: any) => Promise<any>;
        update: (id: number, update: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
      };
      results: {
        list: () => Promise<any>;
        create: (result: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
      };
      attempts: {
        list: () => Promise<any>;
        get: (id: number) => Promise<any>;
        create: (attempt: any) => Promise<any>;
        update: (id: number, update: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
      };
      dialog: {
        openFile: () => Promise<any>;
      };
      config: {
        get: () => Promise<any>;
      };
    };
  }
}
