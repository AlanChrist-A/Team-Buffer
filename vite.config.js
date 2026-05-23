import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Team-Buffer/",
  plugins: [react()],
  server: { port: 8080 },
});