"use client";

import Link from "next/link";

interface PlayButtonProps {
	route: string;
}

const PlayButton = ({ ...props }: PlayButtonProps) => {
	return (
		<Link passHref className="primary-button" href={props.route}>
			<span>Play</span>
		</Link>
	);
};

export default PlayButton;
