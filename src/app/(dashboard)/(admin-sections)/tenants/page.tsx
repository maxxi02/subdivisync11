"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  Paper,
  TextInput,
  Button,
  Badge,
  ActionIcon,
  Group,
  Title,
  Text,
  Modal,
  Stack,
  Grid,
  NumberInput,
  Select,
  Textarea,
  Loader,
  Center,
  Container,
  Flex,
  Box,
  Divider,
  Notification,
} from "@mantine/core";
import {
  IconTrash,
  IconEdit,
  IconEye,
  IconUsers,
  IconPhone,
  IconMail,
  IconSearch,
  IconX,
  IconCheck,
} from "@tabler/icons-react";

interface Tenant {
  _id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  property_id: string;
  monthly_payment?: number;
  status: string;
  personal_info?: {
    full_name?: string;
    email?: string;
    phone?: string;
    emergency_contact?: string;
  };
  employment_info?: {
    employer_name?: string;
    job_title?: string;
    annual_income?: number;
    employment_length?: string;
    supervisor_contact?: string;
  };
  lease_start_date?: string;
  lease_end_date?: string;
  property?: {
    _id: string;
    address: string;
    type: string;
    bedrooms: number;
    bathrooms: number;
  };
  admin_notes?: string;
  created_at: string;
}

const TenantsSection = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form states for editing
  const [editForm, setEditForm] = useState({
    monthly_payment: 0,
    status: "",
    admin_notes: "",
    personal_info: {
      full_name: "",
      email: "",
      phone: "",
      emergency_contact: "",
    },
    employment_info: {
      employer_name: "",
      job_title: "",
      annual_income: 0,
      employment_length: "",
      supervisor_contact: "",
    },
  });

  useEffect(() => {
    fetchTenants();
  }, [filter]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("status", filter);
      }

      const response = await fetch(`/api/tenants?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTenants(data.tenants || []);
      } else {
        throw new Error(data.error || "Failed to fetch tenants");
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
      showNotification("error", "Failed to fetch tenants. Please try again.");
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (tenant: Tenant) => {
    try {
      // Fetch detailed tenant information
      const response = await fetch(`/api/tenants/${tenant._id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSelectedTenant(data.tenant);
        setShowModal(true);
      } else {
        throw new Error(data.error || "Failed to fetch tenant details");
      }
    } catch (error) {
      console.error("Error fetching tenant details:", error);
      showNotification(
        "error",
        "Failed to fetch tenant details. Please try again."
      );
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditForm({
      monthly_payment: tenant.monthly_payment || 0,
      status: tenant.status || "Active",
      admin_notes: tenant.admin_notes || "",
      personal_info: {
        full_name: tenant.personal_info?.full_name || tenant.user_name || "",
        email: tenant.personal_info?.email || tenant.user_email || "",
        phone: tenant.personal_info?.phone || "",
        emergency_contact: tenant.personal_info?.emergency_contact || "",
      },
      employment_info: {
        employer_name: tenant.employment_info?.employer_name || "",
        job_title: tenant.employment_info?.job_title || "",
        annual_income: tenant.employment_info?.annual_income || 0,
        employment_length: tenant.employment_info?.employment_length || "",
        supervisor_contact: tenant.employment_info?.supervisor_contact || "",
      },
    });
    setShowEditModal(true);
  };

  const handleUpdateTenant = async () => {
    if (!editingTenant) return;

    try {
      const response = await fetch(`/api/tenants/${editingTenant._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update local state with the updated tenant
        setTenants((prev) =>
          prev.map((t) =>
            t._id === editingTenant._id ? { ...t, ...data.tenant } : t
          )
        );
        setShowEditModal(false);
        setEditingTenant(null);
        showNotification("success", "Tenant updated successfully!");
      } else {
        throw new Error(data.error || "Failed to update tenant");
      }
    } catch (error) {
      console.error("Error updating tenant:", error);
      showNotification("error", "Failed to update tenant. Please try again.");
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this tenant? This will also make the property available."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTenants((prev) => prev.filter((t) => t._id !== tenantId));
        showNotification("success", "Tenant deleted successfully!");
      } else {
        throw new Error(data.error || "Failed to delete tenant");
      }
    } catch (error) {
      console.error("Error deleting tenant:", error);
      showNotification("error", "Failed to delete tenant. Please try again.");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      Active: "green",
      Inactive: "red",
      Evicted: "red",
      "Moved Out": "gray",
    };
    return (
      <Badge
        color={colors[status as keyof typeof colors] || "yellow"}
        variant="filled"
      >
        {status}
      </Badge>
    );
  };

  const filteredTenants = tenants.filter(
    (tenant) =>
      (tenant.personal_info?.full_name || tenant.user_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (tenant.property?.address || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (tenant.user_email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <Container size="xl" py="md">
      {/* Notification */}
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

      {/* Header */}
      <Group mb="xl">
        <IconUsers size={32} color="blue" />
        <Box>
          <Title order={1}>Tenants Management</Title>
          <Text c="dimmed">
            Manage all your tenants, their payments, and lease information
          </Text>
        </Box>
      </Group>

      {/* Filters and Search */}
      <Paper p="md" mb="md" shadow="sm">
        <Flex justify="space-between" align="center" gap="md" wrap="wrap">
          <Group>
            {["all", "Active", "Inactive", "Evicted", "Moved Out"].map(
              (status) => (
                <Button
                  key={status}
                  variant={filter === status ? "filled" : "light"}
                  onClick={() => setFilter(status)}
                  size="sm"
                >
                  {status === "all" ? "All Tenants" : status}
                </Button>
              )
            )}
          </Group>
          <TextInput
            placeholder="Search tenants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            style={{ minWidth: 250 }}
          />
        </Flex>
      </Paper>

      {/* Table */}
      <Paper shadow="sm">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Tenant</Table.Th>
              <Table.Th>Contact</Table.Th>
              <Table.Th>Property</Table.Th>
              <Table.Th>Monthly Payment</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Start Date</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredTenants.map((tenant) => (
              <Table.Tr key={tenant._id}>
                <Table.Td>
                  <Box>
                    <Text fw={500}>
                      {tenant.personal_info?.full_name ||
                        tenant.user_name ||
                        "Unknown"}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {tenant.user_email}
                    </Text>
                  </Box>
                </Table.Td>
                <Table.Td>
                  <Box>
                    <Text size="sm">
                      <IconPhone
                        size={14}
                        style={{ display: "inline", marginRight: 4 }}
                      />
                      {tenant.personal_info?.phone || "No phone"}
                    </Text>
                    <Text size="sm" c="dimmed">
                      <IconMail
                        size={14}
                        style={{ display: "inline", marginRight: 4 }}
                      />
                      {tenant.user_email}
                    </Text>
                  </Box>
                </Table.Td>
                <Table.Td>
                  <Box>
                    <Text size="sm" fw={500}>
                      {tenant.property?.address || "No address"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {tenant.property?.type} • {tenant.property?.bedrooms}BR/
                      {tenant.property?.bathrooms}BA
                    </Text>
                  </Box>
                </Table.Td>
                <Table.Td>
                  <Text fw={600} c="green">
                    ₱{(tenant.monthly_payment || 0).toLocaleString()}
                  </Text>
                </Table.Td>
                <Table.Td>{getStatusBadge(tenant.status)}</Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => handleViewDetails(tenant)}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="green"
                      onClick={() => handleEditTenant(tenant)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => handleDeleteTenant(tenant._id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {filteredTenants.length === 0 && (
          <Center py="xl">
            <Stack align="center">
              <IconUsers size={48} color="gray" />
              <Title order={3} c="dimmed">
                No tenants found
              </Title>
              <Text c="dimmed">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "No tenants match the selected filter."}
              </Text>
            </Stack>
          </Center>
        )}
      </Paper>

      {/* View Details Modal */}
      <Modal
        opened={showModal}
        onClose={() => setShowModal(false)}
        title={<Title order={2}>Tenant Details</Title>}
        size="lg"
      >
        {selectedTenant && (
          <Grid>
            <Grid.Col span={6}>
              <Title order={4} mb="sm">
                Personal Information
              </Title>
              <Stack gap="xs">
                <Text>
                  <strong>Name:</strong>{" "}
                  {selectedTenant.personal_info?.full_name ||
                    selectedTenant.user_name ||
                    "N/A"}
                </Text>
                <Text>
                  <strong>Email:</strong>{" "}
                  {selectedTenant.personal_info?.email ||
                    selectedTenant.user_email ||
                    "N/A"}
                </Text>
                <Text>
                  <strong>Phone:</strong>{" "}
                  {selectedTenant.personal_info?.phone || "N/A"}
                </Text>
                <Text>
                  <strong>Emergency Contact:</strong>{" "}
                  {selectedTenant.personal_info?.emergency_contact || "N/A"}
                </Text>
                <Group gap="xs">
                  <strong>Status:</strong>
                  {getStatusBadge(selectedTenant.status)}
                </Group>
              </Stack>
            </Grid.Col>

            <Grid.Col span={6}>
              <Title order={4} mb="sm">
                Employment Information
              </Title>
              <Stack gap="xs">
                <Text>
                  <strong>Employer:</strong>{" "}
                  {selectedTenant.employment_info?.employer_name || "N/A"}
                </Text>
                <Text>
                  <strong>Job Title:</strong>{" "}
                  {selectedTenant.employment_info?.job_title || "N/A"}
                </Text>
                <Text>
                  <strong>Annual Income:</strong> ₱
                  {(
                    selectedTenant.employment_info?.annual_income || 0
                  ).toLocaleString()}
                </Text>
                <Text>
                  <strong>Employment Length:</strong>{" "}
                  {selectedTenant.employment_info?.employment_length || "N/A"}
                </Text>
              </Stack>
            </Grid.Col>

            <Grid.Col span={6}>
              <Title order={4} mb="sm">
                Property Information
              </Title>
              <Stack gap="xs">
                <Text>
                  <strong>Address:</strong>{" "}
                  {selectedTenant.property?.address || "N/A"}
                </Text>
                <Text>
                  <strong>Type:</strong>{" "}
                  {selectedTenant.property?.type || "N/A"}
                </Text>
                <Text>
                  <strong>Bedrooms:</strong>{" "}
                  {selectedTenant.property?.bedrooms || "N/A"}
                </Text>
                <Text>
                  <strong>Bathrooms:</strong>{" "}
                  {selectedTenant.property?.bathrooms || "N/A"}
                </Text>
              </Stack>
            </Grid.Col>

            <Grid.Col span={6}>
              <Title order={4} mb="sm">
                Lease Information
              </Title>
              <Stack gap="xs">
                <Text>
                  <strong>Monthly Payment:</strong>{" "}
                  <Text component="span" fw={600} c="green">
                    ₱{(selectedTenant.monthly_payment || 0).toLocaleString()}
                  </Text>
                </Text>
                <Text>
                  <strong>Start Date:</strong>{" "}
                  {new Date(selectedTenant.created_at).toLocaleDateString()}
                </Text>
                {selectedTenant.admin_notes && (
                  <Text>
                    <strong>Admin Notes:</strong> {selectedTenant.admin_notes}
                  </Text>
                )}
              </Stack>
            </Grid.Col>
          </Grid>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        opened={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={<Title order={2}>Edit Tenant</Title>}
        size="lg"
      >
        <Stack>
          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                label="Monthly Payment"
                value={editForm.monthly_payment}
                onChange={(value) =>
                  setEditForm({
                    ...editForm,
                    monthly_payment: Number(value) || 0,
                  })
                }
                leftSection="₱"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Status"
                value={editForm.status}
                onChange={(value) =>
                  setEditForm({ ...editForm, status: value || "Active" })
                }
                data={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                  { value: "Evicted", label: "Evicted" },
                  { value: "Moved Out", label: "Moved Out" },
                ]}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Full Name"
            value={editForm.personal_info.full_name}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                personal_info: {
                  ...editForm.personal_info,
                  full_name: e.currentTarget.value,
                },
              })
            }
          />

          <TextInput
            label="Email"
            type="email"
            value={editForm.personal_info.email}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                personal_info: {
                  ...editForm.personal_info,
                  email: e.currentTarget.value,
                },
              })
            }
          />

          <TextInput
            label="Phone"
            value={editForm.personal_info.phone}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                personal_info: {
                  ...editForm.personal_info,
                  phone: e.currentTarget.value,
                },
              })
            }
          />

          <TextInput
            label="Emergency Contact"
            value={editForm.personal_info.emergency_contact}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                personal_info: {
                  ...editForm.personal_info,
                  emergency_contact: e.currentTarget.value,
                },
              })
            }
          />

          <Divider label="Employment Information" />

          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Employer Name"
                value={editForm.employment_info.employer_name}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    employment_info: {
                      ...editForm.employment_info,
                      employer_name: e.currentTarget.value,
                    },
                  })
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Job Title"
                value={editForm.employment_info.job_title}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    employment_info: {
                      ...editForm.employment_info,
                      job_title: e.currentTarget.value,
                    },
                  })
                }
              />
            </Grid.Col>
          </Grid>

          <NumberInput
            label="Annual Income"
            value={editForm.employment_info.annual_income}
            onChange={(value) =>
              setEditForm({
                ...editForm,
                employment_info: {
                  ...editForm.employment_info,
                  annual_income: Number(value) || 0,
                },
              })
            }
            leftSection="₱"
          />

          <Textarea
            label="Admin Notes"
            value={editForm.admin_notes}
            onChange={(e) =>
              setEditForm({ ...editForm, admin_notes: e.currentTarget.value })
            }
            placeholder="Add any admin notes..."
            rows={3}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTenant}>Update Tenant</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default TenantsSection;
