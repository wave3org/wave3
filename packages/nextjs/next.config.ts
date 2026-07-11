import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	devIndicators: false,
	typescript: {
		ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true"
	},
	eslint: {
		ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true"
	},
	webpack: config => {
		config.resolve.fallback = { fs: false, net: false, tls: false };
		config.externals.push("pino-pretty", "lokijs", "encoding");
		return config;
	},
	images: {
		remotePatterns: [
			{
				protocol: "http",
				hostname: "localhost",
				port: "8080",
				search: ""
			},
			{
				protocol: "http",
				hostname: "127.0.0.1",
				port: "8080",
				search: ""
			},
			{
				protocol: "http",
				hostname: "localhost",
				port: "3001",
				search: ""
			},
			{
				protocol: "https",
				hostname: "coral-accurate-peacock-411.mypinata.cloud",
				port: "",
				search: ""
			},
			{
				protocol: "https",
				hostname: "ipfs.io",
				port: "",
				search: ""
			},
			{
				protocol: "https",
				hostname: "dweb.link",
				port: "",
				search: ""
			}
		]
	}
};

const isIpfs = process.env.NEXT_PUBLIC_IPFS_BUILD === "true";
const isDocker = process.env.DOCKER_BUILD === "true";

if (isIpfs) {
	nextConfig.output = "export";
	nextConfig.trailingSlash = true;
	nextConfig.images = {
		unoptimized: true
	};
} else if (isDocker) {
	nextConfig.output = "standalone";
}

module.exports = nextConfig;
