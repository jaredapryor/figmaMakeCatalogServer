function imageSource(value) {
  return value === "remote" ? "remote" : "local";
}

function artistToApi(row) {
  if (!row) return null;
  const artist = {
    id: row.id,
    name: row.name,
    photo: row.photo ?? "",
    photoSource: imageSource(row.photo_source ?? row.photoSource),
    flag: row.flag ?? "",
    countryCode: row.country_code ?? row.countryCode ?? "US",
    type: row.type === "Group" ? "Group" : "Solo",
    since: row.since,
  };
  const groupSize = row.group_size ?? row.groupSize;
  if (artist.type === "Group" && groupSize != null) {
    artist.groupSize = groupSize;
  }
  return artist;
}

function albumToApi(row, artist = null) {
  if (!row) return null;
  const album = {
    id: row.id,
    title: row.title,
    artistId: row.artist_id ?? row.artistId,
    label: row.label ?? "",
    year: row.year,
    sold: row.sold ?? "0",
    tracks: row.tracks ?? 10,
    singles: row.singles ?? 0,
    cert: row.cert === undefined ? null : row.cert,
    streaming: Array.isArray(row.streaming) ? [...row.streaming] : [],
    cover: row.cover ?? "",
    coverSource: imageSource(row.cover_source ?? row.coverSource),
  };

  if (artist) {
    album.artistName = artist.name ?? "";
    album.artistPhoto = artist.photo ?? "";
    album.artistPhotoSource = imageSource(artist.photoSource ?? artist.photo_source);
  } else if (row.artistName !== undefined || row.artistPhoto !== undefined) {
    album.artistName = row.artistName ?? "";
    album.artistPhoto = row.artistPhoto ?? "";
    album.artistPhotoSource = imageSource(row.artistPhotoSource);
  }

  return album;
}

function artistToRow(artist) {
  return {
    id: artist.id,
    name: artist.name,
    photo: artist.photo ?? "",
    photo_source: imageSource(artist.photoSource),
    flag: artist.flag ?? "",
    country_code: artist.countryCode ?? "US",
    type: artist.type === "Group" ? "Group" : "Solo",
    group_size: artist.type === "Group" && artist.groupSize != null ? artist.groupSize : null,
    since: artist.since,
  };
}

function albumToRow(album) {
  return {
    id: album.id,
    title: album.title,
    artist_id: album.artistId,
    label: album.label ?? "",
    year: album.year,
    sold: album.sold ?? "0",
    tracks: album.tracks ?? 10,
    singles: album.singles ?? 0,
    cert: album.cert === undefined ? null : album.cert,
    streaming: Array.isArray(album.streaming) ? [...album.streaming] : [],
    cover: album.cover ?? "",
    cover_source: imageSource(album.coverSource),
  };
}

module.exports = {
  artistToApi,
  albumToApi,
  artistToRow,
  albumToRow,
};
