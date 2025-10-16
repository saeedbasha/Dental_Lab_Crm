# DentalLab CRM (Vite + React + Tailwind)
Local demo app to track orders between clinics and your lab. Supports English and Arabic (EN/AR toggle). Data is saved to browser localStorage.

## Quick start

1. Install dependencies
```bash
cd dentallab_project
npm install
```

2. Run dev server
```bash
npm run dev
```

3. Open the URL printed by Vite (usually http://localhost:5173)

## Notes
- Built with Vite + React and Tailwind CSS.
- Data persists in the browser via localStorage under the key `dentallab_orders`.
- To deploy, build with `npm run build` and serve the `dist` folder.
