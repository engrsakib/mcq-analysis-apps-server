import {
  AlertEscalationBuilder,
  ApiCheck,
  AssertionBuilder,
  Frequency,
} from "checkly/constructs";

/**
 * Basic HTTP uptime monitor for the Render-hosted API.
 * - GET /health every 5 minutes
 * - Tracks response time (degraded / max thresholds)
 * - Alerts only after multiple consecutive failed checks
 */
new ApiCheck("render-api-health-check", {
  name: "Render API Health (/health)",
  activated: true,
  muted: false,
  locations: ["ap-south-1"],
  frequency: Frequency.EVERY_5M,
  tags: ["api", "uptime", "render", "health"],
  // Alert only after 3 consecutive failures (~15 minutes of downtime)
  alertEscalationPolicy: AlertEscalationBuilder.runBasedEscalation(3, {
    interval: 10,
    amount: 2,
  }),
  // Response time tracking (Render cold starts can be slow)
  degradedResponseTime: 5000,
  maxResponseTime: 20000,
  request: {
    method: "GET",
    url: "api.mcqanalysis.com/health",
    followRedirects: true,
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.responseTime().lessThan(20000),
      AssertionBuilder.jsonBody("$.success").equals(true),
    ],
  },
});
