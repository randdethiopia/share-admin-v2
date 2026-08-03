export enum TicketStatus {
	NEW = "NEW",
	OPEN = "OPEN",
	ANSWERED = "ANSWERED",
	CLOSED = "CLOSED",
	ARCHIVED = "ARCHIVED",
}

export enum TicketPriority {
	LOW = "LOW",
	NORMAL = "NORMAL",
	HIGH = "HIGH",
}

export enum TicketCategory {
	GENERAL = "GENERAL",
	BUG = "BUG",
	FEATURE_REQUEST = "FEATURE_REQUEST",
	BUSINESS = "BUSINESS",
	EXPERT = "EXPERT",
	MENTOR = "MENTOR",
	OTHER = "OTHER",
}

export enum EmailStatus {
	PENDING = "PENDING",
	SENT = "SENT",
	FAILED = "FAILED",
}

export interface SupportReplyType {
	_id: string;
	ticketId: string;
	message: string;
	isStaff: boolean;
	authorName?: string;
	authorEmail?: string;
	emailStatus: EmailStatus;
	createdAt: string;
}

export interface SupportTicketType {
	_id: string;
	ticketNumber?: string;
	name?: string;
	email?: string;
	subject: string;
	message: string;
	status: TicketStatus;
	priority: TicketPriority;
	category: TicketCategory;
	emailStatus: EmailStatus;
	submitterName?: string;
	submitterEmail?: string;
	createdAt: string;
	updatedAt: string;
	lastReplyAt?: string;
}

export interface GetTicketsQueryParams {
	page?: number;
	limit?: number;
	status?: TicketStatus;
	priority?: TicketPriority;
	category?: TicketCategory;
	search?: string;
}

export interface TicketListData {
	tickets: SupportTicketType[];
	total: number;
	page: number;
	limit: number;
}

export interface TicketListMeta {
	total: number;
	page?: number;
	limit?: number;
}

export interface TicketDetailData {
	ticket: SupportTicketType;
	replies: SupportReplyType[];
}

export interface TicketListResponse {
	success: boolean;
	data: SupportTicketType[] | TicketListData;
	meta?: TicketListMeta;
}

export interface TicketDetailResponse {
	success: boolean;
	data: TicketDetailData;
}

export interface ReplyTicketInput {
	id: string;
	message: string;
}

export interface UpdateTicketStatusInput {
	id: string;
	status: TicketStatus;
}
