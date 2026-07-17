const { createClient } = require("@supabase/supabase-js");
const {
  artistToApi,
  albumToApi,
  artistToRow,
  albumToRow,
} = require("./mappers");

const ARTISTS_TABLE = "artistsAlt";
const ALBUMS_TABLE = "albumsAlt";

function createSupabaseStore({ url, serviceRoleKey }) {
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function fetchArtistMap(ids) {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) return new Map();

    const { data, error } = await supabase
      .from(ARTISTS_TABLE)
      .select("*")
      .in("id", unique);

    if (error) throw error;
    const map = new Map();
    for (const row of data || []) {
      map.set(row.id, artistToApi(row));
    }
    return map;
  }

  async function enrichAlbums(rows) {
    const artistMap = await fetchArtistMap(rows.map((r) => r.artist_id));
    return rows.map((row) => albumToApi(row, artistMap.get(row.artist_id) || null));
  }

  return {
    async getArtists() {
      const { data, error } = await supabase.from(ARTISTS_TABLE).select("*").order("name");
      if (error) throw error;
      return (data || []).map(artistToApi);
    },

    async getArtist(id) {
      const { data, error } = await supabase
        .from(ARTISTS_TABLE)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return artistToApi(data);
    },

    async createArtist(artist) {
      const { data, error } = await supabase
        .from(ARTISTS_TABLE)
        .insert(artistToRow(artist))
        .select("*")
        .single();
      if (error) throw error;
      return artistToApi(data);
    },

    async updateArtist(id, artist) {
      const existing = await this.getArtist(id);
      if (!existing) return null;

      const { data, error } = await supabase
        .from(ARTISTS_TABLE)
        .update(artistToRow({ ...artist, id }))
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return artistToApi(data);
    },

    async deleteArtist(id) {
      const artist = await this.getArtist(id);
      if (!artist) return null;

      const { count, error: countError } = await supabase
        .from(ALBUMS_TABLE)
        .select("*", { count: "exact", head: true })
        .eq("artist_id", id);
      if (countError) throw countError;

      const { error } = await supabase.from(ARTISTS_TABLE).delete().eq("id", id);
      if (error) throw error;

      return { artist, deletedAlbumCount: count ?? 0 };
    },

    async getAlbums() {
      const { data, error } = await supabase.from(ALBUMS_TABLE).select("*").order("title");
      if (error) throw error;
      return enrichAlbums(data || []);
    },

    async getAlbum(id) {
      const { data, error } = await supabase
        .from(ALBUMS_TABLE)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [enriched] = await enrichAlbums([data]);
      return enriched;
    },

    async createAlbum(album) {
      const { data, error } = await supabase
        .from(ALBUMS_TABLE)
        .insert(albumToRow(album))
        .select("*")
        .single();
      if (error) throw error;
      const [enriched] = await enrichAlbums([data]);
      return enriched;
    },

    async updateAlbum(id, album) {
      const existing = await this.getAlbum(id);
      if (!existing) return null;

      const { data, error } = await supabase
        .from(ALBUMS_TABLE)
        .update(albumToRow({ ...album, id }))
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      const [enriched] = await enrichAlbums([data]);
      return enriched;
    },

    async deleteAlbum(id) {
      const album = await this.getAlbum(id);
      if (!album) return null;

      const { error } = await supabase.from(ALBUMS_TABLE).delete().eq("id", id);
      if (error) throw error;
      return album;
    },

    async counts() {
      const [artistsRes, albumsRes] = await Promise.all([
        supabase.from(ARTISTS_TABLE).select("*", { count: "exact", head: true }),
        supabase.from(ALBUMS_TABLE).select("*", { count: "exact", head: true }),
      ]);
      if (artistsRes.error) throw artistsRes.error;
      if (albumsRes.error) throw albumsRes.error;
      return { artists: artistsRes.count ?? 0, albums: albumsRes.count ?? 0 };
    },
  };
}

module.exports = { createSupabaseStore };
