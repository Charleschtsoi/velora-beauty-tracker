# AGENTS.md

## Cursor Cloud specific instructions

Velora is an Expo / React Native (TypeScript) mobile app. There is no lint, test, or
build script defined in `package.json` — the dev workflow is the Expo dev server
(`npm start`, or per-platform `npm run ios|android|web`). Standard run commands live in
`README.md`; environment variables are documented in `ENV_SETUP.md` / `.env.example`.

### Running in the headless cloud VM (web target)
- There is no iOS/Android simulator or physical device available in the cloud VM, so the
  only way to actually render and interact with the app here is the **web target**:
  `npx expo start --web --port 8081`. Then open `http://localhost:8081` in Chrome.
- Web runtime deps (`react-dom`, `react-native-web`, `@expo/metro-runtime`) are in
  `package.json` and are installed by the update script (`npm install`).
- `npm start` runs `node scripts/expo-connection-diagnostic.js` first (it only writes a
  diagnostic log to the gitignored `.cursor/debug.log` and is a no-op for functionality).
  For web you can skip it and call `npx expo start --web` directly.
- After adding/removing a `*.web.tsx` platform override or changing platform-resolved
  files, restart Metro with `--clear` so the new platform extension is picked up.

### Web-only shims (do NOT remove; they are platform-guarded)
Some native-only modules are not available on web. To make the web target work without
changing native (iOS/Android) behavior:
- `App.tsx` guards `expo-notifications` calls behind `Platform.OS !== 'web'` and wraps the
  tree in `SafeAreaProvider`.
- `src/components/common/DatePickerField.web.tsx` is a web override (HTML5 `<input type="date">`)
  because `@react-native-community/datetimepicker` is not supported on web. Native keeps
  using `DatePickerField.tsx`. Both files must keep identical props.

### Backend / scanning (optional)
- The client talks only to Supabase via `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
  Working fallbacks are hardcoded in `src/services/supabase.ts`, so the app boots without a
  `.env.local`.
- Core inventory (add/edit/list, expiry status) is fully local (AsyncStorage), so it works
  offline with no backend. Barcode/AI scan features require the deployed Supabase Edge
  Functions + a `GEMINI_API_KEY` secret (see `ENV_SETUP.md`); these are optional for basic dev.

### Known caveats
- `npx tsc --noEmit` reports pre-existing type errors (Deno globals in `supabase/functions/*`
  and some `ProductCategory` mismatches in `src/services/productService.ts`). These exist on
  `main` and are not part of the dev run path — the project does not run `tsc` as a gate.
- Camera-based scan flows cannot be exercised on web (no camera); use the "Add manually"
  path to add products.
