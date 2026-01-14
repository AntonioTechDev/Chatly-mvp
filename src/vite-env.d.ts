/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_ENV: string
  readonly VITE_APP_VERSION: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ENABLE_AI_ASSISTANT?: string
  readonly VITE_ENABLE_ANALYTICS?: string
  readonly VITE_ENABLE_WHATSAPP?: string
  readonly VITE_ENABLE_INSTAGRAM?: string
  readonly VITE_ENABLE_MESSENGER?: string
  readonly VITE_DEBUG_MODE?: string
  readonly VITE_SHOW_QUERY_LOGS?: string
  readonly VITE_SESSION_TIMEOUT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
