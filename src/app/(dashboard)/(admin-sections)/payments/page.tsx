"use client";

import React, { useState, useEffect } from "react";
import {
  Title,
  Text,
  Card,
  Stack,
  Group,
  Badge,
  Loader,
  Center,
  Container,
  Notification,
  TextInput,
  Modal,
  Grid,
  ThemeIcon,
  ActionIcon,
  SimpleGrid,
  useMantineTheme,
  useMantineColorScheme,
  Box,
  Flex,
  Alert,
  Divider,
  Table,
  rgba,
} from "@mantine/core";
import {
  IconCheck,
  IconX,
  IconAlertCircle,
  IconSearch,
  IconRefresh,
  IconCreditCard,
  IconUser,
  IconMail,
  IconPhone,
  IconHome,
  IconCalendar,
  IconBed,
  IconBath,
  IconFileText,
  IconSend,
  IconClock,
  IconEye,
} from "@tabler/icons-react";
import { toast } from "react-hot-toast";

interface PaymentPlan {
  _id: string;
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number;
  downPayment: number;
  monthlyPayment: number;
  interestRate: number;
  leaseDuration: number;
  totalAmount: number;
  startDate: string;
  currentMonth: number;
  remainingBalance: number;
  nextPaymentDate: string;
  status: string;
  tenant: {
    fullName: string;
    email: string;
    phone: string;
  };
  created_at: string;
  property?: {
    title: string;
    location: string;
    type: string;
    sqft?: number;
    bedrooms?: number;
    bathrooms?: number;
  };
}

interface MonthlyPayment {
  _id: string;
  paymentPlanId: string;
  propertyId: string;
  tenantEmail: string;
  monthNumber: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: "pending" | "paid" | "overdue" | "partial";
  paymentMethod?: string;
  paymentIntentId?: string;
  receiptUrl?: string;
  proofUrl?: string;
  notes?: string;
  created_at: string;
}

interface PaymentWithPlan extends MonthlyPayment {
  paymentPlan?: PaymentPlan;
}

interface NotificationType {
  type: "success" | "error";
  message: string;
}

const PaymentsTrackingPage = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [payments, setPayments] = useState<PaymentWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentWithPlan | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  // Fetch payment plans and monthly payments
  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);

      // Fetch payment plans
      const plansResponse = await fetch("/api/payment-plans/all");
      const plansData = await plansResponse.json();

      // Fetch monthly payments
      const paymentsResponse = await fetch("/api/monthly-payments");
      const paymentsData = await paymentsResponse.json();

      if (!plansData.success) {
        throw new Error(plansData.error || "Failed to fetch payment plans");
      }
      if (!paymentsData.success) {
        throw new Error(paymentsData.error || "Failed to fetch payments");
      }

      // Combine payments with their payment plans
      const paymentsWithPlans = paymentsData.payments.map(
        (payment: MonthlyPayment) => {
          const plan = plansData.paymentPlans?.find(
            (p: PaymentPlan) => p._id === payment.paymentPlanId
          );
          return { ...payment, paymentPlan: plan };
        }
      );
      setPayments(paymentsWithPlans);
      showNotification("success", "Payment data fetched successfully");
    } catch (error) {
      console.error("Error fetching payment data:", error);
      showNotification(
        "error",
        "Failed to fetch payment data. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  // Handle remind action
  const handleRemind = async (payment: PaymentWithPlan) => {
    try {
      // Placeholder: Implement actual reminder logic (e.g., send email)
      showNotification("success", `Reminder sent to ${payment.tenantEmail}`);
    } catch (error) {
      console.error("Error sending reminder:", error);
      showNotification("error", "Failed to send reminder. Please try again.");
    }
  };

  // Calculate overdue payments
  const updateOverduePayments = () => {
    const today = new Date();
    return payments.map((payment) => {
      if (payment.status === "pending" && new Date(payment.dueDate) < today) {
        return { ...payment, status: "overdue" as const };
      }
      return payment;
    });
  };

  // Get filtered payments
  const getFilteredPayments = () => {
    let filtered = updateOverduePayments();

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.paymentPlan?.tenant.fullName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          p.paymentPlan?.propertyTitle
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          p.tenantEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );
  };

  // Calculate statistics
  const stats = {
    totalCollected: payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payments
      .filter((p) => p.status === "pending" || p.status === "overdue")
      .reduce((sum, p) => sum + p.amount, 0),
    overdueCount: updateOverduePayments().filter((p) => p.status === "overdue")
      .length,
    totalPayments: payments.length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "green";
      case "pending":
        return "yellow";
      case "overdue":
        return "red";
      case "partial":
        return "orange";
      default:
        return "gray";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredPayments = getFilteredPayments();

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
    <Container size="xl" py="xl">
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
        {/* Header */}
        <Box py="md">
          <Title order={1} size="h2" fw={600} c={primaryTextColor} mb="xs">
            Payment Tracking
          </Title>
          <Text c="dimmed" size="md" lh={1.5}>
            Monitor and manage rental payments from all tenants
          </Text>
        </Box>

        {/* Stats Cards */}
        <SimpleGrid
          cols={{ base: 1, md: 4 }}
          spacing={{ base: "md", sm: "lg" }}
          verticalSpacing={{ base: "md", sm: "lg" }}
        >
          <Card
            padding="xl"
            radius="lg"
            withBorder
            shadow="sm"
            style={{
              background:
                "linear-gradient(135deg, var(--mantine-color-green-6) 0%, var(--mantine-color-green-7) 100%)",
              color: "white",
              boxShadow: getDefaultShadow(),
            }}
          >
            <Flex justify="space-between" align="flex-start" gap="md">
              <Stack gap="xs" flex={1}>
                <Text c="green.2" size="sm" tt="uppercase" fw={600}>
                  Total Collected
                </Text>
                <Text fw={700} size="xl" c="white" lh={1.2}>
                  {formatCurrency(stats.totalCollected)}
                </Text>
              </Stack>
              <ThemeIcon variant="light" color="green" size="xl" radius="lg">
                <IconCreditCard size="1.5rem" />
              </ThemeIcon>
            </Flex>
          </Card>

          <Card
            padding="xl"
            radius="lg"
            withBorder
            shadow="sm"
            style={{
              background:
                "linear-gradient(135deg, var(--mantine-color-yellow-6) 0%, var(--mantine-color-yellow-7) 100%)",
              color: "white",
              boxShadow: getDefaultShadow(),
            }}
          >
            <Flex justify="space-between" align="flex-start" gap="md">
              <Stack gap="xs" flex={1}>
                <Text c="yellow.2" size="sm" tt="uppercase" fw={600}>
                  Pending Collection
                </Text>
                <Text fw={700} size="xl" c="white" lh={1.2}>
                  {formatCurrency(stats.pendingAmount)}
                </Text>
              </Stack>
              <ThemeIcon variant="light" color="yellow" size="xl" radius="lg">
                <IconClock size="1.5rem" />
              </ThemeIcon>
            </Flex>
          </Card>

          <Card
            padding="xl"
            radius="lg"
            withBorder
            shadow="sm"
            style={{
              background:
                "linear-gradient(135deg, var(--mantine-color-red-6) 0%, var(--mantine-color-red-7) 100%)",
              color: "white",
              boxShadow: getDefaultShadow(),
            }}
          >
            <Flex justify="space-between" align="flex-start" gap="md">
              <Stack gap="xs" flex={1}>
                <Text c="red.2" size="sm" tt="uppercase" fw={600}>
                  Overdue Payments
                </Text>
                <Text fw={700} size="xl" c="white" lh={1.2}>
                  {stats.overdueCount}
                </Text>
              </Stack>
              <ThemeIcon variant="light" color="red" size="xl" radius="lg">
                <IconAlertCircle size="1.5rem" />
              </ThemeIcon>
            </Flex>
          </Card>

          <Card
            padding="xl"
            radius="lg"
            withBorder
            shadow="sm"
            style={{
              background:
                "linear-gradient(135deg, var(--mantine-color-blue-6) 0%, var(--mantine-color-blue-7) 100%)",
              color: "white",
              boxShadow: getDefaultShadow(),
            }}
          >
            <Flex justify="space-between" align="flex-start" gap="md">
              <Stack gap="xs" flex={1}>
                <Text c="blue.2" size="sm" tt="uppercase" fw={600}>
                  Total Payments
                </Text>
                <Text fw={700} size="xl" c="white" lh={1.2}>
                  {stats.totalPayments}
                </Text>
              </Stack>
              <ThemeIcon variant="light" color="blue" size="xl" radius="lg">
                <IconFileText size="1.5rem" />
              </ThemeIcon>
            </Flex>
          </Card>
        </SimpleGrid>

        {/* Overdue Alert */}
        {stats.overdueCount > 0 && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            title="Overdue Payments Alert"
          >
            You have {stats.overdueCount} overdue payment
            {stats.overdueCount > 1 ? "s" : ""} requiring immediate attention.
          </Alert>
        )}

        {/* Search */}
        <Card padding="xl" radius="lg" withBorder shadow="sm">
          <TextInput
            placeholder="Search tenants or properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftSection={<IconSearch size={16} />}
            style={{ maxWidth: 300 }}
          />
        </Card>

        {/* Payments Table */}
        <Card padding="xl" radius="lg" withBorder shadow="sm">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tenant & Property</Table.Th>
                <Table.Th>Payment Details</Table.Th>
                <Table.Th>Due Date</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredPayments.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5} ta="center" py="xl">
                    <ThemeIcon size={48} radius="xl" color="gray" mb="md">
                      <IconFileText size={24} />
                    </ThemeIcon>
                    <Text size="lg" fw={500} c={primaryTextColor} mb="xs">
                      {searchTerm
                        ? "No payments match your search"
                        : "No payments found"}
                    </Text>
                    <Text c="dimmed">No matching payments available</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredPayments.map((payment) => (
                  <Table.Tr key={payment._id}>
                    <Table.Td>
                      <Stack gap="xs">
                        <Text fw={500} c={primaryTextColor}>
                          {payment.paymentPlan?.tenant.fullName ||
                            "Unknown Tenant"}
                        </Text>
                        <Group gap="xs">
                          <IconHome size={14} />
                          <Text size="sm" c="dimmed">
                            {payment.paymentPlan?.propertyTitle ||
                              "Property Not Found"}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <IconMail size={14} />
                          <Text size="sm" c="dimmed">
                            {payment.tenantEmail}
                          </Text>
                        </Group>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap="xs">
                        <Text fw={500} c={primaryTextColor}>
                          {formatCurrency(payment.amount)}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Month {payment.monthNumber} of{" "}
                          {payment.paymentPlan?.leaseDuration || "N/A"}
                        </Text>
                        {payment.paymentMethod && (
                          <Group gap="xs">
                            <IconCreditCard size={14} />
                            <Text size="sm" c="dimmed">
                              {payment.paymentMethod}
                            </Text>
                          </Group>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap="xs">
                        <Text c="dimmed">{formatDate(payment.dueDate)}</Text>
                        {payment.paidDate && (
                          <Text c="dimmed">
                            Paid: {formatDate(payment.paidDate)}
                          </Text>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getStatusColor(payment.status)}
                        variant="light"
                      >
                        {payment.status.charAt(0).toUpperCase() +
                          payment.status.slice(1)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          size="lg"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowDetailsModal(true);
                          }}
                        >
                          <IconEye size={18} />
                        </ActionIcon>
                        {payment.status === "pending" && (
                          <ActionIcon
                            variant="light"
                            color="yellow"
                            size="lg"
                            onClick={() => handleRemind(payment)}
                          >
                            <IconSend size={18} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Card>

        {/* Payment Details Modal */}
        <Modal
          opened={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPayment(null);
          }}
          title="Payment Details"
          size="xl"
          centered
        >
          {selectedPayment && (
            <Stack gap="lg">
              <Badge
                color={getStatusColor(selectedPayment.status)}
                size="lg"
                variant="light"
              >
                {selectedPayment.status.charAt(0).toUpperCase() +
                  selectedPayment.status.slice(1)}
              </Badge>

              <Card withBorder radius="md" p="md">
                <Group gap="xs" mb="xs">
                  <IconCreditCard size={16} />
                  <Text fw={500} c={primaryTextColor}>
                    Payment Information
                  </Text>
                </Group>
                <Grid gutter="md">
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Amount
                    </Text>
                    <Text fw={500}>
                      {formatCurrency(selectedPayment.amount)}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Month Number
                    </Text>
                    <Text fw={500}>
                      {selectedPayment.monthNumber} of{" "}
                      {selectedPayment.paymentPlan?.leaseDuration || "N/A"}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Due Date
                    </Text>
                    <Text fw={500}>{formatDate(selectedPayment.dueDate)}</Text>
                  </Grid.Col>
                  {selectedPayment.paidDate && (
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">
                        Paid Date
                      </Text>
                      <Text fw={500}>
                        {formatDate(selectedPayment.paidDate)}
                      </Text>
                    </Grid.Col>
                  )}
                  {selectedPayment.paymentMethod && (
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">
                        Payment Method
                      </Text>
                      <Text fw={500}>{selectedPayment.paymentMethod}</Text>
                    </Grid.Col>
                  )}
                </Grid>
              </Card>

              {selectedPayment.paymentPlan?.property && (
                <Card withBorder radius="md" p="md">
                  <Group gap="xs" mb="xs">
                    <IconHome size={16} />
                    <Text fw={500} c={primaryTextColor}>
                      Property Information
                    </Text>
                  </Group>
                  <Grid gutter="md">
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">
                        Title
                      </Text>
                      <Text fw={500}>
                        {selectedPayment.paymentPlan.property.title}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">
                        Location
                      </Text>
                      <Text fw={500}>
                        {selectedPayment.paymentPlan.property.location}
                      </Text>
                    </Grid.Col>
                    {(selectedPayment.paymentPlan.property.type ===
                      "house-and-lot" ||
                      selectedPayment.paymentPlan.property.type ===
                        "condo") && (
                      <>
                        {selectedPayment.paymentPlan.property.bedrooms &&
                          selectedPayment.paymentPlan.property.bedrooms > 0 && (
                            <Grid.Col span={6}>
                              <Text size="sm" c="dimmed">
                                Bedrooms
                              </Text>
                              <Text fw={500}>
                                {selectedPayment.paymentPlan.property.bedrooms}{" "}
                                Bedroom
                                {selectedPayment.paymentPlan.property.bedrooms >
                                1
                                  ? "s"
                                  : ""}
                              </Text>
                            </Grid.Col>
                          )}
                        {selectedPayment.paymentPlan.property.bathrooms &&
                          selectedPayment.paymentPlan.property.bathrooms >
                            0 && (
                            <Grid.Col span={6}>
                              <Text size="sm" c="dimmed">
                                Bathrooms
                              </Text>
                              <Text fw={500}>
                                {selectedPayment.paymentPlan.property.bathrooms}{" "}
                                Bathroom
                                {selectedPayment.paymentPlan.property
                                  .bathrooms > 1
                                  ? "s"
                                  : ""}
                              </Text>
                            </Grid.Col>
                          )}
                        {selectedPayment.paymentPlan.property.sqft &&
                          selectedPayment.paymentPlan.property.sqft > 0 && (
                            <Grid.Col span={6}>
                              <Text size="sm" c="dimmed">
                                Square Footage
                              </Text>
                              <Text fw={500}>
                                {selectedPayment.paymentPlan.property.sqft} sq
                                ft
                              </Text>
                            </Grid.Col>
                          )}
                      </>
                    )}
                  </Grid>
                </Card>
              )}

              {selectedPayment.paymentPlan && (
                <Card withBorder radius="md" p="md">
                  <Group gap="xs" mb="xs">
                    <IconUser size={16} />
                    <Text fw={500} c={primaryTextColor}>
                      Tenant Information
                    </Text>
                  </Group>
                  <Grid gutter="md">
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">
                        Full Name
                      </Text>
                      <Text fw={500}>
                        {selectedPayment.paymentPlan.tenant.fullName}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">
                        Email
                      </Text>
                      <Text fw={500}>
                        {selectedPayment.paymentPlan.tenant.email}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">
                        Phone
                      </Text>
                      <Text fw={500}>
                        {selectedPayment.paymentPlan.tenant.phone}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">
                        Property
                      </Text>
                      <Text fw={500}>
                        {selectedPayment.paymentPlan.propertyTitle}
                      </Text>
                    </Grid.Col>
                  </Grid>
                </Card>
              )}

              {selectedPayment.paymentPlan && (
                <Card withBorder radius="md" p="md" bg="blue.0">
                  <Group gap="xs" mb="xs">
                    <IconCreditCard size={16} />
                    <Text fw={500} c="blue.9">
                      Payment Plan Summary
                    </Text>
                  </Group>
                  <Grid gutter="md">
                    <Grid.Col span={6}>
                      <Text size="sm" c="blue.7">
                        Monthly Payment
                      </Text>
                      <Text fw={500} c="blue.9">
                        {formatCurrency(
                          selectedPayment.paymentPlan.monthlyPayment
                        )}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="blue.7">
                        Total Duration
                      </Text>
                      <Text fw={500} c="blue.9">
                        {selectedPayment.paymentPlan.leaseDuration} months
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="blue.7">
                        Progress
                      </Text>
                      <Text fw={500} c="blue.9">
                        {Math.round(
                          (selectedPayment.monthNumber /
                            selectedPayment.paymentPlan.leaseDuration) *
                            100
                        )}
                        % Complete
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="blue.7">
                        Remaining Balance
                      </Text>
                      <Text fw={500} c="blue.9">
                        {formatCurrency(
                          selectedPayment.paymentPlan.remainingBalance
                        )}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="blue.7">
                        Property Price
                      </Text>
                      <Text fw={500} c="blue.9">
                        {formatCurrency(
                          selectedPayment.paymentPlan.propertyPrice
                        )}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="blue.7">
                        Down Payment
                      </Text>
                      <Text fw={500} c="blue.9">
                        {formatCurrency(
                          selectedPayment.paymentPlan.downPayment
                        )}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="blue.7">
                        Interest Rate
                      </Text>
                      <Text fw={500} c="blue.9">
                        {selectedPayment.paymentPlan.interestRate}% per annum
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="blue.7">
                        Start Date
                      </Text>
                      <Text fw={500} c="blue.9">
                        {formatDate(selectedPayment.paymentPlan.startDate)}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="blue.7">
                        Next Payment Date
                      </Text>
                      <Text fw={500} c="blue.9">
                        {formatDate(
                          selectedPayment.paymentPlan.nextPaymentDate
                        )}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="blue.7">
                        Total Amount
                      </Text>
                      <Text fw={500} c="blue.9">
                        {formatCurrency(
                          selectedPayment.paymentPlan.totalAmount
                        )}
                      </Text>
                    </Grid.Col>
                  </Grid>
                </Card>
              )}
            </Stack>
          )}
        </Modal>

        {/* Refresh Button */}
        <Group justify="flex-end">
          <ActionIcon
            variant="light"
            color="blue"
            size="lg"
            onClick={fetchPaymentData}
            loading={refreshing}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>
      </Stack>
    </Container>
  );
};

export default PaymentsTrackingPage;
