// vite.config.ts
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    ssr: resolve(__dirname, "src/server.ts"),
    rollupOptions: {
      external: [
        "url",
        "path",
        "fs",
        "util",
        "os",
        "http",
        "https",
        "stream",
        "zlib",
        "express",
      ],
    },
  },

  optimizeDeps: {
    disabled: true,
  },
});
