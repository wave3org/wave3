CREATE INDEX IF NOT EXISTS songs_name_trgm_idx ON wave3.songs USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS song_plays_block_timestamp_idx ON wave3.song_plays (block_timestamp);
CREATE INDEX IF NOT EXISTS royalty_distributions_block_timestamp_idx ON wave3.royalty_distributions (block_timestamp);
