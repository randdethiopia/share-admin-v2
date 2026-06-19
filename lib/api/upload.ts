import { FileType, SuccessRes } from "@/types/core";
import axios from "axios";

export interface UploadImageRes extends SuccessRes {
	urls: FileType;
}

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function uploadFileFn(file: File): Promise<FileType> {
	const formData = new FormData();
	formData.append("files", file);

	const res = (await axios.post(`${API_URL}/api/help/file`, formData)).data as UploadImageRes;

	if (!res.urls?.url) {
		throw new Error(res.message || "Image upload failed");
	}

	return res.urls;
}
