"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { FolderKanban } from "lucide-react";

import type { BusinessProfileProject } from "@/lib/api";
import { getProjectCoverImage } from "@/lib/media/resolve-media-url";
import { cn } from "@/lib/utils";

type ProjectImageProps = {
	project: BusinessProfileProject;
	className?: string;
};

function ProjectImagePlaceholder({ alt }: { alt: string }) {
	return (
		<div
			className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50"
			role="img"
			aria-label={alt}
		>
			<FolderKanban className="h-10 w-10 text-slate-400" />
		</div>
	);
}

export function ProjectImage({ project, className }: ProjectImageProps) {
	const [imageError, setImageError] = useState(false);
	const coverUrl = useMemo(() => getProjectCoverImage(project), [project]);
	const alt = project.projectName?.trim() || "Project cover image";

	if (!coverUrl || imageError) {
		return (
			<div
				className={cn(
					"relative aspect-video w-full overflow-hidden rounded-xl",
					className,
				)}
			>
				<ProjectImagePlaceholder alt={alt} />
			</div>
		);
	}

	return (
		<div
			className={cn(
				"relative aspect-video w-full overflow-hidden rounded-xl bg-muted",
				className,
			)}
		>
			<Image
				src={coverUrl}
				alt={alt}
				fill
				className="object-cover"
				sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
				onError={() => setImageError(true)}
			/>
		</div>
	);
}
