"use client";
import type React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  AppShell,
  NavLink,
  Text,
  Group,
  ActionIcon,
  Stack,
  Avatar,
  Divider,
  Badge,
  Burger,
  Tooltip,
  Modal,
  Button,
} from "@mantine/core";
import {
  IconDashboard,
  IconUsers,
  IconChevronRight,
  IconLogout,
  IconChevronLeft,
  IconMenu2,
  IconCreditCard,
  IconSpeakerphone,
  IconClipboardList,
  IconBuildingStore,
  IconFileText,
  IconUser,
  IconTool,
  IconReceipt,
  IconToolsKitchen,
} from "@tabler/icons-react";
import { signOut } from "@/lib/auth-client";
import type { Session } from "@/better-auth/auth-types";

interface DashboardSidebarProps {
  children: React.ReactNode;
  session: Session;
}

export function DashboardSidebar({ children, session }: DashboardSidebarProps) {
  const [opened, setOpened] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Get user role with fallback
  const getUserRole = (role: string | undefined): "admin" | "tenant" => {
    if (role === "admin" || role === "tenant") {
      return role;
    }
    return "tenant";
  };

  const userRole = getUserRole(session.user.role || "user");
  const userName = session.user.name || "User";
  const userEmail = session.user.email || "";
  const userImage = session.user.image;

  const handleLogout = async () => {
    try {
      await signOut();
      setShowLogoutModal(false);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      setShowLogoutModal(false);
    }
  };

  // Admin navigation items
  const adminNavItems = [
    {
      icon: IconDashboard,
      label: "Dashboard",
      href: "/dashboard",
      description: "Overview & Statistics",
    },
    {
      icon: IconBuildingStore,
      label: "Properties",
      href: "/properties",
      description: "Manage Properties",
    },
    {
      icon: IconClipboardList,
      label: "Applications",
      href: "/applications",
      description: "Tenant Applications",
    },
    {
      icon: IconToolsKitchen,
      label: "Service",
      href: "/services",
      description: "Tenant Applications",
    },
    {
      icon: IconUsers,
      label: "Tenants",
      href: "/tenants",
      description: "Manage Tenants",
    },
    {
      icon: IconSpeakerphone,
      label: "Announcements",
      href: "/announcements",
      description: "Post Updates",
    },
    {
      icon: IconCreditCard,
      label: "Payments",
      href: "/payments",
      description: "Payment Management",
    },
    {
      icon: IconUser,
      label: "Profile",
      href: "/admin-profile",
      description: "Admin Account",
    },
  ];

  // Tenant navigation items
  const tenantNavItems = [
    {
      icon: IconDashboard,
      label: "Dashboard",
      href: "/dashboard",
      description: "Home & Updates",
    },
    {
      icon: IconBuildingStore,
      label: "Browse Properties",
      href: "/browse-properties",
      description: "Available Properties",
    },
    {
      icon: IconFileText,
      label: "My Applications",
      href: "/my-applications",
      description: "Application Status",
    },
    {
      icon: IconTool,
      label: "Service Requests",
      href: "/service-requests",
      description: "Maintenance Requests",
    },
    {
      icon: IconReceipt,
      label: "Transactions",
      href: "/transactions",
      description: "Payment History",
    },
    {
      icon: IconUser,
      label: "Profile",
      href: "/tenant-profile",
      description: "My Account",
    },
  ];

  // Select navigation items based on user role
  const navItems = userRole === "admin" ? adminNavItems : tenantNavItems;
  const userTitle = userRole === "admin" ? "Property Manager" : "Tenant";

  return (
    <AppShell
      navbar={{
        width: collapsed ? 80 : 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      header={{ height: { base: 50, md: 0 } }}
      padding="md"
    >
      <AppShell.Header p="md" hiddenFrom="sm">
        <Group justify="space-between">
          <Burger
            opened={opened}
            onClick={() => setOpened(!opened)}
            size="sm"
          />
          <Text size="lg" fw={700} c="blue">
            SubdiviSync
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p={collapsed ? "xs" : "md"}>
        <AppShell.Section>
          <Group justify="space-between" mb="md">
            {!collapsed && (
              <div>
                <Text size="xl" fw={700} c="blue">
                  SubdiviSync
                </Text>
                <Badge
                  size="xs"
                  variant="light"
                  color={userRole === "admin" ? "red" : "green"}
                  mt="xs"
                >
                  {userRole.toUpperCase()}
                </Badge>
              </div>
            )}
            <Tooltip
              label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              position="right"
              visibleFrom="sm"
            >
              <ActionIcon
                variant="subtle"
                onClick={() => setCollapsed(!collapsed)}
                visibleFrom="sm"
              >
                {collapsed ? (
                  <IconMenu2 size="1.2rem" />
                ) : (
                  <IconChevronLeft size="1.2rem" />
                )}
              </ActionIcon>
            </Tooltip>
          </Group>
        </AppShell.Section>

        <Divider mb="md" />

        <AppShell.Section grow>
          <Stack gap="xs">
            {navItems.map((item) => (
              <Tooltip
                key={item.href}
                label={
                  collapsed
                    ? `${item.label} - ${item.description}`
                    : item.description
                }
                position="right"
                disabled={!collapsed}
                openDelay={300}
              >
                <NavLink
                  component={Link}
                  href={item.href}
                  active={pathname === item.href}
                  label={collapsed ? "" : item.label}
                  leftSection={<item.icon size="1.2rem" stroke={1.5} />}
                  rightSection={
                    !collapsed && (
                      <IconChevronRight size="0.8rem" stroke={1.5} />
                    )
                  }
                  variant="filled"
                  style={collapsed ? { justifyContent: "center" } : undefined}
                />
              </Tooltip>
            ))}
          </Stack>
        </AppShell.Section>

        <Divider my="md" />

        <AppShell.Section>
          {collapsed ? (
            <Tooltip label={`${userName} - ${userTitle}`} position="right">
              <Group justify="center">
                <Avatar src={userImage} radius="xl" size="sm">
                  {!userImage && userName.charAt(0).toUpperCase()}
                </Avatar>
              </Group>
            </Tooltip>
          ) : (
            <Group>
              <Avatar src={userImage} radius="xl" size="sm">
                {!userImage && userName.charAt(0).toUpperCase()}
              </Avatar>
              <div style={{ flex: 1 }}>
                <Text size="sm" fw={500}>
                  {userName}
                </Text>
                <Text c="dimmed" size="xs">
                  {userEmail || userTitle}
                </Text>
              </div>
              <Tooltip label="Logout">
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => setShowLogoutModal(true)}
                >
                  <IconLogout size="1rem" />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>

      {/* Logout Confirmation Modal */}
      <Modal
        opened={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
        centered
        size="sm"
      >
        <Text size="sm" mb="lg">
          Are you sure you want to logout? You will be redirected to the login
          page.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={() => setShowLogoutModal(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleLogout}>
            Logout
          </Button>
        </Group>
      </Modal>
    </AppShell>
  );
}
