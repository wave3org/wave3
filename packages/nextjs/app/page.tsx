"use client";

import Link from "next/link";
import type { NextPage } from "next";
import Logo from "~~/components/Logo";

const LoginPage: NextPage = () => {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-base-200 gap-6 px-4 text-center">
			<Logo />
			<h1 className="text-4xl font-bold text-base-content">The new era of music is yours</h1>
			<p className="max-w-sm text-base-content/60 text-sm">
				Listen without limits, invest in your favorite artists, and earn royalties. All on the blockchain.
			</p>
			<Link href="/home" className="btn btn-primary btn-lg">
				Connect Wallet
			</Link>
		</div>
	);
};

export default LoginPage;
