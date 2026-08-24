-- Drop and recreate artistsAlt / albumsAlt for Modern Music Catalog
-- Run this in the Supabase SQL editor before 02_seed.sql

DROP TABLE IF EXISTS "albumsAlt";
DROP TABLE IF EXISTS "artistsAlt";

CREATE TABLE "artistsAlt" (
  id text PRIMARY KEY,
  name text NOT NULL,
  photo text NOT NULL DEFAULT '',
  photo_source text NOT NULL DEFAULT 'local' CHECK (photo_source IN ('local', 'remote')),
  flag text NOT NULL DEFAULT '',
  country_code text NOT NULL DEFAULT 'US',
  type text NOT NULL CHECK (type IN ('Solo', 'Group')),
  group_size integer NULL,
  since integer NOT NULL
);

CREATE TABLE "albumsAlt" (
  id text PRIMARY KEY,
  title text NOT NULL,
  artist_id text NOT NULL REFERENCES "artistsAlt"(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT '',
  year integer NOT NULL,
  sold text NOT NULL DEFAULT '0',
  tracks integer NOT NULL DEFAULT 10,
  singles integer NOT NULL DEFAULT 0,
  cert text NULL CHECK (cert IS NULL OR cert IN ('Gold', 'Platinum', 'Diamond')),
  streaming text[] NOT NULL DEFAULT '{}',
  cover text NOT NULL DEFAULT '',
  cover_source text NOT NULL DEFAULT 'local' CHECK (cover_source IN ('local', 'remote'))
);

CREATE INDEX albums_alt_artist_id_idx ON "albumsAlt"(artist_id);
