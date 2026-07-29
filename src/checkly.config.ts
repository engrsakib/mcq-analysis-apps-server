import { defineConfig } from "checkly";
import { Frequency } from "checkly/constructs";

/**
 * Checkly project config for basic API uptime monitoring.
 * Deploy with: npx checkly deploy
 * Test locally: npx checkly test
 */
export default defineConfig({
  projectName: "MCQ Analysis API Monitoring",
  logicalId: "mcq-analysis-api-monitoring",
  checks: {
    activated: true,
    muted: false,
    runtimeId: "2024.02",
    frequency: Frequency.EVERY_5M,
    locations: ["ap-south-1"],
    tags: ["api", "monitoring"],
    checkMatch: "**/__checks__/**/*.check.ts",
    ignoreDirectoriesMatch: ["node_modules", "dist"],
    browserChecks: {
      frequency: Frequency.EVERY_10M,
      testMatch: "",
    },
  },
  cli: {
    runLocation: "ap-south-1",
  },
});
