# Modern Music Catalog API

Express REST API aligned with the Figma Make *Modern Music Catalog* schema. Seeded with 30 artists and 116 albums. Data is in-memory and resets on restart.

## Setup

```bash
npm install
npm start
```

Server: `http://localhost:3001` (see `.env`). CORS allows `http://localhost:5174`.

## Schema

### Artist
```json
{
  "id": "cleo-sterling",
  "name": "Cleo Sterling",
  "photo": "<asset-key-or-url>",
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
  "label": "Wavefront Music",
  "year": 2021,
  "sold": "85K",
  "tracks": 6,
  "singles": 1,
  "cert": null,
  "streaming": ["SP", "AM"],
  "cover": "<asset-key-or-url>"
}
```

`cert`: `"Gold"` | `"Platinum"` | `"Diamond"` | `null`.  
`streaming`: `"SP"` | `"AM"` | `"AZ"`.  
`artistName` / `artistPhoto` are enriched on GET (not required on POST/PUT).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/artists` | List artists |
| `GET` | `/artists/:id` | Get artist |
| `POST` | `/artists` | Create (`name` + `since` required) |
| `PUT` | `/artists/:id` | Update |
| `DELETE` | `/artists/:id` | Delete + cascade albums |
| `GET` | `/albums` | List albums (enriched) |
| `GET` | `/albums/:id` | Get album (enriched) |
| `POST` | `/albums` | Create (`title` + `artistId` + `year` required) |
| `PUT` | `/albums/:id` | Update |
| `DELETE` | `/albums/:id` | Delete |

See [TEST_REQUESTS.md](TEST_REQUESTS.md).

## Companion app

React SPA: `c:\Development\React\musicCatalogApp` (Vite on port 5174). PNG assets are resolved on the client.
