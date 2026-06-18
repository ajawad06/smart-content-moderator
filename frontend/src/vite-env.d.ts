/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute backend API base URL for split deploys (e.g. https://api.example.com/api). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
