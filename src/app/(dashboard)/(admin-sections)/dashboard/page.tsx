"use client";

import {
  Title,
  Text,
  Grid,
  Card,
  Group,
  Stack,
  Badge,
  ActionIcon,
  SimpleGrid,
  Container,
  Flex,
  Box,
  ThemeIcon,
  Table,
  Loader,
  Center,
  Notification,
  useMantineTheme,
  useMantineColorScheme,
  rgba,
} from "@mantine/core";
import {
  IconHome,
  IconUsers,
  IconCurrencyDollar,
  IconTrendingUp,
  IconDots,
  IconX,
  IconCheck,
} from "@tabler/icons-react";
import { LineChart, BarChart, PieChart } from "@mantine/charts";
import { useEffect, useState } from "react";
import { getServerSession } from "@/better-auth/action";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface Property {
  _id: string;
  title: string;
  location: string;
  size: string;
  price: number;
  type: "residential-lot" | "commercial" | "house-and-lot" | "condo";
  status: "CREATED" | "UNDER_INQUIRY" | "APPROVED" | "REJECTED" | "LEASED";
  images?: string[];
  amenities: string[];
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  created_by: string;
  created_at: Date;
  updated_at?: Date;
  owner?: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    paymentStatus: "paid" | "partial" | "pending";
    paymentMethod?: string;
  };
  inquiries?: {
    fullName: string;
    email: string;
    phone: string;
    reason: string;
    submittedAt: string;
    status: "pending" | "approved" | "rejected";
  }[];
}

interface MonthlyPayment {
  _id: string;
  paymentPlanId: string;
  propertyId: string;
  tenantEmail: string;
  monthNumber: number;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  paymentIntentId?: string;
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
  receiptUrl?: string;
  created_at: string;
  updated_at: string;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: "low" | "medium" | "high";
  scheduledDate: Date;
  images: { url: string; publicId: string }[];
  created_by: string;
  created_at: Date;
  updated_at?: Date;
}

interface Tenant {
  _id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: string;
  created_at: string;
}

interface NotificationType {
  type: "success" | "error";
  message: string;
}

export default function Dashboard() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<MonthlyPayment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationType | null>(
    null
  );
  const [stats, setStats] = useState([
    {
      title: "Total Properties",
      value: "0",
      icon: IconHome,
      color: "blue",
      change: "+0%",
    },
    {
      title: "Active Tenants",
      value: "0",
      icon: IconUsers,
      color: "green",
      change: "+0%",
    },
    {
      title: "Monthly Revenue",
      value: "₱0", // Changed to PHP
      icon: IconCurrencyDollar,
      color: "yellow",
      change: "+0%",
    },
    {
      title: "Occupancy Rate",
      value: "0%",
      icon: IconTrendingUp,
      color: "teal",
      change: "+0%",
    },
  ]);
  const [tenantData, setTenantData] = useState<
    { month: string; tenants: number }[]
  >([]);
  const [paymentData, setPaymentData] = useState<
    { month: string; payments: number }[]
  >([]);
  const [occupancyData, setOccupancyData] = useState([
    { name: "Occupied", value: 0, color: "green.6" },
    { name: "Vacant", value: 0, color: "red.6" },
  ]);
  const [recentActivity, setRecentActivity] = useState<
    { text: string; time: string; status: string; color: string }[]
  >([]);

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getServerSession();
      if (session?.user?.role !== "admin") {
        router.push("/tenant-dashboard");
      } else {
        fetchAllData();
        const interval = setInterval(fetchAllData, 30000);
        return () => clearInterval(interval);
      }
    };
    fetchSession();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProperties(),
        fetchPayments(),
        fetchAnnouncements(),
        fetchTenants(),
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showNotification(
        "error",
        "Failed to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    const res = await fetch("/api/properties?status=all");
    if (!res.ok) throw new Error("Failed to fetch properties");
    const data = await res.json();
    setProperties(data.properties || []);
  };

  const fetchPayments = async () => {
    const res = await fetch("/api/monthly-payments");
    if (!res.ok) throw new Error("Failed to fetch payments");
    const data = await res.json();
    setPayments(data.payments || []);
  };

  const fetchAnnouncements = async () => {
    const res = await fetch("/api/announcements?limit=10");
    if (!res.ok) throw new Error("Failed to fetch announcements");
    const data = await res.json();
    setAnnouncements(data.announcements || []);
  };

  const fetchTenants = async () => {
    const { data: users, error } = await authClient.admin.listUsers({
      query: {
        filterField: "role",
        filterValue: "tenant",
        filterOperator: "eq",
        limit: 100,
      },
    });
    if (error) throw new Error("Failed to fetch tenants");
    const mappedTenants = (users.users || []).map((user) => ({
      _id: user.id,
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      status: "Active",
      created_at: user.createdAt.toISOString(),
    }));
    setTenants(mappedTenants);
  };

  useEffect(() => {
    if (properties.length > 0 || tenants.length > 0 || payments.length > 0) {
      computeStats();
      computeTenantData();
      computePaymentData();
      computeOccupancyData();
      computeRecentActivity();
    }
  }, [properties, tenants, payments, announcements]);

  const computeStats = () => {
    const totalProperties = properties.length;
    const activeTenants = tenants.filter((t) => t.status === "Active").length;
    const occupied = properties.filter((p) => p.status === "LEASED").length;
    const occupancyRate =
      totalProperties > 0 ? Math.round((occupied / totalProperties) * 100) : 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = payments
      .filter((p) => {
        const paidDate = new Date(p.paidDate || p.dueDate);
        return (
          p.status === "paid" &&
          paidDate.getMonth() === currentMonth &&
          paidDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);

    setStats([
      {
        title: "Total Properties",
        value: totalProperties.toString(),
        icon: IconHome,
        color: "blue",
        change: "+0%",
      },
      {
        title: "Active Tenants",
        value: activeTenants.toString(),
        icon: IconUsers,
        color: "green",
        change: "+0%",
      },
      {
        title: "Monthly Revenue",
        value: `₱${monthlyRevenue.toLocaleString("en-PH")}`, // Changed to PHP
        icon: IconCurrencyDollar,
        color: "yellow",
        change: "+0%",
      },
      {
        title: "Occupancy Rate",
        value: `${occupancyRate}%`,
        icon: IconTrendingUp,
        color: "teal",
        change: "+0%",
      },
    ]);
  };

  const computeTenantData = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const tenantCounts = Array(6).fill(0);
    const now = new Date();
    tenants.forEach((t) => {
      const created = new Date(t.created_at);
      const monthDiff =
        now.getFullYear() * 12 +
        now.getMonth() -
        (created.getFullYear() * 12 + created.getMonth());
      if (monthDiff < 6) {
        tenantCounts[5 - monthDiff]++;
      }
    });
    setTenantData(
      months.slice(-6).map((month, i) => ({ month, tenants: tenantCounts[i] }))
    );
  };

  const computePaymentData = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const paymentSums = Array(6).fill(0);
    const now = new Date();
    payments.forEach((p) => {
      if (p.status === "paid") {
        const paidDate = new Date(p.paidDate || p.dueDate);
        const monthDiff =
          now.getFullYear() * 12 +
          now.getMonth() -
          (paidDate.getFullYear() * 12 + paidDate.getMonth());
        if (monthDiff < 6) {
          paymentSums[5 - monthDiff] += p.amount;
        }
      }
    });
    setPaymentData(
      months.slice(-6).map((month, i) => ({ month, payments: paymentSums[i] }))
    );
  };

  const computeOccupancyData = () => {
    const occupied = properties.filter((p) => p.status === "LEASED").length;
    const vacant = properties.length - occupied;
    setOccupancyData([
      { name: "Occupied", value: occupied, color: "green.6" },
      { name: "Vacant", value: vacant, color: "red.6" },
    ]);
  };

  const computeRecentActivity = () => {
    const activities = [
      ...payments
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        .slice(0, 5)
        .map((p) => ({
          text: `Payment ${p.status} for ${
            p.tenantEmail
          } - ₱${p.amount.toLocaleString("en-PH")}`, // Changed to PHP
          time: new Date(p.updated_at).toLocaleString(),
          status: p.status.charAt(0).toUpperCase() + p.status.slice(1),
          color:
            p.status === "paid"
              ? "blue"
              : p.status === "overdue"
              ? "red"
              : "yellow",
        })),
      ...announcements
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5)
        .map((a) => ({
          text: `Announcement: ${a.title}`,
          time: new Date(a.created_at).toLocaleString(),
          status: a.priority.charAt(0).toUpperCase() + a.priority.slice(1),
          color:
            a.priority === "high"
              ? "red"
              : a.priority === "medium"
              ? "yellow"
              : "blue",
        })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
    setRecentActivity(activities);
  };

  // Theme-aware shadow helper
  const getHoverShadow = () => {
    const baseShadow = "0 4px 12px";
    const opacity = colorScheme === "dark" ? 0.3 : 0.15;
    return `${baseShadow} ${rgba(theme.black, opacity)}`;
  };

  const getDefaultShadow = () => {
    const baseShadow = "0 1px 3px";
    const opacity = colorScheme === "dark" ? 0.2 : 0.12;
    return `${baseShadow} ${rgba(theme.black, opacity)}`;
  };

  // Primary text color (white in dark mode, dark in light mode)
  const primaryTextColor = colorScheme === "dark" ? "white" : "dark.9";

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ height: 400 }}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" px="md">
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
          <Title order={1} size="h2" fw={600} c={primaryTextColor} mb="xs">
            Property Management Dashboard
          </Title>
          <Text c="dimmed" size="md" lh={1.5}>
            Welcome back! Here&#39;s what&#39;s happening with your properties
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
                boxShadow: getDefaultShadow(),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = getHoverShadow();
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = getDefaultShadow();
              }}
            >
              <Flex justify="space-between" align="flex-start" gap="md">
                <Stack gap="xs" flex={1}>
                  <Text
                    c="dimmed"
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
                  <Title order={3} size="h4" fw={600} c={primaryTextColor}>
                    Tenant Growth Trend
                  </Title>
                  <Text size="sm" c="dimmed">
                    Last 6 months
                  </Text>
                </Group>
                <Box flex={1}>
                  <LineChart
                    h={280}
                    data={tenantData}
                    dataKey="month"
                    series={[
                      {
                        name: "tenants",
                        color: "blue.6",
                        label: "Active Tenants",
                      },
                    ]}
                    curveType="linear"
                    gridAxis="xy"
                    withLegend
                    legendProps={{ verticalAlign: "bottom", height: 50 }}
                    aria-label="Line chart showing tenant growth over 6 months"
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
                  <Title order={3} size="h4" fw={600} c={primaryTextColor}>
                    Monthly Revenue
                  </Title>
                  <Text size="sm" c="dimmed">
                    PHP
                  </Text>
                </Group>
                <Box flex={1}>
                  <BarChart
                    h={280}
                    data={paymentData}
                    dataKey="month"
                    series={[
                      { name: "payments", color: "teal.6", label: "Revenue" },
                    ]}
                    gridAxis="xy"
                    withLegend
                    legendProps={{ verticalAlign: "bottom", height: 50 }}
                    aria-label="Bar chart showing monthly payment revenue"
                    valueFormatter={(value) =>
                      `₱${value.toLocaleString("en-PH")}`
                    } // Format as PHP
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
                <Title order={3} size="h4" fw={600} c={primaryTextColor}>
                  Occupancy Overview
                </Title>
                <Box>
                  <PieChart
                    h={220}
                    data={occupancyData}
                    withLabelsLine
                    labelsPosition="outside"
                    labelsType="percent"
                    withTooltip
                    aria-label="Pie chart showing house occupancy status"
                  />
                </Box>
                <Flex justify="center" gap="xl" wrap="wrap">
                  <Group gap="xs">
                    <Box
                      w={12}
                      h={12}
                      bg="teal.6"
                      style={{ borderRadius: 3 }}
                      aria-hidden="true"
                    />
                    <Text size="sm" c={primaryTextColor} fw={500}>
                      Occupied ({occupancyData[0].value})
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Box
                      w={12}
                      h={12}
                      bg="red.6"
                      style={{ borderRadius: 3 }}
                      aria-hidden="true"
                    />
                    <Text size="sm" c={primaryTextColor} fw={500}>
                      Vacant ({occupancyData[1].value})
                    </Text>
                  </Group>
                </Flex>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 7 }}>
            <Card padding="xl" radius="lg" withBorder shadow="sm">
              <Stack gap="lg">
                <Group justify="space-between" align="center">
                  <Title order={3} size="h4" fw={600} c={primaryTextColor}>
                    Recent Activity
                  </Title>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label="More options"
                  >
                    <IconDots size="1rem" />
                  </ActionIcon>
                </Group>
                <Stack gap="lg">
                  {recentActivity.map((activity, index) => (
                    <Flex
                      key={index}
                      justify="space-between"
                      align="center"
                      gap="md"
                    >
                      <Stack gap={4} flex={1}>
                        <Text size="sm" fw={500} c={primaryTextColor} lh={1.4}>
                          {activity.text}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {activity.time}
                        </Text>
                      </Stack>
                      <Badge
                        color={activity.color}
                        variant="light"
                        radius="md"
                        size="sm"
                      >
                        {activity.status}
                      </Badge>
                    </Flex>
                  ))}
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        <Card padding="xl" radius="lg" withBorder shadow="sm">
          <Title order={3} size="h4" fw={600} c={primaryTextColor} mb="md">
            Recent Payments
          </Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tenant Email</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Due Date</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Paid Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {payments
                .sort(
                  (a, b) =>
                    new Date(b.dueDate).getTime() -
                    new Date(a.dueDate).getTime()
                )
                .slice(0, 10)
                .map((payment) => (
                  <Table.Tr key={payment._id}>
                    <Table.Td>{payment.tenantEmail}</Table.Td>
                    <Table.Td>
                      ₱{payment.amount.toLocaleString("en-PH")}{" "}
                      {/* Changed to PHP */}
                    </Table.Td>
                    <Table.Td>
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          payment.status === "paid"
                            ? "green"
                            : payment.status === "overdue"
                            ? "red"
                            : "yellow"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {payment.paidDate
                        ? new Date(payment.paidDate).toLocaleDateString()
                        : "-"}
                    </Table.Td>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
          {payments.length === 0 && (
            <Text c="dimmed" ta="center" mt="md">
              No recent payments
            </Text>
          )}
        </Card>

        <Card padding="xl" radius="lg" withBorder shadow="sm">
          <Title order={3} size="h4" fw={600} c={primaryTextColor} mb="md">
            Recent Tenants
          </Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created At</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tenants
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .slice(0, 10)
                .map((tenant) => (
                  <Table.Tr key={tenant._id}>
                    <Table.Td>{tenant.user_name}</Table.Td>
                    <Table.Td>{tenant.user_email}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          tenant.status === "Active"
                            ? "green"
                            : tenant.status === "Inactive"
                            ? "red"
                            : "yellow"
                        }
                      >
                        {tenant.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </Table.Td>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
          {tenants.length === 0 && (
            <Text c="dimmed" ta="center" mt="md">
              No tenants
            </Text>
          )}
        </Card>
      </Stack>
    </Container>
  );
}
