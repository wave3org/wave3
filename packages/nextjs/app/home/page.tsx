"use client";

import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";
import { parseEther } from "viem/utils";
import Carrousel from "~~/components/Carrousel";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { fetchSongsMetadata } from "~~/services/songs/songService";
import "~~/styles/home-page.css";
import { SongMetadata } from "~~/types/songMetadata";

const fetchNewReleases = (): SongMetadata[] => {
  return fetchSongsMetadata();
};

const fetchTrending = (): SongMetadata[] => {
  return fetchSongsMetadata();
};

const RenderSong = ({ songMetadata }: { songMetadata: SongMetadata }) => {
  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract({ contractName: "Counter" });
  const songUrl: string = "/song/" + songMetadata.id;

  return (
    <div className="song-container" key={songMetadata.id}>
      <div className="song-card">
        <div className="song-thumbnail">
          <Image
            key={songMetadata.image.alt}
            src={songMetadata.image.src}
            width={songMetadata.image.width}
            height={songMetadata.image.height}
            alt={songMetadata.image.alt}
          />
        </div>
        <div className="song-info">
          <span className="song-title">{songMetadata.title}</span>
          <span className="song-artist">{songMetadata.artist}</span>
        </div>
        <div className="song-controls">
          <Link
            key={songMetadata.artist + songMetadata.title}
            passHref
            className="play-button"
            href={songUrl}
            onClick={async () => {
              try {
                await writeYourContractAsync({
                  // TODO: CALL ACTUAL CONTRACT
                  functionName: "increment",
                  value: parseEther("0.1"),
                });
              } catch (e) {
                console.error("Error setting greeting:", e);
              }
            }}
          >
            <span>Play</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

const renderSongs = (songsMetadata: SongMetadata[]) => {
  const songs = [];

  for (const songMetadata of songsMetadata) {
    songs.push(<RenderSong key={songMetadata.id} songMetadata={songMetadata} />);
  }

  return <>{songs}</>;
};

const renderNewReleases = () => {
  return renderSongs(fetchNewReleases());
};

const renderTrending = () => {
  return renderSongs(fetchTrending());
};

const Home: NextPage = () => {
  const newReleases = renderNewReleases();
  const trending = renderTrending();

  return (
    <>
      <div className="carrousel-container">
        <Carrousel title="New Releases">{newReleases}</Carrousel>
      </div>
      <div className="carrousel-container">
        <Carrousel title="Trending on wave3">{trending}</Carrousel>
      </div>
    </>
  );
};

export default Home;
