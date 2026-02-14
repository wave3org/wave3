CREATE INDEX IF NOT EXISTS songs_name_trgm_idx ON wave3.songs USING GIN (name gin_trgm_ops);
