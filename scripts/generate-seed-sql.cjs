/**
 * Generates supabase/02_seed.sql from data/seedArtists.js and data/seedAlbums.js
 * Usage: node scripts/generate-seed-sql.cjs
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const artists = require(path.join(root, "data", "seedArtists.js"));
const albums = require(path.join(root, "data", "seedAlbums.js"));

function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlInt(value) {
  if (value === null || value === undefined) return "NULL";
  return String(Number(value));
}

function sqlTextArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "'{}'::text[]";
  const items = arr.map((v) => sqlString(v)).join(", ");
  return `ARRAY[${items}]::text[]`;
}

const lines = [];
lines.push("-- Seed artistsAlt / albumsAlt from server JS seed files");
lines.push("-- Regenerate with: node scripts/generate-seed-sql.cjs");
lines.push("");
lines.push('TRUNCATE TABLE "albumsAlt", "artistsAlt";');
lines.push("");
lines.push(
  'INSERT INTO "artistsAlt" (id, name, photo, photo_source, flag, country_code, type, group_size, since) VALUES'
);

const artistRows = artists.map((a) => {
  const groupSize = a.groupSize != null ? sqlInt(a.groupSize) : "NULL";
  const photoSource = a.photoSource === "remote" ? "remote" : "local";
  return `  (${sqlString(a.id)}, ${sqlString(a.name)}, ${sqlString(a.photo)}, ${sqlString(photoSource)}, ${sqlString(a.flag)}, ${sqlString(a.countryCode)}, ${sqlString(a.type)}, ${groupSize}, ${sqlInt(a.since)})`;
});
lines.push(artistRows.join(",\n") + ";");
lines.push("");
lines.push(
  'INSERT INTO "albumsAlt" (id, title, artist_id, label, year, sold, tracks, singles, cert, streaming, cover, cover_source) VALUES'
);

const albumRows = albums.map((a) => {
  const cert = a.cert == null ? "NULL" : sqlString(a.cert);
  const coverSource = a.coverSource === "remote" ? "remote" : "local";
  return `  (${sqlString(a.id)}, ${sqlString(a.title)}, ${sqlString(a.artistId)}, ${sqlString(a.label)}, ${sqlInt(a.year)}, ${sqlString(a.sold)}, ${sqlInt(a.tracks)}, ${sqlInt(a.singles)}, ${cert}, ${sqlTextArray(a.streaming)}, ${sqlString(a.cover)}, ${sqlString(coverSource)})`;
});
lines.push(albumRows.join(",\n") + ";");
lines.push("");

const outPath = path.join(root, "supabase", "02_seed.sql");
fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${artists.length} artists and ${albums.length} albums to ${outPath}`);
