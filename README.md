# BloodLink

BloodLink is an emergency blood coordination application for donors, hospitals, and administrators. It includes donor verification, request dispatch, donor matching, outreach message drafting, donation completion, and audit views.

## Supabase Setup

Run the schema in `supabase/schema.sql` from the Supabase SQL Editor before starting the app.

Required local environment variables:

```env
VITE_SUPABASE_URL=""
VITE_SUPABASE_PUBLISHABLE_KEY=""
SUPABASE_URL=""
SUPABASE_PUBLISHABLE_KEY=""
GEMINI_API_KEY=""
VITE_API_BASE_URL=""
APP_URL=""
CORS_ORIGINS=""
```

Public signup supports donor and hospital accounts. To create an administrator, register an account first, then promote it in Supabase SQL:

```sql
update public.profiles
set role = 'admin', status = 'APPROVED'
where email = 'admin@example.com';
```

## Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a local environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Add the required Supabase and server-side keys in `.env.local`.

4. Start the app:
   ```bash
   pnpm run dev
   ```

## Production Build

```bash
pnpm run build
pnpm start
```

## Dokploy Deployment

The backend is ready to deploy as one Dokploy application using the root `Dockerfile`.

Recommended Dokploy settings:

1. Create an Application from your Git repository.
2. Set Build Type to `Dockerfile`.
3. Set Dockerfile Path to `Dockerfile`.
4. Set Docker Context Path to `.`.
5. Expose container port `3000`.
6. Add a domain in Dokploy Domains.
7. Use `/api/health` as the health check URL.

Add these runtime variables in the Dokploy application Environment tab:

```env
NODE_ENV=production
PORT=3000
APP_URL=https://your-dokploy-domain.example
CORS_ORIGINS=capacitor://localhost,http://localhost,https://your-dokploy-domain.example
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=https://ivytidzhluxpmxurpyra.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Add these Dockerfile build arguments in Dokploy:

```env
VITE_SUPABASE_URL=https://ivytidzhluxpmxurpyra.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_API_BASE_URL=https://your-dokploy-domain.example
```

If the web app is served from the same Dokploy container, `VITE_API_BASE_URL` can be left blank for same-origin requests. For an iOS build that calls the Dokploy backend, set `VITE_API_BASE_URL` to the Dokploy domain before running the iOS build/sync commands.

## iOS

After changing web assets, rebuild and sync Capacitor before opening the iOS project:

```bash
pnpm run build
pnpm exec cap sync ios
pnpm exec cap open ios
```
