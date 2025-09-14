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
  IconCheck,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { Check, X, XCircle } from "lucide-react";
import { propertyInquiriesApi } from "@/lib/api/property-inquiries";

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

  property?: {
    title: string;
    location: string;
    price: string;
    type: string;
    size: string;
    images?: string[];
    amenities?: string[];
    description?: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    status: string;
    availability_status?: string;
  };

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

const MyApplicationsSection = () => {
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

  // Fetch tenant's inquiries from API
  const fetchMyInquiries = async () => {
    try {
      setLoading(true);
      const response = await propertyInquiriesApi.getAll({
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (response.success && response.data?.inquiries) {
        const transformedInquiries = response.data.inquiries.map(
          (inquiry): PropertyInquiry => ({
            ...inquiry,
            id: inquiry._id,
            submittedAt: inquiry.created_at,
            status: mapApiStatusToComponentStatus(inquiry.status),
            property: inquiry.property
              ? {
                  ...inquiry.property,
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
          })
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

  const mapApiStatusToComponentStatus = (
    apiStatus:
      | "new"
      | "contacted"
      | "viewing-scheduled"
      | "negotiating"
      | "closed"
      | "rejected"
      | "owned"
  ): "pending" | "approved" | "rejected" | "owned" => {
    switch (apiStatus) {
      case "new":
      case "contacted":
      case "viewing-scheduled":
        return "pending";
      case "negotiating":
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

  const handleMarkAsOwned = async (inquiryId: string) => {
    try {
      setActionLoading(inquiryId);
      const response = await propertyInquiriesApi.update(inquiryId, {
        status: "owned" as const,
      });

      if (response.success) {
        await fetchMyInquiries();
        notifications.show({
          title: "Property Marked as Owned",
          message: "Congratulations! The property has been marked as owned.",
          color: "blue",
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

  const SkeletonInquiry = () => (
    <Card withBorder radius="md" p="lg">
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
  );

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
          <Grid.Col span={{ base: 12, sm: 4 }}>
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

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
                    Approved
                  </Text>
                  <Text fw={700} size="xl">
                    {loading ? <Loader size="xs" /> : approvedCount}
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
                placeholder="Search by property or details..."
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

        {/* Applications List */}
        <Stack gap="md">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <SkeletonInquiry key={index} />
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
            filteredInquiries.map((inquiry) => (
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
                            Submitted {formatDate(inquiry.created_at as string)}
                          </Text>
                        </div>
                        <Badge
                          color={getStatusColor(inquiry.status)}
                          variant="light"
                        >
                          {inquiry.status.charAt(0).toUpperCase() +
                            inquiry.status.slice(1)}
                        </Badge>
                      </Group>

                      <Text fw={500} c="blue">
                        {inquiry.propertyPrice}
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

                      {inquiry.status === "pending" && (
                        <Group grow>
                          <Button
                            color="blue"
                            variant="light"
                            leftSection={
                              actionLoading === inquiry.id ? (
                                <Loader size="xs" />
                              ) : (
                                <IconEdit size={16} />
                              )
                            }
                            onClick={() => handleEdit(inquiry)}
                            disabled={!!actionLoading}
                          >
                            Edit
                          </Button>
                          <Button
                            color="red"
                            variant="light"
                            leftSection={
                              actionLoading === inquiry.id ? (
                                <Loader size="xs" />
                              ) : (
                                <IconTrash size={16} />
                              )
                            }
                            onClick={() => handleCancel(inquiry.id)}
                            disabled={!!actionLoading}
                          >
                            Cancel
                          </Button>
                        </Group>
                      )}

                      {inquiry.status === "rejected" && (
                        <Group grow>
                          <Button
                            color="red"
                            variant="light"
                            leftSection={
                              actionLoading === inquiry.id ? (
                                <Loader size="xs" />
                              ) : (
                                <IconTrash size={16} />
                              )
                            }
                            onClick={() => handleCancel(inquiry.id)}
                            disabled={!!actionLoading}
                          >
                            Delete
                          </Button>
                        </Group>
                      )}
                      {inquiry.status === "approved" && (
                        <Stack gap="xs">
                          <Button
                            color="blue"
                            variant="light"
                            leftSection={
                              actionLoading === inquiry.id ? (
                                <Loader size="xs" />
                              ) : (
                                <IconCheck size={16} />
                              )
                            }
                            onClick={() => handleMarkAsOwned(inquiry.id)}
                            disabled={!!actionLoading}
                            fullWidth
                          >
                            Mark as Owned
                          </Button>
                          <Alert color="green" variant="light" p="xs">
                            <Text size="sm" ta="center">
                              Application Approved
                            </Text>
                          </Alert>
                        </Stack>
                      )}

                      {inquiry.status === "owned" && (
                        <Alert color="blue" variant="light" p="xs">
                          <Text size="sm" ta="center">
                            Property Owned
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
      </Stack>

      {/* Details Modal */}
      <Modal
        opened={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Application Details"
        size="xl"
        centered
      >
        {selectedInquiry && (
          <Stack gap="lg">
            {/* Property Information */}
            <Card withBorder radius="md" p="md">
              <Text fw={600} size="lg" mb="md">
                Property Information
              </Text>
              <Table striped withTableBorder>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td fw={500} w={150}>
                      Property Type
                    </Table.Td>
                    <Table.Td tt="capitalize">
                      {selectedInquiry.propertyType.replace("-", " ")}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td fw={500}>Property Title</Table.Td>
                    <Table.Td>{selectedInquiry.propertyTitle}</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td fw={500}>Budget Range</Table.Td>
                    <Table.Td>{selectedInquiry.budgetRange}</Table.Td>
                  </Table.Tr>
                  {selectedInquiry.preferredLotSize && (
                    <Table.Tr>
                      <Table.Td fw={500}>Preferred Lot Size</Table.Td>
                      <Table.Td>{selectedInquiry.preferredLotSize}</Table.Td>
                    </Table.Tr>
                  )}
                  {selectedInquiry.specificLotUnit && (
                    <Table.Tr>
                      <Table.Td fw={500}>Specific Lot/Unit</Table.Td>
                      <Table.Td>{selectedInquiry.specificLotUnit}</Table.Td>
                    </Table.Tr>
                  )}
                  {selectedInquiry.status === "rejected" &&
                    selectedInquiry.rejectionReason && (
                      <Table.Tr>
                        <Table.Td fw={500} style={{ verticalAlign: "top" }}>
                          Rejection Reason
                        </Table.Td>
                        <Table.Td>
                          <Text c="red">{selectedInquiry.rejectionReason}</Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                </Table.Tbody>
              </Table>
            </Card>

            {/* Application Details */}
            <Card withBorder radius="md" p="md">
              <Text fw={600} size="lg" mb="md">
                Application Details
              </Text>
              <Table striped withTableBorder>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td fw={500} w={150}>
                      Timeline
                    </Table.Td>
                    <Table.Td tt="capitalize">
                      {selectedInquiry.timeline.replace("-", " ")}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td fw={500}>Payment Method</Table.Td>
                    <Table.Td tt="capitalize">
                      {selectedInquiry.paymentMethod}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td fw={500}>Status</Table.Td>
                    <Table.Td>
                      <Badge
                        color={getStatusColor(selectedInquiry.status)}
                        tt="capitalize"
                      >
                        {selectedInquiry.status}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td fw={500}>Submitted</Table.Td>
                    <Table.Td>
                      {formatDate(selectedInquiry.created_at as string)}
                    </Table.Td>
                  </Table.Tr>
                  {selectedInquiry.additionalRequirements && (
                    <Table.Tr>
                      <Table.Td fw={500} style={{ verticalAlign: "top" }}>
                        Additional Requirements
                      </Table.Td>
                      <Table.Td>
                        {selectedInquiry.additionalRequirements}
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Card>
          </Stack>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Application"
        size="xl"
        centered
      >
        <Stack gap="md">
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Full Name"
                value={editFormData.fullName}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, fullName: e.target.value })
                }
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Email"
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Primary Phone"
                value={editFormData.primaryPhone}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    primaryPhone: e.target.value,
                  })
                }
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Secondary Phone"
                value={editFormData.secondaryPhone}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    secondaryPhone: e.target.value,
                  })
                }
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label="Current Address"
                value={editFormData.currentAddress}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    currentAddress: e.target.value,
                  })
                }
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Preferred Contact Method"
                value={editFormData.preferredContactMethod}
                onChange={(value) =>
                  setEditFormData({
                    ...editFormData,
                    preferredContactMethod:
                      (value as "phone" | "email" | "text") || "phone",
                  })
                }
                data={[
                  { value: "phone", label: "Phone" },
                  { value: "email", label: "Email" },
                  { value: "text", label: "Text" },
                ]}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Budget Range"
                value={editFormData.budgetRange}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    budgetRange: e.target.value,
                  })
                }
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Timeline"
                value={editFormData.timeline}
                onChange={(value) =>
                  setEditFormData({
                    ...editFormData,
                    timeline:
                      (value as
                        | "immediate"
                        | "1-3-months"
                        | "3-6-months"
                        | "6-12-months"
                        | "flexible") || "immediate",
                  })
                }
                data={[
                  { value: "immediate", label: "Immediate" },
                  { value: "1-3-months", label: "1-3 Months" },
                  { value: "3-6-months", label: "3-6 Months" },
                  { value: "6-12-months", label: "6-12 Months" },
                  { value: "flexible", label: "Flexible" },
                ]}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Payment Method"
                value={editFormData.paymentMethod}
                onChange={(value) =>
                  setEditFormData({
                    ...editFormData,
                    paymentMethod:
                      (value as "cash" | "financing" | "installment") || "cash",
                  })
                }
                data={[
                  { value: "cash", label: "Cash" },
                  { value: "financing", label: "Financing" },
                  { value: "installment", label: "Installment" },
                ]}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Preferred Lot Size"
                value={editFormData.preferredLotSize}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    preferredLotSize: e.target.value,
                  })
                }
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label="Additional Requirements"
                value={editFormData.additionalRequirements}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    additionalRequirements: e.target.value,
                  })
                }
                minRows={3}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              loading={!!actionLoading}
              leftSection={<IconEdit size={16} />}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default MyApplicationsSection;
