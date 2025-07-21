import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Optional: Safely import Cartographer only if needed
const cartographerPlugin = (() => {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
  ) {
    try {
      return require("@replit/vite-plugin-cartographer").cartographer();
    } catch {
      return null;
    }
  }
  return null;
})();

export default defineConfig({
  root: path.resolve(__dirname, "client"),
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(cartographerPlugin ? [cartographerPlugin] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-navigation-menu",
            "@stripe/react-stripe-js",
            "recharts",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
