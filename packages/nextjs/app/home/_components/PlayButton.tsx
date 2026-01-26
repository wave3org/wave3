"use client";

import Link from "next/link";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface PlayButtonProps {
	route: string;
}

const PlayButton = ({ ...props }: PlayButtonProps) => {
	const { writeContractAsync: writeWavecoinAsync } = useScaffoldWriteContract({ contractName: "Wavecoin" });

	async function payPerPlay(): Promise<void> {
		try {
			await writeWavecoinAsync({
				functionName: "mint",
				args: [1n]
			});
		} catch (e) {
			console.error("Error incrementing counter:", e);
		}
	}

	return (
		<Link passHref className="primary-button" href={props.route} onClick={() => payPerPlay()}>
			<span>Play</span>
		</Link>
	);
};

export default PlayButton;
