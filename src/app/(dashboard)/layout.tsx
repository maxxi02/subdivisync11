import { getServerSession } from "@/better-auth/action";
import { DashboardSidebar } from "@/components/forms/dashboard-sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session?.session.token) redirect("/login");

  return <DashboardSidebar session={session}>{children}</DashboardSidebar>;
}
