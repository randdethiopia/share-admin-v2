import { redirect } from "next/navigation";

export default function DashboardCreateTraineeRedirect() {
	redirect("/trainee/list/create-trainee");
}
