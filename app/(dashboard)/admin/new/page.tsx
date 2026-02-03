"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import api from "@/api";
import { adminSchema, type AdminFormData } from "@/lib/validator";
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

export default function NewAdminPage() {
	const router = useRouter();

	const { mutate: createAdmin, isPending } =
		api.AdminProfile.Create.useMutation({
			onSuccess: () => {
				toast.success("Admin created successfully!");
				router.push("/admin");
			},
			onError: (err: unknown) => {
				const message =
					typeof err === "object" && err !== null && "response" in err
						? (err as { response?: { data?: { message?: string } } }).response
							?.data?.message
						: undefined;
				toast.error(message || "Failed to create admin");
			},
		});

	const form = useForm<AdminFormData>({
		resolver: zodResolver(adminSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			phoneNumber: "",
			email: "",
		},
	});

	return (
		<div className="min-h-screen bg-[#E2EDF8]">
			<div className="px-8 py-10">
				<h1 className="text-[28px] font-bold tracking-tight text-black">
					Creating New Admin
				</h1>
				<p className="text-sm font-medium text-zinc-500">
					Creating New Admin account to access the system
				</p>
			</div>

			<div className="mx-6 rounded-[2.5rem] border border-blue-50 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((data) => createAdmin(data))}
						className="grid max-w-4xl gap-6 sm:grid-cols-2"
					>
						<FormField
							name="firstName"
							control={form.control}
							render={({ field }) => (
								<FormItem className="sm:col-span-1">
									<FormLabel className="text-xs font-semibold text-gray-700">
										First Name <span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder="admin"
											className="h-12 rounded-xl border-none bg-[#F3F8FF]"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							name="lastName"
							control={form.control}
							render={({ field }) => (
								<FormItem className="sm:col-span-1">
									<FormLabel className="text-xs font-semibold text-gray-700">
										Last Name <span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Solomon"
											className="h-12 rounded-xl border-none bg-[#F3F8FF]"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							name="phoneNumber"
							control={form.control}
							render={({ field }) => (
								<FormItem className="sm:col-span-1">
									<FormLabel className="text-xs font-semibold text-gray-700">
										Phone Number <span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder="09875..."
											className="h-12 rounded-xl border-none bg-[#F3F8FF]"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							name="email"
							control={form.control}
							render={({ field }) => (
								<FormItem className="sm:col-span-1">
									<FormLabel className="text-xs font-semibold text-gray-700">
										Email <span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder="your@email.com"
											className="h-12 rounded-xl border-none bg-[#F3F8FF]"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="sm:col-span-2">
							<Button
								type="submit"
								className="h-11 rounded-xl bg-[#3B82F6] px-10 font-bold text-white shadow-md hover:bg-blue-600"
								disabled={isPending}
							>
								{isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								Create Admin
							</Button>
						</div>
					</form>
				</Form>
			</div>
		</div>
	);
}
