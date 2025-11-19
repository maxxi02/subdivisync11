"use client";

import React, { useState, useEffect } from "react";
import {
  Title,
  Text,
  Grid,
  Card,
  Group,
  Stack,
  Badge,
  SimpleGrid,
  Container,
  Flex,
  Box,
  ThemeIcon,
  Notification,
  useMantineTheme,
  useMantineColorScheme,
  rgba,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconClipboardCheck,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { getServerSession } from "@/better-auth/action";
import Image from "next/image";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: string;
  scheduledDate: Date;
  images: { url: string }[];
}

interface Property {
  _id: string;
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number;
  downPayment: number;
  monthlyPayment: number;
  interestRate: number;
  leaseDuration: number;
  totalAmount: number;
  startDate: Date;
  currentMonth: number;
  remainingBalance: number;
  nextPaymentDate: Date;
  status: string;
  tenant: {
    fullName: string;
    email: string;
    phone: string;
    created_at: string;
    updated_at: string;
  };
}

interface ServiceRequest {
  id: string;
  category: string;
  description: string;
  status: string;
  created_at: Date;
  priority: "low" | "medium" | "high";
}

interface MonthlyPayment {
  _id: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
}

interface NotificationType {
  type: "success" | "error";
  message: string;
}

const TenantDashboard = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [payments, setPayments] = useState<MonthlyPayment[]>([]);
  const [notification, setNotification] = useState<NotificationType | null>(
    null
  );

  const primaryTextColor = colorScheme === "dark" ? "white" : "dark";
  const getDefaultShadow = () => {
    const baseShadow = "0 1px 3px";
    const opacity = colorScheme === "dark" ? 0.2 : 0.12;
    return `${baseShadow} ${rgba(theme.black, opacity)}`;
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getServerSession();
        if (session?.user?.role !== "tenant") {
          router.push("/admin-dashboard");
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        showNotification(
          "error",
          "Failed to verify session. Please try again."
        );
      }
    };
    fetchSession();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch latest announcements (limit to 5)
        const annRes = await fetch("/api/announcements?limit=5&page=1");
        const annData = await annRes.json();
        if (annData.success) {
          setAnnouncements(annData.announcements);
          showNotification("success", "Announcements loaded successfully");
        } else {
          showNotification(
            "error",
            annData.error || "Failed to load announcements"
          );
        }

        // Fetch payment plans
        const propRes = await fetch("/api/tenant/payment-plans");
        const propData = await propRes.json();
        if (propData.success) {
          setProperties(propData.paymentPlans);
          showNotification("success", "Payment plans loaded successfully");
        } else {
          showNotification(
            "error",
            propData.error || "Failed to load payment plans"
          );
        }

        // Fetch service requests history
        const srRes = await fetch("/api/service-requests");
        const srData = await srRes.json();
        if (srData.success) {
          setServiceRequests(srData.serviceRequests);
          showNotification("success", "Service requests loaded successfully");
        } else {
          showNotification(
            "error",
            srData.error || "Failed to load service requests"
          );
        }

        // Fetch payments and calculate overdue
        const payRes = await fetch("/api/tenant/monthly-payments");
        const payData = await payRes.json();
        if (payData.success) {
          const today = new Date("2025-09-29"); // Use provided current date
          const updatedPayments = payData.payments.map((p: MonthlyPayment) => {
            if (p.status === "pending" && new Date(p.dueDate) < today) {
              return { ...p, status: "overdue" as const };
            }
            return p;
          });
          setPayments(updatedPayments);
          showNotification("success", "Payments loaded successfully");
        } else {
          showNotification("error", payData.error || "Failed to load payments");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        showNotification(
          "error",
          (error as Error).message ||
            "Failed to load dashboard data. Please try again."
        );
      }
    };

    fetchData();
  }, []);
  const stats = [
    {
      title: "Announcements",
      value: announcements.length.toString(),
      icon: IconAlertCircle,
      color: "teal",
    },
    {
      title: "Pending Requests",
      value: serviceRequests
        .filter((s) => s.status === "pending")
        .length.toString(),
      icon: IconClipboardCheck,
      color: "yellow",
    },
    {
      title: "In Progress",
      value: serviceRequests
        .filter((s) => s.status === "in-progress")
        .length.toString(),
      icon: IconClipboardCheck,
      color: "blue",
    },
    {
      title: "Completed",
      value: serviceRequests
        .filter((s) => s.status === "completed")
        .length.toString(),
      icon: IconCheck,
      color: "green",
    },
    {
      title: "High Priority",
      value: serviceRequests // Changed from announcements
        .filter((s) => s.priority === "high") // Changed from a.priority
        .length.toString(),
      icon: IconAlertCircle,
      color: "red",
    },
  ];

  return (
    <Container size="100%" py="xl">
      {notification && (
        <Notification
          icon={
            notification.type === "success" ? (
              <IconCheck size={18} />
            ) : (
              <IconX size={18} />
            )
          }
          color={notification.type === "success" ? "green" : "red"}
          title={notification.type === "success" ? "Success" : "Error"}
          onClose={() => setNotification(null)}
          style={{ position: "fixed", top: 20, right: 20, zIndex: 1000 }}
        >
          {notification.message}
        </Notification>
      )}
      <Stack gap="xl">
        <Box py="md">
          <Title order={1} size="h2" fw={600} c={primaryTextColor}>
            Homeowner&#39;s Dashboard
          </Title>
          <Text c={primaryTextColor} size="md" lh={1.5}>
            Welcome back! Here&#39;s what&#39;s happening with your dashboard today.
          </Text>
        </Box>

        <SimpleGrid
          cols={{ base: 1, xs: 2, sm: 2, md: 5 }}
          spacing={{ base: "md", sm: "lg" }}
          verticalSpacing={{ base: "md", sm: "lg" }}
        >
          {stats.map((stat) => (
            <Card
              key={stat.title}
              padding="xl"
              radius="lg"
              withBorder
              style={{
                boxShadow: getDefaultShadow(),
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = getDefaultShadow();
              }}
            >
              <Flex justify="space-between" align="flex-start" gap="md">
                <Stack gap="xs" flex={1}>
                  <Text
                    c={primaryTextColor}
                    size="sm"
                    tt="uppercase"
                    fw={600}
                    lts={0.5}
                    role="heading"
                    aria-level={3}
                  >
                    {stat.title}
                  </Text>
                  <Text fw={700} size="xl" c={primaryTextColor} lh={1.2}>
                    {stat.value}
                  </Text>
                </Stack>
                <ThemeIcon
                  variant="light"
                  color={stat.color}
                  size="xl"
                  radius="lg"
                  aria-hidden="true"
                >
                  <stat.icon size="1.5rem" />
                </ThemeIcon>
              </Flex>
            </Card>
          ))}
        </SimpleGrid>

        <Grid gutter={{ base: "md", md: "xl" }}>
          {/* Latest Announcements with Images */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Card
              padding="xl"
              radius="lg"
              withBorder
              style={{ boxShadow: getDefaultShadow() }}
            >
              <Stack gap="lg">
                <Group justify="space-between" align="center">
                  <Title order={3} size="h4" fw={600} c={primaryTextColor}>
                    Latest Announcements
                  </Title>
                  <span
                    className="text-blue-500 p-1 text-sm cursor-pointer hover:underline"
                    onClick={() => router.push("/view-announcements")}
                  >
                    View All
                  </span>
                </Group>
                <Stack gap="xl">
                  {announcements.length === 0 ? (
                    <Text c={primaryTextColor}>
                      No announcements available.
                    </Text>
                  ) : (
                    announcements.map((ann) => (
                      <Card
                        key={ann._id}
                        padding="md"
                        radius="md"
                        withBorder
                        style={{
                          backgroundColor:
                            colorScheme === "dark"
                              ? theme.colors.dark[6]
                              : theme.white,
                        }}
                      >
                        <Grid gutter="md">
                          {/* Image Section */}
                          {ann.images && ann.images.length > 0 && (
                            <Grid.Col span={{ base: 12, sm: 4 }}>
                              <Box
                                style={{
                                  width: "100%",
                                  height: 150,
                                  borderRadius: theme.radius.md,
                                  overflow: "hidden",
                                  backgroundColor:
                                    colorScheme === "dark"
                                      ? theme.colors.dark[5]
                                      : theme.colors.gray[1],
                                }}
                              >
                                <Image
                                  width={500}
                                  height={500}
                                  src={ann.images[0].url}
                                  alt={ann.title}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              </Box>
                            </Grid.Col>
                          )}

                          {/* Content Section */}
                          <Grid.Col
                            span={{
                              base: 12,
                              sm: ann.images && ann.images.length > 0 ? 8 : 12,
                            }}
                          >
                            <Stack gap="xs">
                              <Group justify="space-between" align="flex-start">
                                <Title
                                  order={4}
                                  size="h5"
                                  fw={600}
                                  c={primaryTextColor}
                                  style={{ flex: 1 }}
                                >
                                  {ann.title}
                                </Title>
                                <Badge
                                  color={
                                    ann.priority === "high"
                                      ? "red"
                                      : ann.priority === "medium"
                                        ? "yellow"
                                        : "green"
                                  }
                                  variant="light"
                                  size="sm"
                                  radius="md"
                                >
                                  {ann.priority}
                                </Badge>
                              </Group>

                              <Text
                                size="sm"
                                c={primaryTextColor}
                                lineClamp={2}
                              >
                                {ann.content}
                              </Text>

                              <Group gap="xs" mt="xs">
                                <IconAlertCircle
                                  size={16}
                                  color={
                                    colorScheme === "dark"
                                      ? theme.colors.gray[5]
                                      : theme.colors.gray[6]
                                  }
                                />
                                <Text
                                  size="xs"
                                  c={
                                    colorScheme === "dark"
                                      ? theme.colors.gray[5]
                                      : theme.colors.gray[6]
                                  }
                                >
                                  Posted on{" "}
                                  {new Date(
                                    ann.scheduledDate
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </Text>
                              </Group>
                            </Stack>
                          </Grid.Col>
                        </Grid>
                      </Card>
                    ))
                  )}
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>

          {/* Service Requests */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Card
              padding="xl"
              radius="lg"
              withBorder
              style={{ boxShadow: getDefaultShadow() }}
            >
              <Stack gap="lg">
                <Group justify="space-between" align="center">
                  <Title order={3} size="h4" fw={600} c={primaryTextColor}>
                    Service Requests
                  </Title>
                  <span
                    className="text-blue-500 p-1 text-sm cursor-pointer hover:underline"
                    onClick={() => router.push("/service-requests")}
                  >
                    View All
                  </span>
                </Group>
                <Stack gap="md">
                  {serviceRequests.length === 0 ? (
                    <Text c={primaryTextColor}>No service requests.</Text>
                  ) : (
                    serviceRequests.slice(0, 5).map((sr) => (
                      <Card
                        key={sr.id}
                        padding="sm"
                        radius="md"
                        withBorder
                        style={{
                          backgroundColor:
                            colorScheme === "dark"
                              ? theme.colors.dark[6]
                              : theme.colors.gray[0],
                        }}
                      >
                        <Stack gap="xs">
                          <Group justify="space-between" align="flex-start">
                            <Text size="sm" fw={600} c={primaryTextColor}>
                              {sr.category}
                            </Text>
                            <Badge
                              color={
                                sr.status === "completed"
                                  ? "green"
                                  : sr.status === "in-progress"
                                    ? "blue"
                                    : sr.status === "cancelled"
                                      ? "red"
                                      : "yellow"
                              }
                              variant="light"
                              size="xs"
                              radius="md"
                            >
                              {sr.status}
                            </Badge>
                          </Group>

                          <Text size="xs" c={primaryTextColor} lineClamp={2}>
                            {sr.description}
                          </Text>

                          <Group gap="xs" mt="xs">
                            <IconClipboardCheck
                              size={14}
                              color={
                                colorScheme === "dark"
                                  ? theme.colors.gray[6]
                                  : theme.colors.gray[5]
                              }
                            />
                            <Text
                              size="xs"
                              c={
                                colorScheme === "dark"
                                  ? theme.colors.gray[6]
                                  : theme.colors.gray[5]
                              }
                            >
                              {new Date(sr.created_at).toLocaleDateString()}
                            </Text>
                          </Group>
                        </Stack>
                      </Card>
                    ))
                  )}
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
};

export default TenantDashboard;
