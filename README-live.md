# 505th Hub 0.2 — connected development build

## Run locally

    npm install
    npm start

Sign in with an existing approved website account. The app listens only to `users/{signed-in UID}`. It also listens to the latest 50 notifications in notifications/{signed-in UID}/items. Mark as read updates only the selected notification. It does not list other members. It uses Firebase Authentication and an in-memory session: closing to tray keeps the session alive; quitting signs the app out on the next launch.

Close the window to keep it in the Windows notification area. Click the tray icon to reopen, or use its Quit menu. Start with Windows is not enabled. New server-confirmed unread website notifications trigger custom silent visual alerts. The initial inbox loads quietly. Event scheduling and live operation reminders are not enabled.

## Validation

    npm run build
    npm run check
    node tests/test-live.cjs live.js
    npm run pack:win

`dist/win-unpacked` is a Windows development app folder, not a signed installer. Do not distribute to the unit until the deployment and access tests below are complete. The package file allowlist excludes the old Davy snapshot and sample data.

## Remaining production work

- Read and verify deployed Firestore rules, especially whether users can edit their own role/status. Hiding staff tools is not authorization.
- Add dedicated shared events and response storage with strict member/staff rules, server-side membership verification and input validation.
- Deploy Cortana integration on the user's server PC. Do not embed Discord tokens or service account credentials in this app.
- Link Firebase accounts with Discord through an authenticated, expiring verification flow. Do not trust a member-entered Discord ID.
- Add durable event revision/outbox processing, deduplication, retry handling and cancellation tombstones; preserve responses before legacy Cortana archive cleanup.
- ~~Update hosting~~ — wired via GitHub Releases (`electron-updater`, public repo). Installer signing is still outstanding; unsigned installers and updates will still trigger Windows SmartScreen warnings.
- Add account-scoped attendance history projections. Existing monthly history documents contain multiple members and should not be downloaded by every client.
- Schedule reminders with restart/reconnect recovery and event revision checks, then add preferences, presence opt-in and installer signing/update hosting.
- Test with separate member and staff accounts, rejected writes, revoked membership, two devices, disconnected clients, reschedules and cancellation.

## Attendance semantics found in website source

`snapshotAttendanceHistory` counts all locked event types for attended and eligible totals. The `missed` field counts only main operations (`main_op`). Thus attended + missed need not equal eligible. Monthly July and August values are not necessarily inconsistent. The member document's counters are intentionally not labelled all-time until reset behaviour is audited.

No production Firebase rules or Cortana deployment were changed in this build.

Latest inbox build: dist-live/win-unpacked/505th Hub.exe. Quit any older Hub from its tray menu before launching it. Tests: node tests/test-notifications.cjs. This build still requires a real signed-in test; no production notifications were created during development.

