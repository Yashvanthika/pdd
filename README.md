# BloodLink

BloodLink is a donor-focused mobile application for blood donor registration, secure sign-in, profile management, and location-based donor search.

The frontend is an Expo React Native app for iOS and Android. The backend is a Node/Express API deployed on Dokploy and backed by Supabase Auth plus the `donor_profiles` table.

## Supabase Setup

Run the schema in `supabase/schema.sql` from the Supabase SQL Editor before starting the app. The backend health endpoint checks that the configured Supabase project has the expected `donor_profiles` schema; signup and login will not work until that schema is present.

Backend environment variables:

```env
NODE_ENV=development
PORT=3000
APP_URL="http://localhost:3000"
CORS_ORIGINS="http://localhost:8081,http://localhost:19006"
SUPABASE_URL=""
SUPABASE_PUBLISHABLE_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
```

Mobile environment variables:

```env
EXPO_PUBLIC_SUPABASE_URL=""
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""
EXPO_PUBLIC_API_BASE_URL="http://localhost:3000"
```

## Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a backend environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Add Supabase and API values in `.env.local`.

4. Start the backend API:
   ```bash
   pnpm run dev:server
   ```

5. Start the Expo mobile app:
   ```bash
   pnpm run dev
   ```

## Production Build

Build the Dokploy backend bundle:

```bash
pnpm run build:server
pnpm start
```

## Dokploy Deployment

Deploy the backend API as one Dokploy application using the root `Dockerfile`.

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
CORS_ORIGINS=https://your-mobile-api-client.example
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Configure the mobile app with:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
EXPO_PUBLIC_API_BASE_URL=https://your-dokploy-domain.example
```

## API Surface

- `GET /api/health`
- `GET /api/locations`
- `POST /api/auth/register-donor`
- `GET /api/me`
- `PUT /api/me`
- `POST /api/me/change-password`
- `PUT /api/me/last-donation`
- `DELETE /api/me`
- `GET /api/donors/search?bloodGroup=&state=&district=&city=`
