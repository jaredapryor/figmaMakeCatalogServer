/**
 * Append 20 remote-photo artists and 150 remote-cover albums from the
 * Unsplash Word docs, then leave JS seeds ready for generate-seed-sql.cjs.
 *
 * Usage: node scripts/expand-remote-seeds.cjs
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "..");
const artistsPath = path.join(root, "data", "seedArtists.js");
const albumsPath = path.join(root, "data", "seedAlbums.js");
const ARTIST_DOC = "c:\\Development\\React\\20_artist_representation_images_v1.docx";
const ALBUM_DOC = "c:\\Development\\React\\50_square_album_cover_images_v2_150_total.docx";

const COUNTRY_CODES = [
  "AU", "AR", "ZA", "RU", "DE", "NO", "JP", "NZ", "SE", "FR",
  "BE", "US", "IN", "BR", "DK", "CA", "NL", "UK", "IE", "MX", "KR", "GH",
];

const SOLO_TEMPLATES = [
  { name: "Amara Quill", label: "Quill Station" },
  { name: "Cassian Vale", label: "Vale Editions" },
  { name: "Juniper Hale", label: "Hale Press" },
  { name: "Niko Harada", label: "Harada Sound" },
  { name: "Selene Okonkwo", label: "Okonkwo Audio" },
  { name: "Theo Marais", label: "Marais Editions" },
  { name: "Anika Berg", label: "Berg Line" },
  { name: "Luca Ferraro", label: "Ferraro Music" },
  { name: "Mei Calderon", label: "Calderon Records" },
  { name: "Rowan Iversen", label: "Iversen Audio" },
];

const GROUP_TEMPLATES = [
  { name: "Ivory Frequency", label: "Ivory Press" },
  { name: "The Copper Orchard", label: "Orchard Label" },
  { name: "Night Market Choir", label: "Night Market Records" },
  { name: "Polar Meridian", label: "Polar Meridian Music" },
  { name: "Redpaper Saints", label: "Redpaper Records" },
  { name: "Hollow Antenna", label: "Antenna Works" },
  { name: "Marble Current", label: "Marble Current" },
  { name: "Silver Voltage", label: "Silver Voltage" },
  { name: "Kite & Ember", label: "Kite Ember" },
  { name: "The Low Archives", label: "Low Archives" },
];

const TITLE_LEFT = [
  "Ashen", "Brass", "Cedar", "Cinder", "Coastal", "Copper", "Distant",
  "Ember", "Faded", "Golden", "Hollow", "Ivory", "Marble", "Midnight",
  "Northern", "Pale", "Polar", "Quiet", "River", "Silent", "Silver",
  "Soft", "Solar", "Stone", "Velvet", "Violet", "Wooden", "Amber",
  "Arctic", "Chromatic", "Coral", "Dusk", "Fern", "Fog", "Granite",
  "Harbor", "Indigo", "Juniper", "Linen", "Moss", "Opal", "Pearl",
  "Quartz", "Rust", "Sage", "Tin", "Umber", "Willow",
];

const TITLE_RIGHT = [
  "Almanac", "Antenna", "Archive", "Bloom", "Chamber", "Compass",
  "Garden", "Harbor", "Hymn", "Lattice", "Meridian", "Mirror",
  "Orchard", "Parade", "Room", "Station", "Suite", "Tide",
  "Transmission", "Waltz", "Window", "Atlas", "Diary", "Etude",
  "Fable", "Gallery", "Journal", "Lantern", "Notebook", "Overture",
  "Postcard", "Reverie", "Sonata", "Threshold", "Vesper", "Sketch",
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function mulberry32(seed) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function shuffle(rng, list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueId(base, used) {
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

function readDocxXml(docxPath) {
  return execFileSync("tar", ["-xOf", docxPath, "word/document.xml"], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

function extractUnsplashImageUrls(xml) {
  const matches = xml.match(/https:\/\/images\.unsplash\.com\/[^<\s"]+/g) || [];
  const seen = new Set();
  const urls = [];
  for (const raw of matches) {
    const url = raw.replace(/&amp;/g, "&").replace(/[.,);]+$/, "");
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
}

function parseArtistPhotos() {
  const urls = extractUnsplashImageUrls(readDocxXml(ARTIST_DOC));
  if (urls.length !== 20) {
    fail(`Expected 20 unique artist image URLs, found ${urls.length}`);
  }
  return { solo: urls.slice(0, 10), group: urls.slice(10, 20) };
}

function parseCoverPhotos() {
  const urls = extractUnsplashImageUrls(readDocxXml(ALBUM_DOC));
  if (urls.length !== 150) {
    fail(`Expected 150 unique album cover URLs, found ${urls.length}`);
  }
  return urls;
}

function randomSold(rng, cert) {
  if (cert === "Diamond") {
    const n = (1 + rng() * 2.4).toFixed(1);
    return `${n}M`;
  }
  if (cert === "Platinum") {
    return `${Math.floor(500 + rng() * 500)}K`;
  }
  if (cert === "Gold") {
    return `${Math.floor(250 + rng() * 400)}K`;
  }
  return `${Math.floor(40 + rng() * 220)}K`;
}

function randomCert(rng) {
  const roll = rng();
  if (roll < 0.55) return null;
  if (roll < 0.82) return "Gold";
  if (roll < 0.96) return "Platinum";
  return "Diamond";
}

function randomStreaming(rng) {
  const platforms = ["SP", "AM", "AZ"];
  const count = 1 + Math.floor(rng() * 3);
  return shuffle(rng, platforms)
    .slice(0, count)
    .sort((a, b) => platforms.indexOf(a) - platforms.indexOf(b));
}

function albumCounts(rng, artistCount, albumCount, minPer, maxPer) {
  const counts = Array(artistCount).fill(minPer);
  let remaining = albumCount - artistCount * minPer;
  while (remaining > 0) {
    const eligible = counts
      .map((count, i) => (count < maxPer ? i : -1))
      .filter((i) => i !== -1);
    if (!eligible.length) {
      fail("Could not distribute albums without exceeding the max per artist");
    }
    counts[pick(rng, eligible)] += 1;
    remaining -= 1;
  }
  return counts;
}

function buildTitles(rng, needed, usedIds, usedTitles) {
  const combos = [];
  for (const left of TITLE_LEFT) {
    for (const right of TITLE_RIGHT) {
      combos.push(`${left} ${right}`);
    }
  }
  const titles = [];
  for (const title of shuffle(rng, combos)) {
    const id = slugify(title);
    if (usedIds.has(id) || usedTitles.has(title)) continue;
    titles.push(title);
    if (titles.length === needed) return titles;
  }
  fail(`Only generated ${titles.length} unique album titles, needed ${needed}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function main() {
  const existingArtists = require(artistsPath);
  const existingAlbums = require(albumsPath);
  const originalArtistCount = existingArtists.length;
  const originalAlbumCount = existingAlbums.length;

  const artistPhotos = parseArtistPhotos();
  const coverPhotos = parseCoverPhotos();

  if (existingArtists.some((a) => artistPhotos.solo.includes(a.photo) || artistPhotos.group.includes(a.photo))) {
    fail("Seed artists already include these remote photos. Refusing to append twice.");
  }
  if (existingAlbums.some((a) => coverPhotos.includes(a.cover))) {
    fail("Seed albums already include these remote covers. Refusing to append twice.");
  }

  const rng = mulberry32(20260911);
  const usedArtistIds = new Set(existingArtists.map((a) => a.id));
  const usedArtistNames = new Set(existingArtists.map((a) => a.name));
  const usedAlbumIds = new Set(existingAlbums.map((a) => a.id));
  const usedAlbumTitles = new Set(existingAlbums.map((a) => a.title));

  const soloPhotos = shuffle(rng, artistPhotos.solo);
  const groupPhotos = shuffle(rng, artistPhotos.group);
  const countries = shuffle(rng, COUNTRY_CODES);

  const newArtists = [];
  const artistMeta = [];

  SOLO_TEMPLATES.forEach((template, i) => {
    assert(!usedArtistNames.has(template.name), `Artist name collision: ${template.name}`);
    const id = uniqueId(slugify(template.name), usedArtistIds);
    const countryCode = countries[i];
    const since = 2004 + Math.floor(rng() * 18);
    const artist = {
      id,
      name: template.name,
      photo: soloPhotos[i],
      photoSource: "remote",
      flag: countryCode,
      countryCode,
      type: "Solo",
      since,
    };
    newArtists.push(artist);
    artistMeta.push({ ...artist, label: template.label });
  });

  GROUP_TEMPLATES.forEach((template, i) => {
    assert(!usedArtistNames.has(template.name), `Artist name collision: ${template.name}`);
    const id = uniqueId(slugify(template.name), usedArtistIds);
    const countryCode = countries[10 + i];
    const since = 2003 + Math.floor(rng() * 19);
    const artist = {
      id,
      name: template.name,
      photo: groupPhotos[i],
      photoSource: "remote",
      flag: countryCode,
      countryCode,
      type: "Group",
      since,
      groupSize: 2 + Math.floor(rng() * 6),
    };
    newArtists.push(artist);
    artistMeta.push({ ...artist, label: template.label });
  });

  const counts = albumCounts(rng, newArtists.length, 150, 4, 10);
  const titles = buildTitles(rng, 150, usedAlbumIds, usedAlbumTitles);
  const covers = shuffle(rng, coverPhotos);
  const assignment = [];
  counts.forEach((count, artistIndex) => {
    for (let i = 0; i < count; i++) assignment.push(artistIndex);
  });
  const shuffledAssignment = shuffle(rng, assignment);

  const newAlbums = titles.map((title, i) => {
    const artist = artistMeta[shuffledAssignment[i]];
    const tracks = 6 + Math.floor(rng() * 8);
    const singles = Math.min(tracks, Math.floor(rng() * 5));
    const cert = randomCert(rng);
    const yearSpan = Math.max(0, 2026 - artist.since);
    const year = artist.since + Math.floor(rng() * (yearSpan + 1));
    const id = uniqueId(slugify(title), usedAlbumIds);
    return {
      id,
      title,
      artistId: artist.id,
      label: artist.label,
      year,
      sold: randomSold(rng, cert),
      tracks,
      singles,
      cert,
      streaming: randomStreaming(rng),
      cover: covers[i],
      coverSource: "remote",
    };
  });

  const allArtists = [...existingArtists, ...newArtists];
  const allAlbums = [...existingAlbums, ...newAlbums];

  const newArtistIds = new Set(newArtists.map((a) => a.id));
  const perArtist = {};
  for (const id of newArtistIds) perArtist[id] = 0;
  for (const album of newAlbums) {
    assert(newArtistIds.has(album.artistId), `Album ${album.id} is not assigned to a new artist`);
    perArtist[album.artistId] += 1;
  }

  assert(newArtists.length === 20, `Expected 20 new artists, got ${newArtists.length}`);
  assert(newAlbums.length === 150, `Expected 150 new albums, got ${newAlbums.length}`);
  assert(newArtists.filter((a) => a.type === "Solo").length === 10, "Expected 10 new Solo artists");
  assert(newArtists.filter((a) => a.type === "Group").length === 10, "Expected 10 new Group artists");
  assert(newArtists.every((a) => a.photoSource === "remote"), "Every new artist must have photoSource remote");
  assert(newAlbums.every((a) => a.coverSource === "remote"), "Every new album must have coverSource remote");
  assert(new Set(newArtists.map((a) => a.photo)).size === 20, "New artist photos must be unique");
  assert(new Set(newAlbums.map((a) => a.cover)).size === 150, "New album covers must be unique");
  assert(
    newArtists.filter((a) => a.type === "Solo").every((a) => artistPhotos.solo.includes(a.photo)),
    "Solo artists must use Solo photos"
  );
  assert(
    newArtists.filter((a) => a.type === "Group").every((a) => artistPhotos.group.includes(a.photo)),
    "Group artists must use Group photos"
  );
  assert(
    artistPhotos.solo.every((url) => newArtists.some((a) => a.photo === url)),
    "All Solo photos must be used"
  );
  assert(
    artistPhotos.group.every((url) => newArtists.some((a) => a.photo === url)),
    "All Group photos must be used"
  );
  assert(
    coverPhotos.every((url) => newAlbums.some((a) => a.cover === url)),
    "All 150 cover photos must be used"
  );
  assert(
    Object.values(perArtist).every((n) => n >= 4 && n <= 10),
    `Album counts out of range: ${JSON.stringify(perArtist)}`
  );
  assert(
    Object.values(perArtist).reduce((sum, n) => sum + n, 0) === 150,
    "New albums must sum to 150"
  );
  assert(allArtists.length === originalArtistCount + 20, "Artist total must increase by 20");
  assert(allAlbums.length === originalAlbumCount + 150, "Album total must increase by 150");
  assert(
    new Set(allArtists.map((a) => a.id)).size === allArtists.length,
    "Artist ids must stay unique"
  );
  assert(
    new Set(allAlbums.map((a) => a.id)).size === allAlbums.length,
    "Album ids must stay unique"
  );
  assert(
    newAlbums.every((album) => {
      const artist = artistMeta.find((a) => a.id === album.artistId);
      return album.year >= artist.since && album.year <= 2026;
    }),
    "Album years must be between artist.since and 2026"
  );
  assert(
    newAlbums.every((album) => album.singles <= album.tracks),
    "Singles cannot exceed tracks"
  );

  fs.writeFileSync(artistsPath, `module.exports = ${JSON.stringify(allArtists, null, 2)};\n`);
  fs.writeFileSync(albumsPath, `module.exports = ${JSON.stringify(allAlbums, null, 2)};\n`);

  console.log(`Wrote ${allArtists.length} artists (+${newArtists.length}) to ${artistsPath}`);
  console.log(`Wrote ${allAlbums.length} albums (+${newAlbums.length}) to ${albumsPath}`);
  console.log("New artist album counts:");
  for (const artist of newArtists) {
    console.log(`  ${artist.id} (${artist.type}): ${perArtist[artist.id]} albums`);
  }
}

main();
