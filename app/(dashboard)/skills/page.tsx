"use client";

import api from "@/lib/api";
import { SkillCard } from "@/components/skills/skill-card";
import { CardGridSkeleton } from "@/components/shared/page-skeletons";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function SkillsPage() {
	const { data: skills, isLoading } = api.Skills.GetList.useQuery();

	return (
		<div className="min-h-screen bg-background p-4 md:p-8">
			<div className="flex justify-between items-center mb-6 px-4">
				<h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
					Skill
				</h1>
				<Button
					asChild
					className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl px-6 h-10 shadow-sm"
				>
					<Link href="/skills/new">
						<Plus className="w-4 h-4 mr-1" /> New skill
					</Link>
				</Button>
			</div>

			<div className="bg-white rounded-[3rem] p-10 shadow-sm min-h-[80vh]">
				{isLoading ? (
					<CardGridSkeleton count={10} />
				) : skills?.length ? (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{skills.map((item) => (
							<SkillCard key={item._id} skill={item} />
						))}
					</div>
				) : (
					<div className="flex h-64 items-center justify-center text-sm text-gray-500">
						No skill enhancements yet.
					</div>
				)}
			</div>
		</div>
	);
}
