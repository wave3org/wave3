"use client";

import Link from "next/link";
import { parseEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface PlayButtonProps {
	route: string;
}

const PlayButton = ({ ...props }: PlayButtonProps) => {
	const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract({ contractName: "Counter" });

	async function payPerPlay(): Promise<void> {
		try {
			await writeYourContractAsync({
				// TODO: CALL ACTUAL CONTRACT
				functionName: "increment",
				value: parseEther("0.1")
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
