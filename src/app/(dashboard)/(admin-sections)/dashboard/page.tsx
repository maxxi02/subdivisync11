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
  Progress,
  SimpleGrid,
  Container,
  Flex,
  Box,
  ThemeIcon,
} from "@mantine/core";
import {
  IconHome,
  IconUsers,
  IconCurrencyDollar,
  IconTrendingUp,
  IconDots,
} from "@tabler/icons-react";
import { LineChart, BarChart, PieChart } from "@mantine/charts";
import { useEffect } from "react";
import { getServerSession } from "@/better-auth/action";
import { useRouter } from "next/navigation";

const stats = [
  {
    title: "Total Properties",
    value: "24",
    icon: IconHome,
    color: "blue",
    change: "+12%",
  },
  {
    title: "Active Tenants",
    value: "18",
    icon: IconUsers,
    color: "green",
    change: "+5%",
  },
  {
    title: "Monthly Revenue",
    value: "$12,450",
    icon: IconCurrencyDollar,
    color: "yellow",
    change: "+8%",
  },
  {
    title: "Occupancy Rate",
    value: "92%",
    icon: IconTrendingUp,
    color: "teal",
    change: "+3%",
  },
];

const tenantData = [
  { month: "Jan", tenants: 12 },
  { month: "Feb", tenants: 14 },
  { month: "Mar", tenants: 16 },
  { month: "Apr", tenants: 15 },
  { month: "May", tenants: 17 },
  { month: "Jun", tenants: 18 },
];

const paymentData = [
  { month: "Jan", payments: 8500 },
  { month: "Feb", payments: 9200 },
  { month: "Mar", payments: 10100 },
  { month: "Apr", payments: 9800 },
  { month: "May", payments: 11200 },
  { month: "Jun", payments: 12450 },
];

const occupancyData = [
  { name: "Occupied", value: 18, color: "green.6" },
  { name: "Vacant", value: 6, color: "red.6" },
];

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getServerSession();
      if (session?.user?.role !== "admin") {
        router.push("/tenant-dashboard");
      }
    };
    fetchSession();
  }, []);

  return (
    <Container size="xl" px="md">
      <Stack gap="xl">
        <Box py="md">
          <Title order={1} size="h2" fw={600} c="gray.9" mb="xs">
            Property Management Dashboard
          </Title>
          <Text c="gray.6" size="md" lh={1.5}>
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
                    Tenant Growth Trend
                  </Title>
                  <Text size="sm" c="gray.6">
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
                  <Title order={3} size="h4" fw={600} c="gray.8">
                    Monthly Revenue
                  </Title>
                  <Text size="sm" c="gray.6">
                    USD
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
                    <Text size="sm" c="gray.7" fw={500}>
                      Occupied (18)
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
                    <Text size="sm" c="gray.7" fw={500}>
                      Vacant (6)
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
                  <Title order={3} size="h4" fw={600} c="gray.8">
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
                  {[
                    {
                      text: "New tenant moved in - Unit 4B",
                      time: "2 hours ago",
                      status: "Completed",
                      color: "teal",
                    },
                    {
                      text: "Maintenance request - Unit 2A",
                      time: "5 hours ago",
                      status: "Pending",
                      color: "yellow",
                    },
                    {
                      text: "Rent payment received - Unit 1C",
                      time: "1 day ago",
                      status: "Processed",
                      color: "blue",
                    },
                  ].map((activity, index) => (
                    <Flex
                      key={index}
                      justify="space-between"
                      align="center"
                      gap="md"
                    >
                      <Stack gap={4} flex={1}>
                        <Text size="sm" fw={500} c="gray.8" lh={1.4}>
                          {activity.text}
                        </Text>
                        <Text size="xs" c="gray.5">
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

        <Grid>
          <Grid.Col span={{ base: 12, md: 8, lg: 6 }}>
            <Card padding="xl" radius="lg" withBorder shadow="sm">
              <Stack gap="lg">
                <Title order={3} size="h4" fw={600} c="gray.8">
                  Property Performance
                </Title>
                <Stack gap="xl">
                  {[
                    {
                      label: "Occupied Units",
                      value: "18/24",
                      progress: 75,
                      color: "teal",
                    },
                    {
                      label: "Maintenance Requests",
                      value: "3/10",
                      progress: 30,
                      color: "yellow",
                    },
                    {
                      label: "Collection Rate",
                      value: "95%",
                      progress: 95,
                      color: "blue",
                    },
                  ].map((item, index) => (
                    <Stack key={index} gap="xs">
                      <Group justify="space-between" align="center">
                        <Text size="sm" fw={500} c="gray.7">
                          {item.label}
                        </Text>
                        <Text size="sm" fw={600} c="gray.8">
                          {item.value}
                        </Text>
                      </Group>
                      <Progress
                        value={item.progress}
                        color={item.color}
                        size="md"
                        radius="md"
                        aria-label={`${item.label}: ${item.value}`}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
