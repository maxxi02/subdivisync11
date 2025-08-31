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
  Divider,
  ActionIcon,
  Alert,
  Tabs,
  Paper,
  Skeleton,
  Box,
  Image,
  Loader,
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
  IconHome,
  IconUser,
  IconInfoCircle,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { Check, X, XCircle } from "lucide-react";
import {
  propertyInquiriesApi,
  PropertyInquiry as ApiPropertyInquiry,
} from "@/lib/api/property-inquiries";

interface PropertyInquiry
  extends Omit<ApiPropertyInquiry, "status" | "submittedAt"> {
  id: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";

  // Property Details (if available from API)
  propertyTitle?: string;
  propertyPrice?: string;
  propertyLocation?: string;
  propertyImage?: string;
}

const ApplicationsSection = () => {
  const [inquiries, setInquiries] = useState<PropertyInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] =
    useState<PropertyInquiry | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch inquiries from API
  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await propertyInquiriesApi.getAll({
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (response.success && response.data) {
        // Transform API data to match component interface
        const transformedInquiries = response.data.map((inquiry) => ({
          ...inquiry,
          id: inquiry._id!,
          submittedAt: inquiry.submittedAt,
          status:
            inquiry.status === "new"
              ? ("pending" as const)
              : inquiry.status === "approved"
              ? ("approved" as const)
              : inquiry.status === "rejected"
              ? ("rejected" as const)
              : ("pending" as const),
          // Mock property details - these should come from a separate API call
          propertyTitle: getPropertyTitle(inquiry.propertyType),
          propertyPrice: inquiry.budgetRange,
          propertyLocation: inquiry.specificLotUnit || "Location TBD",
          propertyImage: getPropertyImage(inquiry.propertyType),
        }));

        setInquiries(transformedInquiries);
      } else {
        notifications.show({
          title: "Error",
          message: response.message || "Failed to fetch inquiries",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load inquiries. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter]);

  const handleApprove = async (inquiryId: string) => {
    try {
      setActionLoading(inquiryId);
      const response = await propertyInquiriesApi.updateStatus(inquiryId, {
        status: "approved",
      });

      if (response.success) {
        await fetchInquiries(); // Refresh the list
        notifications.show({
          title: "Inquiry Approved",
          message:
            "The property inquiry has been approved and marked as rented.",
          color: "green",
          icon: <Check size={16} />,
        });
      } else {
        notifications.show({
          title: "Error",
          message: response.message || "Failed to approve inquiry",
          color: "red",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to approve inquiry. Please try again.",
        color: "red",
        icon: <XCircle size={16} />,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (inquiryId: string) => {
    try {
      setActionLoading(inquiryId);
      const response = await propertyInquiriesApi.updateStatus(inquiryId, {
        status: "rejected",
      });

      if (response.success) {
        await fetchInquiries(); // Refresh the list
        notifications.show({
          title: "Inquiry Rejected",
          message: "The property inquiry has been rejected.",
          color: "red",
          icon: <XCircle size={16} />,
        });
      } else {
        notifications.show({
          title: "Error",
          message: response.message || "Failed to reject inquiry",
          color: "red",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to reject inquiry. Please try again.",
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

  const getPropertyImage = (type: string): string => {
    switch (type) {
      case "residential-lot":
        return "/placeholder-lot.jpg";
      case "commercial":
        return "/placeholder-commercial.jpg";
      case "house-and-lot":
        return "/placeholder-house.jpg";
      case "condo":
        return "/placeholder-condo.jpg";
      default:
        return "/placeholder-property.jpg";
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

  // Loading skeleton component
  const SkeletonInquiry = () => (
    <Card withBorder radius="md" p="lg">
      <Grid>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Skeleton height={120} radius="md" />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
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
            Property Applications
          </Title>
          <Text c="dimmed" size="lg">
            Review and manage property inquiries from potential tenants
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
          {loading ? (
            // Show loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
              <SkeletonInquiry key={index} />
            ))
          ) : filteredInquiries.length === 0 ? (
            <Card withBorder radius="md" p="xl">
              <Stack align="center" gap="md">
                <IconInfoCircle size={48} color="gray" />
                <Text size="lg" c="dimmed">
                  {inquiries.length === 0
                    ? "No property inquiries found"
                    : "No inquiries found matching your criteria"}
                </Text>
                {inquiries.length === 0 && (
                  <Button onClick={fetchInquiries}>Refresh</Button>
                )}
              </Stack>
            </Card>
          ) : (
            filteredInquiries.map((inquiry) => (
              <Card key={inquiry.id} withBorder radius="md" p="lg">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Image
                      src={inquiry.propertyImage || "/placeholder.svg"}
                      alt={inquiry.propertyTitle || "Property"}
                      height={120}
                      radius="md"
                      fallbackSrc="/placeholder.svg"
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="xs">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Text fw={600} size="lg">
                            {inquiry.fullName}
                          </Text>
                          <Text c="dimmed" size="sm">
                            Submitted {formatDate(inquiry.submittedAt)}
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
                            color="green"
                            leftSection={
                              actionLoading === inquiry.id ? (
                                <Loader size="xs" />
                              ) : (
                                <IconCheck size={16} />
                              )
                            }
                            onClick={() => handleApprove(inquiry.id)}
                            disabled={!!actionLoading}
                          >
                            Approve
                          </Button>
                          <Button
                            color="red"
                            variant="light"
                            leftSection={
                              actionLoading === inquiry.id ? (
                                <Loader size="xs" />
                              ) : (
                                <IconX size={16} />
                              )
                            }
                            onClick={() => handleReject(inquiry.id)}
                            disabled={!!actionLoading}
                          >
                            Reject
                          </Button>
                        </Group>
                      )}

                      {inquiry.status === "approved" && (
                        <Alert color="green" variant="light" p="xs">
                          <Text size="sm" ta="center">
                            Property Rented
                          </Text>
                        </Alert>
                      )}

                      {inquiry.status === "rejected" && (
                        <Alert color="red" variant="light" p="xs">
                          <Text size="sm" ta="center">
                            Inquiry Rejected
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
        title="Inquiry Details"
        size="lg"
        centered
      >
        {selectedInquiry && (
          <Stack gap="md">
            {/* Property Information */}
            <Card withBorder radius="md" p="md">
              <Stack gap="sm">
                <Text fw={600} size="lg">
                  Property Information
                </Text>
                <Image
                  src={selectedInquiry.propertyImage || "/placeholder.svg"}
                  alt={selectedInquiry.propertyTitle || "Property"}
                  height={200}
                  radius="md"
                  fallbackSrc="/placeholder.svg"
                />
                <Group justify="space-between">
                  <Text fw={500}>{selectedInquiry.propertyTitle}</Text>
                  <Text fw={600} c="blue">
                    {selectedInquiry.propertyPrice}
                  </Text>
                </Group>
                <Text c="dimmed">
                  <IconMapPin
                    size={16}
                    style={{ display: "inline", marginRight: "4px" }}
                  />
                  {selectedInquiry.propertyLocation}
                </Text>
              </Stack>
            </Card>

            <Tabs defaultValue="contact">
              <Tabs.List>
                <Tabs.Tab value="contact" leftSection={<IconUser size={16} />}>
                  Contact Info
                </Tabs.Tab>
                <Tabs.Tab value="property" leftSection={<IconHome size={16} />}>
                  Property Interest
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="contact" pt="md">
                <Stack gap="sm">
                  <Group>
                    <Text fw={500} w={120}>
                      Full Name:
                    </Text>
                    <Text>{selectedInquiry.fullName}</Text>
                  </Group>
                  <Group>
                    <Text fw={500} w={120}>
                      Primary Phone:
                    </Text>
                    <Text>{selectedInquiry.primaryPhone}</Text>
                  </Group>
                  {selectedInquiry.secondaryPhone && (
                    <Group>
                      <Text fw={500} w={120}>
                        Secondary Phone:
                      </Text>
                      <Text>{selectedInquiry.secondaryPhone}</Text>
                    </Group>
                  )}
                  <Group>
                    <Text fw={500} w={120}>
                      Email:
                    </Text>
                    <Text>{selectedInquiry.email}</Text>
                  </Group>
                  <Group align="flex-start">
                    <Text fw={500} w={120}>
                      Current Address:
                    </Text>
                    <Text>{selectedInquiry.currentAddress}</Text>
                  </Group>
                  <Group>
                    <Text fw={500} w={120}>
                      Preferred Contact:
                    </Text>
                    <Text>{selectedInquiry.preferredContactMethod}</Text>
                  </Group>
                  <Group>
                    <Text fw={500} w={120}>
                      Preferred Contact Time:
                    </Text>
                    <Text>{selectedInquiry.preferredContactTime}</Text>
                  </Group>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="property" pt="md">
                <Stack gap="sm">
                  {selectedInquiry.specificLotUnit && (
                    <Group>
                      <Text fw={500} w={120}>
                        Specific Lot/Unit:
                      </Text>
                      <Text>{selectedInquiry.specificLotUnit}</Text>
                    </Group>
                  )}
                  <Group>
                    <Text fw={500} w={120}>
                      Property Type:
                    </Text>
                    <Text>{selectedInquiry.propertyType}</Text>
                  </Group>
                  <Group>
                    <Text fw={500} w={120}>
                      Budget Range:
                    </Text>
                    <Text>{selectedInquiry.budgetRange}</Text>
                  </Group>
                  <Group>
                    <Text fw={500} w={120}>
                      Preferred Lot Size:
                    </Text>
                    <Text>{selectedInquiry.preferredLotSize}</Text>
                  </Group>
                  <Group>
                    <Text fw={500} w={120}>
                      Timeline:
                    </Text>
                    <Text>{selectedInquiry.timeline}</Text>
                  </Group>
                  <Group>
                    <Text fw={500} w={120}>
                      Payment Method:
                    </Text>
                    <Text>{selectedInquiry.paymentMethod}</Text>
                  </Group>
                  {selectedInquiry.additionalRequirements && (
                    <Group align="flex-start">
                      <Text fw={500} w={120}>
                        Additional Requirements:
                      </Text>
                      <Text>{selectedInquiry.additionalRequirements}</Text>
                    </Group>
                  )}
                </Stack>
              </Tabs.Panel>
            </Tabs>

            {selectedInquiry.status === "pending" && (
              <>
                <Divider />
                <Group justify="flex-end">
                  <Button
                    color="red"
                    variant="light"
                    leftSection={
                      actionLoading === selectedInquiry.id ? (
                        <Loader size="xs" />
                      ) : (
                        <IconX size={16} />
                      )
                    }
                    onClick={() => {
                      handleReject(selectedInquiry.id);
                    }}
                    disabled={!!actionLoading}
                  >
                    Reject
                  </Button>
                  <Button
                    color="green"
                    leftSection={
                      actionLoading === selectedInquiry.id ? (
                        <Loader size="xs" />
                      ) : (
                        <IconCheck size={16} />
                      )
                    }
                    onClick={() => {
                      handleApprove(selectedInquiry.id);
                    }}
                    disabled={!!actionLoading}
                  >
                    Approve & Mark as Rented
                  </Button>
                </Group>
              </>
            )}
          </Stack>
        )}
      </Modal>
    </Container>
  );
};

export default ApplicationsSection;
