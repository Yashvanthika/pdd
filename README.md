# BloodLink

BloodLink is an emergency blood coordination application for donors, hospitals, and administrators. It includes donor verification, request dispatch, donor matching, outreach message drafting, donation completion, and audit views.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a local environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Add the required server-side keys in `.env.local`.

4. Start the app:
   ```bash
   npm run dev
   ```

## Production Build

```bash
npm run build
npm start
```

## iOS

After changing web assets, rebuild and sync Capacitor before opening the iOS project:

```bash
npm run build
npx cap sync ios
npx cap open ios
```
