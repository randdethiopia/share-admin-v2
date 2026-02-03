"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type changePasswordData } from "@/lib/validator";
import adminApi from "@/api/admin";
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
import { Loader2 } from "lucide-react";

export default function ChangePasswordPage() {
	const form = useForm<changePasswordData>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
	});

	const { mutate: changePass, isPending } = adminApi.changePassword.useMutation({
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
		<div className="space-y-6 max-w-2xl">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
				<p className="text-gray-500 text-sm">
					Update your account credentials for better security.
				</p>
			</div>

			<Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
				<CardContent className="p-8">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit((data) => changePass(data))}
							className="space-y-6"
						>
							<FormField
								name="oldPassword"
								control={form.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel className="font-bold text-gray-700">
											Old Password *
										</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder="••••••••"
												className="bg-[#F3F8FF] border-none h-12 rounded-xl"
												{...field}
											/>
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
											<Input
												type="password"
												placeholder="••••••••"
												className="bg-[#F3F8FF] border-none h-12 rounded-xl"
												{...field}
											/>
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
											<Input
												type="password"
												placeholder="••••••••"
												className="bg-[#F3F8FF] border-none h-12 rounded-xl"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button
								type="submit"
								className="w-full bg-blue-400 h-12 rounded-xl font-bold"
								disabled={isPending}
							>
								{isPending ? <Loader2 className="animate-spin" /> : "Update Password"}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
