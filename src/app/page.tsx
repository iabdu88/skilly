import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { dashboardPath } from "@/lib/auth";

export default async function RootPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  redirect(dashboardPath(user.role));
}
