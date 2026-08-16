# stream-overlay

Personal stream overlay for [OBS Studio](https://obsproject.com/), used on
[twitch.tv/benjilegnard](https://twitch.tv/benjilegnard).

An Angular SSR application rendered as full-screen, transparent pages that OBS loads in Browser
Sources: an animated canvas background, the current OBS scene name, a stream title, social links,
and live Twitch events (follows, subs, cheers, raids) pushed from a server-side EventSub proxy.

The repo also ships:

- `src/assets/obs-*-overrides.css` — standalone stylesheets to paste into *other* OBS Browser
  Sources (Twitch chat, Spotify, Rhythmbox, StreamElements).
- `benjilegnard.json` — an exported OBS scene collection.

## Requirements

- **Node.js 22+** — the Twitch EventSub client uses the global `WebSocket` (no `ws` dependency).
- **pnpm** — the lockfile is `pnpm-lock.yaml`.

## Setup

```sh
pnpm install
cp .env.dist .env   # then fill in real values
```

`.env` is git-ignored and loaded by `src/server.ts` via `dotenv`. See
[Environment variables](#environment-variables) below.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm start` | Dev server on <http://localhost:4200> (also runs the SSR entry, so the Twitch SSE route is live) |
| `pnpm build` | Production build into `dist/stream-overlay/` (browser + server bundles) |
| `pnpm serve:ssr` | Runs the built Express server on port 4000 (override with `PORT`) |
| `pnpm test` | Unit tests with [Vitest](https://vitest.dev/) in watch mode |
| `pnpm test:ci` | Single test run with coverage |
| `pnpm lint` | ESLint (flat config in `eslint.config.mjs`) |
| `pnpm twitch:bootstrap` | One-time Twitch OAuth flow, see below |

Run a single spec file with `npx vitest run src/app/shared/services/obs-studio.service.spec.ts`.

## Pages / OBS Browser Sources

Each route is meant to be a **separate** Browser Source in OBS, so the background can be layered
independently of the widgets. Point them at the dev server (`:4200`) or the built SSR server
(`:4000`), sized to your canvas, with a transparent background:

| URL | Contents |
| --- | --- |
| `/overlay` | Stream title, social links, chat placeholder, OBS scene name, Twitch events |
| `/background/default` | Constellation background (moving points linked by proximity) |
| `/background/delaunay` | Delaunay triangulation background |
| `/background/hexagon` | Hexagon background |

`/` redirects to `/overlay`, and `/background` to `/background/default`.

The overlay reads the current scene name through the `obsstudio` object OBS injects into Browser
Sources. Outside OBS that object is undefined and the scene name simply stays empty.

## Twitch integration

Twitch events reach the overlay through a **server-side proxy**, never the browser — an OBS Browser
Source is headless, so credentials must not be exposed to it:

```
Twitch EventSub (WebSocket) → Express server → SSE (/api/twitch/events) → overlay
```

Subscribed events: follows, subscriptions (incl. resubs and gifts), cheers, raids, and stream
online/offline.

### One-time OAuth bootstrap

Before the proxy can connect you need a refresh token and your numeric broadcaster id:

1. Create an application at <https://dev.twitch.tv/console/apps/create>. Set its **OAuth Redirect
   URL** to exactly `http://localhost:3000` and its client type to **Confidential**. Twitch compares
   the redirect URI byte-for-byte — a trailing slash, or `127.0.0.1` instead of `localhost`, fails
   with `redirect_mismatch`.
2. Put `TWITCH_USERNAME`, `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in `.env`.
3. Run `pnpm twitch:bootstrap`, open the printed URL, and authorize. The script prints
   `TWITCH_REFRESH_TOKEN` and `TWITCH_BROADCASTER_ID` — paste both into `.env`.

Requested scopes: `moderator:read:followers`, `channel:read:subscriptions`, `bits:read` (raids and
stream online/offline need none). The server rotates the refresh token automatically and persists
it to `.twitch-refresh-token` (git-ignored).

Without the Twitch variables the server logs `[twitch] integration disabled` and everything else
keeps working.

## Environment variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `TWITCH_USERNAME` | sent to the client | Channel login name |
| `TWITCH_CLIENT_ID` | sent to the client | Application client id |
| `TWITCH_CLIENT_SECRET` | server only | Application secret |
| `TWITCH_REFRESH_TOKEN` | server only | Seed refresh token from the bootstrap script |
| `TWITCH_BROADCASTER_ID` | server only | Numeric Twitch user id (not the login name) |
| `TWITCH_REFRESH_TOKEN_FILE` | server only | Where the rotated token is persisted (default `.twitch-refresh-token`) |
| `IMGUR_CLIENT_ID` / `IMGUR_CLIENT_SECRET` | server only | Imgur credentials |
| `PORT` | server only | Port for the built SSR server (default 4000) |

Only the username and client id are transferred to the browser (via Angular's `TransferState`).
Secrets stay on the server.

## License

Personal project, no license granted.
