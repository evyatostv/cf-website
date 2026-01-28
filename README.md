# Clinic Flow Website

Marketing website for the Clinic Flow app (RTL, Hebrew). Built with Vite + React.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Build

```bash
npm run build
```

The production bundle is generated in `dist/`.

## Project structure

```
src-2/
  app/
    components/
    pages/
    routes.tsx
  styles/
```

## Notes

- The entry point is `index.html` → `src-2/main.tsx`.
- App routes are defined in `src-2/app/routes.tsx` (React Router).
- GitHub Pages uses hash routing (`/#/pricing`) to avoid 404s on refresh.
- RTL is enabled globally in the layout.
