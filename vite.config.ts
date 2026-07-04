import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// Dev-only: mirror the production vercel.json rewrite `/soon -> /soon.html` so the
// static coming-soon page is reachable at /soon locally too (otherwise Vite's SPA
// fallback serves the React app for /soon). Prod is unaffected — Vercel handles it.
const soonRewrite = {
  name: "soon-rewrite",
  configureServer(server: any) {
    server.middlewares.use((req: any, _res: any, next: any) => {
      if (req.url === "/soon" || req.url === "/soon/") req.url = "/soon.html";
      next();
    });
  },
};

export default defineConfig({
  base: "/",
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    soonRewrite,
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      "@": path.resolve(__dirname, "./src-2"),
    },
  },
});
