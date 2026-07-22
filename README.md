# footfall-web — getfootfall.com ....

Next.js app: marketing site at `/` (the exported Footfall design served
verbatim with its vanilla-JS interactions) + owner dashboard at `/dashboard`
(Today's calendar, Services & products, Team, Hours).

The dashboard talks to footfall-fastapi through a server-side proxy
(`app/api/f/[...path]` → `/api/v1/owner/*`, Bearer FOOTFALL_ADMIN_KEY).
The key never reaches the browser.

## Dev
1. Start the API: `cd ../api/footfall-fastapi && uv run uvicorn app.main:app --port 8001`
2. `cp .env.local.example .env.local` (FOOTFALL_API_URL, FOOTFALL_ADMIN_KEY)
3. `npm run dev -- -p 3005`

## Before public deploy
- **No owner login yet** — the dashboard is unauthenticated (dev mode).
  Create the Footfall Supabase project, wire Supabase auth here and
  Supabase-JWT verification in the FastAPI owner endpoints, THEN deploy.
- Replace WA_NUMBER placeholder in public/app.js.
