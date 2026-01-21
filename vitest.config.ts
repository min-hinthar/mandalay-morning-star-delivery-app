import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const sanitizedNodeOptions = (process.env.NODE_OPTIONS ?? "")
  .split(" ")
  .filter((option) => option.trim().length > 0)
  .filter((option) => !option.startsWith("--localstorage-file"))
  .join(" ");

for (let index = process.execArgv.length - 1; index >= 0; index -= 1) {
  if (process.execArgv[index]?.startsWith("--localstorage-file")) {
    process.execArgv.splice(index, 1);
  }
}

if (sanitizedNodeOptions) {
  process.env.NODE_OPTIONS = sanitizedNodeOptions;
} else {
  delete process.env.NODE_OPTIONS;
}

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    exclude: ["**/node_modules/**", "**/e2e/**"],
    // Force exit after tests complete to avoid hanging on Windows
    teardownTimeout: 1000,
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
