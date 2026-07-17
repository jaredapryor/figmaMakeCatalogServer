// Modern Music Catalog REST API — seeded from figmaMakeCatalogApp

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const seedArtists = require("./data/seedArtists");
const seedAlbums = require("./data/seedAlbums");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// In-memory store (deep-cloned from seed; resets on restart)
let artists = structuredClone(seedArtists);
let albums = structuredClone(seedAlbums);

const ARTIST_TYPES = new Set(["solo", "group"]);
const CERTIFICATIONS = new Set(["none", "gold", "platinum", "multi-platinum"]);
const STREAMING_PLATFORMS = new Set(["spotify", "apple", "amazon"]);

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function findArtistIndex(id) {
  return artists.findIndex((a) => a.id === id);
}

function findAlbumIndex(id) {
  return albums.findIndex((a) => a.id === id);
}

function validateArtistBody(body, { requireAll = true } = {}) {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object";
  }

  const { name, country, countryFlag, countryCode, photoUrl, type, memberCount, activeSince } =
    body;

  if (requireAll || name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return "name is required and must be a non-empty string";
    }
  }
  if (requireAll || country !== undefined) {
    if (typeof country !== "string") return "country must be a string";
  }
  if (requireAll || countryFlag !== undefined) {
    if (typeof countryFlag !== "string") return "countryFlag must be a string";
  }
  if (requireAll || countryCode !== undefined) {
    if (typeof countryCode !== "string") return "countryCode must be a string";
  }
  if (requireAll || photoUrl !== undefined) {
    if (typeof photoUrl !== "string") return "photoUrl must be a string";
  }
  if (requireAll || type !== undefined) {
    if (!ARTIST_TYPES.has(type)) return 'type must be "solo" or "group"';
  }
  if (requireAll || activeSince !== undefined) {
    if (typeof activeSince !== "number" || !Number.isFinite(activeSince)) {
      return "activeSince must be a number (year)";
    }
  }
  if (memberCount !== undefined && memberCount !== null) {
    if (typeof memberCount !== "number" || !Number.isFinite(memberCount)) {
      return "memberCount must be a number";
    }
  }
  if ((type === "group" || (!requireAll && body.type === undefined)) && type === "group") {
    // ok — memberCount optional even for groups
  }

  return null;
}

function validateAlbumBody(body, { requireAll = true } = {}) {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object";
  }

  const {
    artistId,
    title,
    coverUrl,
    label,
    releaseYear,
    trackCount,
    singleCount,
    albumsSold,
    certification,
    streaming,
  } = body;

  if (requireAll || title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      return "title is required and must be a non-empty string";
    }
  }
  if (requireAll || artistId !== undefined) {
    if (typeof artistId !== "string" || !artistId.trim()) {
      return "artistId is required and must be a non-empty string";
    }
  }
  if (requireAll || coverUrl !== undefined) {
    if (typeof coverUrl !== "string") return "coverUrl must be a string";
  }
  if (requireAll || label !== undefined) {
    if (typeof label !== "string") return "label must be a string";
  }
  if (requireAll || releaseYear !== undefined) {
    if (typeof releaseYear !== "number" || !Number.isFinite(releaseYear)) {
      return "releaseYear must be a number";
    }
  }
  if (requireAll || trackCount !== undefined) {
    if (typeof trackCount !== "number" || !Number.isFinite(trackCount)) {
      return "trackCount must be a number";
    }
  }
  if (requireAll || singleCount !== undefined) {
    if (typeof singleCount !== "number" || !Number.isFinite(singleCount)) {
      return "singleCount must be a number";
    }
  }
  if (requireAll || albumsSold !== undefined) {
    if (typeof albumsSold !== "number" || !Number.isFinite(albumsSold)) {
      return "albumsSold must be a number";
    }
  }
  if (requireAll || certification !== undefined) {
    if (!CERTIFICATIONS.has(certification)) {
      return 'certification must be "none", "gold", "platinum", or "multi-platinum"';
    }
  }
  if (requireAll || streaming !== undefined) {
    if (!Array.isArray(streaming)) return "streaming must be an array";
    for (const p of streaming) {
      if (!STREAMING_PLATFORMS.has(p)) {
        return 'streaming values must be "spotify", "apple", or "amazon"';
      }
    }
  }

  return null;
}

function buildArtist(body, id) {
  const artist = {
    id,
    name: String(body.name).trim(),
    country: body.country ?? "",
    countryFlag: body.countryFlag ?? "",
    countryCode: body.countryCode ?? "",
    photoUrl: body.photoUrl ?? "",
    type: body.type,
    activeSince: body.activeSince,
  };
  if (body.type === "group" && body.memberCount != null) {
    artist.memberCount = body.memberCount;
  }
  return artist;
}

function buildAlbum(body, id) {
  return {
    id,
    artistId: body.artistId,
    title: String(body.title).trim(),
    coverUrl: body.coverUrl ?? "",
    label: body.label ?? "",
    releaseYear: body.releaseYear,
    trackCount: body.trackCount ?? 0,
    singleCount: body.singleCount ?? 0,
    albumsSold: body.albumsSold ?? 0,
    certification: body.certification ?? "none",
    streaming: Array.isArray(body.streaming) ? [...body.streaming] : [],
  };
}

// ─── Artists ─────────────────────────────────────────────────────────────────

app.get("/artists", (_req, res) => {
  res.json(artists);
});

app.get("/artists/:id", (req, res) => {
  const artist = artists.find((a) => a.id === req.params.id);
  if (!artist) {
    return res.status(404).json({ message: `Artist not found: ${req.params.id}` });
  }
  res.json(artist);
});

app.post("/artists", (req, res) => {
  const error = validateArtistBody(req.body, { requireAll: true });
  if (error) return res.status(400).json({ message: error });

  const name = String(req.body.name).trim();
  if (artists.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
    return res.status(409).json({ message: `Artist already exists: ${name}` });
  }

  const artist = buildArtist(req.body, genId());
  artists.push(artist);
  res.status(201).json({
    message: "Artist created",
    creationType: "artist",
    created: true,
    artist,
  });
});

app.put("/artists/:id", (req, res) => {
  const index = findArtistIndex(req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: `Artist not found: ${req.params.id}` });
  }

  const error = validateArtistBody(req.body, { requireAll: true });
  if (error) return res.status(400).json({ message: error });

  const name = String(req.body.name).trim();
  if (
    artists.some(
      (a) => a.id !== req.params.id && a.name.toLowerCase() === name.toLowerCase()
    )
  ) {
    return res.status(409).json({ message: `Artist already exists: ${name}` });
  }

  const artist = buildArtist(req.body, req.params.id);
  artists[index] = artist;
  res.json({
    message: "Artist updated",
    updateType: "artist",
    updated: true,
    artist,
  });
});

app.delete("/artists/:id", (req, res) => {
  const index = findArtistIndex(req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: `Artist not found: ${req.params.id}` });
  }

  const [artist] = artists.splice(index, 1);
  const removedAlbums = albums.filter((al) => al.artistId === artist.id);
  albums = albums.filter((al) => al.artistId !== artist.id);

  res.json({
    message: "Artist deleted",
    deletionType: "artist",
    deleted: true,
    artist,
    deletedAlbumCount: removedAlbums.length,
  });
});

// ─── Albums ──────────────────────────────────────────────────────────────────

app.get("/albums", (_req, res) => {
  res.json(albums);
});

app.get("/albums/:id", (req, res) => {
  const album = albums.find((a) => a.id === req.params.id);
  if (!album) {
    return res.status(404).json({ message: `Album not found: ${req.params.id}` });
  }
  res.json(album);
});

app.post("/albums", (req, res) => {
  const error = validateAlbumBody(req.body, { requireAll: true });
  if (error) return res.status(400).json({ message: error });

  if (findArtistIndex(req.body.artistId) === -1) {
    return res.status(404).json({ message: `Artist not found: ${req.body.artistId}` });
  }

  const title = String(req.body.title).trim();
  if (
    albums.some(
      (a) =>
        a.artistId === req.body.artistId && a.title.toLowerCase() === title.toLowerCase()
    )
  ) {
    return res
      .status(409)
      .json({ message: `Album already exists for this artist: ${title}` });
  }

  const album = buildAlbum(req.body, genId());
  albums.push(album);
  res.status(201).json({
    message: "Album created",
    creationType: "album",
    created: true,
    album,
  });
});

app.put("/albums/:id", (req, res) => {
  const index = findAlbumIndex(req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: `Album not found: ${req.params.id}` });
  }

  const error = validateAlbumBody(req.body, { requireAll: true });
  if (error) return res.status(400).json({ message: error });

  if (findArtistIndex(req.body.artistId) === -1) {
    return res.status(404).json({ message: `Artist not found: ${req.body.artistId}` });
  }

  const title = String(req.body.title).trim();
  if (
    albums.some(
      (a) =>
        a.id !== req.params.id &&
        a.artistId === req.body.artistId &&
        a.title.toLowerCase() === title.toLowerCase()
    )
  ) {
    return res
      .status(409)
      .json({ message: `Album already exists for this artist: ${title}` });
  }

  const album = buildAlbum(req.body, req.params.id);
  albums[index] = album;
  res.json({
    message: "Album updated",
    updateType: "album",
    updated: true,
    album,
  });
});

app.delete("/albums/:id", (req, res) => {
  const index = findAlbumIndex(req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: `Album not found: ${req.params.id}` });
  }

  const [album] = albums.splice(index, 1);
  res.json({
    message: "Album deleted",
    deletionType: "album",
    deleted: true,
    album,
  });
});

app.listen(PORT, () => {
  console.log(
    `Modern Music Catalog API running on ${process.env.SERVER_URL || "http://localhost"}:${PORT}`
  );
  console.log(`Seeded ${artists.length} artists and ${albums.length} albums`);
});
