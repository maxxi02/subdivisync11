import { getServerSession } from "@/better-auth/action";
import { redirect } from "next/navigation";

export default async function TenantSectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  // Check if user is authenticated
  if (!session?.session?.token) {
    redirect("/login");
  }

  // Check if user has tenant/user role (not admin)
  if (session?.user?.role === "admin") {
    // Redirect admin users to their dashboard
    redirect("/dashboard");
  }

  // Allow tenant and user roles
  if (session?.user?.role !== "tenant" && session?.user?.role !== "user") {
    // If role is undefined or unexpected, redirect to login
    redirect("/login");
  }

  return <>{children}</>;
}

