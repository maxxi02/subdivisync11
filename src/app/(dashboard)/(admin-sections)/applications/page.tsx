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
  Table,
  Textarea,
  NumberInput,
  Divider,
} from "@mantine/core";
import {
  IconSearch,
  IconFilter,
  IconCheck,
  IconX,
  IconEye,
  IconPhone,
  IconMail,
  IconMapPin,
  IconClock,
  IconInfoCircle,
  IconCalculator,
} from "@tabler/icons-react";
import { Check, X } from "lucide-react";
import { propertyInquiriesApi } from "@/lib/api/property-inquiries";
import { propertiesApi } from "@/lib/api/properties";

interface Property {
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
  status: "available" | "reserved" | "sold" | "rented" | "owned";
  availability_status?: string;
  owner_details?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
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

  // Updated API status to include 'rejected'
  status:
    | "new"
    | "contacted"
    | "viewing-scheduled"
    | "negotiating"
    | "closed"
    | "rejected";

  // UI status for display purposes
  displayStatus: "pending" | "approved" | "rejected" | "owned";

  rejectionReason?: string;
  priority: "high" | "medium" | "low";
  created_by: string;
  created_at: string | Date;
  updated_at?: string | Date;
  submittedAt: string | Date;
  approvedAt?: string;

  // Enhanced property info - updated to include _id
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
  tenant?: {
    fullName: string;
    email: string;
    phone: string;
  };

  // UI display fields
  propertyTitle?: string;
  propertyPrice?: string;
  propertyLocation?: string;
  propertyImage?: string;

  // Payment plan
  selectedLeasePlan?: LeasePlan;
}

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

interface CustomLeasePlan {
  id: string;
  name: string;
  duration: number; // in months
  monthlyRate: number;
  totalAmount: number;
  interestRate: number;
  features: string[];
  recommended?: boolean;
}

const ApplicationsSection = () => {
  const [inquiries, setInquiries] = useState<PropertyInquiry[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] =
    useState<PropertyInquiry | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [inquiryToReject, setInquiryToReject] = useState<string | null>(null);
  const [clearAllLoading, setClearAllLoading] = useState(false);
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);

  // Lease plan selection variables
  const [planSelectionModalOpen, setPlanSelectionModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CustomLeasePlan | null>(
    null
  );
  const [inquiryToApprove, setInquiryToApprove] = useState<string | null>(null);
  const [customMonthlyPayment, setCustomMonthlyPayment] =
    useState<number>(5000);
  const [selectedTerm, setSelectedTerm] = useState<number>(12);
  const [interestRate, setInterestRate] = useState<number>(5);
  const [calculatedPlan, setCalculatedPlan] = useState<CustomLeasePlan | null>(
    null
  );
  const [currentPropertyPrice, setCurrentPropertyPrice] = useState<number>(0);

  // Extract numeric value from property price string
  const parsePropertyPrice = (priceString?: string): number => {
    if (!priceString) return 0;
    const cleanPrice = priceString
      .replace(/[₱,$]/g, "")
      .replace(/,/g, "")
      .replace(/\s/g, "");
    return parseFloat(cleanPrice) || 0;
  };

  // Map API status to display status
  const mapApiStatusToDisplayStatus = (
    apiStatus: string
  ): "pending" | "approved" | "rejected" | "owned" => {
    switch (apiStatus) {
      case "new":
      case "contacted":
      case "viewing-scheduled":
      case "negotiating":
        return "pending";
      case "closed":
        return "approved";
      case "rejected":
        return "rejected";
      case "owned":
        return "owned";
      default:
        return "pending";
    }
  };

  useEffect(() => {
    fetchInquiries();
    fetchProperties();
  }, []);

  useEffect(() => {
    if (currentPropertyPrice > 0) {
      const plan = calculateCustomPlan(currentPropertyPrice);
      setCalculatedPlan(plan);
    }
  }, [customMonthlyPayment, selectedTerm, interestRate, currentPropertyPrice]);

  const fetchProperties = async () => {
    try {
      const response = await propertiesApi.getAll({});
      if (response.success && response.properties) {
        setProperties(response.properties);
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    }
  };

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await propertyInquiriesApi.getAll();

      if (response.success && response.data?.inquiries) {
        const transformedInquiries: PropertyInquiry[] =
          response.data.inquiries.map((inquiry) => {
            const propertyPrice =
              inquiry.property?.price || inquiry.budgetRange || "0";

            return {
              ...inquiry,
              id: inquiry._id,
              submittedAt: inquiry.created_at,
              displayStatus: mapApiStatusToDisplayStatus(inquiry.status),
              propertyTitle:
                inquiry.property?.title ||
                getPropertyTitle(inquiry.propertyType),
              propertyPrice: propertyPrice,
              propertyLocation: inquiry.property?.location || "Location TBD",
              // Ensure property has _id if it exists
              property: inquiry.property
                ? {
                    ...inquiry.property,
                    _id:
                      inquiry.selectedPropertyId || inquiry.property._id || "",
                    status: inquiry.property.status || "available",
                  }
                : undefined,
            } as PropertyInquiry;
          });

        setInquiries(transformedInquiries);
      } else {
        console.error("Failed to fetch inquiries:", response.error);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Generate predefined lease plans based on property price
  const generatePredefinedPlans = (
    propertyPrice: number
  ): CustomLeasePlan[] => [
    {
      id: "standard",
      name: "Standard Lease",
      duration: 12,
      monthlyRate: Math.round(propertyPrice / 12),
      totalAmount: propertyPrice,
      interestRate: 0,
      features: [
        "No interest for 12 months",
        "Basic maintenance included",
        "Standard property insurance",
        "Monthly payment schedule",
      ],
    },
    {
      id: "extended",
      name: "Extended Lease",
      duration: 24,
      monthlyRate: Math.round((propertyPrice * 1.08) / 24),
      totalAmount: Math.round(propertyPrice * 1.08),
      interestRate: 4,
      features: [
        "4% annual interest rate",
        "Extended payment period",
        "Full maintenance included",
        "Premium property insurance",
      ],
      recommended: true,
    },
    {
      id: "long-term",
      name: "Long-term Lease",
      duration: 36,
      monthlyRate: Math.round((propertyPrice * 1.15) / 36),
      totalAmount: Math.round(propertyPrice * 1.15),
      interestRate: 5,
      features: [
        "5% annual interest rate",
        "Longest payment period",
        "Comprehensive maintenance package",
        "Full property insurance coverage",
        "Quarterly payment options available",
      ],
    },
  ];

  // Calculate custom plan based on monthly payment and term
  const calculateCustomPlan = (
    propertyPrice: number
  ): CustomLeasePlan | null => {
    if (!customMonthlyPayment || !selectedTerm || !propertyPrice) return null;

    const baseTotal = customMonthlyPayment * selectedTerm;

    if (baseTotal < propertyPrice) {
      const requiredTotal =
        propertyPrice * (1 + (interestRate / 100) * (selectedTerm / 12));
      const adjustedMonthly = Math.round(requiredTotal / selectedTerm);

      return {
        id: "custom",
        name: "Custom Payment Plan",
        duration: selectedTerm,
        monthlyRate: adjustedMonthly,
        totalAmount: adjustedMonthly * selectedTerm,
        interestRate: interestRate,
        features: [
          `${interestRate}% annual interest rate`,
          "Custom monthly payment schedule",
          "Flexible payment terms",
          "Basic maintenance included",
        ],
      };
    } else {
      const totalWithInterest =
        baseTotal * (1 + (interestRate / 100) * (selectedTerm / 12));
      const finalMonthly = Math.round(totalWithInterest / selectedTerm);

      return {
        id: "custom",
        name: "Custom Payment Plan",
        duration: selectedTerm,
        monthlyRate: finalMonthly,
        totalAmount: finalMonthly * selectedTerm,
        interestRate: interestRate,
        features: [
          `${interestRate}% annual interest rate`,
          "Custom monthly payment schedule",
          "Flexible payment terms",
          "Premium maintenance included",
        ],
      };
    }
  };

  const termOptions = [
    { value: "6", label: "6 months" },
    { value: "12", label: "12 months" },
    { value: "18", label: "18 months" },
    { value: "24", label: "24 months" },
    { value: "36", label: "36 months" },
    { value: "48", label: "48 months" },
  ];

  const handleApprove = async (inquiryId: string) => {
    const inquiry = inquiries.find((i) => (i.id || i._id) === inquiryId);
    if (!inquiry) return;

    // Get the actual property price
    let propertyPrice = 0;

    if (inquiry.selectedPropertyId) {
      // Try to get price from the selected property
      const property = properties.find(
        (p) => p._id === inquiry.selectedPropertyId
      );
      if (property) {
        propertyPrice = parsePropertyPrice(property.price);
      }
    }

    // Fallback to inquiry data
    if (propertyPrice === 0) {
      propertyPrice = parsePropertyPrice(
        inquiry.propertyPrice || inquiry.budgetRange
      );
    }

    setCurrentPropertyPrice(propertyPrice);
    setCustomMonthlyPayment(Math.round(propertyPrice / 12));
    setInquiryToApprove(inquiryId);
    setPlanSelectionModalOpen(true);
  };

  const confirmApproveWithPlan = async () => {
    if (!inquiryToApprove || !selectedPlan) return;

    setActionLoading(inquiryToApprove);

    try {
      const inquiry = inquiries.find(
        (i) => (i.id || i._id) === inquiryToApprove
      );
      if (!inquiry) return;

      // Update the inquiry status to "closed" (approved)
      const inquiryResponse = await propertyInquiriesApi.update(inquiry._id, {
        status: "closed",
      });

      if (inquiryResponse.success) {
        // If there's a selected property, update it with owner details and set as owned
        if (inquiry.selectedPropertyId) {
          try {
            await propertiesApi.update(inquiry.selectedPropertyId, {
              status: "owned" as const,
              owner_details: {
                fullName: inquiry.fullName,
                email: inquiry.email,
                phone: inquiry.primaryPhone,
                address: inquiry.currentAddress,
              },
            });
          } catch (error) {
            console.error("Error updating property owner:", error);
          }
        }

        // Update local state
        setInquiries((prev) =>
          prev.map((inq) => {
            if ((inq.id || inq._id) === inquiryToApprove) {
              return {
                ...inq,
                status: "closed" as const,
                displayStatus: "approved" as const,
                selectedLeasePlan: {
                  id: selectedPlan.id,
                  name: selectedPlan.name,
                  duration: `${selectedPlan.duration} months`,
                  monthlyRate: formatCurrency(selectedPlan.monthlyRate),
                  totalAmount: formatCurrency(selectedPlan.totalAmount),
                  interestRate: `${selectedPlan.interestRate}%`,
                  features: selectedPlan.features,
                },
                approvedAt: new Date().toISOString(),
              };
            }
            return inq;
          })
        );

        setPlanSelectionModalOpen(false);
        setSelectedPlan(null);
        setInquiryToApprove(null);
        alert(
          `Inquiry approved with ${selectedPlan.name}! Property ownership has been transferred.`
        );
      } else {
        alert(`Failed to approve inquiry: ${inquiryResponse.error}`);
      }
    } catch (error) {
      console.error("Error approving inquiry:", error);
      alert("Failed to approve inquiry. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (inquiryId: string) => {
    setInquiryToReject(inquiryId);
    setRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!inquiryToReject) return;

    setActionLoading(inquiryToReject);

    try {
      const inquiry = inquiries.find(
        (i) => (i.id || i._id) === inquiryToReject
      );
      if (!inquiry) return;

      const response = await propertyInquiriesApi.update(inquiry._id, {
        status: "rejected",
        rejectionReason: rejectionReason.trim() || "Application rejected",
      });

      if (response.success) {
        setInquiries((prev) =>
          prev.map((inq) => {
            if ((inq.id || inq._id) === inquiryToReject) {
              return {
                ...inq,
                status: "rejected" as const,
                displayStatus: "rejected" as const,
                rejectionReason:
                  rejectionReason.trim() || "Application rejected",
              };
            }
            return inq;
          })
        );

        setRejectModalOpen(false);
        setRejectionReason("");
        setInquiryToReject(null);
        alert("Inquiry rejected successfully!");
      } else {
        alert(`Failed to reject inquiry: ${response.error}`);
      }
    } catch (error) {
      console.error("Error rejecting inquiry:", error);
      alert("Failed to reject inquiry. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearAll = async () => {
    setClearAllLoading(true);

    try {
      const inquiriesToDelete = inquiries.filter(
        (inq) => inq.displayStatus !== "approved"
      );
      const deletePromises = inquiriesToDelete.map((inquiry) =>
        propertyInquiriesApi.delete(inquiry._id)
      );

      await Promise.all(deletePromises);
      setInquiries((prev) =>
        prev.filter((inq) => inq.displayStatus === "approved")
      );

      setClearAllModalOpen(false);
      alert("All non-approved applications cleared successfully!");
    } catch (error) {
      console.error("Error clearing applications:", error);
      alert("Failed to clear some applications. Please try again.");
    } finally {
      setClearAllLoading(false);
    }
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
      statusFilter === "all" || inquiry.displayStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (displayStatus: string) => {
    switch (displayStatus) {
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

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingCount = inquiries.filter(
    (i) => i.displayStatus === "pending"
  ).length;
  const approvedCount = inquiries.filter(
    (i) => i.displayStatus === "approved"
  ).length;
  const rejectedCount = inquiries.filter(
    (i) => i.displayStatus === "rejected"
  ).length;

  const isPendingStatus = (inquiry: PropertyInquiry): boolean => {
    return ["new", "contacted", "viewing-scheduled", "negotiating"].includes(
      inquiry.status
    );
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <div>Loading applications...</div>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Group justify="space-between" align="flex-end">
            <div>
              <Title order={1} size="h1" mb="sm">
                Property Applications
              </Title>
              <Text c="dimmed" size="lg">
                Review and manage property inquiries from potential tenants
              </Text>
            </div>
            <Button
              color="red"
              variant="light"
              leftSection={<IconX size={16} />}
              onClick={() => setClearAllModalOpen(true)}
              disabled={
                clearAllLoading ||
                inquiries.filter((i) => i.displayStatus !== "approved")
                  .length === 0
              }
            >
              Clear All Applications
            </Button>
          </Group>
        </div>

        {/* Stats Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
                    Pending
                  </Text>
                  <Text fw={700} size="xl">
                    {pendingCount}
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

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
                    Approved
                  </Text>
                  <Text fw={700} size="xl">
                    {approvedCount}
                  </Text>
                </div>
                <ActionIcon variant="light" color="green" size="xl" radius="md">
                  <Check size={20} />
                </ActionIcon>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
                    Rejected
                  </Text>
                  <Text fw={700} size="xl">
                    {rejectedCount}
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
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                ]}
              />
            </Grid.Col>
          </Grid>
        </Card>

        {/* Inquiries List */}
        <Stack gap="md">
          {filteredInquiries.length === 0 ? (
            <Card withBorder radius="md" p="xl">
              <Stack align="center" gap="md">
                <IconInfoCircle size={48} color="gray" />
                <Text size="lg" c="dimmed">
                  {inquiries.length === 0
                    ? "No property inquiries found"
                    : "No inquiries found matching your criteria"}
                </Text>
              </Stack>
            </Card>
          ) : (
            filteredInquiries.map((inquiry) => (
              <Card key={inquiry.id} withBorder radius="md" p="lg">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 9 }}>
                    <Stack gap="xs">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text fw={600} size="lg">
                            {inquiry.fullName}
                          </Text>
                          <Text c="dimmed" size="sm">
                            Submitted {formatDate(inquiry.created_at)}
                          </Text>
                        </div>
                        <Badge
                          color={getStatusColor(inquiry.displayStatus)}
                          variant="light"
                        >
                          {inquiry.displayStatus === "approved"
                            ? "Approved"
                            : inquiry.displayStatus === "pending"
                            ? "Pending"
                            : inquiry.displayStatus.charAt(0).toUpperCase() +
                              inquiry.displayStatus.slice(1)}
                        </Badge>
                      </Group>

                      <Text fw={500} c="blue">
                        {inquiry.propertyTitle} - {inquiry.propertyPrice}
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
                        {inquiry.timeline}
                      </Text>

                      {/* Show selected lease plan for approved inquiries */}
                      {inquiry.selectedLeasePlan &&
                        inquiry.displayStatus === "approved" && (
                          <Card
                            withBorder
                            radius="sm"
                            p="sm"
                            mt="sm"
                            style={{ backgroundColor: "#f0f8ff" }}
                          >
                            <Text fw={600} size="sm" mb="xs">
                              Selected Lease Plan:{" "}
                              {inquiry.selectedLeasePlan.name}
                            </Text>
                            <Group gap="md">
                              <Text size="xs" c="dimmed">
                                Duration: {inquiry.selectedLeasePlan.duration}
                              </Text>
                              <Text size="xs" c="dimmed">
                                Monthly: {inquiry.selectedLeasePlan.monthlyRate}
                              </Text>
                              <Text size="xs" c="dimmed">
                                Total: {inquiry.selectedLeasePlan.totalAmount}
                              </Text>
                              {inquiry.selectedLeasePlan.interestRate && (
                                <Text size="xs" c="dimmed">
                                  Interest:{" "}
                                  {inquiry.selectedLeasePlan.interestRate}
                                </Text>
                              )}
                            </Group>
                          </Card>
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

                      {isPendingStatus(inquiry) && (
                        <Group grow>
                          <Button
                            color="green"
                            leftSection={<IconCheck size={16} />}
                            onClick={() => handleApprove(inquiry.id)}
                            disabled={!!actionLoading}
                          >
                            Approve
                          </Button>
                          <Button
                            color="red"
                            variant="light"
                            leftSection={<IconX size={16} />}
                            onClick={() => handleReject(inquiry.id)}
                            disabled={!!actionLoading}
                          >
                            Reject
                          </Button>
                        </Group>
                      )}
                      {inquiry.displayStatus === "approved" && (
                        <Alert color="green" variant="light" p="xs">
                          <Text size="sm" ta="center">
                            Property Rented
                          </Text>
                        </Alert>
                      )}
                      {inquiry.displayStatus === "rejected" && (
                        <Alert color="red" variant="light" p="xs">
                          <Text size="sm" ta="center">
                            Application Rejected
                          </Text>
                        </Alert>
                      )}
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Card>
            ))
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
              {/* Personal Information */}
              <div>
                <Text fw={600} mb="xs">
                  Personal Information
                </Text>
                <Table>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td fw={500}>Full Name</Table.Td>
                      <Table.Td>{selectedInquiry.fullName}</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>Email</Table.Td>
                      <Table.Td>{selectedInquiry.email}</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>Primary Phone</Table.Td>
                      <Table.Td>{selectedInquiry.primaryPhone}</Table.Td>
                    </Table.Tr>
                    {selectedInquiry.secondaryPhone && (
                      <Table.Tr>
                        <Table.Td fw={500}>Secondary Phone</Table.Td>
                        <Table.Td>{selectedInquiry.secondaryPhone}</Table.Td>
                      </Table.Tr>
                    )}
                    <Table.Tr>
                      <Table.Td fw={500}>Current Address</Table.Td>
                      <Table.Td>{selectedInquiry.currentAddress}</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>Preferred Contact Method</Table.Td>
                      <Table.Td>
                        {selectedInquiry.preferredContactMethod
                          ?.charAt(0)
                          .toUpperCase() +
                          selectedInquiry.preferredContactMethod?.slice(1)}
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>Preferred Contact Time</Table.Td>
                      <Table.Td>
                        {selectedInquiry.preferredContactTime}
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </div>

              <Divider />

              {/* Property Information */}
              <div>
                <Text fw={600} mb="xs">
                  Property Information
                </Text>
                <Table>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td fw={500}>Property Type</Table.Td>
                      <Table.Td>
                        {selectedInquiry.propertyType
                          ?.replace("-", " ")
                          .toUpperCase()}
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>Property Title</Table.Td>
                      <Table.Td>{selectedInquiry.propertyTitle}</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>Location</Table.Td>
                      <Table.Td>{selectedInquiry.propertyLocation}</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>Price</Table.Td>
                      <Table.Td>{selectedInquiry.propertyPrice}</Table.Td>
                    </Table.Tr>
                    {selectedInquiry.specificLotUnit && (
                      <Table.Tr>
                        <Table.Td fw={500}>Specific Lot/Unit</Table.Td>
                        <Table.Td>{selectedInquiry.specificLotUnit}</Table.Td>
                      </Table.Tr>
                    )}
                    {selectedInquiry.preferredLotSize && (
                      <Table.Tr>
                        <Table.Td fw={500}>Preferred Lot Size</Table.Td>
                        <Table.Td>{selectedInquiry.preferredLotSize}</Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </div>

              <Divider />

              {/* Financial Information */}
              <div>
                <Text fw={600} mb="xs">
                  Financial Information
                </Text>
                <Table>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td fw={500}>Budget Range</Table.Td>
                      <Table.Td>{selectedInquiry.budgetRange}</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>Payment Method</Table.Td>
                      <Table.Td>
                        {selectedInquiry.paymentMethod
                          ?.charAt(0)
                          .toUpperCase() +
                          selectedInquiry.paymentMethod?.slice(1)}
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>Timeline</Table.Td>
                      <Table.Td>
                        {selectedInquiry.timeline
                          ?.replace("-", " ")
                          .toUpperCase()}
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </div>

              {/* Additional Requirements */}
              {selectedInquiry.additionalRequirements && (
                <>
                  <Divider />
                  <div>
                    <Text fw={600} mb="xs">
                      Additional Requirements
                    </Text>
                    <Text>{selectedInquiry.additionalRequirements}</Text>
                  </div>
                </>
              )}

              {/* Application Status */}
              <Divider />
              <div>
                <Text fw={600} mb="xs">
                  Application Status
                </Text>
                <Group>
                  <Badge
                    color={getStatusColor(selectedInquiry.displayStatus)}
                    size="lg"
                  >
                    {selectedInquiry.displayStatus.charAt(0).toUpperCase() +
                      selectedInquiry.displayStatus.slice(1)}
                  </Badge>
                  <Text size="sm" c="dimmed">
                    Priority: {selectedInquiry.priority?.toUpperCase()}
                  </Text>
                </Group>
                {selectedInquiry.rejectionReason && (
                  <Alert color="red" variant="light" mt="sm">
                    <Text fw={500} size="sm">
                      Rejection Reason:
                    </Text>
                    <Text size="sm">{selectedInquiry.rejectionReason}</Text>
                  </Alert>
                )}
              </div>

              {/* Selected Lease Plan for approved applications */}
              {selectedInquiry.selectedLeasePlan &&
                selectedInquiry.displayStatus === "approved" && (
                  <>
                    <Divider />
                    <div>
                      <Text fw={600} mb="xs">
                        Selected Lease Plan
                      </Text>
                      <Card withBorder p="md" radius="sm">
                        <Text fw={600} mb="xs">
                          {selectedInquiry.selectedLeasePlan.name}
                        </Text>
                        <Grid>
                          <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">
                              Duration
                            </Text>
                            <Text fw={500}>
                              {selectedInquiry.selectedLeasePlan.duration}
                            </Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">
                              Monthly Payment
                            </Text>
                            <Text fw={500}>
                              {selectedInquiry.selectedLeasePlan.monthlyRate}
                            </Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="sm" c="dimmed">
                              Total Amount
                            </Text>
                            <Text fw={500}>
                              {selectedInquiry.selectedLeasePlan.totalAmount}
                            </Text>
                          </Grid.Col>
                          {selectedInquiry.selectedLeasePlan.interestRate && (
                            <Grid.Col span={6}>
                              <Text size="sm" c="dimmed">
                                Interest Rate
                              </Text>
                              <Text fw={500}>
                                {selectedInquiry.selectedLeasePlan.interestRate}
                              </Text>
                            </Grid.Col>
                          )}
                        </Grid>
                        {selectedInquiry.selectedLeasePlan.features && (
                          <div>
                            <Text fw={500} size="sm" mt="md" mb="xs">
                              Plan Features:
                            </Text>
                            <Stack gap="xs">
                              {selectedInquiry.selectedLeasePlan.features.map(
                                (feature, index) => (
                                  <Text key={index} size="sm" c="dimmed">
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
            </Stack>
          )}
        </Modal>

        {/* Lease Plan Selection Modal */}
        <Modal
          opened={planSelectionModalOpen}
          onClose={() => {
            setPlanSelectionModalOpen(false);
            setSelectedPlan(null);
            setInquiryToApprove(null);
          }}
          title="Select Lease Plan"
          size="xl"
        >
          <Stack gap="lg">
            <Alert color="blue" variant="light">
              <Text size="sm">
                <IconInfoCircle
                  size={16}
                  style={{ display: "inline", marginRight: "4px" }}
                />
                Choose a lease plan for this approved application. The tenant
                will be notified of the selected terms.
              </Text>
            </Alert>

            {/* Property Price Display */}
            {currentPropertyPrice > 0 && (
              <Card withBorder p="md" radius="sm">
                <Text fw={600} mb="xs">
                  Property Price: {formatCurrency(currentPropertyPrice)}
                </Text>
              </Card>
            )}

            {/* Predefined Plans */}
            <div>
              <Text fw={600} mb="md">
                Predefined Lease Plans
              </Text>
              <Grid>
                {generatePredefinedPlans(currentPropertyPrice).map((plan) => (
                  <Grid.Col key={plan.id} span={{ base: 12, md: 4 }}>
                    <Card
                      withBorder
                      p="md"
                      radius="sm"
                      style={{
                        cursor: "pointer",
                        border:
                          selectedPlan?.id === plan.id
                            ? "2px solid #228be6"
                            : undefined,
                        backgroundColor: plan.recommended
                          ? "#f0f8ff"
                          : undefined,
                      }}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text fw={600}>{plan.name}</Text>
                          {plan.recommended && (
                            <Badge color="blue" size="xs">
                              Recommended
                            </Badge>
                          )}
                        </Group>
                        <Text size="sm" c="dimmed">
                          {plan.duration} months
                        </Text>
                        <Text fw={600} color="green">
                          {formatCurrency(plan.monthlyRate)}/month
                        </Text>
                        <Text size="sm" c="dimmed">
                          Total: {formatCurrency(plan.totalAmount)}
                        </Text>
                        {plan.interestRate > 0 && (
                          <Text size="sm" c="dimmed">
                            Interest: {plan.interestRate}% annually
                          </Text>
                        )}
                        <Stack gap="xs" mt="sm">
                          {plan.features.slice(0, 2).map((feature, index) => (
                            <Text key={index} size="xs" c="dimmed">
                              • {feature}
                            </Text>
                          ))}
                        </Stack>
                      </Stack>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            </div>

            <Divider />

            {/* Custom Plan Calculator */}
            <div>
              <Group mb="md">
                <Text fw={600}>Custom Payment Plan</Text>
                <ActionIcon variant="light" color="blue" size="sm">
                  <IconCalculator size={16} />
                </ActionIcon>
              </Group>

              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <NumberInput
                    label="Monthly Payment (PHP)"
                    value={customMonthlyPayment}
                    onChange={(value) =>
                      setCustomMonthlyPayment(Number(value) || 0)
                    }
                    min={1000}
                    step={500}
                    thousandSeparator=","
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Payment Term"
                    value={selectedTerm.toString()}
                    onChange={(value) => setSelectedTerm(Number(value) || 12)}
                    data={termOptions}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <NumberInput
                    label="Interest Rate (%)"
                    value={interestRate}
                    onChange={(value) => setInterestRate(Number(value) || 0)}
                    min={0}
                    max={20}
                    step={0.5}
                    decimalScale={1}
                  />
                </Grid.Col>
              </Grid>

              {calculatedPlan && (
                <Card
                  withBorder
                  p="md"
                  radius="sm"
                  mt="md"
                  style={{ backgroundColor: "#f8f9fa" }}
                >
                  <Group justify="space-between" mb="sm">
                    <Text fw={600}>Calculated Custom Plan</Text>
                    <Button
                      variant="light"
                      size="xs"
                      onClick={() => setSelectedPlan(calculatedPlan)}
                    >
                      Select This Plan
                    </Button>
                  </Group>
                  <Grid>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">
                        Monthly Payment
                      </Text>
                      <Text fw={600}>
                        {formatCurrency(calculatedPlan.monthlyRate)}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">
                        Total Amount
                      </Text>
                      <Text fw={600}>
                        {formatCurrency(calculatedPlan.totalAmount)}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">
                        Duration
                      </Text>
                      <Text fw={600}>{calculatedPlan.duration} months</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">
                        Interest Rate
                      </Text>
                      <Text fw={600}>
                        {calculatedPlan.interestRate}% annually
                      </Text>
                    </Grid.Col>
                  </Grid>
                </Card>
              )}
            </div>

            <Divider />

            {/* Action Buttons */}
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  setPlanSelectionModalOpen(false);
                  setSelectedPlan(null);
                  setInquiryToApprove(null);
                }}
              >
                Cancel
              </Button>
              <Button
                color="green"
                disabled={!selectedPlan}
                loading={!!actionLoading}
                onClick={confirmApproveWithPlan}
              >
                Approve with Selected Plan
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Rejection Modal */}
        <Modal
          opened={rejectModalOpen}
          onClose={() => {
            setRejectModalOpen(false);
            setRejectionReason("");
            setInquiryToReject(null);
          }}
          title="Reject Application"
          size="md"
        >
          <Stack gap="md">
            <Alert color="red" variant="light">
              <Text size="sm">
                Please provide a reason for rejecting this application. This
                will be sent to the applicant.
              </Text>
            </Alert>

            <Textarea
              label="Rejection Reason"
              placeholder="Enter the reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.currentTarget.value)}
              minRows={3}
              required
            />

            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectionReason("");
                  setInquiryToReject(null);
                }}
              >
                Cancel
              </Button>
              <Button
                color="red"
                disabled={!rejectionReason.trim()}
                loading={!!actionLoading}
                onClick={confirmReject}
              >
                Confirm Rejection
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Clear All Confirmation Modal */}
        <Modal
          opened={clearAllModalOpen}
          onClose={() => setClearAllModalOpen(false)}
          title="Clear All Applications"
          size="md"
        >
          <Stack gap="md">
            <Alert color="orange" variant="light">
              <Text size="sm">
                <IconInfoCircle
                  size={16}
                  style={{ display: "inline", marginRight: "4px" }}
                />
                This will permanently delete all non-approved applications.
                Approved applications will be preserved.
              </Text>
            </Alert>

            <Text>
              Are you sure you want to clear all pending and rejected
              applications? This action cannot be undone.
            </Text>

            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => setClearAllModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                color="red"
                loading={clearAllLoading}
                onClick={handleClearAll}
              >
                Clear All Applications
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
};

export default ApplicationsSection;
