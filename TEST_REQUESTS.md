# Test Requests — Modern Music Catalog API

Base URL: `http://localhost:3001`

## Artists

```bash
# List all artists
curl http://localhost:3001/artists

# Get one artist
curl http://localhost:3001/artists/a1

# Create artist
curl -X POST http://localhost:3001/artists ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Band\",\"country\":\"United States\",\"countryFlag\":\"🇺🇸\",\"countryCode\":\"us\",\"photoUrl\":\"\",\"type\":\"group\",\"memberCount\":3,\"activeSince\":2020}"

# Update artist (replace :id)
curl -X PUT http://localhost:3001/artists/:id ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Band Updated\",\"country\":\"United States\",\"countryFlag\":\"🇺🇸\",\"countryCode\":\"us\",\"photoUrl\":\"\",\"type\":\"group\",\"memberCount\":4,\"activeSince\":2020}"

# Delete artist (cascades albums)
curl -X DELETE http://localhost:3001/artists/:id
```

## Albums

```bash
# List all albums
curl http://localhost:3001/albums

# Get one album
curl http://localhost:3001/albums/al1

# Create album
curl -X POST http://localhost:3001/albums ^
  -H "Content-Type: application/json" ^
  -d "{\"artistId\":\"a1\",\"title\":\"New Release\",\"coverUrl\":\"\",\"label\":\"Test Label\",\"releaseYear\":2024,\"trackCount\":10,\"singleCount\":2,\"albumsSold\":1000,\"certification\":\"none\",\"streaming\":[\"spotify\"]}"

# Update album / reparent (replace :id)
curl -X PUT http://localhost:3001/albums/:id ^
  -H "Content-Type: application/json" ^
  -d "{\"artistId\":\"a2\",\"title\":\"New Release\",\"coverUrl\":\"\",\"label\":\"Test Label\",\"releaseYear\":2024,\"trackCount\":10,\"singleCount\":2,\"albumsSold\":1000,\"certification\":\"gold\",\"streaming\":[\"spotify\",\"apple\"]}"

# Delete album
curl -X DELETE http://localhost:3001/albums/:id
```

## Counts (PowerShell)

```powershell
(Invoke-RestMethod http://localhost:3001/artists).Count
(Invoke-RestMethod http://localhost:3001/albums).Count
```
