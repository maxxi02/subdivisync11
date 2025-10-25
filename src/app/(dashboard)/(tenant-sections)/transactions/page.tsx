"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Title,
  Group,
  Text,
  Select,
  Button as MantineButton,
  Card,
  SimpleGrid,
  Modal,
  Stack,
  LoadingOverlay,
  Notification,
  Badge,
  Progress,
  Table,
  useMantineTheme,
  useMantineColorScheme,
  rgba,
  ScrollArea,
} from "@mantine/core";
import {
  IconClock,
  IconAlertCircle,
  IconCreditCard,
  IconRefresh,
  IconEye,
  IconHome,
  IconTrendingUp,
  IconCheck,
  IconExclamationMark,
} from "@tabler/icons-react";

interface PaymentPlan {
  _id: string;
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number;
  downPayment: number;
  monthlyPayment: number;
  guardFee?: number;
  garbageFee?: number;
  maintenanceFee?: number;
  totalMonthlyPayment?: number;
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

interface NotificationType {
  type: "success" | "error";
  message: string;
}

const TransactionPage = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(
    null
  );
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<MonthlyPayment | null>(
    null
  );
  const [filter, setFilter] = useState<
    "all" | "active" | "completed" | "overdue"
  >("all");
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

  const fetchPaymentPlans = useCallback(async () => {
    try {
      const response = await fetch("/api/tenant/payment-plans");
      const data = await response.json();
      if (data.success) {
        setPaymentPlans(data.paymentPlans);
        showNotification("success", "Payment plans loaded successfully");
      } else {
        throw new Error(data.error || "Failed to fetch payment plans");
      }
    } catch (error) {
      console.error("Error fetching payment plans:", error);
      showNotification(
        "error",
        (error as Error).message || "Failed to load payment plans"
      );
    }
  }, []);

  const fetchMonthlyPayments = useCallback(async () => {
    try {
      const response = await fetch("/api/tenant/monthly-payments");
      const data = await response.json();
      if (data.success) {
        setMonthlyPayments(data.payments);
        showNotification("success", "Monthly payments loaded successfully");
      } else {
        throw new Error(data.error || "Failed to fetch monthly payments");
      }
    } catch (error) {
      console.error("Error fetching monthly payments:", error);
      showNotification(
        "error",
        (error as Error).message || "Failed to load monthly payments"
      );
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchPaymentPlans(), fetchMonthlyPayments()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchPaymentPlans, fetchMonthlyPayments]);

  const filteredPaymentPlans = paymentPlans.filter((plan) => {
    if (filter === "all") return true;
    if (filter === "active") return plan.status === "active";
    if (filter === "completed") return plan.status === "completed";
    return false;
  });

  const getPaymentsForPlan = (planId: string) => {
    return monthlyPayments.filter(
      (payment) => payment.paymentPlanId === planId
    );
  };

  const getOverduePayments = () => {
    const today = new Date();
    return monthlyPayments.filter(
      (payment) =>
        payment.status === "pending" && new Date(payment.dueDate) < today
    );
  };

  const updatePaymentPlanProgress = async (
    paymentPlanId: string,
    paymentAmount: number
  ) => {
    try {
      const response = await fetch(
        `/api/tenant/payment-plans/${paymentPlanId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentAmount,
            updateType: "payment_made",
          }),
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update payment plan progress");
      }
      showNotification("success", "Payment plan updated successfully");
      return data.success;
    } catch (error) {
      console.error("Error updating payment plan progress:", error);
      showNotification("error", "Failed to update payment plan progress");
      return false;
    }
  };

  const processPayment = async (payment: MonthlyPayment) => {
    if (!payment) return;

    try {
      setProcessingPayment(payment._id);
      const response = await fetch("/api/tenant/payments/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: payment._id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.paymentProcessed) {
          await markPaymentAsPaid(payment._id, data.paymentIntentId);
          await updatePaymentPlanProgress(
            payment.paymentPlanId,
            payment.amount
          );
          await Promise.all([fetchPaymentPlans(), fetchMonthlyPayments()]);
          showNotification("success", "Payment successful!");
          setShowPaymentModal(false);
        } else if (data.checkoutUrl) {
          localStorage.setItem(
            "pendingPayment",
            JSON.stringify({
              paymentId: payment._id,
              paymentPlanId: payment.paymentPlanId,
              amount: payment.amount,
            })
          );
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error("No checkout URL or payment confirmation received");
        }
      } else {
        throw new Error(data.error || "Failed to process payment");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      showNotification(
        "error",
        (error as Error).message || "Failed to process payment"
      );
      setProcessingPayment(null);
      setShowPaymentModal(false);
    }
  };

  const markPaymentAsPaid = async (
    paymentId: string,
    paymentIntentId?: string
  ) => {
    try {
      const response = await fetch(
        `/api/tenant/monthly-payments/${paymentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "paid",
            paidDate: new Date().toISOString(),
            paymentMethod: "PayMongo",
            paymentIntentId: paymentIntentId || undefined,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        showNotification("success", "Payment marked as paid");
        return true;
      } else {
        throw new Error(data.error || "Failed to update payment");
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      showNotification(
        "error",
        (error as Error).message || "Failed to update payment"
      );
      return false;
    }
  };

  useEffect(() => {
    const checkPendingPayment = async () => {
      const pendingPayment = localStorage.getItem("pendingPayment");
      if (pendingPayment) {
        try {
          const paymentInfo = JSON.parse(pendingPayment);
          const urlParams = new URLSearchParams(window.location.search);
          const paymentStatus = urlParams.get("status");

          if (paymentStatus === "success") {
            const success = await markPaymentAsPaid(paymentInfo.paymentId);
            if (success) {
              await updatePaymentPlanProgress(
                paymentInfo.paymentPlanId,
                paymentInfo.amount
              );
              await Promise.all([fetchPaymentPlans(), fetchMonthlyPayments()]);
              showNotification("success", "Payment completed successfully!");
            }
          }
          localStorage.removeItem("pendingPayment");
          if (paymentStatus) {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          }
        } catch (error) {
          console.error("Error processing pending payment:", error);
          showNotification("error", "Failed to process pending payment");
          localStorage.removeItem("pendingPayment");
        }
      }
    };

    if (!loading) {
      checkPendingPayment();
    }
  }, [loading, fetchPaymentPlans, fetchMonthlyPayments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { color: "yellow", text: "Pending" };
      case "paid":
        return { color: "green", text: "Paid" };
      case "overdue":
        return { color: "red", text: "Overdue" };
      case "active":
        return { color: "blue", text: "Active" };
      case "completed":
        return { color: "purple", text: "Completed" };
      default:
        return { color: "gray", text: status };
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Container size="100%" py="xl">
      <LoadingOverlay visible={loading} />
      {notification && (
        <Notification
          icon={
            notification.type === "success" ? (
              <IconCheck size={18} />
            ) : (
              <IconExclamationMark size={18} />
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
        <Card
          shadow="sm"
          padding="lg"
          radius="lg"
          withBorder
          style={{ boxShadow: getDefaultShadow() }}
        >
          <Group justify="space-between" align="center">
            <Stack gap="xs">
              <Title order={1} size="h2" fw={600} c={primaryTextColor}>
                Transactions
              </Title>
              <Text size="md" c={primaryTextColor} lh={1.5}>
                Manage your property lease payments
              </Text>
            </Stack>
            <Group gap="md">
              <Select
                value={filter}
                onChange={(value) =>
                  setFilter(value as "all" | "active" | "completed" | "overdue")
                }
                data={[
                  { value: "all", label: "All Plans" },
                  { value: "active", label: "Active" },
                  { value: "completed", label: "Completed" },
                ]}
                radius="md"
                style={{ minWidth: 150 }}
              />
              <MantineButton
                variant="outline"
                color="gray"
                onClick={() => window.location.reload()}
                leftSection={<IconRefresh size={16} />}
              >
                Refresh
              </MantineButton>
            </Group>
          </Group>
        </Card>

        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
          <Card
            shadow="sm"
            padding="lg"
            radius="lg"
            withBorder
            style={{ boxShadow: getDefaultShadow() }}
          >
            <Group justify="space-between" align="center">
              <Stack gap="xs">
                <Text size="sm" c={primaryTextColor} fw={500}>
                  Active Plans
                </Text>
                <Text size="xl" fw={700} c="blue.6">
                  {paymentPlans.filter((p) => p.status === "active").length}
                </Text>
              </Stack>
              <Group
                className="h-12 w-12 bg-blue-100 rounded-lg"
                justify="center"
              >
                <IconHome size={24} color="blue" />
              </Group>
            </Group>
          </Card>
          <Card
            shadow="sm"
            padding="lg"
            radius="lg"
            withBorder
            style={{ boxShadow: getDefaultShadow() }}
          >
            <Group justify="space-between" align="center">
              <Stack gap="xs">
                <Text size="sm" c={primaryTextColor} fw={500}>
                  Pending Payments
                </Text>
                <Text size="xl" fw={700} c="yellow.6">
                  {monthlyPayments.filter((p) => p.status === "pending").length}
                </Text>
              </Stack>
              <Group
                className="h-12 w-12 bg-yellow-100 rounded-lg"
                justify="center"
              >
                <IconClock size={24} color="yellow" />
              </Group>
            </Group>
          </Card>
          <Card
            shadow="sm"
            padding="lg"
            radius="lg"
            withBorder
            style={{ boxShadow: getDefaultShadow() }}
          >
            <Group justify="space-between" align="center">
              <Stack gap="xs">
                <Text size="sm" c={primaryTextColor} fw={500}>
                  Overdue
                </Text>
                <Text size="xl" fw={700} c="red.6">
                  {getOverduePayments().length}
                </Text>
              </Stack>
              <Group
                className="h-12 w-12 bg-red-100 rounded-lg"
                justify="center"
              >
                <IconAlertCircle size={24} color="red" />
              </Group>
            </Group>
          </Card>
          <Card
            shadow="sm"
            padding="lg"
            radius="lg"
            withBorder
            style={{ boxShadow: getDefaultShadow() }}
          >
            <Group justify="space-between" align="center">
              <Stack gap="xs">
                <Text size="sm" c={primaryTextColor} fw={500}>
                  Total Remaining
                </Text>
                <Text size="xl" fw={700} c="green.6">
                  {formatCurrency(
                    paymentPlans.reduce(
                      (sum, plan) => sum + plan.remainingBalance,
                      0
                    )
                  )}
                </Text>
              </Stack>
              <Group
                className="h-12 w-12 bg-green-100 rounded-lg"
                justify="center"
              >
                <IconTrendingUp size={24} color="green" />
              </Group>
            </Group>
          </Card>
        </SimpleGrid>

        {/* Payment Plans */}
        <Card
          shadow="sm"
          padding="lg"
          radius="lg"
          withBorder
          style={{ boxShadow: getDefaultShadow() }}
        >
          {filteredPaymentPlans.length === 0 ? (
            <Stack align="center" gap="md" py="xl">
              <IconHome size={64} color="gray" />
              <Text size="xl" fw={500} c={primaryTextColor}>
                No Payment Plans Found
              </Text>
              <Text size="sm" c={primaryTextColor}>
                You don&apos;t have any {filter !== "all" ? filter : ""} payment
                plans at the moment.
              </Text>
            </Stack>
          ) : (
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
              {filteredPaymentPlans.map((plan) => {
                const planPayments = getPaymentsForPlan(plan._id);
                const pendingPayments = planPayments.filter(
                  (p) => p.status === "pending"
                );
                const nextPayment = pendingPayments.sort(
                  (a, b) =>
                    new Date(a.dueDate).getTime() -
                    new Date(b.dueDate).getTime()
                )[0];

                return (
                  <Card
                    key={plan._id}
                    padding="lg"
                    radius="lg"
                    withBorder
                    style={{ boxShadow: getDefaultShadow() }}
                  >
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start">
                        <Stack gap="xs">
                          <Text size="lg" fw={700} c={primaryTextColor}>
                            {plan.propertyTitle}
                          </Text>
                          <Group gap="xs">
                            <Badge
                              variant="light"
                              color={getStatusBadge(plan.status).color}
                              size="sm"
                              radius="md"
                            >
                              {getStatusBadge(plan.status).text}
                            </Badge>
                            <Text size="sm" c={primaryTextColor}>
                              Month {plan.currentMonth} of {plan.leaseDuration}
                            </Text>
                          </Group>
                        </Stack>
                      </Group>
                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        <Stack gap="xs">
                          <Text size="sm" c={primaryTextColor}>
                            Base Monthly Payment
                          </Text>
                          <Text fw={500} c={primaryTextColor}>
                            {formatCurrency(plan.monthlyPayment)}
                          </Text>
                        </Stack>
                        {((plan.guardFee ?? 0) > 0 ||
                          (plan.garbageFee ?? 0) > 0 ||
                          (plan.maintenanceFee ?? 0) > 0) && (
                          <Stack gap="xs">
                            <Text size="sm" c={primaryTextColor}>
                              Total Monthly (incl. HOA)
                            </Text>
                            <Text fw={600} c="orange.6">
                              {formatCurrency(
                                plan.totalMonthlyPayment ??
                                  plan.monthlyPayment +
                                    (plan.guardFee ?? 0) +
                                    (plan.garbageFee ?? 0) +
                                    (plan.maintenanceFee ?? 0)
                              )}
                            </Text>
                          </Stack>
                        )}
                        <Stack gap="xs">
                          <Text size="sm" c={primaryTextColor}>
                            Remaining Balance
                          </Text>
                          <Text fw={500} c={primaryTextColor}>
                            {formatCurrency(plan.remainingBalance)}
                          </Text>
                        </Stack>
                        <Stack gap="xs">
                          <Text size="sm" c={primaryTextColor}>
                            Next Payment
                          </Text>
                          <Text fw={500} c={primaryTextColor}>
                            {formatDate(plan.nextPaymentDate)}
                          </Text>
                        </Stack>
                        <Stack gap="xs" style={{ gridColumn: "1 / -1" }}>
                          <Text size="sm" c={primaryTextColor}>
                            Progress
                          </Text>
                          <Progress
                            value={
                              (plan.currentMonth / plan.leaseDuration) * 100
                            }
                            color="blue"
                            size="sm"
                            radius="md"
                          />
                          <Text size="xs" c={primaryTextColor}>
                            {Math.round(
                              (plan.currentMonth / plan.leaseDuration) * 100
                            )}
                            % Complete
                          </Text>
                        </Stack>
                      </SimpleGrid>

                      {nextPayment && (
                        <Card
                          withBorder
                          radius="md"
                          bg={colorScheme === "dark" ? "yellow.9" : "yellow.1"}
                          p="md"
                        >
                          <Group justify="space-between" align="center">
                            <Stack gap="xs">
                              <Text
                                size="sm"
                                fw={500}
                                c={
                                  colorScheme === "dark" ? "white" : "yellow.8"
                                }
                              >
                                Payment Due: Month {nextPayment.monthNumber}
                              </Text>
                              <Text
                                size="xs"
                                c={
                                  colorScheme === "dark" ? "white" : "yellow.6"
                                }
                              >
                                Due: {formatDate(nextPayment.dueDate)}
                              </Text>
                            </Stack>
                            <Stack gap="xs" align="flex-end">
                              <Text
                                fw={500}
                                c={
                                  colorScheme === "dark" ? "white" : "yellow.8"
                                }
                              >
                                {formatCurrency(nextPayment.amount)}
                              </Text>
                              <Badge
                                variant="light"
                                color={getStatusBadge(nextPayment.status).color}
                                size="sm"
                                radius="md"
                              >
                                {getStatusBadge(nextPayment.status).text}
                              </Badge>
                            </Stack>
                          </Group>
                        </Card>
                      )}

                      <Group gap="md">
                        {nextPayment && (
                          <MantineButton
                            size="xs"
                            color="green"
                            onClick={() => {
                              setSelectedPayment(nextPayment);
                              setSelectedPlan(plan);
                              setShowPaymentModal(true);
                            }}
                            disabled={processingPayment === nextPayment._id}
                            leftSection={<IconCreditCard size={16} />}
                          >
                            {processingPayment === nextPayment._id
                              ? "Processing..."
                              : "Pay Now"}
                          </MantineButton>
                        )}
                        <MantineButton
                          size="xs"
                          variant="outline"
                          color="gray"
                          onClick={() => {
                            setSelectedPlan(plan);
                            setShowDetailsModal(true);
                          }}
                          leftSection={<IconEye size={16} />}
                        >
                          Details
                        </MantineButton>
                      </Group>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </Card>

        {/* Payment Modal */}
        <Modal
          opened={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title={
            <Text fw={600} c={primaryTextColor}>
              Confirm Payment
            </Text>
          }
          centered
          size="md"
        >
          {selectedPayment && selectedPlan && (
            <Stack gap="md">
              <Card
                withBorder
                radius="lg"
                style={{ boxShadow: getDefaultShadow() }}
              >
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text size="sm" c={primaryTextColor}>
                      Property:
                    </Text>
                    <Text fw={500} c={primaryTextColor}>
                      {selectedPlan.propertyTitle}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c={primaryTextColor}>
                      Payment Month:
                    </Text>
                    <Text fw={500} c={primaryTextColor}>
                      {selectedPayment.monthNumber} of{" "}
                      {selectedPlan.leaseDuration}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c={primaryTextColor}>
                      Due Date:
                    </Text>
                    <Text fw={500} c={primaryTextColor}>
                      {formatDate(selectedPayment.dueDate)}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c={primaryTextColor}>
                      Current Progress:
                    </Text>
                    <Text fw={500} c={primaryTextColor}>
                      {selectedPlan.currentMonth} / {selectedPlan.leaseDuration}{" "}
                      months
                    </Text>
                  </Group>

                  {/* Payment Breakdown */}
                  <Stack gap="xs" mt="sm">
                    <Text size="sm" fw={600} c={primaryTextColor}>
                      Payment Breakdown:
                    </Text>
                    <Group justify="space-between" pl="md">
                      <Text size="sm" c={primaryTextColor}>
                        Base Payment:
                      </Text>
                      <Text fw={500} c={primaryTextColor}>
                        {formatCurrency(selectedPlan.monthlyPayment)}
                      </Text>
                    </Group>
                    {(selectedPlan.guardFee ?? 0) > 0 && (
                      <Group justify="space-between" pl="md">
                        <Text size="sm" c={primaryTextColor}>
                          Guard Fee:
                        </Text>
                        <Text fw={500} c={primaryTextColor}>
                          {formatCurrency(selectedPlan.guardFee ?? 0)}
                        </Text>
                      </Group>
                    )}
                    {(selectedPlan.garbageFee ?? 0) > 0 && (
                      <Group justify="space-between" pl="md">
                        <Text size="sm" c={primaryTextColor}>
                          Garbage Collection:
                        </Text>
                        <Text fw={500} c={primaryTextColor}>
                          {formatCurrency(selectedPlan.garbageFee ?? 0)}
                        </Text>
                      </Group>
                    )}
                    {(selectedPlan.maintenanceFee ?? 0) > 0 && (
                      <Group justify="space-between" pl="md">
                        <Text size="sm" c={primaryTextColor}>
                          Street Maintenance:
                        </Text>
                        <Text fw={500} c={primaryTextColor}>
                          {formatCurrency(selectedPlan.maintenanceFee ?? 0)}
                        </Text>
                      </Group>
                    )}
                  </Stack>

                  <Group
                    justify="space-between"
                    pt="sm"
                    style={{
                      borderTop: "2px solid var(--mantine-color-gray-3)",
                    }}
                  >
                    <Text size="sm" fw={600} c={primaryTextColor}>
                      Total Amount:
                    </Text>
                    <Text fw={700} c="green.6" size="lg">
                      {formatCurrency(selectedPayment.amount)}
                    </Text>
                  </Group>
                </Stack>
              </Card>
              <Card
                withBorder
                radius="md"
                bg={colorScheme === "dark" ? "blue.9" : "blue.1"}
                p="sm"
              >
                <Text size="xs" c={colorScheme === "dark" ? "white" : "blue.8"}>
                  <strong>After payment:</strong> Progress will advance to month{" "}
                  {selectedPayment.monthNumber}, and your remaining balance will
                  be reduced by {formatCurrency(selectedPayment.amount)}.
                </Text>
              </Card>
              <Group gap="md">
                <MantineButton
                  size="md"
                  color="green"
                  onClick={() => processPayment(selectedPayment)}
                  disabled={processingPayment === selectedPayment._id}
                  leftSection={<IconCreditCard size={16} />}
                  fullWidth
                >
                  {processingPayment === selectedPayment._id
                    ? "Processing..."
                    : "Pay with PayMongo"}
                </MantineButton>
                <MantineButton
                  size="md"
                  variant="outline"
                  color="gray"
                  onClick={() => setShowPaymentModal(false)}
                  fullWidth
                >
                  Cancel
                </MantineButton>
              </Group>
            </Stack>
          )}
        </Modal>

        {/* Plan Details Modal */}
        <Modal
          opened={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={
            <Text fw={600} c={primaryTextColor}>
              Payment Plan Details
            </Text>
          }
          centered
          size="xl"
          styles={{ content: { maxHeight: "90vh", overflowY: "auto" } }}
        >
          {selectedPlan && (
            <Stack gap="md">
              {/* Plan Overview */}
              <Card
                withBorder
                radius="lg"
                style={{ boxShadow: getDefaultShadow() }}
              >
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <Stack gap="md">
                    <Text fw={600} c={primaryTextColor}>
                      Property Information
                    </Text>
                    <Stack gap="xs">
                      <Text size="sm" c={primaryTextColor}>
                        Property:
                      </Text>
                      <Text fw={500} c={primaryTextColor}>
                        {selectedPlan.propertyTitle}
                      </Text>
                    </Stack>
                    <Stack gap="xs">
                      <Text size="sm" c={primaryTextColor}>
                        Property Price:
                      </Text>
                      <Text fw={500} c={primaryTextColor}>
                        {formatCurrency(selectedPlan.propertyPrice)}
                      </Text>
                    </Stack>
                    <Stack gap="xs">
                      <Text size="sm" c={primaryTextColor}>
                        Down Payment:
                      </Text>
                      <Text fw={500} c={primaryTextColor}>
                        {formatCurrency(selectedPlan.downPayment)}
                      </Text>
                    </Stack>
                  </Stack>
                  <Stack gap="md">
                    <Text fw={600} c={primaryTextColor}>
                      Payment Terms
                    </Text>
                    <Stack gap="xs">
                      <Text size="sm" c={primaryTextColor}>
                        Base Monthly Payment:
                      </Text>
                      <Text fw={500} c={primaryTextColor}>
                        {formatCurrency(selectedPlan.monthlyPayment)}
                      </Text>
                    </Stack>

                    {/* HOA Fees Section */}
                    {((selectedPlan.guardFee ?? 0) > 0 ||
                      (selectedPlan.garbageFee ?? 0) > 0 ||
                      (selectedPlan.maintenanceFee ?? 0) > 0) && (
                      <>
                        <Stack gap="xs">
                          <Text size="sm" fw={600} c={primaryTextColor}>
                            HOA Fees:
                          </Text>
                        </Stack>
                        {(selectedPlan.guardFee ?? 0) > 0 && (
                          <Stack gap="xs" pl="md">
                            <Text size="sm" c={primaryTextColor}>
                              • Guard Fee:
                            </Text>
                            <Text fw={500} c="blue.6">
                              {formatCurrency(selectedPlan.guardFee ?? 0)}
                            </Text>
                          </Stack>
                        )}
                        {(selectedPlan.garbageFee ?? 0) > 0 && (
                          <Stack gap="xs" pl="md">
                            <Text size="sm" c={primaryTextColor}>
                              • Garbage Collection:
                            </Text>
                            <Text fw={500} c="blue.6">
                              {formatCurrency(selectedPlan.garbageFee ?? 0)}
                            </Text>
                          </Stack>
                        )}
                        {(selectedPlan.maintenanceFee ?? 0) > 0 && (
                          <Stack gap="xs" pl="md">
                            <Text size="sm" c={primaryTextColor}>
                              • Street Maintenance:
                            </Text>
                            <Text fw={500} c="blue.6">
                              {formatCurrency(selectedPlan.maintenanceFee ?? 0)}
                            </Text>
                          </Stack>
                        )}
                        <Card withBorder bg="orange.0" p="sm" radius="md">
                          <Group justify="space-between">
                            <Text size="sm" fw={600} c="orange.9">
                              Total Monthly Payment:
                            </Text>
                            <Text size="lg" fw={700} c="orange.9">
                              {formatCurrency(
                                selectedPlan.totalMonthlyPayment ??
                                  selectedPlan.monthlyPayment +
                                    (selectedPlan.guardFee ?? 0) +
                                    (selectedPlan.garbageFee ?? 0) +
                                    (selectedPlan.maintenanceFee ?? 0)
                              )}
                            </Text>
                          </Group>
                        </Card>
                      </>
                    )}

                    <Stack gap="xs">
                      <Text size="sm" c={primaryTextColor}>
                        Interest Rate:
                      </Text>
                      <Text fw={500} c={primaryTextColor}>
                        {selectedPlan.interestRate}% per annum
                      </Text>
                    </Stack>
                    <Stack gap="xs">
                      <Text size="sm" c={primaryTextColor}>
                        Lease Duration:
                      </Text>
                      <Text fw={500} c={primaryTextColor}>
                        {selectedPlan.leaseDuration} months
                      </Text>
                    </Stack>
                    <Stack gap="xs">
                      <Text size="sm" c={primaryTextColor}>
                        Total Amount:
                      </Text>
                      <Text fw={500} c={primaryTextColor}>
                        {formatCurrency(selectedPlan.totalAmount)}
                      </Text>
                    </Stack>
                  </Stack>
                </SimpleGrid>
              </Card>

              {/* Progress */}
              <Card
                withBorder
                radius="lg"
                style={{ boxShadow: getDefaultShadow() }}
              >
                <Stack gap="md">
                  <Text fw={600} c={primaryTextColor}>
                    Progress
                  </Text>
                  <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                    <Stack align="center" gap="xs">
                      <Text size="xl" fw={700} c="blue.6">
                        {selectedPlan.currentMonth}
                      </Text>
                      <Text size="sm" c={primaryTextColor}>
                        Payments Made
                      </Text>
                    </Stack>
                    <Stack align="center" gap="xs">
                      <Text size="xl" fw={700} c="yellow.6">
                        {selectedPlan.leaseDuration - selectedPlan.currentMonth}
                      </Text>
                      <Text size="sm" c={primaryTextColor}>
                        Payments Remaining
                      </Text>
                    </Stack>
                    <Stack align="center" gap="xs">
                      <Text size="xl" fw={700} c="green.6">
                        {formatCurrency(selectedPlan.remainingBalance)}
                      </Text>
                      <Text size="sm" c={primaryTextColor}>
                        Remaining Balance
                      </Text>
                    </Stack>
                  </SimpleGrid>
                </Stack>
              </Card>

              {/* Payment History */}
              <Card
                withBorder
                radius="lg"
                style={{ boxShadow: getDefaultShadow() }}
              >
                <Stack gap="md">
                  <Text fw={600} c={primaryTextColor}>
                    Payment History
                  </Text>
                  {getPaymentsForPlan(selectedPlan._id).length === 0 ? (
                    <Text size="sm" c={primaryTextColor} ta="center" py="md">
                      No payment history available.
                    </Text>
                  ) : (
                    <ScrollArea type="auto">
                      <Table verticalSpacing="sm" horizontalSpacing="md">
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Month</Table.Th>
                            <Table.Th>Amount</Table.Th>
                            <Table.Th>Due Date</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Paid Date</Table.Th>
                            <Table.Th>Action</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {getPaymentsForPlan(selectedPlan._id).map(
                            (payment) => (
                              <Table.Tr key={payment._id}>
                                <Table.Td>Month {payment.monthNumber}</Table.Td>
                                <Table.Td>
                                  {formatCurrency(payment.amount)}
                                </Table.Td>
                                <Table.Td>
                                  {formatDate(payment.dueDate)}
                                </Table.Td>
                                <Table.Td>
                                  <Badge
                                    variant="light"
                                    color={getStatusBadge(payment.status).color}
                                    size="sm"
                                    radius="md"
                                  >
                                    {getStatusBadge(payment.status).text}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  {payment.paidDate
                                    ? formatDate(payment.paidDate)
                                    : "-"}
                                </Table.Td>
                                <Table.Td>
                                  {payment.status === "pending" && (
                                    <MantineButton
                                      size="xs"
                                      color="green"
                                      onClick={() => {
                                        setSelectedPayment(payment);
                                        setShowPaymentModal(true);
                                        setShowDetailsModal(false);
                                      }}
                                      disabled={
                                        processingPayment === payment._id
                                      }
                                      leftSection={<IconCreditCard size={16} />}
                                    >
                                      Pay Now
                                    </MantineButton>
                                  )}
                                  {payment.status === "paid" &&
                                    payment.receiptUrl && (
                                      <MantineButton
                                        size="xs"
                                        variant="outline"
                                        color="blue"
                                        component="a"
                                        href={payment.receiptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        leftSection={<IconEye size={16} />}
                                      >
                                        View Receipt
                                      </MantineButton>
                                    )}
                                </Table.Td>
                              </Table.Tr>
                            )
                          )}
                        </Table.Tbody>
                      </Table>
                    </ScrollArea>
                  )}
                </Stack>
              </Card>

              {/* Tenant Information */}
              <Card
                withBorder
                radius="lg"
                style={{ boxShadow: getDefaultShadow() }}
              >
                <Stack gap="md">
                  <Text fw={600} c={primaryTextColor}>
                    Tenant Information
                  </Text>
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    <Stack gap="xs">
                      <Text size="sm" c={primaryTextColor}>
                        Full Name:
                      </Text>
                      <Text fw={500} c={primaryTextColor}>
                        {selectedPlan.tenant.fullName}
                      </Text>
                    </Stack>
                    <Stack gap="xs">
                      <Text size="sm" c={primaryTextColor}>
                        Email:
                      </Text>
                      <Text fw={500} c={primaryTextColor}>
                        {selectedPlan.tenant.email}
                      </Text>
                    </Stack>
                    <Stack gap="xs">
                      <Text size="sm" c={primaryTextColor}>
                        Phone:
                      </Text>
                      <Text fw={500} c={primaryTextColor}>
                        {selectedPlan.tenant.phone}
                      </Text>
                    </Stack>
                    <Stack gap="xs">
                      <Text size="sm" c={primaryTextColor}>
                        Start Date:
                      </Text>
                      <Text fw={500} c={primaryTextColor}>
                        {formatDate(selectedPlan.startDate)}
                      </Text>
                    </Stack>
                  </SimpleGrid>
                </Stack>
              </Card>

              <MantineButton
                variant="outline"
                color="gray"
                onClick={() => setShowDetailsModal(false)}
                fullWidth
              >
                Close
              </MantineButton>
            </Stack>
          )}
        </Modal>
      </Stack>
    </Container>
  );
};

export default TransactionPage;
