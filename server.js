// Modern Music Catalog REST API — Figma-aligned schema

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createDataStore } = require("./lib/dataStore");

const app = express();
const PORT = process.env.PORT || 3001;

const { store, source: dataSource } = createDataStore();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

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
  const photoSourceError = validateImageSource(body.photoSource, body.photo, "photoSource", "photo");
  if (photoSourceError) return photoSourceError;
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
  const coverSourceError = validateImageSource(body.coverSource, body.cover, "coverSource", "cover");
  if (coverSourceError) return coverSourceError;
  return null;
}

function validateImageSource(source, value, sourceField, valueField) {
  if (source === undefined) return null;
  if (source !== "local" && source !== "remote") {
    return `${sourceField} must be "local" or "remote"`;
  }
  if (source === "remote" && typeof value === "string" && value.trim()) {
    if (!/^https?:\/\//i.test(value.trim())) {
      return `${valueField} must be an http(s) URL when ${sourceField} is "remote"`;
    }
  }
  return null;
}

function buildArtist(body, id) {
  const type = body.type === "Group" ? "Group" : "Solo";
  const artist = {
    id,
    name: String(body.name).trim(),
    photo: typeof body.photo === "string" ? body.photo : "",
    photoSource: body.photoSource === "remote" ? "remote" : "local",
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
    coverSource: body.coverSource === "remote" ? "remote" : "local",
  };
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function parseImageSourceQuery(req) {
  const raw = req.query.imageSource;
  if (raw === undefined || raw === "") return { value: undefined };
  const value = String(Array.isArray(raw) ? raw[0] : raw).toLowerCase().trim();
  if (value === "all") return { value: undefined };
  if (value === "local" || value === "remote") return { value };
  return { error: 'imageSource must be "all", "local", or "remote"' };
}

// ─── Artists ─────────────────────────────────────────────────────────────────

app.get(
  "/artists",
  asyncHandler(async (req, res) => {
    const parsed = parseImageSourceQuery(req);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    res.json(await store.getArtists({ imageSource: parsed.value }));
  })
);

app.get(
  "/artists/:id",
  asyncHandler(async (req, res) => {
    const artist = await store.getArtist(req.params.id);
    if (!artist) {
      return res.status(404).json({ message: `Artist not found: ${req.params.id}` });
    }
    res.json(artist);
  })
);

app.post(
  "/artists",
  asyncHandler(async (req, res) => {
    const error = validateArtistBody(req.body, { requireAll: true });
    if (error) return res.status(400).json({ message: error });

    const artist = await store.createArtist(buildArtist(req.body, genId(req.body.name)));
    res.status(201).json({
      message: "Artist created",
      creationType: "artist",
      created: true,
      artist,
    });
  })
);

app.put(
  "/artists/:id",
  asyncHandler(async (req, res) => {
    const error = validateArtistBody(req.body, { requireAll: true });
    if (error) return res.status(400).json({ message: error });

    const artist = await store.updateArtist(req.params.id, buildArtist(req.body, req.params.id));
    if (!artist) {
      return res.status(404).json({ message: `Artist not found: ${req.params.id}` });
    }

    res.json({
      message: "Artist updated",
      updateType: "artist",
      updated: true,
      artist,
    });
  })
);

app.delete(
  "/artists/:id",
  asyncHandler(async (req, res) => {
    const result = await store.deleteArtist(req.params.id);
    if (!result) {
      return res.status(404).json({ message: `Artist not found: ${req.params.id}` });
    }

    res.json({
      message: "Artist deleted",
      deletionType: "artist",
      deleted: true,
      artist: result.artist,
      deletedAlbumCount: result.deletedAlbumCount,
    });
  })
);

// ─── Albums ──────────────────────────────────────────────────────────────────

app.get(
  "/albums",
  asyncHandler(async (req, res) => {
    const parsed = parseImageSourceQuery(req);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    res.json(await store.getAlbums({ imageSource: parsed.value }));
  })
);

app.get(
  "/albums/:id",
  asyncHandler(async (req, res) => {
    const album = await store.getAlbum(req.params.id);
    if (!album) {
      return res.status(404).json({ message: `Album not found: ${req.params.id}` });
    }
    res.json(album);
  })
);

app.post(
  "/albums",
  asyncHandler(async (req, res) => {
    const error = validateAlbumBody(req.body, { requireAll: true });
    if (error) return res.status(400).json({ message: error });

    if (!(await store.getArtist(req.body.artistId))) {
      return res.status(404).json({ message: `Artist not found: ${req.body.artistId}` });
    }

    const album = await store.createAlbum(buildAlbum(req.body, genId(req.body.title)));
    res.status(201).json({
      message: "Album created",
      creationType: "album",
      created: true,
      album,
    });
  })
);

app.put(
  "/albums/:id",
  asyncHandler(async (req, res) => {
    const error = validateAlbumBody(req.body, { requireAll: true });
    if (error) return res.status(400).json({ message: error });

    if (!(await store.getArtist(req.body.artistId))) {
      return res.status(404).json({ message: `Artist not found: ${req.body.artistId}` });
    }

    const album = await store.updateAlbum(req.params.id, buildAlbum(req.body, req.params.id));
    if (!album) {
      return res.status(404).json({ message: `Album not found: ${req.params.id}` });
    }

    res.json({
      message: "Album updated",
      updateType: "album",
      updated: true,
      album,
    });
  })
);

app.delete(
  "/albums/:id",
  asyncHandler(async (req, res) => {
    const album = await store.deleteAlbum(req.params.id);
    if (!album) {
      return res.status(404).json({ message: `Album not found: ${req.params.id}` });
    }

    res.json({
      message: "Album deleted",
      deletionType: "album",
      deleted: true,
      album,
    });
  })
);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    message: err.message || "Internal server error",
  });
});

async function start() {
  const counts = await store.counts();
  app.listen(PORT, () => {
    console.log(
      `Modern Music Catalog API running on ${process.env.SERVER_URL || "http://localhost"}:${PORT}`
    );
    console.log(`DATA_SOURCE=${dataSource} — ${counts.artists} artists, ${counts.albums} albums`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message || err);
  process.exit(1);
});
