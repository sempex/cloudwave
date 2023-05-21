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
      GITHUB_CLIENT_SECRET: string;
      GITHUB_CLIENT_ID: string;
      FRONTEND_ORIGIN: string;
      TOKEN_EXPIRES_IN: number;
      GITHUB_CALLBACK_URL: string;
      DOMAIN: string;
      GITHUB_APP_SECRET: string;
      GITHUB_APP_ID: string;
    }
  }
}
