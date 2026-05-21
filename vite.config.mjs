import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/scheduler/")) {
            return "vendor-react";
          }

          if (id.includes("/@supabase/")) {
            return "vendor-supabase";
          }

          if (id.includes("/lucide-react/") || id.includes("/lucide/")) {
            return "vendor-icons";
          }

          return undefined;
        },
      },
    },
  },
});
