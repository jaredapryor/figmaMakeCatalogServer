// Modern Music Catalog REST API — Figma-aligned schema

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

let artists = structuredClone(seedArtists);
let albums = structuredClone(seedAlbums);

const ARTIST_TYPES = new Set(["Solo", "Group"]);
const CERTS = new Set(["Gold", "Platinum", "Diamond"]);
const STREAMING = new Set(["SP", "AM", "AZ"]);

function genId(name) {
  if (typeof name === "string" && name.trim()) {
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (slug) return `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return Math.random().toString(36).slice(2, 10);
}

function findArtistIndex(id) {
  return artists.findIndex((a) => a.id === id);
}

function findAlbumIndex(id) {
  return albums.findIndex((a) => a.id === id);
}

function findArtist(id) {
  return artists.find((a) => a.id === id) || null;
}

function enrichAlbum(album) {
  const artist = findArtist(album.artistId);
  return {
    ...album,
    artistName: artist ? artist.name : "",
    artistPhoto: artist ? artist.photo : "",
  };
}

function validateArtistBody(body, { requireAll = false } = {}) {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object";
  }

  if (requireAll || body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return "name is required and must be a non-empty string";
    }
  }
  if (requireAll || body.since !== undefined) {
    if (typeof body.since !== "number" || !Number.isFinite(body.since)) {
      return "since is required and must be a number (year)";
    }
  }
  if (body.type !== undefined && !ARTIST_TYPES.has(body.type)) {
    return 'type must be "Solo" or "Group"';
  }
  if (body.countryCode !== undefined && typeof body.countryCode !== "string") {
    return "countryCode must be a string";
  }
  if (body.photo !== undefined && typeof body.photo !== "string") {
    return "photo must be a string";
  }
  if (body.flag !== undefined && typeof body.flag !== "string") {
    return "flag must be a string";
  }
  if (body.groupSize !== undefined && body.groupSize !== null) {
    if (typeof body.groupSize !== "number" || !Number.isFinite(body.groupSize)) {
      return "groupSize must be a number";
    }
  }
  return null;
}

function validateAlbumBody(body, { requireAll = false } = {}) {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object";
  }

  if (requireAll || body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return "title is required and must be a non-empty string";
    }
  }
  if (requireAll || body.artistId !== undefined) {
    if (typeof body.artistId !== "string" || !body.artistId.trim()) {
      return "artistId is required and must be a non-empty string";
    }
  }
  if (requireAll || body.year !== undefined) {
    if (typeof body.year !== "number" || !Number.isFinite(body.year)) {
      return "year is required and must be a number";
    }
  }
  if (body.label !== undefined && typeof body.label !== "string") {
    return "label must be a string";
  }
  if (body.sold !== undefined && typeof body.sold !== "string") {
    return "sold must be a string";
  }
  if (body.tracks !== undefined && (typeof body.tracks !== "number" || !Number.isFinite(body.tracks))) {
    return "tracks must be a number";
  }
  if (body.singles !== undefined && (typeof body.singles !== "number" || !Number.isFinite(body.singles))) {
    return "singles must be a number";
  }
  if (body.cert !== undefined && body.cert !== null && !CERTS.has(body.cert)) {
    return 'cert must be "Gold", "Platinum", "Diamond", or null';
  }
  if (body.streaming !== undefined) {
    if (!Array.isArray(body.streaming)) return "streaming must be an array";
    for (const p of body.streaming) {
      if (!STREAMING.has(p)) return 'streaming values must be "SP", "AM", or "AZ"';
    }
  }
  if (body.cover !== undefined && typeof body.cover !== "string") {
    return "cover must be a string";
  }
  return null;
}

function buildArtist(body, id) {
  const type = body.type === "Group" ? "Group" : "Solo";
  const artist = {
    id,
    name: String(body.name).trim(),
    photo: typeof body.photo === "string" ? body.photo : "",
    flag: typeof body.flag === "string" ? body.flag : body.countryCode || "",
    countryCode: typeof body.countryCode === "string" ? body.countryCode : "US",
    type,
    since: body.since,
  };
  if (type === "Group" && body.groupSize != null) {
    artist.groupSize = body.groupSize;
  }
  return artist;
}

function buildAlbum(body, id) {
  return {
    id,
    title: String(body.title).trim(),
    artistId: body.artistId,
    label: typeof body.label === "string" ? body.label : "",
    year: body.year,
    sold: typeof body.sold === "string" ? body.sold : "0",
    tracks: typeof body.tracks === "number" ? body.tracks : 10,
    singles: typeof body.singles === "number" ? body.singles : 0,
    cert: body.cert === undefined ? null : body.cert,
    streaming: Array.isArray(body.streaming) ? [...body.streaming] : [],
    cover: typeof body.cover === "string" ? body.cover : "",
  };
}

// ─── Artists ─────────────────────────────────────────────────────────────────

app.get("/artists", (_req, res) => {
  res.json(artists);
});

app.get("/artists/:id", (req, res) => {
  const artist = findArtist(req.params.id);
  if (!artist) {
    return res.status(404).json({ message: `Artist not found: ${req.params.id}` });
  }
  res.json(artist);
});

app.post("/artists", (req, res) => {
  const error = validateArtistBody(req.body, { requireAll: true });
  if (error) return res.status(400).json({ message: error });

  const artist = buildArtist(req.body, genId(req.body.name));
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
  const removed = albums.filter((al) => al.artistId === artist.id);
  albums = albums.filter((al) => al.artistId !== artist.id);

  res.json({
    message: "Artist deleted",
    deletionType: "artist",
    deleted: true,
    artist,
    deletedAlbumCount: removed.length,
  });
});

// ─── Albums ──────────────────────────────────────────────────────────────────

app.get("/albums", (_req, res) => {
  res.json(albums.map(enrichAlbum));
});

app.get("/albums/:id", (req, res) => {
  const album = albums.find((a) => a.id === req.params.id);
  if (!album) {
    return res.status(404).json({ message: `Album not found: ${req.params.id}` });
  }
  res.json(enrichAlbum(album));
});

app.post("/albums", (req, res) => {
  const error = validateAlbumBody(req.body, { requireAll: true });
  if (error) return res.status(400).json({ message: error });

  if (!findArtist(req.body.artistId)) {
    return res.status(404).json({ message: `Artist not found: ${req.body.artistId}` });
  }

  const album = buildAlbum(req.body, genId(req.body.title));
  albums.push(album);
  res.status(201).json({
    message: "Album created",
    creationType: "album",
    created: true,
    album: enrichAlbum(album),
  });
});

app.put("/albums/:id", (req, res) => {
  const index = findAlbumIndex(req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: `Album not found: ${req.params.id}` });
  }

  const error = validateAlbumBody(req.body, { requireAll: true });
  if (error) return res.status(400).json({ message: error });

  if (!findArtist(req.body.artistId)) {
    return res.status(404).json({ message: `Artist not found: ${req.body.artistId}` });
  }

  const album = buildAlbum(req.body, req.params.id);
  albums[index] = album;
  res.json({
    message: "Album updated",
    updateType: "album",
    updated: true,
    album: enrichAlbum(album),
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
    album: enrichAlbum(album),
  });
});

app.listen(PORT, () => {
  console.log(
    `Modern Music Catalog API running on ${process.env.SERVER_URL || "http://localhost"}:${PORT}`
  );
  console.log(`Seeded ${artists.length} artists and ${albums.length} albums`);
});
