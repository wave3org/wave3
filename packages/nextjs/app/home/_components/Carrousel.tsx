"use client";

import Song from "~~/components/Song";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import "~~/styles/home-page.css";

interface CarrouselProps {
	title: string;
	songIds: readonly bigint[];
}

const Carrousel = ({ ...props }: CarrouselProps) => {
	const { data: songMetadataResponse, isLoading: isLoading } = useScaffoldReadContract({
		contractName: "SongsPresenter",
		functionName: "getSongs",
		args: [props.songIds]
	});

	const renderSongs = () => {
		const songs = [];

		if (songMetadataResponse) {
			for (const songMetadata of songMetadataResponse.songs) {
				songs.push(
					<div className="song-container" key={songMetadata.id}>
						<Song songMetadata={songMetadata} />
					</div>
				);
			}
		}

		return <>{songs}</>;
	};

	const renderContent = () => {
		if (songMetadataResponse) {
			return renderSongs();
		} else {
			return <span>Nothing to show here...</span>;
		}
	};

	return (
		<>
			<div className="subtitle">
				<span>{props.title}</span>
			</div>
			<div className="carrousel">
				{isLoading ? <span className="loading loading-spinner"></span> : <>{renderContent()}</>}
			</div>
		</>
	);
};

export default Carrousel;
