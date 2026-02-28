/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_AUTH_API_URL?: string;
  readonly VITE_TIME_API_URL?: string;
  /** Static Bearer token for dev/testing when backend expects token auth */
  readonly VITE_AUTH_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

