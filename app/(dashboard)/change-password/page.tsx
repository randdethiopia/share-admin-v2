"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type changePasswordData } from "@/lib/validator";
import api from "@/lib/api";
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";

const PASSWORD_REQUIREMENTS = [
	{
		label: "At least 8 characters",
		test: (value: string) => value.length >= 8,
	},
	{
		label: "One uppercase letter (A–Z)",
		test: (value: string) => /[A-Z]/.test(value),
	},
	{
		label: "One lowercase letter (a–z)",
		test: (value: string) => /[a-z]/.test(value),
	},
	{
		label: "One number (0–9)",
		test: (value: string) => /\d/.test(value),
	},
	{
		label: "One special character (@ $ ! % * ? &)",
		test: (value: string) => /[@$!%*?&]/.test(value),
	},
] as const;

function PasswordInput({
	value,
	onChange,
	onBlur,
	name,
	ref,
}: React.ComponentProps<typeof Input>) {
	const [visible, setVisible] = useState(false);

	return (
		<div className="relative">
			<Input
				type={visible ? "text" : "password"}
				placeholder="••••••••"
				className="bg-[#F3F8FF] border-none h-12 rounded-xl pr-12"
				value={value}
				onChange={onChange}
				onBlur={onBlur}
				name={name}
				ref={ref}
			/>
			<button
				type="button"
				onClick={() => setVisible((prev) => !prev)}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
				aria-label={visible ? "Hide password" : "Show password"}
			>
				{visible ? <EyeOff size={18} /> : <Eye size={18} />}
			</button>
		</div>
	);
}

export default function ChangePasswordPage() {
	const form = useForm<changePasswordData>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
	});

	const newPassword = form.watch("newPassword") ?? "";

	const { mutate: changePass, isPending } = api.AdminAuth.changePassword.useMutation({
		onSuccess: () => {
			toast.success("Password updated successfully");
			form.reset();
		},
		onError: (error: unknown) => {
			const message =
				typeof error === "object" && error !== null && "response" in error
					? (error as { response?: { data?: { message?: string } } }).response?.data
						?.message
					: undefined;
			toast.error(message || "Failed to update password");
		},
	});

	return (
		<div className="flex min-h-[calc(100dvh-7rem)] items-center justify-center px-4 py-10">
			<div className="w-full max-w-md">
				<div className="mb-8 text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
						<LockKeyhole className="h-8 w-8" />
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-gray-900">
						Change Password
					</h1>
					<p className="mt-2 text-sm text-gray-500">
						Keep your account secure with a strong, unique password.
					</p>
				</div>

				<Card className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
					<CardContent className="p-8">
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit((data) => changePass(data))}
								className="space-y-5"
							>
								<FormField
									name="oldPassword"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-bold text-gray-700">
												Current Password *
											</FormLabel>
											<FormControl>
												<PasswordInput {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									name="newPassword"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-bold text-gray-700">
												New Password *
											</FormLabel>
											<FormControl>
												<PasswordInput {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									name="confirmPassword"
									control={form.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-bold text-gray-700">
												Confirm New Password *
											</FormLabel>
											<FormControl>
												<PasswordInput {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button
									type="submit"
									className="mt-2 h-12 w-full rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
									disabled={isPending}
								>
									{isPending ? (
										<Loader2 className="animate-spin" />
									) : (
										"Update Password"
									)}
								</Button>
							</form>
						</Form>

						<div className="mt-6 rounded-2xl border border-blue-100 bg-[#F3F8FF] p-4">
							<p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">
								Password requirements
							</p>
							<ul className="mt-3 space-y-2">
								{PASSWORD_REQUIREMENTS.map((requirement) => {
									const met = requirement.test(newPassword);
									return (
										<li
											key={requirement.label}
											className={cn(
												"flex items-start gap-2 text-sm",
												met ? "text-emerald-700" : "text-slate-600"
											)}
										>
											<Check
												className={cn(
													"mt-0.5 h-4 w-4 shrink-0",
													met ? "text-emerald-600" : "text-slate-300"
												)}
											/>
											<span>{requirement.label}</span>
										</li>
									);
								})}
							</ul>
							<p className="mt-3 text-xs text-slate-500">
								Your new password and confirmation must match exactly.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
