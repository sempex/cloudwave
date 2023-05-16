export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: number;
      REGISTRY_USERNAME: string;
      REGISTRY_PASSWORD: string;
      REGISTRY_URL: string;
      SESSION_SECRET: string;
      DATABASE_URL: string;
    }
  }
}
