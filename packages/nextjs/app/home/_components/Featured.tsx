"use client";

import Image from "next/image";
import Link from "next/link";
import PlayButton from "../../../components/PlayButton";
import { getFileUrl } from "~~/services/files/fileService";
import "~~/styles/home-page.css";
import { SongMetadata } from "~~/types/songMetadata";
import { SearchBy } from "~~/types/songSearchSpec";

interface FeaturedProps {
	songMetadata: SongMetadata | null;
}

const Featured = ({ ...props }: FeaturedProps) => {
	const songMetadata = props.songMetadata;
	const renderFeatured = () => {
		if (songMetadata && typeof songMetadata !== "string" && songMetadata.album) {
			return (
				<div className="featured-container">
					<Link href={`/search?q=${songMetadata.name}&by=${SearchBy.Song}`}>
						<Image
							key={songMetadata.id}
							src={getFileUrl(songMetadata.album.imageCID)}
							width={230}
							height={230}
							alt={songMetadata.album.name}
						/>
					</Link>
					<div className="featured-description">
						<span>
							Featured Release:{" "}
							<Link href={`/search?q=${songMetadata.name}&by=${SearchBy.Song}`}>{songMetadata.name}</Link> by{" "}
							<Link href={`/search?q=${songMetadata.album.artist}&by=${SearchBy.Artist}`}>
								{songMetadata.album.artist}
							</Link>
						</span>
						<div className="featured-controls">
							<PlayButton songMetadata={songMetadata} />
						</div>
					</div>
				</div>
			);
		} else {
			return <></>;
		}
	};

	return renderFeatured();
};

export default Featured;
