# 505th Hub ↔ Cortana Integration — Design Proposal

Status: **design only, nothing built yet.** Written after reading (not modifying) all three repos: Hub, `505th-website`, `Cortana_Bot`.

## The big finding

Cortana already does most of the Discord-side work for shared events. It is not starting from zero:

- Staff create events using **Discord's own native "Scheduled Events" feature** (right-click a channel → Create Event). Cortana listens for `guildScheduledEventCreate/Update/Delete` and automatically posts a signup embed with working **Attend / Cannot Attend / Cancel / Refresh buttons** (`utils/createSignupEmbed.js`, `events/interaction/interactionCreate.js`).
- Rosters are tracked per event, pings go out to attendees when the event starts, and a "Mission Log" archive embed gets posted when it ends.
- A reminder job (`jobs/reminderScheduler.js`) already runs every minute checking time-to-start — the actual "send a reminder" line is just commented out.

All of this is **local to the bot's server PC** — stored in flat JSON files (`data/signups.json`, `data/roster_<eventId>.json`, `data/activeEvents.json`). Nothing about it touches Firebase. That's the entire gap: a well-built Discord-side system with no bridge to the Hub or the website.

The website, separately, already has:
- An `attendance_events` Firestore collection where **staff manually type in** who attended each op — this is what recalculates `opsAttended` / `opsEligible` on `users/{uid}` (the exact fields your Hub's service record already displays).
- A `presence_sessions` pattern (heartbeat doc, 30s ping, 90s staleness) used to show "who's currently in this admin panel" — a directly reusable pattern for Hub's opt-in presence.
- **No** Discord-account-linking field anywhere on `users/{uid}`. That has to be built from scratch, which matches your instruction not to trust a member-typed Discord ID.
- Roles (`enlistee` → `developer`) are plain fields on the Firestore document, checked only in client JS. No custom claims, no Cloud Functions. This is the "UI role checks aren't security" issue you flagged — it's real and current.

## Proposed architecture

Keep Firestore as the one shared backend (it's already what Hub, the website, and auth all use — this extends the existing system rather than adding a second one). The only new piece: **Cortana gets the Firebase Admin SDK**, authenticated with a service account key file that lives only on the bot's server PC, `.gitignore`'d, never touched by Hub or the website. Admin SDK access bypasses Firestore rules by design (that's normal — it's how a trusted server is supposed to work), so Cortana can read/write freely while Hub and the website stay bound by rules.

```
505th Hub  ──(Firestore, rules-limited)──┐
                                          ├──►  Firestore  (th-website-91533)
Website    ──(Firestore, rules-limited)──┘        ▲
                                                    │ Admin SDK (server-only credential)
                                          Cortana Bot (Windows server PC)
                                                    │
                                                 Discord
```

## Data model additions (all PROPOSED — not created)

**`shared_events/{eventId}`** — mirrors a Discord Scheduled Event. Doc ID = the Discord event ID, so Hub, website, and Cortana all reference the same record.
Fields: `title`, `description`, `type`, `startTime`, `status` (`open`/`cancelled`/`completed`), `createdBy` (uid), `discordEventId`, `signupChannelId`, `signupMessageId`.

**`shared_events/{eventId}/responses/{uid}`** — one doc per member per event, `{ response: 'attending'|'cannot_attend', respondedAt }`. Written two ways: by Cortana (Admin SDK) when someone clicks a Discord button, or by Hub itself once we build an in-app respond flow — same doc either way, so it stays in sync regardless of which app the member used.

**`discord_links/{uid}` → `{ discordId, linkedAt }`** — the verified link. See linking flow below for how it gets written safely.

**`hub_presence/{uid}` → `{ online: bool, updatedAt }`** — opt-in only, heartbeat pattern copied from `presence_sessions`. **Settled:** visible only to the member themselves for now (a personal "Hub is running" confirmation) — not staff, not unit-wide. You mentioned a future chat feature that may change this; that's noted for later, not designed here.

**Reuse, no new collection:** `notifications/{uid}/items` — Hub's inbox and silent-alert pipeline (`live.js`) already works end-to-end. Cortana just needs to *write* into it (new event posted, event changed/cancelled, reminder fired) using the Admin SDK, and Hub's existing code picks it up with zero Hub-side changes.

**Reuse, no new collection:** `attendance_events` — this is the standout integration. When Cortana archives a signup today, it already knows exactly who clicked Attend. Instead of that data dying in a JSON file, Cortana writes it straight into `attendance_events` in the same shape the website's admin panel already produces (`title`, `date`, `type`, `attendees[]`). That collection already drives the `opsAttended`/`opsEligible` recompute on `users/{uid}` — so **verified attendance stops being manual staff data entry** and becomes automatic from real Discord responses. This is the actual answer to your requirement #7.

## Discord account linking — proposed flow (does not trust a typed Discord ID)

**Deferred to the last phase, by your instruction** — kept here so the design is complete, but nothing about it happens until every other phase is done and working.

1. Member signs into Hub (already-authenticated Firebase session) and clicks "Link Discord."
2. Hub asks Cortana (via a small Cloud Function or a Cortana-hosted endpoint — where exactly is a decision for when we actually reach this phase, not now) to generate a short one-time code, stored server-side against that `uid`.
3. Member runs `/link <code>` **in Discord, from their own Discord account** — this is the proof, since only the real owner of that Discord account can run a command as themselves.
4. Cortana verifies the code server-side and writes `discord_links/{uid}`.

No step ever asks the member to type a Discord ID that gets trusted at face value.

## Decisions — settled vs. still open

**Settled:**
- Reminder timing: **1 hour before**, re-enabling the existing (currently commented-out) threshold. No 24h reminder added.
- Presence visibility: **member-only** for now (see `hub_presence` above).
- Discord-link endpoint location: **deferred** — decide when Phase 7 (linking) actually starts, not before.

**Still open, needed before the relevant phase starts (not before Phase 1):**
- **Firestore rules.** New collections need new rules (`shared_events` responses: a member can only write their own; `hub_presence`: same; `discord_links`: server-only writes). I will draft these for your review, but per your constraint **I will not deploy any rules change without your explicit sign-off**, and I'd deploy them separately from app code so they can be tested first.

## Suggested build order (phased, so nothing is one giant change)

- **Phase 1 — foundations, no visible behavior change.** Add `firebase-admin` to Cortana, service account key handling, connect to Firestore read-only first (just log what it sees) to prove the credential path works safely before anything writes.
- **Phase 2 — event mirroring.** Cortana writes `shared_events/{eventId}` when a Discord scheduled event is created/updated/cancelled. Nothing reads it yet.
- **Phase 3 — Hub shows shared events.** Hub's "Operations" page (currently a placeholder) reads `shared_events` and shows real upcoming ops. Read-only first — no responding from Hub yet.
- **Phase 4 — notifications.** Cortana writes into `notifications/{uid}/items` for event created/changed/cancelled and the (re-enabled, 1-hour) reminder. Uses Hub's existing alert pipeline untouched.
- **Phase 5 — attendance feed.** Cortana writes archived rosters into `attendance_events`, replacing manual entry for events that went through Discord signup (staff can still manually add non-Discord attendance the way they do today).
- **Phase 6 — presence + in-Hub responses.** Opt-in, member-only presence, and letting a member click Attend/Cannot Attend from inside Hub itself (writing to the same `responses` subcollection Cortana writes to).
- **Phase 7 — Discord linking (last, by your instruction).** The `/link` flow above.

Each phase is independently testable with synthetic data before touching a real Discord channel, per your constraint on live messages.

## What I have NOT done

No code changes in any of the three repos. No Firestore rules touched. No Discord messages sent. This document is the plan; nothing below "Phase 1" starts until you tell me to.
