"use client";

import PlayableSong from "~~/components/PlayableSong";
import "~~/styles/home-page.css";
import { SongMetadata } from "~~/types/songMetadata";

interface CarrouselProps {
	title: string;
	songsMetadata: SongMetadata[] | null;
}

const Carrousel = ({ ...props }: CarrouselProps) => {
	const title: string = props.title;
	const songsMetadata: SongMetadata[] | null = props.songsMetadata;

	const renderSongs = () => {
		const songs = [];

		if (songsMetadata) {
			for (const songMetadata of songsMetadata) {
				songs.push(
					<div className="carrousel-song-container" key={songMetadata.id}>
						<PlayableSong songMetadata={songMetadata} />
					</div>
				);
			}
		}

		return <>{songs}</>;
	};

	// TODO: IMPROVE EMPTY MESSAGE
	const renderContent = () => {
		if (songsMetadata && songsMetadata.length != 0) {
			return renderSongs();
		} else {
			return <span>Nothing to show here...</span>;
		}
	};

	return (
		<>
			<div className="subtitle">
				<span>{title}</span>
			</div>
			<div className="carrousel-container">{renderContent()}</div>
		</>
	);
};

export default Carrousel;
