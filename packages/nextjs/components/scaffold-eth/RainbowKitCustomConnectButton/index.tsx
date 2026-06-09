"use client";

// @refresh reset
import { useEffect, useState } from "react";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { RevealBurnerPKModal } from "./RevealBurnerPKModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Balance } from "@scaffold-ui/components";
import { useBalance } from "@scaffold-ui/hooks";
import { Address, formatUnits } from "viem";
import { mainnet } from "viem/chains";
import { useAccount, useConfig } from "wagmi";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";
import { fetchBalance } from "~~/services/wavecoin/wavecoinService";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

/**
 * Custom Wagmi Connect Button (watch balance + custom design)
 */
export const RainbowKitCustomConnectButton = () => {
	const networkColor = useNetworkColor();
	const { targetNetwork } = useTargetNetwork();
	const { address } = useAccount();
	const { globalIsStartingPlayback } = useGlobalState();
	const [wavecoinBalance, setWavecoinBalance] = useState<bigint | null>(0n);
	const { chains: configuredChains } = useConfig();
	const chainToUse = configuredChains[0] ? configuredChains[0] : mainnet;
	const { balance } = useBalance({ address, chain: chainToUse, defaultUsdMode: false });

	useEffect(() => {
		const updateWavecoinBalance = async () => {
			if (address) {
				setWavecoinBalance(await fetchBalance(address));
			}
		};
		updateWavecoinBalance();
	}, [address, globalIsStartingPlayback, balance]);

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
												<span>{wavecoinBalance ? `${formatUnits(wavecoinBalance, 18)}` : "0"}</span>
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
