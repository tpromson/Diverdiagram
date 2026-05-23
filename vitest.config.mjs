import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.{js,ts,jsx,tsx}"],
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "src"),
    },
  },
});
