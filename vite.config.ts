import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import istanbul from "vite-plugin-istanbul";

// Conditionally import Replit-specific plugin
let runtimeErrorOverlay: any;
try {
  runtimeErrorOverlay = require("@replit/vite-plugin-runtime-error-modal");
} catch {
  // Plugin not available in non-Replit environments
  runtimeErrorOverlay = null;
}

export default defineConfig(({ mode }) => {
  // Build plugins array with proper typing
  const plugins: PluginOption[] = [
    react(),
  ];

  // Add istanbul plugin only if E2E_COVERAGE is set
  if (process.env.E2E_COVERAGE) {
    plugins.push(istanbul({
      include: ['client/src/**/*'], // adjust if your src path differs
      exclude: ['tests/**/*', 'node_modules', 'playwright-report/**/*'],
      extension: ['.ts', '.tsx'],
      cypress: false,
      requireEnv: false,
    }));
  }

  // Add Replit plugins only if not in production and REPL_ID is set
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    // Add runtime error overlay if available
    if (runtimeErrorOverlay) {
      try {
        plugins.push(runtimeErrorOverlay.default ? runtimeErrorOverlay.default() : runtimeErrorOverlay());
      } catch (error) {
        console.warn('Failed to initialize Replit runtime error overlay:', error);
      }
    }

    // Add optional Replit plugins with error handling
    plugins.push(
      import("@replit/vite-plugin-cartographer")
        .then((m) => m.cartographer())
        .catch((error) => {
          console.warn('Replit cartographer plugin not available:', error);
          return null; // Return null to avoid breaking the plugins array
        }),
      import("@replit/vite-plugin-dev-banner")
        .then((m) => m.devBanner())
        .catch((error) => {
          console.warn('Replit dev banner plugin not available:', error);
          return null; // Return null to avoid breaking the plugins array
        }),
    );
  }
  
  return {
    plugins: plugins.filter(Boolean), // Filter out any null/undefined plugins
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
