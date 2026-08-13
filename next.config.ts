import type { NextConfig } from "next";

/** Upstream API for `/api-proxy/*` rewrites (avoids browser CORS preflight to :5000 when using custom headers). */
const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:5000").replace(
	/\/$/,
	""
);

function buildRemotePatterns() {
	const candidates = [
		process.env.NEXT_PUBLIC_BASE_URL,
		process.env.BACKEND_URL,
	].filter(Boolean) as string[];

	const seen = new Set<string>();

	return candidates.flatMap((raw) => {
		try {
			const { protocol, hostname, port } = new URL(raw);
			const key = `${protocol}//${hostname}${port ? `:${port}` : ""}`;
			if (seen.has(key)) return [];
			seen.add(key);

			return [
				{
					protocol: protocol.replace(":", "") as "http" | "https",
					hostname,
					...(port ? { port } : {}),
					pathname: "/**",
				},
			];
		} catch {
			return [];
		}
	});
}

const nextConfig: NextConfig = {
	images: {
		remotePatterns: buildRemotePatterns(),
	},
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
