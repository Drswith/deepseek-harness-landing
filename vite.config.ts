import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ isSsrBuild }) => ({
  base: "/",
  plugins: [react()],
  server: { host: "127.0.0.1", port: 43880, strictPort: true },
  preview: { host: "127.0.0.1", port: 43882, strictPort: true },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    copyPublicDir: !isSsrBuild,
  },
}));
