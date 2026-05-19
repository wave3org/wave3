"use client";

// @refresh reset
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { RevealBurnerPKModal } from "./RevealBurnerPKModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Balance } from "@scaffold-ui/components";
import { Address, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useNetworkColor, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

/**
 * Custom Wagmi Connect Button (watch balance + custom design)
 */
export const RainbowKitCustomConnectButton = () => {
	const networkColor = useNetworkColor();
	const { targetNetwork } = useTargetNetwork();
	const { address } = useAccount();
	const { data: wavecoinbalance } = useScaffoldReadContract({
		contractName: "Wavecoin",
		functionName: "balanceOf",
		args: [address],
		query: { enabled: Boolean(address) }
	});

	return (
		<ConnectButton.Custom>
			{({ account, chain, openConnectModal, mounted }) => {
				const connected = mounted && account && chain;
				const blockExplorerAddressLink = account
					? getBlockExplorerAddressLink(targetNetwork, account.address)
					: undefined;

				return (
					<>
						{(() => {
							if (!connected) {
								return (
									<button className="btn btn-primary btn-sm" onClick={openConnectModal} type="button">
										Connect Wallet
									</button>
								);
							}

							if (chain.unsupported || chain.id !== targetNetwork.id) {
								return <WrongNetworkDropdown />;
							}

							return (
								<>
									<div className="flex flex-col items-center mr-2">
										<div className="flex flex-row gap-2">
											<div className="flex items-center text-[0.8em]">
												<span>{wavecoinbalance ? `${formatUnits(wavecoinbalance, 18)}` : "0"}</span>
												<span className="text-xs font-bold ml-1">WAVE</span>
											</div>
											<Balance
												address={account.address as Address}
												style={{
													minHeight: "0",
													height: "auto",
													fontSize: "0.8em"
												}}
											/>
										</div>
										<span className="text-xs" style={{ color: networkColor }}>
											{chain.name}
										</span>
									</div>
									<AddressInfoDropdown
										address={account.address as Address}
										displayName={account.displayName}
										ensAvatar={account.ensAvatar}
										blockExplorerAddressLink={blockExplorerAddressLink}
									/>
									<AddressQRCodeModal address={account.address as Address} modalId="qrcode-modal" />
									<RevealBurnerPKModal />
								</>
							);
						})()}
					</>
				);
			}}
		</ConnectButton.Custom>
	);
};
