"use client";

import { SkillType } from "@/lib/api/skills";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";

export function SkillCard({ skill }: { skill: SkillType }) {
	const viewHref = `/skills/${skill._id}`;

	return (
		<Link href={viewHref} className="group block h-full">
			<Card className="h-full gap-0 overflow-hidden border-slate-100 py-0 shadow-sm transition-shadow hover:shadow-md">
				<div className="relative aspect-16/11 w-full overflow-hidden">
					<img
						src={skill.image.url || "/placeholder.png"}
						alt=""
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
					<Badge
						className="absolute right-2 top-2 border-none bg-[#EBF5FF] text-[10px] font-bold text-[#3B82F6] shadow-sm"
					>
						{skill.isPublic ? "Public" : "Private"}
					</Badge>
				</div>

				<CardHeader className="gap-1 px-4 pt-4 pb-2">
					<CardDescription className="text-[10px] font-medium text-gray-400">
						{format(new Date(skill.datePosted), "EEEE, MMMM dd, yyyy")}
					</CardDescription>
					<CardTitle className="line-clamp-2 text-[13px] font-bold uppercase tracking-tight text-gray-900 group-hover:text-slate-700">
						{skill.title}
					</CardTitle>
				</CardHeader>

				<CardContent className="px-4 pb-4">
					<div
						className="line-clamp-2 text-[12px] leading-relaxed text-gray-500"
						dangerouslySetInnerHTML={{ __html: skill.description }}
					/>
				</CardContent>
			</Card>
		</Link>
	);
}
