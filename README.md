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
EXPO_PUBLIC_API_TIMEOUT_MS="15000"
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

4. Seed searchable test donors:
   ```bash
   pnpm run seed:test-donors
   ```
   This creates five consented test donors for every city in `src/data/indiaLocations.ts`, including two `A+` donors per city plus varied additional blood groups. Seed emails use `test.donor.NNNN@bloodlink.test`, all seeded test accounts use password `BloodLinkTest#2026`, and displayed phone numbers use test-safe `+910000NNNNNN` values.

5. Start the backend API:
   ```bash
   pnpm run dev:server
   ```

6. Start the Expo mobile app:
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
7. Use `/api/live` as the Dokploy health check URL.

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

Use `/api/live` for container liveness and `/api/health` when you want to verify that Supabase credentials and the `donor_profiles` table are ready.

## API Surface

- `GET /api/live`
- `GET /api/health`
- `GET /api/locations`
- `POST /api/auth/register-donor`
- `GET /api/me`
- `PUT /api/me`
- `POST /api/me/change-password`
- `PUT /api/me/last-donation`
- `DELETE /api/me`
- `GET /api/donors/search?bloodGroup=&state=&district=&city=`


## Appium Android E2E Testing

This repository also includes an Appium 2.x + UiAutomator2 mobile automation framework for the BloodLink Android APK. The catalog generates at least 340 Android cases for authentication, registration validation, donor search, navigation, gestures, diagnostics, accessibility, production API configuration, and authenticated profile workflows.

Framework locations:

- `tests/appium/` - generated Mocha E2E execution suite
- `pages/appium/` - mobile Page Object Model classes
- `utilities/appium/` - Appium driver client, ADB device discovery, gestures, failure capture, logging, report store, catalog builder, Excel report generation
- `config/appium.config.js` - APK, package, Appium server, device, timeout, retry, credential, and artifact settings
- `data/appium/` - BloodLink mobile test data
- `.github/workflows/appium-e2e.yml` - Android emulator workflow for Appium E2E artifacts

Install Appium once on your Mac:

```bash
npm install -g appium@^2
appium driver install uiautomator2@4.2.9
```

If you are using the local portable Android toolchain created for the APK build:

```bash
export TOOLCHAIN=/private/tmp/bloodlink-android-toolchain
export JAVA_HOME="$TOOLCHAIN/jdk/jdk-17.0.19+10/Contents/Home"
export ANDROID_HOME="$TOOLCHAIN/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

Connect your Android phone by USB, enable USB debugging, accept the trust prompt, and verify:

```bash
adb devices -l
```

Start Appium in one terminal:

```bash
pnpm run appium:server
```

Run a quick smoke test in another terminal:

```bash
APPIUM_UDID=RZCX113G5ZD \
APPIUM_APK_PATH=/Users/guest1/Documents/pdd/BloodLink-arm64-release.apk \
pnpm run appium:test:smoke
```

Run the full 300+ catalog:

```bash
APPIUM_UDID=RZCX113G5ZD \
APPIUM_APK_PATH=/Users/guest1/Documents/pdd/BloodLink-arm64-release.apk \
APPIUM_MAX_CASES=340 \
pnpm run appium:test
```

Optional authenticated workflow coverage:

```bash
APPIUM_USER_EMAIL=test.donor.0001@bloodlink.test
APPIUM_USER_PASSWORD=BloodLinkTest#2026
```

Without credentials, authenticated-only mobile cases are recorded as skipped in the Excel report. The app is configured for `https://bloodlink-api.welcos.in` by default.

Generated Appium artifacts:

- `excel/Mobile_E2E_Report.xlsx`
- `Summary`, `Test Cases`, `Failed Tests`, and `Execution Logs` sheets
- `reports/appium/appium-results.json`
- `reports/appium/mochawesome/`
- `reports/appium/failures/`
- `screenshots/appium/`
- `logs/appium-e2e.log`
