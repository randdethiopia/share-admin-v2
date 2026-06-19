"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { skillSchema } from "@/lib/validator";
import api from "@/lib/api";
import { uploadFileFn } from "@/lib/api/upload";
import { SkillType } from "@/lib/api/skills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import Editor from "@/components/shared/Editor";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type SkillFormValues = z.input<typeof skillSchema>;

function getUpdateErrorMessage(err: unknown): string {
	if (err && typeof err === "object") {
		const maybe = err as {
			message?: string;
			response?: { data?: { message?: string } };
		};

		return maybe.response?.data?.message || maybe.message || "Not updated";
	}

	return "Not updated";
}

type SkillEditFormProps = {
	id: string;
	skill: SkillType;
	onSuccess: () => void;
	onCancel: () => void;
};

export function SkillEditForm({ id, skill, onSuccess, onCancel }: SkillEditFormProps) {
	const updateToastIdRef = useRef<string | number | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const { mutate: updateSkill, isPending } = api.Skills.Update.useMutation(id, {
		onMutate: () => {
			updateToastIdRef.current = toast.loading("Updating...");
		},
		onSuccess: () => {
			if (updateToastIdRef.current !== null) toast.dismiss(updateToastIdRef.current);
			toast.success("Updated successfully");
			onSuccess();
		},
		onError: (err: unknown) => {
			if (updateToastIdRef.current !== null) toast.dismiss(updateToastIdRef.current);
			toast.error(getUpdateErrorMessage(err));
		},
	});

	const form = useForm<SkillFormValues>({
		resolver: zodResolver(skillSchema),
		defaultValues: {
			title: skill.title,
			description: skill.description,
			source: skill.source,
			tags: skill.tags,
			isPublic: skill.isPublic,
			image: skill.image,
		},
	});

	const image = useWatch({ control: form.control, name: "image" });
	const imageUrl = image?.url;

	useEffect(() => {
		form.reset({
			title: skill.title,
			description: skill.description,
			source: skill.source,
			tags: skill.tags,
			isPublic: skill.isPublic,
			image: skill.image,
		});
	}, [skill, form]);

	const handleBrowseClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		try {
			const uploaded = await uploadFileFn(file);
			form.setValue("image", uploaded, { shouldDirty: true, shouldValidate: true });
			toast.success("Image uploaded");
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to upload image";
			toast.error(message);
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleSubmit = (data: SkillFormValues) => {
		updateSkill({
			...data,
			isPublic: data.isPublic ?? false,
		});
	};

	return (
		<Card className="rounded-3xl border-slate-100 py-0 shadow-sm">
			<CardContent className="p-6 sm:p-8">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="max-w-4xl space-y-8">
						<FormField
							name="title"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-semibold text-neutral-800">
										Title <span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter title"
											className="h-12 border-none bg-[#F3F8FF]"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							name="source"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-semibold text-neutral-800">
										Source <span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter source"
											className="h-12 border-none bg-[#F3F8FF]"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							name="tags"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel className="font-semibold text-neutral-800">
										Tags <span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter tags"
											className="h-12 border-none bg-[#F3F8FF]"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="space-y-3">
							<h3 className="font-semibold text-neutral-800">
								Do you want to make this content public?
							</h3>
							<FormField
								name="isPublic"
								control={form.control}
								render={({ field }) => (
									<div className="flex items-center gap-3">
										<FormControl>
											<Checkbox
												checked={field.value ?? false}
												onCheckedChange={(checked) =>
													field.onChange(checked === true)
												}
											/>
										</FormControl>
										<label className="text-sm text-stone-500">Make it Public</label>
									</div>
								)}
							/>
						</div>

						<FormField
							name="description"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-lg text-neutral-800">Description</FormLabel>
									<FormControl>
										<Editor value={field.value} onChange={field.onChange} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex items-center gap-4">
							<div className="relative aspect-video w-40 overflow-hidden rounded-lg bg-gray-100">
								{isUploading ? (
									<div className="flex h-full w-full items-center justify-center">
										<Loader2 className="animate-spin text-blue-500" />
									</div>
								) : (
									<img
										src={imageUrl || "/placeholder.png"}
										className="h-full w-full object-cover"
										alt=""
									/>
								)}
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleFileChange}
							/>
							<Button
								type="button"
								variant="secondary"
								className="bg-blue-500 text-white hover:bg-blue-600"
								onClick={handleBrowseClick}
								disabled={isUploading}
							>
								{isUploading ? (
									<>
										<Loader2 className="mr-2 animate-spin" size={16} />
										Uploading...
									</>
								) : (
									"Browse"
								)}
							</Button>
						</div>

						<div className="flex flex-wrap gap-3 pt-2">
							<Button
								type="submit"
								className="h-12 bg-blue-500 px-10 hover:bg-blue-600"
								disabled={isPending || isUploading}
							>
								{isPending ? "Saving..." : "Save changes"}
							</Button>
							<Button
								type="button"
								variant="outline"
								className="h-12 px-8"
								disabled={isPending || isUploading}
								onClick={onCancel}
							>
								Cancel
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
