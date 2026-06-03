import { ErrorRes } from "@/types/core";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

export interface CityRef {
	_id: string;
	name: string;
	slug: string;
}

export interface City extends CityRef {
	isActive: boolean;
	hasSubcity: boolean;
}

export interface SubCity {
	_id: string;
	name: string;
	slug: string;
	city: CityRef;
	isActive: boolean;
}

async function getCitiesFn() {
	const response = await axios.get("/api/adress/city");
	return response.data as City[];
}

async function getSubCitiesFn(cityId: string) {
	const response = await axios .get(`/api/adress/city/${cityId}/subcity`);
	return response.data as SubCity[];
}

const Adress = {
	GetCities: {
		useQuery: (options?: UseQueryOptions<City[], AxiosError<ErrorRes>>) =>
			useQuery({
				queryKey: ["adress", "cities"],
				queryFn: () => getCitiesFn(),
				...options,
			}),
	},
	GetSubCities: {
		useQuery: (
			cityId: string,
			enabled = true,
			options?: UseQueryOptions<SubCity[], AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["adress", "subcities", cityId],
				queryFn: () => getSubCitiesFn(cityId),
				enabled: !!cityId && enabled,
				...options,
			}),
	},
};

export default Adress;
