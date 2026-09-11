# Test Requests — Modern Music Catalog API

Base URL: `http://localhost:3001`

## Artists

```bash
curl http://localhost:3001/artists

curl "http://localhost:3001/artists?imageSource=local"

curl "http://localhost:3001/artists?imageSource=remote"

curl http://localhost:3001/artists/cleo-sterling

curl -X POST http://localhost:3001/artists ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Band\",\"photo\":\"\",\"photoSource\":\"local\",\"flag\":\"US\",\"countryCode\":\"US\",\"type\":\"Group\",\"groupSize\":3,\"since\":2020}"

curl -X PUT http://localhost:3001/artists/cleo-sterling ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Cleo Sterling\",\"photo\":\"7904cb0025b39f222fadb1ef662026d6f6865817.png\",\"photoSource\":\"local\",\"flag\":\"AU\",\"countryCode\":\"AU\",\"type\":\"Solo\",\"since\":2021}"

curl -X DELETE http://localhost:3001/artists/:id
```

## Albums

```bash
curl http://localhost:3001/albums

curl "http://localhost:3001/albums?imageSource=local"

curl "http://localhost:3001/albums?imageSource=remote"

curl http://localhost:3001/albums/debut

curl -X POST http://localhost:3001/albums ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"New Release\",\"artistId\":\"cleo-sterling\",\"label\":\"Test Label\",\"year\":2024,\"sold\":\"10K\",\"tracks\":10,\"singles\":2,\"cert\":null,\"streaming\":[\"SP\"],\"cover\":\"\",\"coverSource\":\"local\"}"

curl -X PUT http://localhost:3001/albums/debut ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Debut\",\"artistId\":\"cleo-sterling\",\"label\":\"Wavefront Music\",\"year\":2021,\"sold\":\"85K\",\"tracks\":6,\"singles\":1,\"cert\":\"Gold\",\"streaming\":[\"SP\",\"AM\"],\"cover\":\"e2e5a8d68a60105902e16ce4688b4ccf69d6be69.png\",\"coverSource\":\"local\"}"

curl -X DELETE http://localhost:3001/albums/:id
```

## Counts (PowerShell)

```powershell
(Invoke-RestMethod http://localhost:3001/artists).Count
(Invoke-RestMethod "http://localhost:3001/artists?imageSource=local").Count
(Invoke-RestMethod "http://localhost:3001/artists?imageSource=remote").Count
(Invoke-RestMethod http://localhost:3001/albums).Count
(Invoke-RestMethod "http://localhost:3001/albums?imageSource=local").Count
(Invoke-RestMethod "http://localhost:3001/albums?imageSource=remote").Count
```
