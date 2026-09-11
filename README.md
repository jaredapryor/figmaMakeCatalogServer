# Modern Music Catalog API

Express REST API aligned with the Figma Make *Modern Music Catalog* schema. Seeded with 50 artists and 266 albums.

Supports two data backends via `DATA_SOURCE`:

- **`local`** (default) — in-memory JS seeds; resets on restart
- **`supabase`** — persists to Supabase tables `artistsAlt` / `albumsAlt`

## Setup

```bash
cp .env.example .env
npm install
npm start
```

Server: `http://localhost:3001` (see `.env`). CORS allows `http://localhost:5174`.

Copy `.env.example` to `.env` and fill in real values locally. **Never commit secrets** — `.env` is gitignored. `.env.example` only has placeholders.

## Data source

| Variable | Values | Default |
|----------|--------|---------|
| `DATA_SOURCE` | `local` or `supabase` | `local` |

### Local mode

Uses [`data/seedArtists.js`](data/seedArtists.js) and [`data/seedAlbums.js`](data/seedAlbums.js) in memory. No Supabase credentials required.

### Supabase mode

1. Create a Supabase project (if you do not already have one).
2. In the dashboard, open **Project Settings → API Keys** (or the **Connect** dialog) and copy:
   - **Project URL** → `SUPABASE_URL`
   - **Service role** key (legacy `service_role` JWT, or a new `sb_secret_...` secret key) → `SUPABASE_SERVICE_ROLE_KEY`  
   The key already exists when the project is created; you do not create it manually. Either legacy or secret key works (both bypass RLS). Use them **only** in the server `.env`, never in the React app or README.
3. In the Supabase SQL editor, run [`supabase/01_schema.sql`](supabase/01_schema.sql), then [`supabase/02_seed.sql`](supabase/02_seed.sql).
4. Set in `.env`:

```env
DATA_SOURCE=supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-real-key
```

5. Restart the server. Startup fails fast if URL/key are missing.

To regenerate seed SQL after editing the JS seed files:

```bash
node scripts/generate-seed-sql.cjs
```

Then re-run `02_seed.sql` in Supabase.

## Schema

### Artist
```json
{
  "id": "cleo-sterling",
  "name": "Cleo Sterling",
  "photo": "<filename-or-url>",
  "photoSource": "local",
  "flag": "AU",
  "countryCode": "AU",
  "type": "Solo",
  "groupSize": 4,
  "since": 2021
}
```

`type`: `"Solo"` | `"Group"`. `groupSize` only for groups.

### Album
```json
{
  "id": "debut",
  "title": "Debut",
  "artistId": "cleo-sterling",
  "artistName": "Cleo Sterling",
  "artistPhoto": "<from-artist>",
  "artistPhotoSource": "local",
  "label": "Wavefront Music",
  "year": 2021,
  "sold": "85K",
  "tracks": 6,
  "singles": 1,
  "cert": null,
  "streaming": ["SP", "AM"],
  "cover": "<filename-or-url>",
  "coverSource": "local"
}
```

`cert`: `"Gold"` | `"Platinum"` | `"Diamond"` | `null`.  
`streaming`: `"SP"` | `"AM"` | `"AZ"`.  
`photoSource` / `coverSource`: `"local"` | `"remote"` (default `"local"`).  
Local `photo`/`cover` is a bundled filename (or `""` for none). Remote is an http(s) URL.  
`artistName` / `artistPhoto` / `artistPhotoSource` are enriched on GET (not required on POST/PUT).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/artists` | List artists. Optional `?imageSource=all\|local\|remote` (default all) |
| `GET` | `/artists/:id` | Get artist |
| `POST` | `/artists` | Create (`name` + `since` required) |
| `PUT` | `/artists/:id` | Update |
| `DELETE` | `/artists/:id` | Delete + cascade albums |
| `GET` | `/albums` | List albums (enriched). Optional `?imageSource=all\|local\|remote` (default all) |
| `GET` | `/albums/:id` | Get album (enriched) |
| `POST` | `/albums` | Create (`title` + `artistId` + `year` required) |
| `PUT` | `/albums/:id` | Update |
| `DELETE` | `/albums/:id` | Delete |

See [TEST_REQUESTS.md](TEST_REQUESTS.md).

## Companion app

React SPA: `c:\Development\React\musicCatalogApp` (Vite on port 5174). PNG assets are resolved on the client.
