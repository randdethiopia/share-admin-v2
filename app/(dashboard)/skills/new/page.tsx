"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { skillSchema, type SkillFormData } from "@/lib/validator";
import api from "@/lib/api";
import { uploadFileFn } from "@/lib/api/upload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import Editor from "@/components/shared/Editor";
import { ArrowLeft, Loader2, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";

type SkillFormValues = z.input<typeof skillSchema>;

export default function NewSkillPage() {
	const { mutate: createSkill, isPending } = api.Skills.Create.useMutation();
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const pendingFileRef = useRef<File | null>(null);
	const lastObjectUrlRef = useRef<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<SkillFormValues>({
		resolver: zodResolver(skillSchema),
		defaultValues: {
			title: "",
			source: "",
			tags: "",
			description: "",
			isPublic: false,
			image: { url: "", id: "" },
		},
	});

	const image = useWatch({ control: form.control, name: "image" });
	const imageUrl = image?.url;

	useEffect(() => {
		return () => {
			if (lastObjectUrlRef.current?.startsWith("blob:")) {
				URL.revokeObjectURL(lastObjectUrlRef.current);
			}
		};
	}, []);

	const onSubmit = async (data: SkillFormValues) => {
		const file = pendingFileRef.current;
		if (!file) {
			form.setError("image", { message: "Please select an image" });
			return;
		}

		setIsSubmitting(true);
		try {
			const uploaded = await uploadFileFn(file);
			createSkill(
				{
					...(data as SkillFormData),
					image: uploaded,
					isPublic: data.isPublic ?? false,
				},
				{ onSettled: () => setIsSubmitting(false) }
			);
		} catch (err) {
			setIsSubmitting(false);
			const message = err instanceof Error ? err.message : "Failed to upload image";
			toast.error(message);
		}
	};

	const handleBrowseClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		pendingFileRef.current = file;

		const nextUrl = URL.createObjectURL(file);
		if (lastObjectUrlRef.current?.startsWith("blob:")) {
			URL.revokeObjectURL(lastObjectUrlRef.current);
		}
		lastObjectUrlRef.current = nextUrl;

		form.setValue(
			"image",
			{ url: nextUrl, id: file.name },
			{ shouldDirty: true, shouldValidate: true }
		);
	};

	const handleRemoveImage = () => {
		pendingFileRef.current = null;
		if (lastObjectUrlRef.current?.startsWith("blob:")) {
			URL.revokeObjectURL(lastObjectUrlRef.current);
		}
		lastObjectUrlRef.current = null;
		form.setValue(
			"image",
			{ url: "", id: "" },
			{ shouldDirty: true, shouldValidate: true }
		);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const isWorking = isSubmitting || isPending;

	return (
		<div className="min-h-screen bg-[#E2EDF8] px-4 py-6 sm:px-6 lg:px-8">
			<div className="mx-auto w-full max-w-5xl space-y-6">
		
				<div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
					
					<div className="p-6 sm:p-8">
						<Link
							href="/skills"
							className="text-blue-600 text-sm font-semibold inline-flex items-center gap-2 hover:underline"
						>
							<ArrowLeft size={16} /> Back
						</Link>

						<h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight wrap-break-word">
							New Skill
						</h1>
					</div>

					<div className="p-6 sm:p-8">
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
								<FormField
									name="title"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-gray-700 font-semibold">
												Title <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input
													placeholder="Enter title"
													className="bg-[#F3F8FF] border-none h-12 rounded-xl"
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
											<FormLabel className="text-gray-700 font-semibold">
												Source <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input
													placeholder="Enter source"
													className="bg-[#F3F8FF] border-none h-12 rounded-xl"
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
											<FormLabel className="text-gray-700 font-semibold">
												Tags <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input
													placeholder="Enter tags"
													className="bg-[#F3F8FF] border-none h-12 rounded-xl"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="space-y-3">
									<h3 className="text-gray-800 font-bold text-sm">
										Do you want to make this content public?
									</h3>

									<FormField
										name="isPublic"
										control={form.control}
										render={({ field }) => (
											<div className="flex items-center gap-3 mt-4">
												<FormControl>
													<Checkbox
														checked={field.value ?? false}
														onCheckedChange={(checked) =>
															field.onChange(checked === true)
														}
													/>
												</FormControl>
												<label className="text-gray-500 text-sm font-medium">
													Make it Public
												</label>
											</div>
										)}
									/>
								</div>

								<FormField
									name="description"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-gray-700 font-semibold">
												Description
											</FormLabel>
											<FormControl>
												<Editor value={field.value} onChange={field.onChange} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="flex items-center gap-6">
									<div className="relative w-40 aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
										<img
											src={imageUrl || "/placeholder.png"}
											className="object-cover w-full h-full"
											alt="Preview"
										/>
										{imageUrl ? (
											<button
												type="button"
												onClick={handleRemoveImage}
												disabled={isWorking}
												className="absolute top-2 left-2 bg-white rounded-lg shadow-sm p-1 disabled:opacity-60"
												aria-label="Remove image"
											>
												<X size={14} className="text-red-500" />
											</button>
										) : null}
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
										onClick={handleBrowseClick}
										disabled={isWorking}
										className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl px-8 h-10 shadow-md"
									>
										Browse
									</Button>
								</div>
								<FormField name="image" control={form.control} render={() => <FormMessage />} />

								<div className="pt-6">
									<Button
										type="submit"
										className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl px-10 h-12 font-bold shadow-md"
										disabled={isWorking}
									>
										{isWorking ? <Loader2 className="mr-2 animate-spin" /> : null}
										{isSubmitting ? "Uploading image..." : isPending ? "Creating..." : "Create skill"}
									</Button>
								</div>
							</form>
						</Form>
					</div>
				</div>
			</div>
		</div>
	);
}
