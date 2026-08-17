"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { traineeSchema, type TraineeFormData } from "@/lib/validator";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const ETHIOPIA_REGIONS = [
	"Addis Ababa",
	"Tigray",
	"Afar",
	"Amhara",
	"Oromia",
	"Benishangul-Gumuz",
	"Central Ethiopia",
	"Dire Dawa",
	"Gambela",
	"Harari",
	"Sidama",
	"Somali",
	"South Ethiopia",
	"South West Ethiopia Peoples",
];

export function CreateTraineeForm({
	onCreated,
	onCancel,
}: {
	onCreated: () => void;
	onCancel: () => void;
}) {
	const { mutate: createTrainee, isPending } =
		api.TraineeAuth.registerTrainee.useMutation({
			onSuccess: () => {
				onCreated();
			},
		});

	const form = useForm<TraineeFormData>({
		resolver: zodResolver(traineeSchema),
		defaultValues: {
			firstName: "",
			middleName: "",
			lastName: "",
			email: "",
			phoneNumber: "",
			age: undefined,
			region: "",
			gender: undefined,
		},
	});

	const onSubmit = (data: TraineeFormData) => {
		createTrainee({
			firstname: data.firstName,
			middlename: data.middleName,
			lastname: data.lastName,
			email: data.email || undefined,
			phoneNumber: data.phoneNumber,
			age: data.age,
			region: data.region,
			gender: data.gender,
		});
	};

	return (
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
									placeholder="Dawit"
									className="bg-[#F3F8FF] border-none h-12 rounded-xl"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					name="middleName"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-gray-700 font-semibold">
								Middle Name <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input
									placeholder="Girma"
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
									placeholder="Bekele"
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
							<FormLabel className="text-gray-700 font-semibold">Email</FormLabel>
							<FormControl>
								<Input
									placeholder="dawit.bekele@example.com"
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

				<FormField
					name="age"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-gray-700 font-semibold">
								Age <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									placeholder="25"
									className="bg-[#F3F8FF] border-none h-12 rounded-xl"
									{...field}
									onChange={(e) =>
										field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
									}
									value={field.value ?? ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					name="region"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-gray-700 font-semibold">
								Region <span className="text-red-500">*</span>
							</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger className="bg-[#F3F8FF] border-none h-12 rounded-xl w-full">
										<SelectValue placeholder="Select region" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{ETHIOPIA_REGIONS.map((region) => (
										<SelectItem key={region} value={region}>
											{region}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					name="gender"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-gray-700 font-semibold">
								Gender <span className="text-red-500">*</span>
							</FormLabel>
							<Select onValueChange={field.onChange} value={field.value}>
								<FormControl>
									<SelectTrigger className="bg-[#F3F8FF] border-none h-12 rounded-xl w-full">
										<SelectValue placeholder="Select gender" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="male">Male</SelectItem>
									<SelectItem value="female">Female</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="md:col-span-2 pt-2 flex flex-col sm:flex-row gap-3">
					<Button
						type="button"
						variant="outline"
						className="rounded-xl h-11"
						onClick={onCancel}
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
	);
}
