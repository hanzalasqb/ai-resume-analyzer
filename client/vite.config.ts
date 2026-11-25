import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  server: {
    proxy: { "/api": "http://localhost:4000" },
    fs: { allow: [".."] }, // demo mode reuses ../server/src/keywords.ts
  },
});
