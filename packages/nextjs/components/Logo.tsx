"use client";

import Image from "next/image";

const Logo = () => {
	return (
		<div className="logo-container">
			<div className="logo-image-container">
				<Image alt="wave3 logo" className="cursor-pointer" fill sizes="(max-width: 32px) 100vw" src="/wave3-logo.png" />
			</div>
			<div className="logo-text-container">
				<span>wave3</span>
			</div>
		</div>
	);
};

export default Logo;
