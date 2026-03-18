import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    ui: true,
    browser: {
      enabled: false, // El modo UI es diferente al modo browser experimental
    },
    // Vitest UI configuración
    open: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["node_modules/", "src/__tests__/", "coverage/", "**/*.test.js"],
    },
    include: ["src/**/__tests__/**/*.test.js"],
    exclude: ["node_modules/", "dist/"],
  },
});
