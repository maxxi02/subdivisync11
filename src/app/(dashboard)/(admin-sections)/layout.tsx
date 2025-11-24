import { getServerSession } from "@/better-auth/action";
import { redirect } from "next/navigation";

export default async function AdminSectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  // Check if user is authenticated
  if (!session?.session?.token) {
    redirect("/login");
  }

  // Check if user has admin role
  if (session?.user?.role !== "admin") {
    // Redirect non-admin users to their appropriate dashboard
    redirect("/homeowner-dashboard");
  }

  return <>{children}</>;
}

