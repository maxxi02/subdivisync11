"use client";

import React, { useState, useEffect } from "react";
import {
  Title,
  Text,
  Card,
  Stack,
  Group,
  Badge,
  Table,
  Loader,
  Center,
  Container,
  Notification,
  Select,
  Modal,
  TextInput,
  Textarea,
  Button as MantineButton,
  NumberInput,
  Grid,
  ThemeIcon,
  ActionIcon,
  SimpleGrid,
  useMantineTheme,
  Box,
  Flex,
  Alert,
  Divider,
  useMantineColorScheme as useMantineColorSchemeHook,
  rgba,
  ScrollArea,
} from "@mantine/core";
import {
  IconUser,
  IconClock,
  IconCheck,
  IconX,
  IconTrash,
  IconAlertCircle,
  IconPhone,
  IconMail,
  IconMapPin,
  IconSearch,
  IconRefresh,
  IconCreditCard,
  IconEye,
} from "@tabler/icons-react";
import { getServerSession } from "@/better-auth/action";
import { Session } from "@/better-auth/auth-types";

interface Inquiry {
  fullName: string;
  email: string;
  phone: string;
  reason: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

interface Property {
  _id: string;
  title: string;
  location: string;
  size: string;
  price: number;
  type: string;
  status: string;
  images?: string[];
  amenities: string[];
  description?: string;
  sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  created_by: string;
  created_at: string;
  updated_at?: string;
  owner?: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    paymentStatus: "paid" | "partial" | "pending";
    paymentMethod?: string;
  };
  inquiries?: Inquiry[];
}

interface InquiryWithProperty extends Inquiry {
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number;
  propertyLocation: string;
  propertyStatus: string;
  propertyType: string;
  sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
}

interface PaymentPlan {
  propertyPrice: number;
  downPayment: number;
  monthlyPayment: number;
  interestRate: number;
  leaseDuration: number;
  totalAmount: number;
  startDate: string;
  status: string;
  currentMonth: number;
  remainingBalance: number;
  nextPaymentDate: string;
  guardFee: number;
  garbageFee: number;
  maintenanceFee: number;
}

interface NotificationType {
  type: "success" | "error";
  message: string;
}

const ApplicationsPage = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorSchemeHook();
  const [inquiries, setInquiries] = useState<InquiryWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] =
    useState<InquiryWithProperty | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [interestRate, setInterestRate] = useState("12");
  const [downPayment, setDownPayment] = useState("");
  const [guardFee, setGuardFee] = useState("0");
  const [garbageFee, setGarbageFee] = useState("0");
  const [maintenanceFee, setMaintenanceFee] = useState("0");
  const [leaseDuration, setLeaseDuration] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);
  const [notification, setNotification] = useState<NotificationType | null>(
    null
  );
  const [dataFetched, setDataFetched] = useState(false);

  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const getSession = async () => {
      const session = await getServerSession();
      setSession(session);
    };
    getSession();
  }, []);

  const [paymentPlanData, setPaymentPlanData] = useState<PaymentPlan | null>(
    null
  );

  // Theme-aware helpers
  const primaryTextColor = colorScheme === "dark" ? "white" : "dark.9";

  useEffect(() => {
    if (!dataFetched) {
      fetchInquiries();
      setDataFetched(true);
    }
  }, [dataFetched]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dataFetched) {
        fetchInquiries();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, dataFetched]);

  const getDefaultShadow = () => {
    const baseShadow = "0 1px 3px";
    const opacity = colorScheme === "dark" ? 0.2 : 0.12;
    return `${baseShadow} ${rgba(theme.black, opacity)}`;
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchPaymentPlan = async (propertyId: string, tenantEmail: string) => {
    try {
      const response = await fetch(
        `/api/payments/create?propertyId=${propertyId}&tenantEmail=${tenantEmail}`
      );
      const data = await response.json();

      if (data.success) {
        setPaymentPlanData(data.paymentPlan);
      } else {
        throw new Error(data.error || "Failed to fetch payment plan");
      }
    } catch (error) {
      console.error("Error fetching payment plan:", error);
      showNotification(
        "error",
        error instanceof Error ? error.message : "Failed to fetch payment plan"
      );
    }
  };

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/properties");
      const data = await response.json();

      if (data.success) {
        const allInquiries: InquiryWithProperty[] = [];
        data.properties.forEach((property: Property) => {
          if (property.inquiries && property.inquiries.length > 0) {
            property.inquiries.forEach((inquiry: Inquiry) => {
              allInquiries.push({
                ...inquiry,
                propertyId: property._id,
                propertyTitle: property.title,
                propertyPrice: property.price,
                propertyLocation: property.location,
                propertyStatus: property.status,
                propertyType: property.type,
                sqft: property.sqft,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
              });
            });
          }
        });
        setInquiries(allInquiries);
        showNotification("success", "Inquiries fetched successfully");
      } else {
        throw new Error(data.error || "Failed to fetch inquiries");
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      showNotification(
        "error",
        error instanceof Error ? error.message : "Failed to fetch inquiries"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const filteredInquiries = inquiries
    .filter((inquiry) => {
      if (filter === "all") return true;
      if (filter === "approved") {
        return (
          inquiry.status === "approved" || inquiry.propertyStatus === "LEASED"
        );
      }
      if (filter === "pending") {
        return (
          inquiry.status === "pending" && inquiry.propertyStatus !== "LEASED"
        );
      }
      return inquiry.status === filter;
    })
    .filter(
      (inquiry) =>
        inquiry.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.propertyTitle
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        inquiry.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

  const calculateLeaseTerms = () => {
    if (!selectedInquiry || !monthlyPayment || !interestRate) return;

    const propertyPrice = selectedInquiry.propertyPrice;
    const downPaymentAmount = parseFloat(downPayment) || 0;
    const monthlyPaymentAmount = parseFloat(monthlyPayment);
    const annualRate = parseFloat(interestRate) / 100;
    const monthlyRate = annualRate / 12;

    const principalAmount = propertyPrice - downPaymentAmount;

    if (principalAmount <= 0 || monthlyPaymentAmount <= 0) {
      setLeaseDuration(0);
      setTotalAmount(0);
      return;
    }

    let months = 0;
    let total = 0;

    if (monthlyRate === 0) {
      months = Math.ceil(principalAmount / monthlyPaymentAmount);
      total = downPaymentAmount + months * monthlyPaymentAmount;
    } else {
      const interestThreshold = principalAmount * monthlyRate;
      if (monthlyPaymentAmount > interestThreshold) {
        months = Math.ceil(
          Math.log(
            monthlyPaymentAmount / (monthlyPaymentAmount - interestThreshold)
          ) / Math.log(1 + monthlyRate)
        );
        total = downPaymentAmount + months * monthlyPaymentAmount;
      } else {
        months = 0;
        total = 0;
      }
    }

    setLeaseDuration(months);
    setTotalAmount(total);
  };

  const sendPaymentReminders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/payment-reminders", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        showNotification("success", data.message);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showNotification("error", "Failed to send payment reminders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateLeaseTerms();
  }, [selectedInquiry, monthlyPayment, interestRate, downPayment]);

  const handleApprove = async (inquiry: InquiryWithProperty) => {
    if (!monthlyPayment || leaseDuration === 0) {
      showNotification("error", "Please enter valid payment details");
      return;
    }

    try {
      setProcessingId(`${inquiry.propertyId}-${inquiry.email}`);

      const propertyResponse = await fetch(
        `/api/properties/${inquiry.propertyId}`
      );
      const propertyData = await propertyResponse.json();

      if (!propertyData.success) {
        throw new Error("Failed to fetch property details");
      }

      const currentProperty = propertyData.property;

      const paymentResponse = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(monthlyPayment) * 100,
          currency: "PHP",
          description: `Monthly lease payment for ${inquiry.propertyTitle}`,
          customer: {
            name: inquiry.fullName,
            email: inquiry.email,
            phone: inquiry.phone,
          },
          propertyId: inquiry.propertyId,
          paymentPlan: {
            propertyPrice: inquiry.propertyPrice,
            downPayment: parseFloat(downPayment) || 0,
            monthlyPayment: parseFloat(monthlyPayment),
            guardFee: parseFloat(guardFee) || 0,
            garbageFee: parseFloat(garbageFee) || 0,
            maintenanceFee: parseFloat(maintenanceFee) || 0,
            totalMonthlyPayment:
              (parseFloat(monthlyPayment) || 0) +
              (parseFloat(guardFee) || 0) +
              (parseFloat(garbageFee) || 0) +
              (parseFloat(maintenanceFee) || 0),
            interestRate: parseFloat(interestRate),
            leaseDuration: leaseDuration,
            totalAmount: totalAmount,
          },
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        throw new Error("Failed to create payment plan");
      }

      const updatedInquiries = currentProperty.inquiries.map((inq: Inquiry) => {
        if (inq.email === inquiry.email && inq.phone === inquiry.phone) {
          return { ...inq, status: "approved" };
        }
        return inq;
      });

      const updateResponse = await fetch(
        `/api/properties/${inquiry.propertyId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: currentProperty.title,
            location: currentProperty.location,
            size: currentProperty.size,
            price: currentProperty.price,
            type: currentProperty.type,
            status: "LEASED",
            description: currentProperty.description,
            amenities: currentProperty.amenities,
            images: currentProperty.images,
            sqft: currentProperty.sqft,
            bedrooms: currentProperty.bedrooms,
            bathrooms: currentProperty.bathrooms,
            inquiries: updatedInquiries,
            owner_details: {
              fullName: inquiry.fullName,
              email: inquiry.email,
              phone: inquiry.phone,
              paymentStatus: "pending",
              paymentMethod: "installment",
              paymentPlan: {
                propertyPrice: inquiry.propertyPrice,
                downPayment: parseFloat(downPayment) || 0,
                monthlyPayment: parseFloat(monthlyPayment),
                guardFee: parseFloat(guardFee) || 0,
                garbageFee: parseFloat(garbageFee) || 0,
                maintenanceFee: parseFloat(maintenanceFee) || 0,
                totalMonthlyPayment:
                  (parseFloat(monthlyPayment) || 0) +
                  (parseFloat(guardFee) || 0) +
                  (parseFloat(garbageFee) || 0) +
                  (parseFloat(maintenanceFee) || 0),
                interestRate: parseFloat(interestRate),
                leaseDuration: leaseDuration,
                totalAmount: totalAmount,
              },
            },
          }),
        }
      );

      const updateData = await updateResponse.json();

      if (updateData.success) {
        await fetchInquiries();
        resetPaymentModal();
        showNotification(
          "success",
          "Inquiry approved and payment plan created successfully"
        );
      } else {
        throw new Error(updateData.error || "Failed to update property");
      }
    } catch (error) {
      console.error("Error approving inquiry:", error);
      showNotification(
        "error",
        error instanceof Error ? error.message : "Failed to approve inquiry"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const resetPaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInquiry(null);
    setMonthlyPayment("");
    setInterestRate("12");
    setDownPayment("");
    setGuardFee("0");
    setGarbageFee("0");
    setMaintenanceFee("0");
    setLeaseDuration(0);
    setTotalAmount(0);
  };

  const handleReject = async () => {
    if (!selectedInquiry || !rejectionReason.trim()) {
      setRejectionError("Please provide a rejection reason");
      showNotification("error", "Please provide a rejection reason");
      return;
    }

    if (!confirmReject) {
      setConfirmReject(true);
      return;
    }

    try {
      setProcessingId(`${selectedInquiry.propertyId}-${selectedInquiry.email}`);

      const response = await fetch(
        `/api/properties/${selectedInquiry.propertyId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "reject",
            email: selectedInquiry.email,
            phone: selectedInquiry.phone,
            reason: rejectionReason.trim(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchInquiries();
        setShowRejectModal(false);
        setSelectedInquiry(null);
        setRejectionReason("");
        setRejectionError("");
        setConfirmReject(false);
        showNotification("success", "Inquiry rejected successfully");
      } else {
        throw new Error(data.error || "Failed to reject inquiry");
      }
    } catch (error) {
      console.error("Error rejecting inquiry:", error);
      setRejectionError(
        error instanceof Error ? error.message : "Failed to reject inquiry"
      );
      showNotification(
        "error",
        error instanceof Error ? error.message : "Failed to reject inquiry"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const clearRejectedInquiries = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear all rejected inquiries? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const rejectedInquiries = inquiries.filter(
        (inq) => inq.status === "rejected"
      );

      if (rejectedInquiries.length === 0) {
        showNotification("error", "No rejected inquiries to clear");
        setLoading(false);
        return;
      }

      const deletePromises = rejectedInquiries.map((inquiry) =>
        fetch(`/api/properties/${inquiry.propertyId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: inquiry.email,
          }),
        }).then((response) => response.json())
      );

      const results = await Promise.all(deletePromises);
      const failedDeletions = results.filter((result) => !result.success);

      if (failedDeletions.length > 0) {
        console.error("Some inquiries failed to delete:", failedDeletions);
        throw new Error("Some inquiries could not be deleted");
      }

      await fetchInquiries();
      showNotification(
        "success",
        "All rejected inquiries cleared successfully"
      );
    } catch (error) {
      console.error("Error clearing rejected inquiries:", error);
      showNotification(
        "error",
        error instanceof Error
          ? error.message
          : "Failed to clear rejected inquiries"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, propertyStatus?: string) => {
    if (propertyStatus === "LEASED") {
      return "blue";
    }
    switch (status) {
      case "pending":
        return "yellow";
      case "approved":
        return "green";
      case "rejected":
        return "red";
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

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ height: 400 }}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  const stats = {
    totalApplications: inquiries.length,
    pendingApplications: inquiries.filter(
      (inq) => inq.status === "pending" && inq.propertyStatus !== "LEASED"
    ).length,
    approvedApplications: inquiries.filter(
      (inq) => inq.status === "approved" || inq.propertyStatus === "LEASED"
    ).length,
    rejectedApplications: inquiries.filter((inq) => inq.status === "rejected")
      .length,
  };

  return (
    <Container size="xl">
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
            Property Applications
          </Title>
          <Text c="dimmed" size="md" lh={1.5}>
            Monitor and manage property inquiries
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
                "linear-gradient(135deg, var(--mantine-color-blue-6) 0%, var(--mantine-color-blue-7) 100%)",
              color: "white",
              boxShadow: getDefaultShadow(),
            }}
          >
            <Flex justify="space-between" align="flex-start" gap="md">
              <Stack gap="xs" flex={1}>
                <Text c="blue.2" size="sm" tt="uppercase" fw={600}>
                  Total Applications
                </Text>
                <Text fw={700} size="xl" c="white" lh={1.2}>
                  {stats.totalApplications}
                </Text>
              </Stack>
              <ThemeIcon variant="light" color="blue" size="xl" radius="lg">
                <IconUser size="1.5rem" />
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
                  Pending
                </Text>
                <Text fw={700} size="xl" c="white" lh={1.2}>
                  {stats.pendingApplications}
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
                "linear-gradient(135deg, var(--mantine-color-green-6) 0%, var(--mantine-color-green-7) 100%)",
              color: "white",
              boxShadow: getDefaultShadow(),
            }}
          >
            <Flex justify="space-between" align="flex-start" gap="md">
              <Stack gap="xs" flex={1}>
                <Text c="green.2" size="sm" tt="uppercase" fw={600}>
                  Approved/Leased
                </Text>
                <Text fw={700} size="xl" c="white" lh={1.2}>
                  {stats.approvedApplications}
                </Text>
              </Stack>
              <ThemeIcon variant="light" color="green" size="xl" radius="lg">
                <IconCheck size="1.5rem" />
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
                  Rejected
                </Text>
                <Text fw={700} size="xl" c="white" lh={1.2}>
                  {stats.rejectedApplications}
                </Text>
              </Stack>
              <ThemeIcon variant="light" color="red" size="xl" radius="lg">
                <IconX size="1.5rem" />
              </ThemeIcon>
            </Flex>
          </Card>
        </SimpleGrid>

        {/* Pending Alert */}
        {stats.pendingApplications > 0 && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="yellow"
            title="Pending Applications Alert"
          >
            You have {stats.pendingApplications} pending application
            {stats.pendingApplications > 1 ? "s" : ""} requiring review.
          </Alert>
        )}

        {/* Filters and Search */}
        <Card padding="xl" radius="lg" withBorder shadow="sm">
          <Group justify="apart" mb="md">
            <Group>
              <Select
                value={filter}
                onChange={(value) =>
                  setFilter(
                    value as "all" | "pending" | "approved" | "rejected"
                  )
                }
                data={[
                  { value: "all", label: "All Applications" },
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                ]}
              />
              <MantineButton
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={clearRejectedInquiries}
                disabled={!inquiries.some((inq) => inq.status === "rejected")}
              >
                Clear Rejected
              </MantineButton>
            </Group>
            <TextInput
              placeholder="Search applicants or properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftSection={<IconSearch size={16} />}
              style={{ maxWidth: 300 }}
            />
          </Group>
        </Card>

        {/* Applications Table */}
        <Card padding="xl" radius="lg" withBorder shadow="sm">
          <ScrollArea type="auto">
            <Table striped highlightOnHover miw={800}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Applicant</Table.Th>
                  <Table.Th>Property</Table.Th>
                  <Table.Th>Application Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredInquiries.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} ta="center" py="xl">
                      <ThemeIcon size={48} radius="xl" color="gray" mb="md">
                        <IconUser size={24} />
                      </ThemeIcon>
                      <Text size="lg" fw={500} c={primaryTextColor} mb="xs">
                        No applications found
                      </Text>
                      <Text c="dimmed">No matching inquiries available</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredInquiries.map((inquiry, index) => (
                    <Table.Tr
                      key={`${inquiry.propertyId}-${inquiry.email}-${index}`}
                    >
                      <Table.Td>
                        <Stack gap="xs">
                          <Text fw={500} c={primaryTextColor}>
                            {inquiry.fullName}
                          </Text>
                          <Group gap="xs">
                            <IconMail size={14} />
                            <Text size="sm" c="dimmed">
                              {inquiry.email}
                            </Text>
                          </Group>
                          <Group gap="xs">
                            <IconPhone size={14} />
                            <Text size="sm" c="dimmed">
                              {inquiry.phone}
                            </Text>
                          </Group>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap="xs">
                          <Text fw={500}>{inquiry.propertyTitle}</Text>
                          <Group gap="xs">
                            <IconMapPin size={14} />
                            <Text size="sm" c="dimmed">
                              {inquiry.propertyLocation}
                            </Text>
                          </Group>
                          <Group gap="xs">
                            <Text size="sm" fw={500} c="green.6">
                              {formatCurrency(inquiry.propertyPrice)}
                            </Text>
                          </Group>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Text c="dimmed">
                          {formatDate(inquiry.submittedAt)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap="xs">
                          <Badge
                            color={getStatusColor(
                              inquiry.status,
                              inquiry.propertyStatus
                            )}
                            variant="light"
                          >
                            {inquiry.propertyStatus === "LEASED"
                              ? "Leased"
                              : inquiry.status.charAt(0).toUpperCase() +
                              inquiry.status.slice(1)}
                          </Badge>
                          {inquiry.status === "rejected" &&
                            inquiry.rejectionReason && (
                              <Text size="xs" c="red" lh={1.2}>
                                <IconAlertCircle
                                  size={12}
                                  style={{
                                    display: "inline",
                                    verticalAlign: "middle",
                                    marginRight: 4,
                                  }}
                                />
                                {inquiry.rejectionReason}
                              </Text>
                            )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {inquiry.status === "pending" &&
                            inquiry.propertyStatus !== "LEASED" && (
                              <>
                                <MantineButton
                                  size="xs"
                                  color="green"
                                  leftSection={<IconCheck size={14} />}
                                  onClick={() => {
                                    setSelectedInquiry(inquiry);
                                    setShowPaymentModal(true);
                                  }}
                                  loading={
                                    processingId ===
                                    `${inquiry.propertyId}-${inquiry.email}`
                                  }
                                  disabled={
                                    processingId ===
                                    `${inquiry.propertyId}-${inquiry.email}`
                                  }
                                >
                                  Approve
                                </MantineButton>
                                <MantineButton
                                  size="xs"
                                  color="red"
                                  leftSection={<IconX size={14} />}
                                  onClick={() => {
                                    setSelectedInquiry(inquiry);
                                    setShowRejectModal(true);
                                    setRejectionReason("");
                                    setRejectionError("");
                                    setConfirmReject(false);
                                  }}
                                  loading={
                                    processingId ===
                                    `${inquiry.propertyId}-${inquiry.email}`
                                  }
                                  disabled={
                                    processingId ===
                                    `${inquiry.propertyId}-${inquiry.email}`
                                  }
                                >
                                  Reject
                                </MantineButton>
                              </>
                            )}
                          <ActionIcon
                            variant="light"
                            color="blue"
                            size="lg"
                            onClick={async () => {
                              setSelectedInquiry(inquiry);
                              setShowViewModal(true);
                              if (
                                inquiry.propertyStatus === "LEASED" ||
                                inquiry.status === "approved"
                              ) {
                                await fetchPaymentPlan(
                                  inquiry.propertyId,
                                  inquiry.email
                                );
                              }
                            }}
                          >
                            <IconEye size={18} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card>

        {/* View Details Modal */}
        <Modal
          opened={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedInquiry(null);
            setPaymentPlanData(null);
          }}
          title={selectedInquiry?.fullName || "Application Details"}
          size="xl"
          centered
        >
          {selectedInquiry && (
            <Stack gap="lg">
              <Badge
                color={getStatusColor(
                  selectedInquiry.status,
                  selectedInquiry.propertyStatus
                )}
                size="lg"
              >
                {selectedInquiry.propertyStatus === "LEASED"
                  ? "Leased"
                  : selectedInquiry.status.charAt(0).toUpperCase() +
                  selectedInquiry.status.slice(1)}
              </Badge>

              <Card withBorder radius="md" p="md">
                <Group gap="xs" mb="xs">
                  <IconUser size={16} />
                  <Text fw={500} c={primaryTextColor}>
                    Applicant Information
                  </Text>
                </Group>
                <Grid gutter="md">
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Full Name
                    </Text>
                    <Text fw={500}>{selectedInquiry.fullName}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Email
                    </Text>
                    <Text fw={500}>{selectedInquiry.email}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Phone
                    </Text>
                    <Text fw={500}>{selectedInquiry.phone}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Application Date
                    </Text>
                    <Text fw={500}>
                      {formatDate(selectedInquiry.submittedAt)}
                    </Text>
                  </Grid.Col>
                </Grid>
              </Card>

              <Card withBorder radius="md" p="md">
                <Group gap="xs" mb="xs">
                  <IconMapPin size={16} />
                  <Text fw={500} c={primaryTextColor}>
                    Property Information
                  </Text>
                </Group>
                <Grid gutter="md">
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Property Title
                    </Text>
                    <Text fw={500}>{selectedInquiry.propertyTitle}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Block/Street
                    </Text>
                    <Text fw={500}>{selectedInquiry.propertyLocation}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Price
                    </Text>
                    <Text fw={500} c="green.6">
                      {formatCurrency(selectedInquiry.propertyPrice)}
                    </Text>
                  </Grid.Col>
                  {(selectedInquiry.propertyType === "house-and-lot" ||
                    selectedInquiry.propertyType === "condo") && (
                      <>
                        {selectedInquiry.bedrooms &&
                          selectedInquiry.bedrooms > 0 && (
                            <Grid.Col span={6}>
                              <Text size="sm" c="dimmed">
                                Bedrooms
                              </Text>
                              <Text fw={500}>
                                {selectedInquiry.bedrooms} Bedroom
                                {selectedInquiry.bedrooms > 1 ? "s" : ""}
                              </Text>
                            </Grid.Col>
                          )}
                        {selectedInquiry.bathrooms &&
                          selectedInquiry.bathrooms > 0 && (
                            <Grid.Col span={6}>
                              <Text size="sm" c="dimmed">
                                Bathrooms
                              </Text>
                              <Text fw={500}>
                                {selectedInquiry.bathrooms} Bathroom
                                {selectedInquiry.bathrooms > 1 ? "s" : ""}
                              </Text>
                            </Grid.Col>
                          )}
                        {selectedInquiry.sqft && selectedInquiry.sqft > 0 && (
                          <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">
                              Square Footage
                            </Text>
                            <Text fw={500}>{selectedInquiry.sqft} sq ft</Text>
                          </Grid.Col>
                        )}
                      </>
                    )}
                </Grid>
              </Card>

              <Card withBorder radius="md" p="md">
                <Text fw={500} c={primaryTextColor} mb="xs">
                  Reason for Application
                </Text>
                <Text c="dimmed">{selectedInquiry.reason}</Text>
              </Card>

              {selectedInquiry.status === "rejected" &&
                selectedInquiry.rejectionReason && (
                  <Alert
                    icon={<IconAlertCircle size={16} />}
                    color="red"
                    title="Rejection Reason"
                  >
                    {selectedInquiry.rejectionReason}
                  </Alert>
                )}

              {(selectedInquiry.status === "approved" ||
                selectedInquiry.propertyStatus === "LEASED") &&
                paymentPlanData && (
                  <Card withBorder radius="md" p="md" bg="blue.0">
                    <Group gap="xs" mb="md">
                      <IconCreditCard size={16} />
                      <Text fw={500} c="blue.9">
                        Payment Plan Summary
                      </Text>
                    </Group>
                    <Grid gutter="md">
                      <Grid.Col span={6}>
                        <Text size="sm" c="blue.7">
                          Property Price
                        </Text>
                        <Text fw={500} c="blue.9">
                          {formatCurrency(paymentPlanData.propertyPrice)}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="sm" c="blue.7">
                          Down Payment
                        </Text>
                        <Text fw={500} c="blue.9">
                          {formatCurrency(paymentPlanData.downPayment)}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="sm" c="blue.7">
                          Base Monthly Payment
                        </Text>
                        <Text fw={500} c="blue.9">
                          {formatCurrency(paymentPlanData.monthlyPayment)}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="sm" c="blue.7">
                          Interest Rate
                        </Text>
                        <Text fw={500} c="blue.9">
                          {paymentPlanData.interestRate}% per annum
                        </Text>
                      </Grid.Col>

                      {/* HOA Fees Section */}
                      <Grid.Col span={12}>
                        <Divider
                          label="HOA Fees"
                          labelPosition="center"
                          my="xs"
                        />
                      </Grid.Col>

                      {paymentPlanData.guardFee > 0 && (
                        <Grid.Col span={6}>
                          <Text size="sm" c="blue.7">
                            Guard Fee
                          </Text>
                          <Text fw={500} c="blue.9">
                            {formatCurrency(paymentPlanData.guardFee)}
                          </Text>
                        </Grid.Col>
                      )}
                      {paymentPlanData.garbageFee > 0 && (
                        <Grid.Col span={6}>
                          <Text size="sm" c="blue.7">
                            Garbage Collection
                          </Text>
                          <Text fw={500} c="blue.9">
                            {formatCurrency(paymentPlanData.garbageFee)}
                          </Text>
                        </Grid.Col>
                      )}
                      {paymentPlanData.maintenanceFee > 0 && (
                        <Grid.Col span={6}>
                          <Text size="sm" c="blue.7">
                            Street Maintenance
                          </Text>
                          <Text fw={500} c="blue.9">
                            {formatCurrency(paymentPlanData.maintenanceFee)}
                          </Text>
                        </Grid.Col>
                      )}

                      <Grid.Col span={12}>
                        <Card withBorder bg="orange.0" p="sm">
                          <Group justify="apart">
                            <Text size="sm" fw={600} c="orange.9">
                              Total Monthly Payment (incl. HOA)
                            </Text>
                            <Text size="lg" fw={700} c="orange.9">
                              {formatCurrency(
                                paymentPlanData.monthlyPayment +
                                (paymentPlanData.guardFee || 0) +
                                (paymentPlanData.garbageFee || 0) +
                                (paymentPlanData.maintenanceFee || 0)
                              )}
                            </Text>
                          </Group>
                        </Card>
                      </Grid.Col>

                      <Grid.Col span={12}>
                        <Divider my="xs" />
                      </Grid.Col>

                      <Grid.Col span={6}>
                        <Text size="sm" c="blue.7">
                          Lease Duration
                        </Text>
                        <Text fw={500} c="blue.9">
                          {paymentPlanData.leaseDuration} months (
                          {Math.floor(paymentPlanData.leaseDuration / 12)} years{" "}
                          {paymentPlanData.leaseDuration % 12} months)
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="sm" c="blue.7">
                          Total Amount
                        </Text>
                        <Text fw={500} c="blue.9">
                          {formatCurrency(paymentPlanData.totalAmount)}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="sm" c="blue.7">
                          Start Date
                        </Text>
                        <Text fw={500} c="blue.9">
                          {formatDate(paymentPlanData.startDate)}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="sm" c="blue.7">
                          Plan Status
                        </Text>
                        <Badge
                          color={
                            paymentPlanData.status === "active"
                              ? "green"
                              : "gray"
                          }
                          variant="light"
                        >
                          {paymentPlanData.status.charAt(0).toUpperCase() +
                            paymentPlanData.status.slice(1)}
                        </Badge>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="sm" c="blue.7">
                          Current Month
                        </Text>
                        <Text fw={500} c="blue.9">
                          {paymentPlanData.currentMonth} of{" "}
                          {paymentPlanData.leaseDuration}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="sm" c="blue.7">
                          Remaining Balance
                        </Text>
                        <Text fw={500} c="blue.9">
                          {formatCurrency(paymentPlanData.remainingBalance)}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="sm" c="blue.7">
                          Next Payment Date
                        </Text>
                        <Text fw={500} c="blue.9">
                          {formatDate(paymentPlanData.nextPaymentDate)}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={12}>
                        <Text size="sm" c="blue.7">
                          Total Interest
                        </Text>
                        <Text fw={500} c="orange.6">
                          {formatCurrency(
                            paymentPlanData.totalAmount -
                            paymentPlanData.propertyPrice
                          )}
                        </Text>
                      </Grid.Col>
                    </Grid>
                  </Card>
                )}
            </Stack>
          )}
        </Modal>

        {/* Payment Modal */}
        <Modal
          opened={showPaymentModal}
          onClose={resetPaymentModal}
          title={selectedInquiry?.propertyTitle || "Create Payment Plan"}
          size="xl"
          centered
        >
          {selectedInquiry && (
            <Stack gap="lg">
              <Card withBorder radius="md" p="md">
                <Group gap="xs" mb="xs">
                  <IconMapPin size={16} />
                  <Text fw={500} c={primaryTextColor}>
                    Property & Applicant Info
                  </Text>
                </Group>
                <Grid gutter="md">
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Property Title
                    </Text>
                    <Text fw={500}>{selectedInquiry.propertyTitle}</Text>
                    <Text size="sm" c="dimmed">
                      Location
                    </Text>
                    <Text fw={500}>{selectedInquiry.propertyLocation}</Text>
                    <Text size="sm" c="dimmed">
                      Price
                    </Text>
                    <Text fw={500} c="green.6">
                      {formatCurrency(selectedInquiry.propertyPrice)}
                    </Text>
                    {(selectedInquiry.propertyType === "house-and-lot" ||
                      selectedInquiry.propertyType === "condo") && (
                        <>
                          {selectedInquiry.bedrooms &&
                            selectedInquiry.bedrooms > 0 && (
                              <>
                                <Text size="sm" c="dimmed">
                                  Bedrooms
                                </Text>
                                <Text fw={500}>
                                  {selectedInquiry.bedrooms} Bedroom
                                  {selectedInquiry.bedrooms > 1 ? "s" : ""}
                                </Text>
                              </>
                            )}
                          {selectedInquiry.bathrooms &&
                            selectedInquiry.bathrooms > 0 && (
                              <>
                                <Text size="sm" c="dimmed">
                                  Bathrooms
                                </Text>
                                <Text fw={500}>
                                  {selectedInquiry.bathrooms} Bathroom
                                  {selectedInquiry.bathrooms > 1 ? "s" : ""}
                                </Text>
                              </>
                            )}
                          {selectedInquiry.sqft && selectedInquiry.sqft > 0 && (
                            <>
                              <Text size="sm" c="dimmed">
                                Square Footage
                              </Text>
                              <Text fw={500}>{selectedInquiry.sqft} sq ft</Text>
                            </>
                          )}
                        </>
                      )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Applicant Name
                    </Text>
                    <Text fw={500}>{selectedInquiry.fullName}</Text>
                    <Text size="sm" c="dimmed">
                      Email
                    </Text>
                    <Text fw={500}>{selectedInquiry.email}</Text>
                    <Text size="sm" c="dimmed">
                      Phone
                    </Text>
                    <Text fw={500}>{selectedInquiry.phone}</Text>
                  </Grid.Col>
                </Grid>
              </Card>

              <Grid gutter="lg">
                <Grid.Col span={6}>
                  <Stack gap="md">
                    <Text fw={500} c={primaryTextColor}>
                      Payment Configuration
                    </Text>

                    <Divider
                      label="HOA Fees (Homeowners Association)"
                      labelPosition="center"
                      mt="md"
                      mb="md"
                    />

                    <Grid gutter="md">
                      <Grid.Col span={6}>
                        <NumberInput
                          label="Guard Fee (₱)"
                          placeholder="0"
                          value={parseFloat(guardFee) || 0}
                          onChange={(value) =>
                            setGuardFee((value || 0).toString())
                          }
                          min={0}
                          step={0.01}
                          description="Security guard service"
                          leftSection={<IconUser size={16} />}
                        />
                      </Grid.Col>

                      <Grid.Col span={6}>
                        <NumberInput
                          label="Garbage Collection Fee (₱)"
                          placeholder="0"
                          value={parseFloat(garbageFee) || 0}
                          onChange={(value) =>
                            setGarbageFee((value || 0).toString())
                          }
                          min={0}
                          step={0.01}
                          description="Waste management"
                          leftSection={<IconTrash size={16} />}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <NumberInput
                          label="Street Maintenance Fee (₱)"
                          placeholder="0"
                          value={parseFloat(maintenanceFee) || 0}
                          onChange={(value) =>
                            setMaintenanceFee((value || 0).toString())
                          }
                          min={0}
                          step={0.01}
                          description="Road and street upkeep"
                          leftSection={<IconMapPin size={16} />}
                        />
                      </Grid.Col>
                    </Grid>

                    <NumberInput
                      label="Down Payment (₱)"
                      placeholder="0"
                      value={parseFloat(downPayment) || 0}
                      onChange={(value) =>
                        setDownPayment((value || 0).toString())
                      }
                      min={0}
                      max={selectedInquiry.propertyPrice}
                      step={0.01}
                      description="Optional"
                    />
                    <NumberInput
                      label="Base Monthly Payment (₱)"
                      placeholder="Enter monthly payment"
                      value={parseFloat(monthlyPayment) || 0}
                      onChange={(value) =>
                        setMonthlyPayment((value || 0).toString())
                      }
                      min={1}
                      step={0.01}
                      required
                    />
                    <NumberInput
                      label="Annual Interest Rate (%)"
                      placeholder="12"
                      value={parseFloat(interestRate) || 12}
                      onChange={(value) =>
                        setInterestRate((value || 12).toString())
                      }
                      min={0}
                      max={50}
                      step={0.1}
                      required
                      description="Common rates: 8-15% for property financing"
                    />
                  </Stack>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Stack gap="md">
                    <Text fw={500} c={primaryTextColor}>
                      Calculated Terms
                    </Text>
                    <Card withBorder radius="md" p="md" bg="blue.0">
                      <Stack gap="xs">
                        <Group justify="apart">
                          <Text size="sm" c="blue.7">
                            Property Price:
                          </Text>
                          <Text size="sm" fw={500}>
                            {formatCurrency(selectedInquiry.propertyPrice)}
                          </Text>
                        </Group>
                        <Group justify="apart">
                          <Text size="sm" c="blue.7">
                            Down Payment:
                          </Text>
                          <Text size="sm" fw={500}>
                            {formatCurrency(parseFloat(downPayment) || 0)}
                          </Text>
                        </Group>
                        <Group justify="apart">
                          <Text size="sm" c="blue.7">
                            Principal Amount:
                          </Text>
                          <Text size="sm" fw={500}>
                            {formatCurrency(
                              selectedInquiry.propertyPrice -
                              (parseFloat(downPayment) || 0)
                            )}
                          </Text>
                        </Group>

                        <Divider c="blue.3" my="xs" />
                        <Text size="sm" fw={500} c="blue.9" mb="xs">
                          HOA Fees Breakdown:
                        </Text>
                        <Stack gap={4} mb="xs">
                          {parseFloat(guardFee) > 0 && (
                            <Group justify="apart">
                              <Text size="xs" c="blue.6">
                                • Guard Fee:
                              </Text>
                              <Text size="xs" fw={500}>
                                {formatCurrency(parseFloat(guardFee))}
                              </Text>
                            </Group>
                          )}
                          {parseFloat(garbageFee) > 0 && (
                            <Group justify="apart">
                              <Text size="xs" c="blue.6">
                                • Garbage Collection:
                              </Text>
                              <Text size="xs" fw={500}>
                                {formatCurrency(parseFloat(garbageFee))}
                              </Text>
                            </Group>
                          )}
                          {parseFloat(maintenanceFee) > 0 && (
                            <Group justify="apart">
                              <Text size="xs" c="blue.6">
                                • Street Maintenance:
                              </Text>
                              <Text size="xs" fw={500}>
                                {formatCurrency(parseFloat(maintenanceFee))}
                              </Text>
                            </Group>
                          )}
                        </Stack>
                        <Group justify="apart">
                          <Text size="sm" c="blue.7">
                            Total HOA Fees:
                          </Text>
                          <Text size="sm" fw={500} c="orange.6">
                            {formatCurrency(
                              (parseFloat(guardFee) || 0) +
                              (parseFloat(garbageFee) || 0) +
                              (parseFloat(maintenanceFee) || 0)
                            )}
                          </Text>
                        </Group>
                        <Divider c="blue.3" my="xs" />
                        <Group justify="apart">
                          <Text size="sm" fw={500} c="blue.7">
                            Base Monthly Payment:
                          </Text>
                          <Text size="sm" fw={500}>
                            {formatCurrency(parseFloat(monthlyPayment) || 0)}
                          </Text>
                        </Group>
                        <Group justify="apart">
                          <Text size="sm" fw={600} c="blue.9">
                            Total Monthly Payment:
                          </Text>
                          <Text size="lg" fw={700} c="blue.6">
                            {formatCurrency(
                              (parseFloat(monthlyPayment) || 0) +
                              (parseFloat(guardFee) || 0) +
                              (parseFloat(garbageFee) || 0) +
                              (parseFloat(maintenanceFee) || 0)
                            )}
                          </Text>
                        </Group>
                        <Divider c="blue.3" />
                        <Group justify="apart">
                          <Text size="sm" c="blue.7">
                            Lease Duration:
                          </Text>
                          <Text size="sm" fw={500} c="blue.6">
                            {leaseDuration > 0
                              ? `${leaseDuration} months (${Math.floor(leaseDuration / 12)} years ${leaseDuration % 12} months)`
                              : "Invalid payment"}
                          </Text>
                        </Group>
                        <Group justify="apart">
                          <Text size="sm" c="blue.7">
                            Total Amount:
                          </Text>
                          <Text size="sm" fw={500} c="blue.6">
                            {formatCurrency(totalAmount)}
                          </Text>
                        </Group>
                        <Group justify="apart">
                          <Text size="sm" c="blue.7">
                            Total Interest:
                          </Text>
                          <Text size="sm" fw={500} c="orange.6">
                            {formatCurrency(
                              totalAmount - selectedInquiry.propertyPrice
                            )}
                          </Text>
                        </Group>
                      </Stack>
                    </Card>
                    {leaseDuration === 0 && monthlyPayment && (
                      <Alert
                        icon={<IconAlertCircle size={16} />}
                        color="red"
                        title="Payment Warning"
                      >
                        Monthly payment is too low to cover interest. Please
                        increase the payment amount.
                      </Alert>
                    )}
                    {leaseDuration > 600 && (
                      <Alert
                        icon={<IconAlertCircle size={16} />}
                        color="yellow"
                        title="Long Duration Warning"
                      >
                        Lease duration is very long (
                        {Math.floor(leaseDuration / 12)} years). Consider
                        increasing monthly payment.
                      </Alert>
                    )}
                  </Stack>
                </Grid.Col>
              </Grid>

              <Group>
                <Text fw={500} c={primaryTextColor}>
                  Quick Payment Options
                </Text>
              </Group>
              <SimpleGrid cols={3} spacing="md">
                {[
                  { years: 5, label: "5 Years" },
                  { years: 10, label: "10 Years" },
                  { years: 15, label: "15 Years" },
                ].map((option) => {
                  const principal =
                    selectedInquiry.propertyPrice -
                    (parseFloat(downPayment) || 0);
                  const monthlyRate = parseFloat(interestRate) / 100 / 12;
                  const months = option.years * 12;
                  let suggestedPayment = 0;

                  if (monthlyRate === 0) {
                    suggestedPayment = principal / months;
                  } else {
                    suggestedPayment =
                      (principal *
                        (monthlyRate * Math.pow(1 + monthlyRate, months))) /
                      (Math.pow(1 + monthlyRate, months) - 1);
                  }

                  return (
                    <MantineButton
                      key={option.years}
                      variant="light"
                      onClick={() =>
                        setMonthlyPayment(suggestedPayment.toFixed(2))
                      }
                    >
                      <Text size="sm" fw={500}>
                        {option.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatCurrency(suggestedPayment)} / month
                      </Text>
                    </MantineButton>
                  );
                })}
              </SimpleGrid>

              <Group justify="apart">
                <MantineButton
                  onClick={() => handleApprove(selectedInquiry)}
                  color="green"
                  leftSection={<IconCreditCard size={16} />}
                  loading={
                    processingId ===
                    `${selectedInquiry.propertyId}-${selectedInquiry.email}`
                  }
                  disabled={
                    !monthlyPayment ||
                    leaseDuration === 0 ||
                    processingId ===
                    `${selectedInquiry.propertyId}-${selectedInquiry.email}`
                  }
                >
                  {processingId ===
                    `${selectedInquiry.propertyId}-${selectedInquiry.email}`
                    ? "Processing..."
                    : "Approve & Create Payment Plan"}
                </MantineButton>
                <MantineButton variant="outline" onClick={resetPaymentModal}>
                  Cancel
                </MantineButton>
                <MantineButton
                  leftSection={<IconMail size={16} />}
                  onClick={sendPaymentReminders}
                  loading={loading}
                >
                  Send Payment Reminders
                </MantineButton>
              </Group>
            </Stack>
          )}
        </Modal>

        {/* Reject Modal */}
        <Modal
          opened={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedInquiry(null);
            setRejectionReason("");
            setRejectionError("");
            setConfirmReject(false);
          }}
          title="Reject Application"
          size="md"
          centered
        >
          {selectedInquiry && (
            <>
              <Text c="dimmed" mb="md">
                Rejecting application from{" "}
                <Text span fw={500} c={primaryTextColor}>
                  ,{selectedInquiry.fullName}
                </Text>{" "}
                for property{" "}
                <Text span fw={500} c={primaryTextColor}>
                  ,{selectedInquiry.propertyTitle}
                </Text>
                .
              </Text>
              <Textarea
                label="Rejection Reason"
                placeholder="Please provide a reason for rejection (e.g., insufficient documentation, property already leased)..."
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setRejectionError("");
                }}
                error={rejectionError}
                minRows={4}
                required
              />
              {confirmReject && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="yellow"
                  title="Confirmation"
                >
                  Are you sure you want to reject this application? This action
                  cannot be undone.
                </Alert>
              )}
              <Group justify="apart" mt="md">
                <MantineButton
                  color="red"
                  leftSection={<IconX size={16} />}
                  onClick={handleReject}
                  loading={
                    processingId ===
                    `${selectedInquiry.propertyId}-${selectedInquiry.email}`
                  }
                  disabled={
                    processingId ===
                    `${selectedInquiry.propertyId}-${selectedInquiry.email}`
                  }
                >
                  {processingId ===
                    `${selectedInquiry.propertyId}-${selectedInquiry.email}`
                    ? "Processing..."
                    : confirmReject
                      ? "Confirm Rejection"
                      : "Reject Application"}
                </MantineButton>
                <MantineButton
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedInquiry(null);
                    setRejectionReason("");
                    setRejectionError("");
                    setConfirmReject(false);
                  }}
                >
                  Cancel
                </MantineButton>
              </Group>
            </>
          )}
        </Modal>

        {/* Refresh Button */}
        <Group justify="flex-end">
          <MantineButton
            leftSection={<IconRefresh size={16} />}
            onClick={fetchInquiries}
          >
            Refresh
          </MantineButton>
        </Group>
      </Stack>
    </Container>
  );
};

export default ApplicationsPage;