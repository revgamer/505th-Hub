# 505th Hub — prototype

Desktop prototype matching the 505th website's dark cyan Command Terminal styling.

## Run

Install Node.js, then run from this folder:

    npm install
    npm start

For a browser-only layout preview, open index.html. Native notifications require Electron.

## Available

- Member overview, operations, service-record placeholder and notification history.
- Attend / Cannot Attend responses saved locally.
- Explicit staff preview switch, local event creation and cancellation.
- Silent Windows test notification from the desktop app.

## Prototype boundaries

No Firebase login, live data, Discord messages, real access control, background reminders, tray mode, installer or auto-update yet. Closing the app exits it. Preview roles are not security permissions. Sign-ups are not confirmed attendance. Sample events and history use localStorage and must not hold sensitive data.

## Updates

505th Hub checks GitHub Releases (`RevGamer/505th-hub`, public repo) for new versions on launch and every 4 hours while running, plus on demand via the tray menu's "Check for Updates." Updates download automatically in the background; the member is prompted to restart once ready, or it installs on next quit. This only works in the installed (packaged) app, not `npm start`.

To ship a release from this machine:

1. Bump `"version"` in `package.json`.
2. Set a GitHub personal access token with `repo` scope in the `GH_TOKEN` environment variable (needed to create the GitHub Release and upload the installer — this is a *publishing* credential for you, not something shipped inside the app).
3. Run `npm run release:win`. This builds, packages the NSIS installer, and uploads it plus the `latest.yml` metadata file electron-updater reads.

## Next integration phase

Link existing Firebase member accounts to verified Discord identities. Store shared events and responses durably, keeping staff-confirmed attendance separate. Add server-enforced permissions and a bot synchronisation worker with retries and event revisions. Preserve historical responses before Cortana archive cleanup. Add reliable rescheduling/cancellation handling, notification preferences, tray behaviour and a signed Windows installer.

Existing reference projects:
- F:\505th Exp Force Design Dev Works\505th-website
- F:\Discord Bot\Cortana_Bot
