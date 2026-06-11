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
import type { AxiosError } from "axios";
import type { ErrorRes } from "@/types/core";

export const PASSWORD_REQUIREMENTS = [
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
	compact,
}: React.ComponentProps<typeof Input> & { compact?: boolean }) {
	const [visible, setVisible] = useState(false);

	return (
		<div className="relative">
			<Input
				type={visible ? "text" : "password"}
				placeholder="••••••••"
				className={cn(
					"bg-[#F3F8FF] border-none rounded-xl pr-11",
					compact ? "h-10 text-sm" : "h-11"
				)}
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
				{visible ? <EyeOff size={17} /> : <Eye size={17} />}
			</button>
		</div>
	);
}

type ChangePasswordProps = {
	variant?: "page" | "inline";
	title?: string;
	description?: string;
	defaultOldPassword?: string;
	onSuccess?: () => void;
};

export function ChangePassword({
	variant = "page",
	title = "Change Password",
	description = "Keep your account secure with a strong, unique password.",
	defaultOldPassword = "",
	onSuccess,
}: ChangePasswordProps) {
	const isInline = variant === "inline";

	const form = useForm<changePasswordData>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: {
			oldPassword: defaultOldPassword,
			newPassword: "",
			confirmPassword: "",
		},
	});

	const newPassword = form.watch("newPassword") ?? "";

	const { mutate: changePass, isPending } = api.AdminAuth.changePassword.useMutation({
		onSuccess: () => {
			toast.success("Password updated successfully");
			form.reset();
			onSuccess?.();
		},
		onError: (error: AxiosError<ErrorRes>) => {
			toast.error(error.response?.data?.message || "Failed to update password");
		},
	});

	const formContent = (
		<Card className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-sm">
			<CardContent className={cn(isInline ? "p-5" : "p-6")}>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((data) => changePass(data))}
						className={cn(isInline ? "space-y-3" : "space-y-4")}
					>
						<FormField
							name="oldPassword"
							control={form.control}
							render={({ field }) => (
								<FormItem className="space-y-1.5">
									<FormLabel className="text-sm font-bold text-gray-700">
										Current Password *
									</FormLabel>
									<FormControl>
										<PasswordInput compact={isInline} {...field} />
									</FormControl>
									<FormMessage className="text-xs" />
								</FormItem>
							)}
						/>

						<FormField
							name="newPassword"
							control={form.control}
							render={({ field }) => (
								<FormItem className="space-y-1.5">
									<FormLabel className="text-sm font-bold text-gray-700">
										New Password *
									</FormLabel>
									<FormControl>
										<PasswordInput compact={isInline} {...field} />
									</FormControl>
									<FormMessage className="text-xs" />
								</FormItem>
							)}
						/>

						<FormField
							name="confirmPassword"
							control={form.control}
							render={({ field }) => (
								<FormItem className="space-y-1.5">
									<FormLabel className="text-sm font-bold text-gray-700">
										Confirm New Password *
									</FormLabel>
									<FormControl>
										<PasswordInput compact={isInline} {...field} />
									</FormControl>
									<FormMessage className="text-xs" />
								</FormItem>
							)}
						/>

						<Button
							type="submit"
							className={cn(
								"mt-1 w-full rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700",
								isInline ? "h-10 text-sm" : "h-11"
							)}
							disabled={isPending}
						>
							{isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Update Password"
							)}
						</Button>
					</form>
				</Form>

				<div
					className={cn(
						"rounded-xl border border-blue-100 bg-[#F3F8FF]",
						isInline ? "mt-4 p-3" : "mt-5 p-4"
					)}
				>
					<p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">
						Password requirements
					</p>
					<ul
						className={cn(
							"mt-2 gap-x-4 gap-y-1",
							isInline
								? "grid grid-cols-1 sm:grid-cols-2"
								: "space-y-1"
						)}
					>
						{PASSWORD_REQUIREMENTS.map((requirement) => {
							const met = requirement.test(newPassword);
							return (
								<li
									key={requirement.label}
									className={cn(
										"flex items-start gap-2 text-sm leading-snug",
										met ? "text-emerald-700" : "text-slate-600"
									)}
								>
									<Check
										className={cn(
											"mt-0.5 h-3.5 w-3.5 shrink-0",
											met ? "text-emerald-600" : "text-slate-300"
										)}
									/>
									<span>{requirement.label}</span>
								</li>
							);
						})}
					</ul>
				</div>
			</CardContent>
		</Card>
	);

	if (variant === "inline") {
		return (
			<div className="w-full max-h-[calc(100dvh-2rem)] overflow-y-auto">
				<div className="mb-4 text-center">
					<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
						<LockKeyhole className="h-6 w-6" />
					</div>
					<h1 className="text-xl font-bold tracking-tight text-gray-900">
						{title}
					</h1>
					<p className="mt-1 text-sm text-gray-500">{description}</p>
				</div>
				{formContent}
			</div>
		);
	}

	return (
		<div className="flex min-h-0 items-center justify-center px-4 py-6">
			<div className="w-full max-w-md">
				<div className="mb-6 text-center">
					<div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
						<LockKeyhole className="h-7 w-7" />
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-gray-900">
						{title}
					</h1>
					<p className="mt-1.5 text-sm text-gray-500">{description}</p>
				</div>
				{formContent}
			</div>
		</div>
	);
}
