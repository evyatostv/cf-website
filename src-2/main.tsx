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
  <Sentry.ErrorBoundary
    fallback={
      <div dir="rtl" style={{ padding: 24, textAlign: "center" }}>
        <p style={{ marginBottom: 12 }}>אירעה תקלה — רעננו את העמוד.</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            background: "#0d47a1",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          רענון העמוד
        </button>
      </div>
    }
  >
    <App />
  </Sentry.ErrorBoundary>
);
