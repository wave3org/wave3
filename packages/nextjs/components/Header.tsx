"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { JSX } from "react/jsx-runtime";
import { hardhat } from "viem/chains";
import { BugAntIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { ChainWithAttributes } from "~~/utils/scaffold-eth/networks";

type HeaderMenuLink = {
	label: string;
	href: string;
	icon?: React.ReactNode;
};

const menuLinks: HeaderMenuLink[] = [
	// TODO: searchbar
	{
		label: "Discover",
		href: "/discover"
	},
	{
		label: "Playlists",
		href: "/playlists"
	},
	{
		label: "Marketplace",
		href: "/marketplace"
	},
	{
		label: "Portfolio",
		href: "/portfolio"
	},
	// TODO: REMOVE FOR PROD
	{
		label: "Debug Contracts",
		href: "/debug",
		icon: <BugAntIcon className="h-4 w-4" />
	}
];

const renderHomeLink = () => {
	return (
		<div key="/home" className="logo-container">
			<Link href="/home" passHref>
				<Logo />
			</Link>
		</div>
	);
};

const renderMenuLinks = () => {
	const headerMenuLinks = [];

	for (const headerMenuLinkData of menuLinks) {
		headerMenuLinks.push(RenderMenuLink(headerMenuLinkData));
	}
	return <div className="navbar-container">{headerMenuLinks}</div>;
};

const RenderMenuLink = (headerMenuLinksData: HeaderMenuLink) => {
	const pathname: string = usePathname();
	const isActive: boolean = pathname === headerMenuLinksData.href;
	let className: string = "navbar-link";

	if (isActive) {
		className += " navbar-link-active";
	}

	return (
		<Link key={headerMenuLinksData.href} href={headerMenuLinksData.href} passHref className={className}>
			{headerMenuLinksData.icon}
			<span className="navbar-link-text">{headerMenuLinksData.label}</span>
		</Link>
	);
};

const renderWalletButton = () => {
	return (
		<div className="wallet-container">
			<RainbowKitCustomConnectButton />
		</div>
	);
};

// TODO: REMOVE FOR PRODUCTION
const RenderFaucetButton = () => {
	const targetNetwork: ChainWithAttributes = useTargetNetwork().targetNetwork;
	const isLocalNetwork: boolean = targetNetwork.id === hardhat.id;
	let faucetButton: JSX.Element;

	if (isLocalNetwork) {
		faucetButton = (
			<div className="wallet-container">
				<FaucetButton />
			</div>
		);
	} else {
		faucetButton = <></>;
	}

	return faucetButton;
};

// TODO: BURGUER MENU
const Header = () => {
	return (
		<div className="header-container">
			{renderHomeLink()}
			{renderMenuLinks()}
			{renderWalletButton()}
			{RenderFaucetButton()}
		</div>
	);
};

export default Header;
