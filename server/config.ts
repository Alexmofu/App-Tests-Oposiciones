export const config = {
  app: {
    name: process.env.APP_NAME || "OposTest Pro",
    description: process.env.APP_DESCRIPTION || "Preparación de oposiciones",
    welcomeMessage: process.env.WELCOME_MESSAGE || "Preparando tu entorno de estudio...",
  },
  server: {
    port: parseInt(process.env.PORT || "5000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
  },
  session: {
    secret: process.env.SESSION_SECRET || "default-secret-change-me",
  },
};

export type AppConfig = typeof config.app;
