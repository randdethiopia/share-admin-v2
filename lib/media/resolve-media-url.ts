import type { ProjectType } from "@/lib/api/project";

function getMediaBaseUrl(): string {
	return process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";
}

export function resolveMediaUrl(
	rawUrl: string | null | undefined,
): string | null {
	if (!rawUrl?.trim()) return null;

	try {
		return new URL(rawUrl).href;
	} catch {
		const base = getMediaBaseUrl();
		if (!base) return null;
		return new URL(rawUrl, `${base}/`).href;
	}
}

export function getProjectCoverImage(
	project: Pick<ProjectType, "projectGallery">,
): string | null {
	return resolveMediaUrl(project.projectGallery?.[0]?.url);
}
