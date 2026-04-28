import { redirect } from "next/navigation";

export default function AdminDetailsRedirectPage() {
	redirect("/admin-dashboard/admin");
}