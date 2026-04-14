import "@/instrument";

import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "@/app/App";
import "@/styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <Sentry.ErrorBoundary fallback={<p style={{ padding: 24, textAlign: "center" }}>משהו השתבש. אנא רענן את העמוד.</p>} showDialog>
    <App />
  </Sentry.ErrorBoundary>
);
