# Modern Music Catalog API

Express REST API seeded with the same 30 artists and 118 albums used by the Figma Make *Modern Music Catalog* UI. Data is held in memory and resets when the server restarts.

## Setup

```bash
npm install
npm start
```

Server listens on `http://localhost:3001` by default (see `.env`).

CORS is configured for `http://localhost:5174` (the companion React app).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/artists` | List all artists |
| `GET` | `/artists/:id` | Get one artist |
| `POST` | `/artists` | Create artist |
| `PUT` | `/artists/:id` | Update artist |
| `DELETE` | `/artists/:id` | Delete artist (cascades albums) |
| `GET` | `/albums` | List all albums |
| `GET` | `/albums/:id` | Get one album |
| `POST` | `/albums` | Create album |
| `PUT` | `/albums/:id` | Update album (can reparent via `artistId`) |
| `DELETE` | `/albums/:id` | Delete album |

See [TEST_REQUESTS.md](TEST_REQUESTS.md) for curl examples.

## Companion app

React SPA: `c:\Development\React\musicCatalogApp` (Vite on port 5174).
