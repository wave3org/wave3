"use client";

import Image from "next/image";
import PlayButton from "../../../components/PlayButton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { getFileUrl } from "~~/services/files/fileService";
import "~~/styles/home-page.css";

interface FeaturedProps {
	songId: number;
}

const Featured = ({ ...props }: FeaturedProps) => {
	const { data: songMetadata, isLoading: isLoading } = useScaffoldReadContract({
		contractName: "SongsPresenter",
		functionName: "getSong",
		args: [props.songId]
	});

	const renderFeatured = () => {
		if (songMetadata) {
			return (
				<div>
					<div className="featured-container">
						<Image
							key={songMetadata.id}
							src={getFileUrl(songMetadata.album.imageCID)}
							width={230}
							height={230}
							alt={songMetadata.album.name}
						/>
						<div className="featured-description">
							<span>
								Featured Release: {songMetadata.name} by {songMetadata.album.artist}
							</span>
							<div className="featured-controls">
								<PlayButton songMetadata={songMetadata} />
							</div>
						</div>
					</div>
				</div>
			);
		} else {
			return <></>;
		}
	};

	return (
		<>
			<div>{isLoading ? <span className="loading loading-spinner"></span> : <>{renderFeatured()}</>}</div>
		</>
	);
};

export default Featured;
