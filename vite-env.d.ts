/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NOTION_TOKEN: string;
  readonly VITE_PK_SW: `0x${string}`;
  readonly VITE_RPC: string;
  readonly VITE_PK: `0x${string}`;
  readonly VITE_PORT: number;
}
