import { ImageMetadata } from "./imageMetadata";

export type SongMetadata = {
  id: string;
  image: ImageMetadata;
  url: string;
  title: string;
  artist: string;
};
