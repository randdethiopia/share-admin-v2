import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
  // Avoid an extra redirect hop (/) -> (/dashboard) -> (/login).
  // Send the user where they actually belong based on auth state.
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  redirect(token ? "/dashboard" : "/login");
}