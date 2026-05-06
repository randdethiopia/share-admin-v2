import { ErrorRes } from "@/types/core";
import {
	type UseMutationOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import axios, { AxiosError, isAxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export type TrainingSessionStatus =
	| "draft"
	| "scheduled"
	| "completed"
	| "cancelled";

/** POST /api/training-session — Auth: Bearer + `role` header via `lib/axios.ts` interceptors. */
export interface CreateTrainingSessionBody {
	title: string;
	scheduledAt: string;
	description?: string;
	location?: string;
	status?: TrainingSessionStatus;
}

export interface CreateTrainingSessionRes {
	success: boolean;
	data: unknown;
}

export async function createTrainingSessionFn(body: CreateTrainingSessionBody) {
	const res = await axios.post(`${API_URL}/api/training-session`, body);
	return res.data as CreateTrainingSessionRes;
}

const TrainingSessionApi = {
	Create: {
		useMutation: (
			options?: UseMutationOptions<
				CreateTrainingSessionRes,
				AxiosError<ErrorRes>,
				CreateTrainingSessionBody
			>
		) => {
			const queryClient = useQueryClient();
			return useMutation({
				...options,
				mutationFn: createTrainingSessionFn,
				onSuccess: (data, variables, context) => {
					queryClient.invalidateQueries({ queryKey: ["TrainingSession"] });
					queryClient.invalidateQueries({
						queryKey: ["Coordinator", "sessions"],
					});
					options?.onSuccess?.(
						data,
						variables,
						context,
						undefined as unknown as never
					);
				},
			});
		},
	},
};

export function trainingSessionErrorMessage(error: unknown, fallback: string) {
	if (isAxiosError(error)) {
		const msg = error.response?.data?.message;
		if (typeof msg === "string" && msg.trim()) return msg;
	}
	return fallback;
}

export default TrainingSessionApi;
