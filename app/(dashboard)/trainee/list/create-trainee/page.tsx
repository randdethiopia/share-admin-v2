"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { CreateTraineeForm } from "../../components/create-trainee-form";

export default function CreateTraineePage() {
	const router = useRouter();
	const queryClient = useQueryClient();

	const handleCreated = () => {
		queryClient.invalidateQueries({ queryKey: ["Trainee"] });
		router.push("/trainee/list");
	};

	return (
		<div className="min-h-screen bg-[#E2EDF8] p-4 sm:p-6 md:p-8">
			<div className="max-w-4xl mx-auto space-y-6">
				<div className="space-y-1">
					<h1 className="text-2xl md:text-[28px] font-bold text-black tracking-tight">
						Create New Trainee
					</h1>
					<p className="text-zinc-600 text-sm font-medium">
						Create a trainee profile
					</p>
				</div>

				<div className="bg-white rounded-3xl md:rounded-[2.5rem] p-5 sm:p-8 md:p-10 shadow-sm border border-blue-50">
					<CreateTraineeForm
						onCreated={handleCreated}
						onCancel={() => router.push("/trainee/list")}
					/>
				</div>
			</div>
		</div>
	);
}
