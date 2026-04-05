"use client";

import Link from "next/link";
import type { NextPage } from "next";
import Logo from "~~/components/Logo";
import "~~/styles/login-page.css";

const LoginPage: NextPage = () => {
	return (
		<div className="greetings-container">
			<div className="greetings-content">
				<div className="title">
					<Logo />
				</div>
				<div className="greetings-subtitle">
					<span>The new era of music is yours</span>
				</div>
				<div className="greetings-description">
					<span>
						Listen without limits, invest in your favorite artists, and earn royalties. All on the blockchain.
					</span>
				</div>
				<div className="login-button-container">
					<Link href="/home" passHref className="primary-button ">
						<span>Connect Wallet</span>
					</Link>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
