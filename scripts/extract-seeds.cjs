const fs = require("fs");

const src = fs.readFileSync(
  "c:/Development/React/figmaMakeCatalogApp/src/app/App.tsx",
  "utf8"
);

// Build map: imgVarName -> filename (without path)
const importMap = {};
const importRe =
  /import\s+(img\w+)\s+from\s+"@\/imports\/(?:Artists|Albums)\/([a-f0-9]+\.png)"/g;
let m;
while ((m = importRe.exec(src)) !== null) {
  importMap[m[1]] = m[2];
}

const artistsMatch = src.match(
  /const INITIAL_ARTISTS: Artist\[\] = (\[[\s\S]*?\]);/
);
const albumsMatch = src.match(
  /const INITIAL_ALBUMS: Album\[\] = (\[[\s\S]*?\]);/
);
if (!artistsMatch || !albumsMatch) {
  console.error("Failed to find seed arrays");
  process.exit(1);
}

function replaceImgRefs(block) {
  return block.replace(/img\w+/g, (name) => {
    if (!importMap[name]) {
      throw new Error("Unknown import: " + name);
    }
    return JSON.stringify(importMap[name]);
  });
}

const artists = eval(replaceImgRefs(artistsMatch[1]));
const albums = eval(replaceImgRefs(albumsMatch[1]));

const seedArtists = artists.map((a) => {
  const out = {
    id: a.id,
    name: a.name,
    photo: a.photo, // png filename
    flag: a.countryCode, // resolve by country code on client
    countryCode: a.countryCode,
    type: a.type,
    since: a.since,
  };
  if (a.type === "Group" && a.groupSize != null) out.groupSize = a.groupSize;
  return out;
});

const seedAlbums = albums.map((al) => ({
  id: al.id,
  title: al.title,
  artistId: al.artistId,
  label: al.label,
  year: al.year,
  sold: al.sold,
  tracks: al.tracks,
  singles: al.singles,
  cert: al.cert,
  streaming: [...al.streaming],
  cover: al.cover, // png filename
}));

const outDir = "c:/Development/Express/figmaMakeCatalogServer/data";
fs.writeFileSync(
  `${outDir}/seedArtists.js`,
  "module.exports = " + JSON.stringify(seedArtists, null, 2) + ";\n"
);
fs.writeFileSync(
  `${outDir}/seedAlbums.js`,
  "module.exports = " + JSON.stringify(seedAlbums, null, 2) + ";\n"
);

console.log("artists", seedArtists.length, "albums", seedAlbums.length);
console.log("artist0", seedArtists[0]);
console.log("album0", seedAlbums[0]);
console.log("shared cover check", seedAlbums.filter((a) => a.cover === seedAlbums.find((x) => x.id === "dark-matter").cover).map((a) => a.id));
