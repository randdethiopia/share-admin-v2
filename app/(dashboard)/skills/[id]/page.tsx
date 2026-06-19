"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { SkillDetailView } from "@/components/skills/skill-detail-view";
import { SkillEditForm } from "@/components/skills/skill-edit-form";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";

export default function SkillDetailPage() {
	const params = useParams();
	const router = useRouter();
	const rawId = params?.id as string | string[] | undefined;
	const id = Array.isArray(rawId) ? rawId[0] : rawId;

	const [isEditing, setIsEditing] = useState(false);
	const [isPublicLocal, setIsPublicLocal] = useState(false);
	const optimisticPrevIsPublicRef = useRef(false);
	const nextIsPublicRef = useRef(false);
	const updateToastIdRef = useRef<string | number | null>(null);

	const { data: skill, isLoading, isError } = api.Skills.GetById.useQuery(id ?? "");

	const { mutate: deleteSkill, isPending: isDeleting } = api.Skills.Delete.useMutation({
		onSuccess: () => {
			router.push("/skills");
		},
	});

	const { mutate: updateVisibility, isPending: isUpdatingVisibility } =
		api.Skills.Update.useMutation(id ?? "", {
			onMutate: () => {
				updateToastIdRef.current = toast.loading("Updating...");
			},
			onSuccess: () => {
				if (updateToastIdRef.current !== null) toast.dismiss(updateToastIdRef.current);
				toast.success(
					nextIsPublicRef.current ? "Changed to Public" : "Changed to Private"
				);
			},
			onError: (err: unknown) => {
				if (updateToastIdRef.current !== null) toast.dismiss(updateToastIdRef.current);
				setIsPublicLocal(optimisticPrevIsPublicRef.current);

				const message =
					err && typeof err === "object" && "response" in err
						? (err as { response?: { data?: { message?: string } } }).response?.data
								?.message
						: undefined;
				toast.error(message || "Not updated");
			},
		});

	useEffect(() => {
		if (skill) {
			setIsPublicLocal(skill.isPublic);
		}
	}, [skill]);

	useEffect(() => {
		if (!id) {
			toast.error("Invalid skill id");
			return;
		}

		if (!isLoading && (isError || !skill)) {
			toast.error("Skill not found");
		}
	}, [id, isError, isLoading, skill]);

	if (isLoading) {
		return <DetailPageSkeleton />;
	}

	if (isError || !skill || !id) {
		return (
			<div className="p-10 text-center text-red-500">
				Skill not found.{" "}
				<Link href="/skills" className="underline">
					Go back
				</Link>
			</div>
		);
	}

	const isWorking = isDeleting || isUpdatingVisibility;

	return (
		<div className="min-h-screen bg-[#E2EDF8] px-4 py-6 sm:px-6 lg:px-8">
			<div className="mx-auto w-full max-w-5xl space-y-6">
				<div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="min-w-0 space-y-4">
							<Link
								href="/skills"
								className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
							>
								<ArrowLeft size={16} /> Back
							</Link>

							<h1 className="text-2xl font-bold leading-tight text-slate-900 wrap-break-word sm:text-3xl lg:text-4xl">
								{isEditing ? "Edit skill" : skill.title}
							</h1>
							{isEditing ? (
								<p className="text-sm text-slate-600 sm:text-base">
									Update this skill enhancement
								</p>
							) : null}
						</div>

						{!isEditing ? (
							<div className="flex flex-wrap items-center gap-2 shrink-0">
								<Button
									type="button"
									variant="outline"
									className="h-10 rounded-xl"
									onClick={() => setIsEditing(true)}
									disabled={isWorking}
								>
									<Pencil className="mr-2 h-4 w-4" />
									Edit
								</Button>

								<Button
									type="button"
									variant="outline"
									className="h-10 rounded-xl"
									disabled={isWorking}
									onClick={() => {
										if (isUpdatingVisibility) return;
										const nextIsPublic = !isPublicLocal;
										optimisticPrevIsPublicRef.current = isPublicLocal;
										nextIsPublicRef.current = nextIsPublic;
										setIsPublicLocal(nextIsPublic);
										updateVisibility({ isPublic: nextIsPublic });
									}}
								>
									{isPublicLocal ? "Make private" : "Make public"}
								</Button>

								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button
											type="button"
											variant="outline"
											className="h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
											disabled={isWorking}
										>
											{isDeleting ? "Deleting..." : "Delete"}
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Delete skill?</AlertDialogTitle>
											<AlertDialogDescription>
												This action cannot be undone. This will permanently delete
												the skill enhancement.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											<AlertDialogAction
												className="bg-red-600 hover:bg-red-700"
												onClick={() => deleteSkill(id)}
											>
												Delete
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						) : null}
					</div>
				</div>

				{isEditing ? (
					<SkillEditForm
						id={id}
						skill={skill}
						onSuccess={() => setIsEditing(false)}
						onCancel={() => setIsEditing(false)}
					/>
				) : (
					<SkillDetailView skill={skill} />
				)}
			</div>
		</div>
	);
}
