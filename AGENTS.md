# AGENTS.md

## Environment: WSL opencode + Windows-native Expo (CRITICAL)

This project is developed with a split setup:

- **opencode runs in WSL** against `/mnt/c/USers/conte/code/workout` (the Windows
  filesystem mounted into WSL).
- **The app runs on Windows-native Node** via PowerShell (`C:\Users\conte\code\workout`).

This split causes silent corruption: any `npm install`/`npx expo` run from WSL creates
Linux symlinks in `node_modules/**/.bin/` that Windows-native Node cannot `lstat`,
crashing Metro with `EACCES: permission denied, lstat '...\.bin\<name>'`.

### Rule

- **Never run `npm install`, `npx expo`, or any install/run command from WSL (opencode).**
  Those must be executed by the user from **PowerShell**.
- opencode (WSL) is restricted to: editing source files, running `typecheck`/lint,
  git operations, and code search. Editing `.ts`/`.tsx`/`.json` source from WSL is safe.
- If the user reports an `EACCES`/`lstat` Metro error, do NOT reinstall from WSL. Point
  them to the PowerShell reinstall below.

### If node_modules is corrupted (EACCES on Metro start)

Run from **PowerShell** (not WSL):
```powershell
Remove-Item -Recurse -Force node_modules
npm install
npx expo start
```

### Metro already excludes `.opencode`

`metro.config.js` adds `.opencode` to `resolver.blockList` so Metro's file watcher never
descends into opencode's WSL-installed `node_modules`. Do not remove that exclusion —
opencode's symlinks are valid for WSL but unreadable by Windows Node.

## Commands

- `npm start` / `npx expo start` — start Metro (run from PowerShell)
- `npm run typecheck` — `tsc --noEmit` (safe to run from WSL)
- `npm run android` / `ios` / `web` — platform targets (PowerShell)

## Stack

- Expo SDK 54, React Native 0.81, React 19, expo-router 6 (entry: `expo-router/entry`)
- Metro 0.83 (`metro.config.js` uses `expo/metro-config` `getDefaultConfig`)
- State: zustand. Storage: expo-sqlite. IDs: uuid.
- TypeScript, strict. `newArchEnabled: true`.
