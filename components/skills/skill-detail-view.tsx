"use client";

import { SkillType } from "@/lib/api/skills";
import { Card, CardContent } from "@/components/ui/card";

export function SkillDetailView({ skill }: { skill: SkillType }) {
	return (
		<Card className="gap-0 overflow-hidden rounded-3xl border-slate-100 py-0 shadow-sm">
			{skill.image?.url ? (
				<div className="overflow-hidden border-b border-slate-100">
					<img
						src={skill.image.url}
						alt={skill.title}
						className="h-64 w-full object-cover sm:h-80"
					/>
				</div>
			) : null}

			<CardContent className="p-6 sm:p-8">
				<div
					className={
						"prose prose-slate max-w-none wrap-break-word " +
						"prose-headings:scroll-mt-24 prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline " +
						"prose-img:max-w-full prose-img:h-auto prose-img:rounded-2xl prose-img:shadow-sm " +
						"prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:bg-slate-950 prose-pre:text-slate-50 " +
						"prose-code:wrap-break-word"
					}
					dangerouslySetInnerHTML={{ __html: skill.description }}
				/>
				<div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:flex-wrap sm:items-center">
					<div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
						<span className="text-slate-500">Source</span>
						<span className="wrap-break-word text-slate-700">{skill.source}</span>
					</div>
					<div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
						<span className="text-blue-600">Tags</span>
						<span className="wrap-break-word">{skill.tags}</span>
					</div>
					<div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
						<span className="text-emerald-600">Visibility</span>
						<span>{skill.isPublic ? "Public" : "Private"}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
