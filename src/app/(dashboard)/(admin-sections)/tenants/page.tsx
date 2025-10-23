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
  Select,
  Loader,
  Center,
  Container,
  Flex,
  Box,
  PasswordInput,
  ScrollArea,
} from "@mantine/core";
import {
  IconTrash,
  IconEdit,
  IconUsers,
  IconSearch,
} from "@tabler/icons-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "react-hot-toast";

interface Tenant {
  _id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: string;
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

interface UserWithData {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  data?: {
    status?: string;
    property?: {
      title: string;
      location: string;
      type: string;
      sqft?: number;
      bedrooms?: number;
      bathrooms?: number;
    };
    [key: string]: unknown;
  };
}

const defaultForm = {
  full_name: "",
  email: "",
  password: "",
  confirmPassword: "",
  status: "Active",
};

const TenantsSection = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editForm, setEditForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState<{
    full_name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [dataFetched, setDataFetched] = useState(false);

  useEffect(() => {
    if (!dataFetched) {
      fetchTenants();
      setDataFetched(true);
    }
  }, [dataFetched]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dataFetched) {
        fetchTenants();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, dataFetched]);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const { data: users, error } = await authClient.admin.listUsers({
        query: {
          filterField: "role",
          filterValue: "tenant",
          filterOperator: "eq",
          limit: 100,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to fetch users");
      }

      const mappedTenants = (users.users || []).map((user: UserWithData) => ({
        _id: user.id,
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        status: user.data?.status || "Active",
        created_at: user.createdAt.toISOString(),
        property: user.data?.property,
      }));

      setTenants(mappedTenants);
      toast.success("Tenants fetched successfully");
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Failed to fetch tenants. Please try again.");
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditForm({
      full_name: tenant.user_name || "",
      email: tenant.user_email || "",
      password: "",
      confirmPassword: "",
      status: tenant.status || "Active",
    });
    setShowEditModal(true);
  };

  const validateForm = () => {
    const errors: typeof formErrors = {};
    let isValid = true;

    if (!editForm.full_name.trim()) {
      errors.full_name = "Full name is required";
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editForm.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(editForm.email)) {
      errors.email = "Invalid email format";
      isValid = false;
    }

    if (!editingTenant) {
      if (!editForm.password) {
        errors.password = "Password is required";
        isValid = false;
      } else if (editForm.password.length < 8) {
        errors.password = "Password must be at least 8 characters long";
        isValid = false;
      }

      if (!editForm.confirmPassword) {
        errors.confirmPassword = "Confirm password is required";
        isValid = false;
      } else if (editForm.password !== editForm.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSaveTenant = async () => {
    if (!validateForm()) {
      return;
    }

    if (editingTenant) {
      // Update
      try {
        const { data: updatedUser, error } = await authClient.admin.updateUser({
          userId: editingTenant._id,
          data: {
            name: editForm.full_name,
            email: editForm.email,
            status: editForm.status,
          },
        });

        if (error) {
          throw new Error(error.message || "Failed to update tenant");
        }

        setTenants((prev) =>
          prev.map((t) =>
            t._id === editingTenant._id
              ? {
                  ...t,
                  user_name: editForm.full_name,
                  user_email: editForm.email,
                  status: editForm.status,
                }
              : t
          )
        );
        setShowEditModal(false);
        setEditingTenant(null);
        toast.success("Tenant updated successfully!");
      } catch (error) {
        console.error("Error updating tenant:", error);
        toast.error("Failed to update tenant. Please try again.");
      }
    } else {
      // Create
      try {
        if (!editForm.password) {
          toast.error("Password is required for new tenants.");
          return;
        }

        const createData = {
          email: editForm.email,
          password: editForm.password,
          name: editForm.full_name,
          role: "tenant" as const,
          data: {
            status: editForm.status,
          },
        };

        const { data: newUser, error } =
          await authClient.admin.createUser(createData);

        if (error) {
          throw new Error(error.message || "Failed to create tenant");
        }

        const newTenant: Tenant = {
          _id: newUser.user.id,
          user_id: newUser.user.id,
          user_name: newUser.user.name,
          user_email: newUser.user.email,
          status: editForm.status,
          created_at: newUser.user.createdAt.toISOString(),
        };

        setTenants((prev) => [...prev, newTenant]);
        setShowEditModal(false);
        toast.success("Tenant created successfully!");
      } catch (error) {
        console.error("Error creating tenant:", error);
        toast.error("Failed to create tenant. Please try again.");
      }
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm("Are you sure you want to delete this tenant?")) {
      return;
    }

    try {
      const { error } = await authClient.admin.removeUser({
        userId: tenantId,
      });

      if (error) {
        throw new Error(error.message || "Failed to delete tenant");
      }

      setTenants((prev) => prev.filter((t) => t._id !== tenantId));
      toast.success("Tenant deleted successfully!");
    } catch (error) {
      console.error("Error deleting tenant:", error);
      toast.error("Failed to delete tenant. Please try again.");
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
      (tenant.user_name || "")
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
      {/* Header */}
      <Group mb="xl" justify="space-between">
        <Group>
          <IconUsers size={32} color="blue" />
          <Box>
            <Title order={1}>Tenants Management</Title>
            <Text c="dimmed">Manage all your tenants</Text>
          </Box>
        </Group>
        <Button
          onClick={() => {
            setEditingTenant(null);
            setEditForm(defaultForm);
            setShowEditModal(true);
          }}
        >
          Add New Tenant
        </Button>
      </Group>

      {/* Search */}
      <Paper p="md" mb="md" shadow="sm">
        <TextInput
          placeholder="Search tenants by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          style={{ maxWidth: 400 }}
        />
      </Paper>

      {/* Table */}
      <Paper shadow="sm">
        <ScrollArea type="auto">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tenant</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created At</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredTenants.map((tenant) => (
                <Table.Tr key={tenant._id}>
                  <Table.Td>
                    <Text fw={500}>{tenant.user_name || "Unknown"}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{tenant.user_email}</Text>
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
        </ScrollArea>

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
                  : "No tenants available."}
              </Text>
            </Stack>
          </Center>
        )}
      </Paper>

      {/* Edit/Create Modal */}
      <Modal
        opened={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setFormErrors({});
        }}
        title={<>{editingTenant ? "Edit Tenant" : "Create Tenant"}</>}
        size="lg"
      >
        <Stack>
          {editingTenant?.property && (
            <Box className="bg-gray-50 rounded-lg p-4">
              <Text size="sm" fw={500} mb="sm">
                Property Information
              </Text>
              <Group>
                <Box>
                  <Text size="xs" c="dimmed">
                    Property Title
                  </Text>
                  <Text size="sm">{editingTenant.property.title}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">
                    Location
                  </Text>
                  <Text size="sm">{editingTenant.property.location}</Text>
                </Box>
                {(editingTenant.property.type === "house-and-lot" ||
                  editingTenant.property.type === "condo") && (
                  <>
                    {editingTenant.property.bedrooms &&
                      editingTenant.property.bedrooms > 0 && (
                        <Box>
                          <Text size="xs" c="dimmed">
                            Bedrooms
                          </Text>
                          <Text size="sm">
                            {editingTenant.property.bedrooms} Bedroom
                            {editingTenant.property.bedrooms > 1 ? "s" : ""}
                          </Text>
                        </Box>
                      )}
                    {editingTenant.property.bathrooms &&
                      editingTenant.property.bathrooms > 0 && (
                        <Box>
                          <Text size="xs" c="dimmed">
                            Bathrooms
                          </Text>
                          <Text size="sm">
                            {editingTenant.property.bathrooms} Bathroom
                            {editingTenant.property.bathrooms > 1 ? "s" : ""}
                          </Text>
                        </Box>
                      )}
                    {editingTenant.property.sqft &&
                      editingTenant.property.sqft > 0 && (
                        <Box>
                          <Text size="xs" c="dimmed">
                            Square Footage
                          </Text>
                          <Text size="sm">
                            {editingTenant.property.sqft} sq ft
                          </Text>
                        </Box>
                      )}
                  </>
                )}
              </Group>
            </Box>
          )}
          <TextInput
            label="Full Name"
            value={editForm.full_name}
            onChange={(e) =>
              setEditForm({ ...editForm, full_name: e.currentTarget.value })
            }
            required
            error={formErrors.full_name}
          />
          <TextInput
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) =>
              setEditForm({ ...editForm, email: e.currentTarget.value })
            }
            required
            error={formErrors.email}
          />
          {!editingTenant && (
            <>
              <PasswordInput
                label="Password"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm({ ...editForm, password: e.currentTarget.value })
                }
                required
                error={formErrors.password}
              />
              <PasswordInput
                label="Confirm Password"
                value={editForm.confirmPassword}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    confirmPassword: e.currentTarget.value,
                  })
                }
                required
                error={formErrors.confirmPassword}
              />
            </>
          )}
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
          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              onClick={() => {
                setShowEditModal(false);
                setFormErrors({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTenant}>
              {editingTenant ? "Update Tenant" : "Create Tenant"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default TenantsSection;
