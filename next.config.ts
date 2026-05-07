import type { NextConfig } from "next";

/** Upstream API for `/api-proxy/*` rewrites (avoids browser CORS preflight to :5000 when using custom headers). */
const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:5000").replace(
	/\/$/,
	""
);

const nextConfig: NextConfig = {
	async rewrites() {
		return [
			{
				source: "/api-proxy/:path*",
				destination: `${backendUrl}/:path*`,
			},
		];
	},
};

export default nextConfig;
