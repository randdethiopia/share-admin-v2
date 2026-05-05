import { ErrorRes } from "@/types/core";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export interface CoordinatorRoleRef {
	_id: string;
	name: string;
}

export interface CoordinatorType {
	_id: string;
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
	role: string;
	isActive: boolean;
	firstTimeLogin: boolean;
	status: string;
	__v: number;
	roles: CoordinatorRoleRef[];
}

export interface CoordinatorListResType {
	success: boolean;
	count: number;
	data: CoordinatorType[];
}

export async function getAllCoordinatorFn() {
	return (
		await axios.get(`${API_URL}/api/user/coordinator`)
	).data as CoordinatorListResType;
}

const CoordinatorApi = {
	GetList: {
		useQuery: (
			options?: Omit<
				UseQueryOptions<CoordinatorListResType, AxiosError<ErrorRes>>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				queryKey: ["Coordinator"],
				queryFn: getAllCoordinatorFn,
				...options,
			}),
	},
};

export default CoordinatorApi;
