"use client";

import { type ReactNode, useState } from "react";
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

interface CreateTraineeModalProps {
	renderTrigger?: (openDialog: () => void) => ReactNode;
}

export function CreateTraineeModal({ renderTrigger }: CreateTraineeModalProps = {}) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const handleCreated = () => {
		queryClient.invalidateQueries({ queryKey: ["Trainee"] });
		setOpen(false);
	};

	return (
		<>
			{renderTrigger ? (
				renderTrigger(() => setOpen(true))
			) : (
				<Button
					className="bg-[#69B34C] hover:bg-emerald-600 rounded-xl px-6 font-bold"
					onClick={() => setOpen(true)}
				>
					Add Trainee
				</Button>
			)}

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
