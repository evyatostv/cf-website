import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://e8c3eb0d82a37bcfdc86f6a8abdb7a3a@o4511219015024640.ingest.de.sentry.io/4511219016925264",
  environment: import.meta.env.MODE,
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: import.meta.env.MODE === "production" ? 0.2 : 1.0,
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/clinic-flow\.co\.il/,
    /^https:\/\/dmuwxydmuylcbhcoagri\.supabase\.co/,
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
});
