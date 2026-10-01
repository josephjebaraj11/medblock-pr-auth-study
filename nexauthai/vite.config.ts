import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Deployed under a subpath on GitHub Pages (e.g. /medblock-pr-auth-study/),
// served from "/" in dev and preview. CI sets VITE_BASE; everything that needs
// the prefix reads it back via import.meta.env.BASE_URL.
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  server: { port: 5173, open: false },
});
