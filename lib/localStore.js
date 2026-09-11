const seedArtists = require("../data/seedArtists");
const seedAlbums = require("../data/seedAlbums");
const { albumToApi, imageSource } = require("./mappers");

function createLocalStore() {
  let artists = structuredClone(seedArtists);
  let albums = structuredClone(seedAlbums);

  function findArtist(id) {
    return artists.find((a) => a.id === id) || null;
  }

  function enrichAlbum(album) {
    const artist = findArtist(album.artistId);
    return albumToApi(
      {
        ...album,
        artist_id: album.artistId,
      },
      artist
    );
  }

  return {
    async getArtists({ imageSource: filter } = {}) {
      const rows = filter
        ? artists.filter((a) => imageSource(a.photoSource) === filter)
        : artists;
      return rows.map((a) => ({ ...a }));
    },

    async getArtist(id) {
      const artist = findArtist(id);
      return artist ? { ...artist } : null;
    },

    async createArtist(artist) {
      artists.push(artist);
      return { ...artist };
    },

    async updateArtist(id, artist) {
      const index = artists.findIndex((a) => a.id === id);
      if (index === -1) return null;
      artists[index] = artist;
      return { ...artist };
    },

    async deleteArtist(id) {
      const index = artists.findIndex((a) => a.id === id);
      if (index === -1) return null;
      const [artist] = artists.splice(index, 1);
      const removed = albums.filter((al) => al.artistId === artist.id);
      albums = albums.filter((al) => al.artistId !== artist.id);
      return { artist: { ...artist }, deletedAlbumCount: removed.length };
    },

    async getAlbums({ imageSource: filter } = {}) {
      const rows = filter
        ? albums.filter((a) => imageSource(a.coverSource) === filter)
        : albums;
      return rows.map(enrichAlbum);
    },

    async getAlbum(id) {
      const album = albums.find((a) => a.id === id);
      return album ? enrichAlbum(album) : null;
    },

    async createAlbum(album) {
      albums.push(album);
      return enrichAlbum(album);
    },

    async updateAlbum(id, album) {
      const index = albums.findIndex((a) => a.id === id);
      if (index === -1) return null;
      albums[index] = album;
      return enrichAlbum(album);
    },

    async deleteAlbum(id) {
      const index = albums.findIndex((a) => a.id === id);
      if (index === -1) return null;
      const [album] = albums.splice(index, 1);
      return enrichAlbum(album);
    },

    async counts() {
      return { artists: artists.length, albums: albums.length };
    },
  };
}

module.exports = { createLocalStore };
