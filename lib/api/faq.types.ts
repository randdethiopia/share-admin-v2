export interface FAQType {
	_id: string;
	question: string;
	answer: string;
	order: number;
	isActive: boolean;
	category?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateFAQInput {
	question: string;
	answer: string;
	order?: number;
	isActive?: boolean;
	category?: string;
}

export interface UpdateFAQInput {
	id: string;
	question?: string;
	answer?: string;
	order?: number;
	isActive?: boolean;
	category?: string;
}

export type FAQListResponse = {
	data: FAQType[] | { data?: FAQType[] };
};
