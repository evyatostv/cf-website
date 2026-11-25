import * as Sentry from "@sentry/react";

// Only generated bundle locations and standard error classifications leave the
// browser. Arbitrary error text, URLs and breadcrumb data can contain form data.
if (typeof window !== "undefined") {
  Sentry.init({
    dsn: "https://e8c3eb0d82a37bcfdc86f6a8abdb7a3a@o4511219015024640.ingest.de.sentry.io/4511219016925264",
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    defaultIntegrations: false,
    integrations: [Sentry.globalHandlersIntegration(), Sentry.eventFiltersIntegration()],
    ignoreErrors: [/^Object Not Found Matching Id:\d+, MethodName:update, ParamCount:\d+$/],
    beforeSend(event) {
      const values = event.exception?.values?.map(exception => {
        const frames = exception.stacktrace?.frames?.flatMap(frame => {
          if (!frame.filename) return [];
          try {
            const url = new URL(frame.filename, location.origin);
            if (url.origin !== location.origin || !/^\/assets\/[\w.-]+\.js$/.test(url.pathname)) return [];
            return [{ filename: url.origin + url.pathname, lineno: frame.lineno, colno: frame.colno }];
          } catch { return []; }
        });
        const type = /^(Error|TypeError|RangeError|ReferenceError|SyntaxError|UnhandledRejection)$/.test(exception.type || '')
          ? exception.type : 'Error';
        return { type, value: type, stacktrace: { frames: frames || [] } };
      });
      if (!values?.length) return null;
      return {
        type: undefined,
        event_id: event.event_id,
        timestamp: event.timestamp,
        platform: 'javascript',
        environment: import.meta.env.MODE,
        level: 'error',
        exception: { values },
      };
    },
  });
}
