"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { CreateTraineeForm } from "./create-trainee-form";

export function CreateTraineeModal() {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const handleCreated = () => {
		queryClient.invalidateQueries({ queryKey: ["Trainee"] });
		setOpen(false);
	};

	return (
		<>
			<Button
				className="bg-[#10B981] hover:bg-emerald-600 rounded-xl px-6 font-bold"
				onClick={() => setOpen(true)}
			>
				Create
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-xl font-bold text-slate-900">
							Create New Trainee
						</DialogTitle>
						<DialogDescription>Create a trainee profile</DialogDescription>
					</DialogHeader>
					<CreateTraineeForm onCreated={handleCreated} onCancel={() => setOpen(false)} />
				</DialogContent>
			</Dialog>
		</>
	);
}
