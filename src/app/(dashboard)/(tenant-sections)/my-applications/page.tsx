"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Title,
  Card,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  Grid,
  TextInput,
  Select,
  Modal,
  ActionIcon,
  Alert,
  Paper,
  Skeleton,
  Loader,
  Table,
  Textarea,
  Divider,
  Progress,
} from "@mantine/core";
import {
  IconSearch,
  IconFilter,
  IconEdit,
  IconTrash,
  IconEye,
  IconPhone,
  IconMail,
  IconMapPin,
  IconClock,
  IconInfoCircle,
  IconPlus,
  IconHome,
  IconCurrencyPeso,
  IconCalendar,
  IconAlertCircle,
  IconAlertTriangle,
  IconCreditCard,
  IconArrowRight,
  IconReceipt,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { Check, X, XCircle } from "lucide-react";
import { propertyInquiriesApi } from "@/lib/api/property-inquiries";
import { useRouter } from "next/navigation";

interface LeasePlan {
  id: string;
  name: string;
  duration: string;
  monthlyRate: string;
  totalAmount: string;
  interestRate?: string;
  features: string[];
  recommended?: boolean;
}

interface PropertyInquiry {
  _id: string;
  id: string;
  fullName: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  currentAddress: string;
  preferredContactMethod: "phone" | "email" | "text";
  preferredContactTime: string;
  selectedPropertyId?: string;
  specificLotUnit?: string;
  propertyType:
    | "residential-lot"
    | "commercial"
    | "house-and-lot"
    | "condo"
    | "other";
  budgetRange: string;
  preferredLotSize?: string;
  timeline:
    | "immediate"
    | "1-3-months"
    | "3-6-months"
    | "6-12-months"
    | "flexible";
  paymentMethod: "cash" | "financing" | "installment";
  additionalRequirements?: string;
  status: "pending" | "approved" | "rejected" | "owned";
  rejectionReason?: string;
  priority: "high" | "medium" | "low";
  created_by: string;
  created_at: string | Date;
  updated_at?: string | Date;
  submittedAt: string | Date;
  approvedAt?: string;

  // Enhanced property info
  property?: {
    _id: string;
    title: string;
    location: string;
    price: string;
    type: string;
    size?: string;
    images?: string[];
    amenities?: string[];
    description?: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    status?: "available" | "reserved" | "sold" | "rented" | "owned";
    availability_status?: string;
  };

  // Payment plan information
  selectedLeasePlan?: LeasePlan;

  // UI display fields
  propertyTitle?: string;
  propertyPrice?: string;
  propertyLocation?: string;
}

interface EditFormData {
  fullName: string;
  primaryPhone: string;
  secondaryPhone: string;
  email: string;
  currentAddress: string;
  preferredContactMethod: "phone" | "email" | "text";
  preferredContactTime: string;
  specificLotUnit: string;
  budgetRange: string;
  preferredLotSize: string;
  timeline:
    | "immediate"
    | "1-3-months"
    | "3-6-months"
    | "6-12-months"
    | "flexible";
  paymentMethod: "cash" | "financing" | "installment";
  additionalRequirements: string;
}

interface PaymentInfo {
  nextPaymentDate: Date;
  daysUntilPayment: number;
  paymentsPaid: number;
  totalPayments: number;
  monthlyAmount: number;
  remainingBalance: number;
  paymentStatus: "current" | "due-soon" | "overdue" | "due-week";
}

const MyApplicationsSection = () => {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<PropertyInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] =
    useState<PropertyInquiry | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    fullName: "",
    primaryPhone: "",
    secondaryPhone: "",
    email: "",
    currentAddress: "",
    preferredContactMethod: "phone",
    preferredContactTime: "",
    specificLotUnit: "",
    budgetRange: "",
    preferredLotSize: "",
    timeline: "immediate",
    paymentMethod: "cash",
    additionalRequirements: "",
  });

  // Helper function to calculate payment information
  const calculatePaymentInfo = (
    inquiry: PropertyInquiry
  ): PaymentInfo | null => {
    if (!inquiry.approvedAt || !inquiry.selectedLeasePlan) return null;

    const approvalDate = new Date(inquiry.approvedAt);
    const today = new Date();
    const monthlyAmount = parseFloat(
      inquiry.selectedLeasePlan.monthlyRate
        .replace(/[₱,$]/g, "")
        .replace(/,/g, "")
    );
    const totalAmount = parseFloat(
      inquiry.selectedLeasePlan.totalAmount
        .replace(/[₱,$]/g, "")
        .replace(/,/g, "")
    );
    const durationInMonths = parseInt(
      inquiry.selectedLeasePlan.duration.replace(" months", "")
    );

    // Calculate months elapsed since approval
    const monthsElapsed = Math.floor(
      (today.getTime() - approvalDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );

    // Calculate next payment date
    const nextPaymentDate = new Date(approvalDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + monthsElapsed + 1);

    // Calculate days until next payment
    const daysUntilPayment = Math.ceil(
      (nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine payment status
    let paymentStatus: PaymentInfo["paymentStatus"] = "current";
    if (daysUntilPayment < 0) {
      paymentStatus = "overdue";
    } else if (daysUntilPayment <= 3) {
      paymentStatus = "due-soon";
    } else if (daysUntilPayment <= 7) {
      paymentStatus = "due-week";
    }

    const paymentsPaid = Math.max(0, monthsElapsed);
    const remainingBalance = Math.max(
      0,
      totalAmount - paymentsPaid * monthlyAmount
    );

    return {
      nextPaymentDate,
      daysUntilPayment,
      paymentsPaid,
      totalPayments: durationInMonths,
      monthlyAmount,
      remainingBalance,
      paymentStatus,
    };
  };

  // Helper function to get payment status display
  const getPaymentStatusDisplay = (
    paymentStatus: PaymentInfo["paymentStatus"]
  ) => {
    switch (paymentStatus) {
      case "overdue":
        return {
          color: "red",
          label: "Overdue",
          icon: <IconAlertCircle size={12} />,
        };
      case "due-soon":
        return {
          color: "orange",
          label: "Due Soon",
          icon: <IconAlertTriangle size={12} />,
        };
      case "due-week":
        return {
          color: "yellow",
          label: "Due This Week",
          icon: <IconClock size={12} />,
        };
      case "current":
        return { color: "green", label: "Current", icon: <Check size={12} /> };
      default:
        return {
          color: "gray",
          label: "Unknown",
          icon: <IconInfoCircle size={12} />,
        };
    }
  };

  // Format currency function
  const formatCurrency = (amount: number | string) => {
    const numAmount =
      typeof amount === "string"
        ? parseFloat(amount.replace(/[₱,$]/g, "").replace(/,/g, ""))
        : amount;

    if (isNaN(numAmount)) return "₱0";

    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  // Map API status to display status and auto-own approved properties
  const mapApiStatusToComponentStatus = async (
    apiStatus:
      | "new"
      | "contacted"
      | "viewing-scheduled"
      | "negotiating"
      | "closed"
      | "rejected"
      | "owned",
    inquiryId?: string
  ): Promise<"pending" | "approved" | "rejected" | "owned"> => {
    switch (apiStatus) {
      case "new":
      case "contacted":
      case "viewing-scheduled":
        return "pending";
      case "negotiating":
        return "pending";
      case "closed":
        // Automatically set as owned when approved
        if (inquiryId) {
          try {
            await propertyInquiriesApi.update(inquiryId, {
              status: "owned" as const,
            });
            return "owned";
          } catch (error) {
            console.error("Error auto-setting property as owned:", error);
            return "approved";
          }
        }
        return "approved";
      case "rejected":
        return "rejected";
      case "owned":
        return "owned";
      default:
        return "pending";
    }
  };

  // Fetch tenant's inquiries from API
  const fetchMyInquiries = async () => {
    try {
      setLoading(true);
      const response = await propertyInquiriesApi.getAll({
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (response.success && response.data?.inquiries) {
        const transformedInquiries = await Promise.all(
          response.data.inquiries.map(
            async (inquiry): Promise<PropertyInquiry> => {
              const mappedStatus = await mapApiStatusToComponentStatus(
                inquiry.status,
                inquiry._id
              );

              return {
                ...inquiry,
                id: inquiry._id,
                submittedAt: inquiry.created_at,
                status: mappedStatus,
                property: inquiry.property
                  ? {
                      ...inquiry.property,
                      _id:
                        inquiry.selectedPropertyId ||
                        inquiry.property._id ||
                        "",
                      size: inquiry.property.size || "",
                      images: inquiry.property.images || [],
                      amenities: inquiry.property.amenities || [],
                      description: inquiry.property.description || "",
                      status: inquiry.property.status || "available",
                    }
                  : undefined,
                propertyTitle:
                  inquiry.property?.title ||
                  inquiry.specificLotUnit ||
                  getPropertyTitle(inquiry.propertyType),
                propertyPrice:
                  inquiry.property?.price || inquiry.budgetRange || "Price TBD",
                propertyLocation:
                  inquiry.property?.location ||
                  inquiry.currentAddress ||
                  "Location TBD",
              };
            }
          )
        );

        setInquiries(transformedInquiries);
      } else {
        notifications.show({
          title: "Error",
          message: response.error || "Failed to fetch your applications",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      notifications.show({
        title: "Error",
        message: "Failed to fetch your applications. Please try again.",
        color: "red",
        icon: <XCircle size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyInquiries();
  }, [statusFilter]);

  const handleEdit = (inquiry: PropertyInquiry) => {
    setSelectedInquiry(inquiry);
    setEditFormData({
      fullName: inquiry.fullName,
      primaryPhone: inquiry.primaryPhone,
      secondaryPhone: inquiry.secondaryPhone || "",
      email: inquiry.email,
      currentAddress: inquiry.currentAddress,
      preferredContactMethod: inquiry.preferredContactMethod,
      preferredContactTime: inquiry.preferredContactTime,
      specificLotUnit: inquiry.specificLotUnit || "",
      budgetRange: inquiry.budgetRange,
      preferredLotSize: inquiry.preferredLotSize || "",
      timeline: inquiry.timeline,
      paymentMethod: inquiry.paymentMethod,
      additionalRequirements: inquiry.additionalRequirements || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedInquiry) return;

    try {
      setActionLoading(selectedInquiry.id);
      const response = await propertyInquiriesApi.update(
        selectedInquiry.id,
        editFormData
      );

      if (response.success) {
        await fetchMyInquiries();
        setEditModalOpen(false);
        notifications.show({
          title: "Application Updated",
          message: "Your property application has been updated successfully.",
          color: "green",
        });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: (error as Error).message,
        color: "red",
        icon: <XCircle size={16} />,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (inquiryId: string) => {
    try {
      setActionLoading(inquiryId);
      const response = await propertyInquiriesApi.delete(inquiryId);

      if (response.success) {
        await fetchMyInquiries();
        notifications.show({
          title: "Application Cancelled",
          message: "Your property application has been cancelled.",
          color: "orange",
        });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: (error as Error).message,
        color: "red",
        icon: <XCircle size={16} />,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMakePayment = (inquiry: PropertyInquiry) => {
    // Navigate to transactions page with inquiry data
    const queryParams = new URLSearchParams({
      propertyId: inquiry.selectedPropertyId || "",
      inquiryId: inquiry.id,
      type: "payment",
      propertyTitle: inquiry.propertyTitle || "",
      monthlyAmount: inquiry.selectedLeasePlan?.monthlyRate || "0",
    });

    router.push(`/transactions?${queryParams.toString()}`);
  };

  const getPropertyTitle = (type: string): string => {
    switch (type) {
      case "residential-lot":
        return "Premium Residential Lot";
      case "commercial":
        return "Commercial Corner Lot";
      case "house-and-lot":
        return "Modern Family Home";
      case "condo":
        return "Luxury Condominium Unit";
      default:
        return "Property Listing";
    }
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inquiry.propertyTitle || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || inquiry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "yellow";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "owned":
        return "blue";
      default:
        return "gray";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingCount = inquiries.filter((i) => i.status === "pending").length;
  const approvedCount = inquiries.filter((i) => i.status === "approved").length;
  const rejectedCount = inquiries.filter((i) => i.status === "rejected").length;
  const ownedCount = inquiries.filter((i) => i.status === "owned").length;

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Title order={1} size="h1" mb="sm">
            My Property Applications
          </Title>
          <Text c="dimmed" size="lg">
            View and manage your property inquiry applications
          </Text>
        </div>

        {/* Stats Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
                    Pending
                  </Text>
                  <Text fw={700} size="xl">
                    {loading ? <Loader size="xs" /> : pendingCount}
                  </Text>
                </div>
                <ActionIcon
                  variant="light"
                  color="yellow"
                  size="xl"
                  radius="md"
                >
                  <IconClock size={20} />
                </ActionIcon>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
                    Owned
                  </Text>
                  <Text fw={700} size="xl">
                    {loading ? <Loader size="xs" /> : ownedCount}
                  </Text>
                </div>
                <ActionIcon variant="light" color="blue" size="xl" radius="md">
                  <IconHome size={20} />
                </ActionIcon>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
                    Rejected
                  </Text>
                  <Text fw={700} size="xl">
                    {loading ? <Loader size="xs" /> : rejectedCount}
                  </Text>
                </div>
                <ActionIcon variant="light" color="red" size="xl" radius="md">
                  <X size={20} />
                </ActionIcon>
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Filters */}
        <Card withBorder radius="md" p="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <TextInput
                placeholder="Search by name, email, or property..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                placeholder="Filter by status"
                leftSection={<IconFilter size={16} />}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value || "all")}
                data={[
                  { value: "all", label: "All Status" },
                  { value: "pending", label: "Pending" },
                  { value: "owned", label: "Owned" },
                  { value: "rejected", label: "Rejected" },
                ]}
              />
            </Grid.Col>
          </Grid>
        </Card>

        {/* Applications List */}
        <Stack gap="md">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} withBorder radius="md" p="lg">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 9 }}>
                    <Stack gap="xs">
                      <Group justify="space-between" align="flex-start">
                        <Skeleton height={24} width="60%" radius="sm" />
                        <Skeleton height={24} width="80px" radius="xl" />
                      </Group>
                      <Skeleton height={20} width="80%" radius="sm" />
                      <Skeleton height={16} width="60%" radius="sm" />
                      <Group gap="xs">
                        <Skeleton height={16} width="40%" radius="sm" />
                        <Skeleton height={16} width="40%" radius="sm" />
                      </Group>
                      <Skeleton height={16} width="70%" radius="sm" />
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Stack gap="xs">
                      <Skeleton height={36} radius="md" />
                      <Group grow>
                        <Skeleton height={36} radius="md" />
                        <Skeleton height={36} radius="md" />
                      </Group>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Card>
            ))
          ) : filteredInquiries.length === 0 ? (
            <Card withBorder radius="md" p="xl">
              <Stack align="center" gap="md">
                <IconInfoCircle size={48} color="gray" />
                <Text size="lg" c="dimmed">
                  {inquiries.length === 0
                    ? "You haven't submitted any property applications yet"
                    : "No applications found matching your criteria"}
                </Text>
                {inquiries.length === 0 && (
                  <Button leftSection={<IconPlus size={16} />}>
                    Submit New Application
                  </Button>
                )}
              </Stack>
            </Card>
          ) : (
            filteredInquiries.map((inquiry) => {
              const paymentInfo = calculatePaymentInfo(inquiry);
              const paymentStatusDisplay = paymentInfo
                ? getPaymentStatusDisplay(paymentInfo.paymentStatus)
                : null;

              return (
                <Card key={inquiry.id} withBorder radius="md" p="lg">
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 9 }}>
                      <Stack gap="xs">
                        <Group justify="space-between" align="flex-start">
                          <div>
                            <Text fw={600} size="lg">
                              {inquiry.propertyTitle}
                            </Text>
                            <Text c="dimmed" size="sm">
                              Submitted{" "}
                              {formatDate(inquiry.created_at as string)}
                            </Text>
                          </div>
                          <Badge
                            color={getStatusColor(inquiry.status)}
                            variant="light"
                          >
                            {inquiry.status === "owned"
                              ? "Owned"
                              : inquiry.status.charAt(0).toUpperCase() +
                                inquiry.status.slice(1)}
                          </Badge>
                        </Group>

                        <Text fw={500} c="blue" size="lg">
                          {formatCurrency(inquiry.propertyPrice || "0")}
                        </Text>
                        <Text size="sm" c="dimmed">
                          <IconMapPin
                            size={14}
                            style={{ display: "inline", marginRight: "4px" }}
                          />
                          {inquiry.propertyLocation}
                        </Text>

                        <Group gap="xs">
                          <Text size="sm">
                            <IconPhone
                              size={14}
                              style={{ display: "inline", marginRight: "4px" }}
                            />
                            {inquiry.primaryPhone}
                          </Text>
                          <Text size="sm">
                            <IconMail
                              size={14}
                              style={{ display: "inline", marginRight: "4px" }}
                            />
                            {inquiry.email}
                          </Text>
                        </Group>

                        <Text size="sm" c="dimmed">
                          Budget: {inquiry.budgetRange} • Timeline:{" "}
                          {inquiry.timeline} • Payment: {inquiry.paymentMethod}
                        </Text>

                        {/* Enhanced Payment Plan Card for Owned Properties */}
                        {inquiry.status === "owned" &&
                          inquiry.selectedLeasePlan &&
                          paymentInfo && (
                            <Card
                              withBorder
                              radius="sm"
                              p="md"
                              mt="sm"
                              style={{ backgroundColor: "#f0f8ff" }}
                            >
                              <Group
                                justify="space-between"
                                align="flex-start"
                                mb="md"
                              >
                                <div>
                                  <Text fw={600} size="sm" mb="xs">
                                    {inquiry.selectedLeasePlan.name}
                                  </Text>
                                  <Group gap="md">
                                    <Group gap="xs">
                                      <IconCalendar size={14} />
                                      <Text size="xs" c="dimmed">
                                        {inquiry.selectedLeasePlan.duration}
                                      </Text>
                                    </Group>
                                    <Group gap="xs">
                                      <IconCurrencyPeso size={14} />
                                      <Text size="xs" fw={600} c="green">
                                        {inquiry.selectedLeasePlan.monthlyRate}
                                        /month
                                      </Text>
                                    </Group>
                                  </Group>
                                </div>
                                <Badge color="green" variant="light" size="sm">
                                  Payment Plan Active
                                </Badge>
                              </Group>

                              <Text size="xs" c="dimmed" mb="xs">
                                Total: {inquiry.selectedLeasePlan.totalAmount}
                                {inquiry.selectedLeasePlan.interestRate &&
                                  ` • Interest: ${inquiry.selectedLeasePlan.interestRate}`}
                              </Text>

                              {/* Payment Status Badge */}
                              {paymentStatusDisplay && (
                                <Badge
                                  color={paymentStatusDisplay.color}
                                  variant="filled"
                                  size="sm"
                                  mb="sm"
                                >
                                  <Group gap={4}>
                                    {paymentStatusDisplay.icon}
                                    <Text size="xs">
                                      {paymentStatusDisplay.label}
                                    </Text>
                                  </Group>
                                </Badge>
                              )}

                              {/* Payment Progress */}
                              <div>
                                <Group justify="space-between" mb="xs">
                                  <Text size="xs" fw={500}>
                                    Payment Progress
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {paymentInfo.paymentsPaid} of{" "}
                                    {paymentInfo.totalPayments} payments
                                  </Text>
                                </Group>
                                <Progress
                                  value={
                                    (paymentInfo.paymentsPaid /
                                      paymentInfo.totalPayments) *
                                    100
                                  }
                                  color="blue"
                                  size="sm"
                                  mb="sm"
                                />
                              </div>

                              {/* Payment Details */}
                              <Grid>
                                <Grid.Col span={6}>
                                  <Text size="xs" c="dimmed">
                                    Next Payment
                                  </Text>
                                  <Text size="sm" fw={600}>
                                    {paymentInfo.nextPaymentDate.toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      }
                                    )}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {paymentInfo.daysUntilPayment < 0
                                      ? `${Math.abs(
                                          paymentInfo.daysUntilPayment
                                        )} days overdue`
                                      : `Due in ${
                                          paymentInfo.daysUntilPayment
                                        } day${
                                          paymentInfo.daysUntilPayment !== 1
                                            ? "s"
                                            : ""
                                        }`}
                                  </Text>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                  <Text size="xs" c="dimmed">
                                    Remaining Balance
                                  </Text>
                                  <Text size="sm" fw={600} c="orange">
                                    {formatCurrency(
                                      paymentInfo.remainingBalance
                                    )}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    of {inquiry.selectedLeasePlan.totalAmount}
                                  </Text>
                                </Grid.Col>
                              </Grid>

                              {/* Make Payment Button */}
                              <Button
                                leftSection={<IconCreditCard size={16} />}
                                rightSection={<IconArrowRight size={14} />}
                                color="green"
                                variant="light"
                                fullWidth
                                mt="md"
                                onClick={() => handleMakePayment(inquiry)}
                              >
                                Make Payment -{" "}
                                {formatCurrency(paymentInfo.monthlyAmount)}
                              </Button>
                            </Card>
                          )}

                        {/* Show payment plan for approved properties */}
                        {inquiry.status === "approved" &&
                          inquiry.selectedLeasePlan && (
                            <Card
                              withBorder
                              radius="sm"
                              p="md"
                              mt="sm"
                              style={{ backgroundColor: "#f0fff4" }}
                            >
                              <Group
                                justify="space-between"
                                align="flex-start"
                                mb="xs"
                              >
                                <div>
                                  <Text fw={600} size="sm" mb="xs">
                                    {inquiry.selectedLeasePlan.name}
                                  </Text>
                                  <Group gap="md">
                                    <Group gap="xs">
                                      <IconCalendar size={14} />
                                      <Text size="xs" c="dimmed">
                                        {inquiry.selectedLeasePlan.duration}
                                      </Text>
                                    </Group>
                                    <Group gap="xs">
                                      <IconCurrencyPeso size={14} />
                                      <Text size="xs" fw={600} c="green">
                                        {inquiry.selectedLeasePlan.monthlyRate}
                                        /month
                                      </Text>
                                    </Group>
                                  </Group>
                                </div>
                                <Badge color="green" variant="light" size="sm">
                                  Approved
                                </Badge>
                              </Group>

                              <Text size="xs" c="dimmed" mb="xs">
                                Total: {inquiry.selectedLeasePlan.totalAmount}
                                {inquiry.selectedLeasePlan.interestRate &&
                                  ` • Interest: ${inquiry.selectedLeasePlan.interestRate}`}
                              </Text>

                              {inquiry.selectedLeasePlan.features &&
                                inquiry.selectedLeasePlan.features.length >
                                  0 && (
                                  <div>
                                    <Text size="xs" fw={500} mb="xs">
                                      Features:
                                    </Text>
                                    <Stack gap={2}>
                                      {inquiry.selectedLeasePlan.features.map(
                                        (feature, index) => (
                                          <Text
                                            key={index}
                                            size="xs"
                                            c="dimmed"
                                          >
                                            • {feature}
                                          </Text>
                                        )
                                      )}
                                    </Stack>
                                  </div>
                                )}
                            </Card>
                          )}

                        {/* Show property details for approved/owned properties */}
                        {(inquiry.status === "approved" ||
                          inquiry.status === "owned") &&
                          inquiry.property && (
                            <Card
                              withBorder
                              radius="sm"
                              p="md"
                              mt="sm"
                              style={{ backgroundColor: "#fafafa" }}
                            >
                              <Text fw={600} size="sm" mb="xs">
                                Property Details
                              </Text>
                              <Grid>
                                {inquiry.property.bedrooms && (
                                  <Grid.Col span={6}>
                                    <Text size="xs" c="dimmed">
                                      Bedrooms
                                    </Text>
                                    <Text size="sm" fw={500}>
                                      {inquiry.property.bedrooms}
                                    </Text>
                                  </Grid.Col>
                                )}
                                {inquiry.property.bathrooms && (
                                  <Grid.Col span={6}>
                                    <Text size="xs" c="dimmed">
                                      Bathrooms
                                    </Text>
                                    <Text size="sm" fw={500}>
                                      {inquiry.property.bathrooms}
                                    </Text>
                                  </Grid.Col>
                                )}
                                {inquiry.property.sqft && (
                                  <Grid.Col span={6}>
                                    <Text size="xs" c="dimmed">
                                      Area
                                    </Text>
                                    <Text size="sm" fw={500}>
                                      {inquiry.property.sqft} sq ft
                                    </Text>
                                  </Grid.Col>
                                )}
                                {inquiry.property.size && (
                                  <Grid.Col span={6}>
                                    <Text size="xs" c="dimmed">
                                      Lot Size
                                    </Text>
                                    <Text size="sm" fw={500}>
                                      {inquiry.property.size}
                                    </Text>
                                  </Grid.Col>
                                )}
                              </Grid>
                              {inquiry.property.amenities &&
                                inquiry.property.amenities.length > 0 && (
                                  <>
                                    <Divider my="xs" />
                                    <Text size="xs" c="dimmed" mb="xs">
                                      Amenities
                                    </Text>
                                    <Group gap="xs">
                                      {inquiry.property.amenities
                                        .slice(0, 3)
                                        .map((amenity, index) => (
                                          <Badge
                                            key={index}
                                            size="xs"
                                            variant="light"
                                          >
                                            {amenity}
                                          </Badge>
                                        ))}
                                      {inquiry.property.amenities.length >
                                        3 && (
                                        <Badge size="xs" variant="outline">
                                          +
                                          {inquiry.property.amenities.length -
                                            3}{" "}
                                          more
                                        </Badge>
                                      )}
                                    </Group>
                                  </>
                                )}
                            </Card>
                          )}

                        {inquiry.status === "rejected" &&
                          inquiry.rejectionReason && (
                            <Alert
                              color="red"
                              title="Rejection Reason"
                              icon={<IconAlertCircle size={16} />}
                            >
                              {inquiry.rejectionReason}
                            </Alert>
                          )}
                      </Stack>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <Stack gap="xs">
                        <Button
                          variant="light"
                          leftSection={<IconEye size={16} />}
                          onClick={() => {
                            setSelectedInquiry(inquiry);
                            setDetailsModalOpen(true);
                          }}
                          fullWidth
                        >
                          View Details
                        </Button>

                        {/* Payment History Button for Owned Properties */}
                        {inquiry.status === "owned" && (
                          <Button
                            variant="outline"
                            color="blue"
                            leftSection={<IconReceipt size={16} />}
                            rightSection={<IconArrowRight size={14} />}
                            onClick={() => {
                              const queryParams = new URLSearchParams({
                                propertyId: inquiry.selectedPropertyId || "",
                                inquiryId: inquiry.id,
                                type: "history",
                                propertyTitle: inquiry.propertyTitle || "",
                              });
                              router.push(
                                `/transactions?${queryParams.toString()}`
                              );
                            }}
                            fullWidth
                          >
                            Payment History
                          </Button>
                        )}

                        <Group grow>
                          <Button
                            variant="outline"
                            size="sm"
                            leftSection={<IconEdit size={16} />}
                            onClick={() => handleEdit(inquiry)}
                            disabled={
                              inquiry.status === "approved" ||
                              inquiry.status === "owned" ||
                              actionLoading === inquiry.id
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            color="red"
                            size="sm"
                            leftSection={<IconTrash size={16} />}
                            onClick={() => handleCancel(inquiry.id)}
                            disabled={
                              inquiry.status === "approved" ||
                              inquiry.status === "owned" ||
                              actionLoading === inquiry.id
                            }
                            loading={actionLoading === inquiry.id}
                          >
                            Cancel
                          </Button>
                        </Group>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Card>
              );
            })
          )}
        </Stack>

        {/* Details Modal */}
        <Modal
          opened={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title="Application Details"
          size="lg"
        >
          {selectedInquiry && (
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600} size="lg">
                  {selectedInquiry.propertyTitle}
                </Text>
                <Badge
                  color={getStatusColor(selectedInquiry.status)}
                  variant="light"
                >
                  {selectedInquiry.status.charAt(0).toUpperCase() +
                    selectedInquiry.status.slice(1)}
                </Badge>
              </Group>

              <Divider />

              <div>
                <Text fw={600} mb="xs">
                  Contact Information
                </Text>
                <Table>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          Full Name
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{selectedInquiry.fullName}</Text>
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          Primary Phone
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{selectedInquiry.primaryPhone}</Text>
                      </Table.Td>
                    </Table.Tr>
                    {selectedInquiry.secondaryPhone && (
                      <Table.Tr>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            Secondary Phone
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {selectedInquiry.secondaryPhone}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                    <Table.Tr>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          Email
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{selectedInquiry.email}</Text>
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          Current Address
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{selectedInquiry.currentAddress}</Text>
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </div>

              <Divider />

              <div>
                <Text fw={600} mb="xs">
                  Property Preferences
                </Text>
                <Table>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          Property Type
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{selectedInquiry.propertyType}</Text>
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          Budget Range
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{selectedInquiry.budgetRange}</Text>
                      </Table.Td>
                    </Table.Tr>
                    {selectedInquiry.specificLotUnit && (
                      <Table.Tr>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            Specific Lot/Unit
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {selectedInquiry.specificLotUnit}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                    {selectedInquiry.preferredLotSize && (
                      <Table.Tr>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            Preferred Lot Size
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {selectedInquiry.preferredLotSize}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                    <Table.Tr>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          Timeline
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{selectedInquiry.timeline}</Text>
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          Payment Method
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{selectedInquiry.paymentMethod}</Text>
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </div>

              {selectedInquiry.additionalRequirements && (
                <>
                  <Divider />
                  <div>
                    <Text fw={600} mb="xs">
                      Additional Requirements
                    </Text>
                    <Text size="sm" c="dimmed">
                      {selectedInquiry.additionalRequirements}
                    </Text>
                  </div>
                </>
              )}

              <Divider />

              <div>
                <Text fw={600} mb="xs">
                  Contact Preferences
                </Text>
                <Table>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          Preferred Contact Method
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {selectedInquiry.preferredContactMethod}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          Preferred Contact Time
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {selectedInquiry.preferredContactTime}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </div>

              {/* Show selected lease plan if approved/owned */}
              {(selectedInquiry.status === "approved" ||
                selectedInquiry.status === "owned") &&
                selectedInquiry.selectedLeasePlan && (
                  <>
                    <Divider />
                    <div>
                      <Text fw={600} mb="xs">
                        Selected Payment Plan
                      </Text>
                      <Card withBorder p="md">
                        <Group
                          justify="space-between"
                          align="flex-start"
                          mb="xs"
                        >
                          <Text fw={600}>
                            {selectedInquiry.selectedLeasePlan.name}
                          </Text>
                          {selectedInquiry.selectedLeasePlan.recommended && (
                            <Badge color="blue" variant="light" size="sm">
                              Recommended
                            </Badge>
                          )}
                        </Group>
                        <Group gap="md" mb="xs">
                          <Text size="sm">
                            <IconCalendar
                              size={14}
                              style={{ display: "inline", marginRight: "4px" }}
                            />
                            {selectedInquiry.selectedLeasePlan.duration}
                          </Text>
                          <Text size="sm" fw={600} c="green">
                            <IconCurrencyPeso
                              size={14}
                              style={{ display: "inline", marginRight: "4px" }}
                            />
                            {selectedInquiry.selectedLeasePlan.monthlyRate}
                            /month
                          </Text>
                        </Group>
                        <Text size="sm" c="dimmed" mb="xs">
                          Total: {selectedInquiry.selectedLeasePlan.totalAmount}
                          {selectedInquiry.selectedLeasePlan.interestRate &&
                            ` • Interest: ${selectedInquiry.selectedLeasePlan.interestRate}`}
                        </Text>
                        {selectedInquiry.selectedLeasePlan.features &&
                          selectedInquiry.selectedLeasePlan.features.length >
                            0 && (
                            <div>
                              <Text size="xs" fw={500} mb="xs">
                                Features:
                              </Text>
                              <Stack gap={2}>
                                {selectedInquiry.selectedLeasePlan.features.map(
                                  (feature, index) => (
                                    <Text key={index} size="xs" c="dimmed">
                                      • {feature}
                                    </Text>
                                  )
                                )}
                              </Stack>
                            </div>
                          )}
                      </Card>
                    </div>
                  </>
                )}

              <Divider />

              <div>
                <Text fw={600} mb="xs">
                  Application Timeline
                </Text>
                <Text size="sm">
                  <IconClock
                    size={14}
                    style={{ display: "inline", marginRight: "4px" }}
                  />
                  Submitted on{" "}
                  {formatDate(selectedInquiry.created_at as string)}
                </Text>
                {selectedInquiry.approvedAt && (
                  <Text size="sm" c="green">
                    <Check
                      size={14}
                      style={{ display: "inline", marginRight: "4px" }}
                    />
                    Approved on {formatDate(selectedInquiry.approvedAt)}
                  </Text>
                )}
              </div>
            </Stack>
          )}
        </Modal>

        {/* Edit Modal */}
        <Modal
          opened={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Application"
          size="lg"
        >
          <Stack gap="md">
            <TextInput
              label="Full Name"
              required
              value={editFormData.fullName}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  fullName: e.currentTarget.value,
                }))
              }
            />

            <Group grow>
              <TextInput
                label="Primary Phone"
                required
                value={editFormData.primaryPhone}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    primaryPhone: e.currentTarget.value,
                  }))
                }
              />
              <TextInput
                label="Secondary Phone"
                value={editFormData.secondaryPhone}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    secondaryPhone: e.currentTarget.value,
                  }))
                }
              />
            </Group>

            <TextInput
              label="Email"
              type="email"
              required
              value={editFormData.email}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  email: e.currentTarget.value,
                }))
              }
            />

            <TextInput
              label="Current Address"
              required
              value={editFormData.currentAddress}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  currentAddress: e.currentTarget.value,
                }))
              }
            />

            <Group grow>
              <Select
                label="Preferred Contact Method"
                required
                value={editFormData.preferredContactMethod}
                onChange={(value) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    preferredContactMethod: value as "phone" | "email" | "text",
                  }))
                }
                data={[
                  { value: "phone", label: "Phone Call" },
                  { value: "email", label: "Email" },
                  { value: "text", label: "Text Message" },
                ]}
              />
              <TextInput
                label="Preferred Contact Time"
                required
                value={editFormData.preferredContactTime}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    preferredContactTime: e.currentTarget.value,
                  }))
                }
              />
            </Group>

            <TextInput
              label="Specific Lot/Unit"
              value={editFormData.specificLotUnit}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  specificLotUnit: e.currentTarget.value,
                }))
              }
            />

            <Group grow>
              <TextInput
                label="Budget Range"
                required
                value={editFormData.budgetRange}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    budgetRange: e.currentTarget.value,
                  }))
                }
              />
              <TextInput
                label="Preferred Lot Size"
                value={editFormData.preferredLotSize}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    preferredLotSize: e.currentTarget.value,
                  }))
                }
              />
            </Group>

            <Group grow>
              <Select
                label="Timeline"
                required
                value={editFormData.timeline}
                onChange={(value) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    timeline: value as
                      | "immediate"
                      | "1-3-months"
                      | "3-6-months"
                      | "6-12-months"
                      | "flexible",
                  }))
                }
                data={[
                  { value: "immediate", label: "Immediate (ASAP)" },
                  { value: "1-3-months", label: "1-3 months" },
                  { value: "3-6-months", label: "3-6 months" },
                  { value: "6-12-months", label: "6-12 months" },
                  { value: "flexible", label: "Flexible timeline" },
                ]}
              />
              <Select
                label="Payment Method"
                required
                value={editFormData.paymentMethod}
                onChange={(value) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    paymentMethod: value as
                      | "cash"
                      | "financing"
                      | "installment",
                  }))
                }
                data={[
                  { value: "cash", label: "Cash Payment" },
                  { value: "financing", label: "Bank Financing" },
                  { value: "installment", label: "Installment Plan" },
                ]}
              />
            </Group>

            <Textarea
              label="Additional Requirements"
              rows={3}
              value={editFormData.additionalRequirements}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  additionalRequirements: e.currentTarget.value,
                }))
              }
            />

            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                loading={actionLoading === selectedInquiry?.id}
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
};

export default MyApplicationsSection;
