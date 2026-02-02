"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { traineeSchema, type TraineeFormData } from "@/lib/validator";
import TraineeAuth from "@/api/trainee";

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
import { Loader2 } from "lucide-react";

export default function CreateTraineePage() {
	const router = useRouter();

	const { mutate: createTrainee, isPending } =
		TraineeAuth.registerTrainee.useMutation({
			onSuccess: () => {
				router.push("/dashboard/trainee/list");
			},
		});

	const form = useForm<TraineeFormData>({
		resolver: zodResolver(traineeSchema),
		defaultValues: { firstName: "", lastName: "", email: "", phoneNumber: "" },
	});

	const onSubmit = (data: TraineeFormData) => {
		createTrainee({
			firstname: data.firstName,
			lastname: data.lastName,
			email: data.email,
			phoneNumber: data.phoneNumber,
		});
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
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="grid grid-cols-1 md:grid-cols-2 gap-5"
						>
							<FormField
								name="firstName"
								control={form.control}
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-gray-700 font-semibold">
											First Name <span className="text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="John"
												className="bg-[#F3F8FF] border-none h-12 rounded-xl"
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
									<FormItem>
										<FormLabel className="text-gray-700 font-semibold">
											Last Name <span className="text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Doe"
												className="bg-[#F3F8FF] border-none h-12 rounded-xl"
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
									<FormItem className="md:col-span-2">
										<FormLabel className="text-gray-700 font-semibold">
											Email <span className="text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="john@example.com"
												className="bg-[#F3F8FF] border-none h-12 rounded-xl"
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
									<FormItem className="md:col-span-2">
										<FormLabel className="text-gray-700 font-semibold">
											Phone Number <span className="text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input
												placeholder="0912345678"
												className="bg-[#F3F8FF] border-none h-12 rounded-xl"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="md:col-span-2 pt-2 flex flex-col sm:flex-row gap-3">
								<Button
									type="button"
									variant="outline"
									className="rounded-xl h-11"
									onClick={() => router.push("/dashboard/trainee/list")}
									disabled={isPending}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl px-8 h-11 font-bold shadow-md"
									disabled={isPending}
								>
									{isPending && <Loader2 className="mr-2 animate-spin h-4 w-4" />}
									Create Trainee
								</Button>
							</div>
						</form>
					</Form>
				</div>
			</div>
		</div>
	);
}
