"use client";

import * as React from "react";
import { Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
	title: string;
	value: number | string;
	percentage: string;
	icon?: React.ComponentType<{ className?: string }>;
};

export function StatCard({
	title,
	value,
	percentage,
	icon: Icon = Users,
}: StatCardProps) {
	return (
		<Card className="border-none shadow-sm rounded-[1.5rem] bg-white">
			<CardContent className="p-6 flex justify-between items-center">
				<div className="space-y-1">
					<p className="text-sm font-medium text-muted-foreground">{title}</p>
					<h3 className="text-3xl font-bold">{value}</h3>
					<p className="text-xs font-bold text-emerald-500">{percentage}</p>
				</div>
				<div className="bg-slate-50 p-3 rounded-2xl">
					<Icon className="h-6 w-6 text-slate-400" />
				</div>
			</CardContent>
		</Card>
	);
}

