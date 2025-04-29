/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEB3_STORAGE_TOKEN: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
