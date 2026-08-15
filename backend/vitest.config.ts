import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
    },
    globalSetup: ["./test/global-setup.ts"],
    setupFiles: ["./test/setup.ts"],
    fileParallelism: false,
    testTimeout: 15000,
    include: ["test/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@common": path.resolve(__dirname, "src/common"),
      "@modules": path.resolve(__dirname, "src/modules"),
    },
  },
});
