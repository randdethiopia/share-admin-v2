"use client";

import { ClipboardList, UserRound } from "lucide-react";
import { InlineStats } from "@/components/shared/InlineStats";
import type { WaitlistGenderStat } from "@/lib/waitlist-stats";

type Props = {
	total: number;
	genderBreakdown: WaitlistGenderStat[];
	isLoading: boolean;
};

export function AgarMentorWaitlistStats({
	total,
	genderBreakdown,
	isLoading,
}: Props) {
	const displayTotal = isLoading ? "—" : total;

	if (isLoading) {
		return (
			<InlineStats
				items={[
					{ title: "Total", value: displayTotal, icon: ClipboardList },
					{ title: "Female", value: "—", icon: UserRound },
					{ title: "Male", value: "—", icon: UserRound },
				]}
			/>
		);
	}

	if (genderBreakdown.length === 0) {
		return (
			<InlineStats
				items={[
					{ title: "Total", value: displayTotal, icon: ClipboardList },
					{ title: "Gender", value: "—", icon: UserRound },
				]}
			/>
		);
	}

	return (
		<InlineStats
			items={[
				{ title: "Total", value: displayTotal, icon: ClipboardList },
				...genderBreakdown.map((item) => ({
					title: item.label,
					value: item.count,
					icon: UserRound,
				})),
			]}
		/>
	);
}
