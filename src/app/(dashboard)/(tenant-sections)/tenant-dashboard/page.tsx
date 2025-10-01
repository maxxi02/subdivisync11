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
} from "@mantine/core";
import {
  IconHome,
  IconCurrencyDollar,
  IconAlertCircle,
  IconClipboardCheck,
} from "@tabler/icons-react";
import { BarChart, PieChart } from "@mantine/charts";
import { useRouter } from "next/navigation";
import { getServerSession } from "@/better-auth/action";

// Assuming these interfaces are defined elsewhere or imported
// For completeness, including minimal versions here
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
}

interface MonthlyPayment {
  _id: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
}

const TenantDashboard = () => {
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getServerSession();
      if (session?.user?.role !== "tenant") {
        router.push("/admin-dashboard");
      }
    };
    fetchSession();
  }, []);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [payments, setPayments] = useState<MonthlyPayment[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch latest announcements (limit to 5)
        const annRes = await fetch("/api/announcements?limit=5&page=1");
        const annData = await annRes.json();
        if (annData.success) {
          setAnnouncements(annData.announcements);
        }

        // Fetch payment plans (changed from properties to get payment plan details)
        const propRes = await fetch("/api/tenant/payment-plans");
        const propData = await propRes.json();
        if (propData.success) {
          setProperties(propData.paymentPlans);
        }

        // Fetch service requests history
        const srRes = await fetch("/api/service-requests");
        const srData = await srRes.json();
        if (srData.success) {
          setServiceRequests(srData.serviceRequests);
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
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  // Stats for tenant
  const stats = [
    {
      title: "My Properties",
      value: properties.length.toString(),
      icon: IconHome,
      color: "blue",
      change: "+0%",
    },
    {
      title: "Service Requests",
      value: serviceRequests.length.toString(),
      icon: IconClipboardCheck,
      color: "green",
      change: "+0%",
    },
    {
      title: "Pending Payments",
      value: payments
        .filter((p) => p.status === "pending" || p.status === "overdue")
        .length.toString(),
      icon: IconCurrencyDollar,
      color: "yellow",
      change: "+0%",
    },
    {
      title: "Announcements",
      value: announcements.length.toString(),
      icon: IconAlertCircle,
      color: "teal",
      change: "+0%",
    },
  ];

  // Payment analytics for bar chart
  const monthlyData = payments.reduce(
    (
      acc: { [key: string]: { month: string; paid: number; due: number } },
      p
    ) => {
      const month = new Date(p.dueDate).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (!acc[month]) {
        acc[month] = { month, paid: 0, due: 0 };
      }
      if (p.status === "paid") {
        acc[month].paid += p.amount;
      } else {
        acc[month].due += p.amount;
      }
      return acc;
    },
    {}
  );

  const barData = Object.values(monthlyData).sort(
    (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
  );

  // Service request pie data
  const srStats = [
    {
      name: "Pending",
      value: serviceRequests.filter((s) => s.status === "pending").length,
      color: "yellow.6",
    },
    {
      name: "In Progress",
      value: serviceRequests.filter((s) => s.status === "in-progress").length,
      color: "blue.6",
    },
    {
      name: "Completed",
      value: serviceRequests.filter((s) => s.status === "completed").length,
      color: "green.6",
    },
    {
      name: "Cancelled",
      value: serviceRequests.filter((s) => s.status === "cancelled").length,
      color: "red.6",
    },
  ];

  // Payment pie data
  const paymentStats = [
    {
      name: "Paid",
      value: payments.filter((p) => p.status === "paid").length,
      color: "green.6",
    },
    {
      name: "Pending",
      value: payments.filter((p) => p.status === "pending").length,
      color: "yellow.6",
    },
    {
      name: "Overdue",
      value: payments.filter((p) => p.status === "overdue").length,
      color: "red.6",
    },
  ];

  return (
    <Container size="xl" px="md">
      <Stack gap="xl">
        <Box py="md">
          <Title order={1} size="h2" fw={600} c="gray.9" mb="xs">
            Tenant Dashboard
          </Title>
          <Text c="gray.6" size="md" lh={1.5}>
            Welcome back! Here&#39;s what&#39;s happening with your tenancy
            today.
          </Text>
        </Box>

        <SimpleGrid
          cols={{ base: 1, xs: 2, sm: 2, md: 4 }}
          spacing={{ base: "md", sm: "lg" }}
          verticalSpacing={{ base: "md", sm: "lg" }}
        >
          {stats.map((stat) => (
            <Card
              key={stat.title}
              padding="xl"
              radius="lg"
              withBorder
              shadow="sm"
              style={{
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
                e.currentTarget.style.boxShadow =
                  "0 1px 3px rgba(0, 0, 0, 0.12)";
              }}
            >
              <Flex justify="space-between" align="flex-start" gap="md">
                <Stack gap="xs" flex={1}>
                  <Text
                    c="gray.6"
                    size="sm"
                    tt="uppercase"
                    fw={600}
                    lts={0.5}
                    role="heading"
                    aria-level={3}
                  >
                    {stat.title}
                  </Text>
                  <Text fw={700} size="xl" c="gray.9" lh={1.2}>
                    {stat.value}
                  </Text>
                  <Badge
                    color={stat.color}
                    variant="light"
                    size="sm"
                    radius="md"
                    aria-label={`Change: ${stat.change}`}
                  >
                    {stat.change}
                  </Badge>
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
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Card
              padding="xl"
              radius="lg"
              withBorder
              shadow="sm"
              h={{ base: "auto", lg: 400 }}
            >
              <Stack gap="lg" h="100%">
                <Group justify="space-between" align="center">
                  <Title order={3} size="h4" fw={600} c="gray.8">
                    Monthly Payments Overview
                  </Title>
                  <Text size="sm" c="gray.6">
                    Last 6 months
                  </Text>
                </Group>
                <Box flex={1}>
                  <BarChart
                    h={280}
                    data={barData}
                    dataKey="month"
                    series={[
                      { name: "paid", color: "green.6", label: "Paid" },
                      { name: "due", color: "red.6", label: "Due" },
                    ]}
                    gridAxis="xy"
                    withLegend
                    legendProps={{ verticalAlign: "bottom", height: 50 }}
                    aria-label="Bar chart showing monthly payments"
                  />
                </Box>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Card
              padding="xl"
              radius="lg"
              withBorder
              shadow="sm"
              h={{ base: "auto", lg: 400 }}
            >
              <Stack gap="lg" h="100%">
                <Group justify="space-between" align="center">
                  <Title order={3} size="h4" fw={600} c="gray.8">
                    Service Requests Status
                  </Title>
                </Group>
                <Box flex={1}>
                  <PieChart
                    h={280}
                    data={srStats}
                    withLabelsLine
                    labelsPosition="outside"
                    labelsType="percent"
                    withTooltip
                    aria-label="Pie chart showing service request statuses"
                  />
                </Box>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        <Grid gutter={{ base: "md", md: "xl" }}>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Card padding="xl" radius="lg" withBorder shadow="sm">
              <Stack gap="lg">
                <Title order={3} size="h4" fw={600} c="gray.8">
                  Payment Statuses
                </Title>
                <Box>
                  <PieChart
                    h={220}
                    data={paymentStats}
                    withLabelsLine
                    labelsPosition="outside"
                    labelsType="percent"
                    withTooltip
                    aria-label="Pie chart showing payment statuses"
                  />
                </Box>
                <Flex justify="center" gap="xl" wrap="wrap">
                  {paymentStats.map((stat, index) => (
                    <Group key={index} gap="xs">
                      <Box
                        w={12}
                        h={12}
                        bg={stat.color}
                        style={{ borderRadius: 3 }}
                        aria-hidden="true"
                      />
                      <Text size="sm" c="gray.7" fw={500}>
                        {stat.name} ({stat.value})
                      </Text>
                    </Group>
                  ))}
                </Flex>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 7 }}>
            <Card padding="xl" radius="lg" withBorder shadow="sm">
              <Stack gap="lg">
                <Group justify="space-between" align="center">
                  <Title order={3} size="h4" fw={600} c="gray.8">
                    Latest Announcements
                  </Title>
                  <span
                    className="text-blue-500 p-1 text-sm cursor-pointer hover:underline"
                    onClick={() => router.push("/view-announcements")}
                  >
                    Read More
                  </span>
                </Group>
                <Stack gap="lg">
                  {announcements.length === 0 ? (
                    <Text c="gray.6">No announcements available.</Text>
                  ) : (
                    announcements.map((ann) => (
                      <Flex
                        key={ann._id}
                        justify="space-between"
                        align="center"
                        gap="md"
                      >
                        <Stack gap={4} flex={1}>
                          <Text size="sm" fw={500} c="gray.8" lh={1.4}>
                            {ann.title}
                          </Text>
                          <Text size="xs" c="gray.5">
                            {new Date(ann.scheduledDate).toLocaleDateString()}
                          </Text>
                        </Stack>
                        <Badge
                          color="blue"
                          variant="light"
                          size="sm"
                          radius="md"
                        >
                          {ann.priority}
                        </Badge>
                      </Flex>
                    ))
                  )}
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={{ base: 12, md: 8, lg: 6 }}>
            <Card padding="xl" radius="lg" withBorder shadow="sm">
              <Stack gap="lg">
                <Title order={3} size="h4" fw={600} c="gray.8">
                  My Properties
                </Title>
                <Stack gap="xl">
                  {properties.length === 0 ? (
                    <Text c="gray.6">No properties leased.</Text>
                  ) : (
                    properties.map((prop) => (
                      <Stack key={prop._id} gap="xs">
                        <Group justify="space-between" align="center">
                          <Text size="sm" fw={500} c="gray.7">
                            {prop.propertyTitle}
                          </Text>
                          <Text size="sm" fw={600} c="gray.8">
                            ₱{prop.propertyPrice.toLocaleString()}
                          </Text>
                        </Group>
                        <Text size="xs" c="gray.5">
                          Lease Duration: {prop.leaseDuration} months
                        </Text>
                        <Text size="xs" c="gray.5">
                          Monthly Payment: ₱
                          {prop.monthlyPayment.toLocaleString()}
                        </Text>
                        <Text size="xs" c="gray.5">
                          Remaining Balance: ₱
                          {prop.remainingBalance.toLocaleString()}
                        </Text>
                        <Text size="xs" c="gray.5">
                          Next Payment Date:{" "}
                          {new Date(prop.nextPaymentDate).toLocaleDateString()}
                        </Text>
                        <Badge
                          color="green"
                          variant="light"
                          size="sm"
                          radius="md"
                        >
                          {prop.status}
                        </Badge>
                      </Stack>
                    ))
                  )}
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4, lg: 6 }}>
            <Card padding="xl" radius="lg" withBorder shadow="sm">
              <Stack gap="lg">
                <Title order={3} size="h4" fw={600} c="gray.8">
                  Service Requests History
                </Title>
                <Stack gap="xl">
                  {serviceRequests.length === 0 ? (
                    <Text c="gray.6">No service requests.</Text>
                  ) : (
                    serviceRequests.map((sr) => (
                      <Stack key={sr.id} gap="xs">
                        <Group justify="space-between" align="center">
                          <Text size="sm" fw={500} c="gray.7">
                            {sr.category}
                          </Text>
                          <Text size="xs" c="gray.5">
                            {new Date(sr.created_at).toLocaleDateString()}
                          </Text>
                        </Group>
                        <Text size="xs" c="gray.5">
                          {sr.description}
                        </Text>
                        <Badge
                          color="blue"
                          variant="light"
                          size="sm"
                          radius="md"
                        >
                          {sr.status}
                        </Badge>
                      </Stack>
                    ))
                  )}
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        <Card padding="xl" radius="lg" withBorder shadow="sm">
          <Stack gap="lg">
            <Title order={3} size="h4" fw={600} c="gray.8">
              Payments
            </Title>
            <Stack gap="xl">
              {payments.length === 0 ? (
                <Text c="gray.6">No payments.</Text>
              ) : (
                payments.map((p) => (
                  <Stack key={p._id.toString()} gap="xs">
                    <Group justify="space-between" align="center">
                      <Text size="sm" fw={500} c="gray.7">
                        ₱{p.amount.toLocaleString()}
                      </Text>
                      <Text size="xs" c="gray.5">
                        Due: {new Date(p.dueDate).toLocaleDateString()}
                      </Text>
                    </Group>
                    <Badge
                      color={
                        p.status === "paid"
                          ? "green"
                          : p.status === "overdue"
                          ? "red"
                          : "yellow"
                      }
                      variant="light"
                      size="sm"
                      radius="md"
                    >
                      {p.status}
                    </Badge>
                  </Stack>
                ))
              )}
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
};

export default TenantDashboard;
