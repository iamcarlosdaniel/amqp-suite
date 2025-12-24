import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true, // Permite usar 'describe', 'it', 'expect' sin importarlos
    environment: "node",
  },
});
