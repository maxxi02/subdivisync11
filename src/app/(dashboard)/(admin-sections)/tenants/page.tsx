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
  Box,
  PasswordInput,
  ScrollArea,
} from "@mantine/core";
import { IconEdit, IconUsers, IconSearch, IconEye } from "@tabler/icons-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "react-hot-toast";
import { DateInput } from "@mantine/dates";

interface Tenant {
  _id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: string;
  created_at: string;
  address?: string;
  gender?: string;
  age?: number;
  phoneNumber?: string;
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
  status?: string;
  address?: string;
  gender?: string;
  age?: number;
  phoneNumber?: string;
  property?: {
    title: string;
    location: string;
    type: string;
    sqft?: number;
    bedrooms?: number;
    bathrooms?: number;
  };
}

const defaultForm = {
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  password: "",
  confirmPassword: "",
  status: "Active",
  address: "",
  gender: "",
  age: "",
  phoneNumber: "",
};

const TenantsSection = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editForm, setEditForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState<{
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    address?: string;
    gender?: string;
    age?: string;
    phoneNumber?: string;
  }>({});
  const [dataFetched, setDataFetched] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingTenant, setViewingTenant] = useState<Tenant | null>(null);

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
    toast.success("Tenants fetched successfully");
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
        _id: user.id, // IMPORTANT: Use user.id (UUID), not the MongoDB _id
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        status: user.status || "Active",
        created_at: user.createdAt.toISOString(),
        address: user.address || "",
        gender: user.gender || "",
        age: user.age || 0,
        phoneNumber: user.phoneNumber || "",
        property: user.property,
      }));

      setTenants(mappedTenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Failed to fetch tenants. Please try again.");
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    const nameParts = (tenant.user_name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName =
      nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    const middleName =
      nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

    setEditingTenant(tenant);
    setEditForm({
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      email: tenant.user_email || "",
      password: "",
      confirmPassword: "",
      status: tenant.status || "Active",
      address: tenant.address || "",
      gender: tenant.gender || "",
      age: tenant.age?.toString() || "",
      phoneNumber: tenant.phoneNumber || "",
    });
    setShowEditModal(true);
  };

  const validateForm = () => {
    const errors: typeof formErrors = {};
    let isValid = true;

    // First Name validation
    if (!editForm.first_name.trim()) {
      errors.first_name = "First name is required";
      isValid = false;
    } else if (editForm.first_name.trim().length < 2) {
      errors.first_name = "First name must be at least 2 characters";
      isValid = false;
    }

    // Last Name validation
    if (!editForm.last_name.trim()) {
      errors.last_name = "Last name is required";
      isValid = false;
    } else if (editForm.last_name.trim().length < 2) {
      errors.last_name = "Last name must be at least 2 characters";
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editForm.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(editForm.email)) {
      errors.email = "Invalid email format";
      isValid = false;
    }

    if (!editingTenant) {
      // Password validation with special characters
      if (!editForm.password) {
        errors.password = "Password is required";
        isValid = false;
      } else {
        if (editForm.password.length < 8) {
          errors.password = "Password must be at least 8 characters long";
          isValid = false;
        } else if (!/[A-Z]/.test(editForm.password)) {
          errors.password =
            "Password must contain at least one uppercase letter";
          isValid = false;
        } else if (!/[a-z]/.test(editForm.password)) {
          errors.password =
            "Password must contain at least one lowercase letter";
          isValid = false;
        } else if (!/[0-9]/.test(editForm.password)) {
          errors.password = "Password must contain at least one number";
          isValid = false;
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(editForm.password)) {
          errors.password =
            'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)';
          isValid = false;
        }
      }

      if (!editForm.confirmPassword) {
        errors.confirmPassword = "Confirm password is required";
        isValid = false;
      } else if (editForm.password !== editForm.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
        isValid = false;
      }

      // Phone number validation - must be exactly 11 digits for PH
      if (!editForm.phoneNumber.trim()) {
        errors.phoneNumber = "Phone number is required";
        isValid = false;
      } else {
        const phoneRegex = /^(09|\+639)\d{9}$/;
        if (!phoneRegex.test(editForm.phoneNumber.trim())) {
          errors.phoneNumber =
            "Invalid phone number format. Use 09XXXXXXXXX or +639XXXXXXXXX";
          isValid = false;
        }
      }

      if (!editForm.gender) {
        errors.gender = "Gender is required";
        isValid = false;
      }

      // Date of birth validation
      if (!editForm.age.trim()) {
        errors.age = "Date of birth is required";
        isValid = false;
      } else {
        const birthDate = new Date(editForm.age);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        // Adjust age if birthday hasn't occurred this year
        const actualAge =
          monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

        if (actualAge < 18) {
          errors.age = "Tenant must be at least 18 years old";
          isValid = false;
        } else if (actualAge > 120) {
          errors.age = "Please enter a valid date of birth";
          isValid = false;
        }
      }
    } else {
      // For existing tenants
      if (editForm.phoneNumber.trim().length > 0) {
        const phoneRegex = /^(09|\+639)\d{9}$/;
        if (!phoneRegex.test(editForm.phoneNumber.trim())) {
          errors.phoneNumber =
            "Invalid phone number format. Use 09XXXXXXXXX or +639XXXXXXXXX";
          isValid = false;
        }
      }

      // Validate date of birth if provided for existing tenant
      if (editForm.age.trim() !== "") {
        const birthDate = new Date(editForm.age);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        const actualAge =
          monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

        if (actualAge < 18) {
          errors.age = "Tenant must be at least 18 years old";
          isValid = false;
        } else if (actualAge > 120) {
          errors.age = "Please enter a valid date of birth";
          isValid = false;
        }
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleCreateTenant = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (!editForm.password) {
        toast.error("Password is required for new tenants.");
        return;
      }

      const response = await fetch("/api/admin/create-tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: editForm.email,
          password: editForm.password,
          name: `${editForm.first_name.trim()} ${editForm.middle_name.trim() ? editForm.middle_name.trim() + " " : ""}${editForm.last_name.trim()}`,
          status: editForm.status,
          address: editForm.address.trim() || "n/a",
          gender: editForm.gender,
          dateOfBirth: editForm.age, // Send as ISO string
          phoneNumber: editForm.phoneNumber.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create tenant");
      }

      // Close modal and reset form immediately
      setShowEditModal(false);
      setEditForm(defaultForm);

      // Refetch all tenants to get the newly created one
      await fetchTenants();

      toast.success("Tenant created successfully!");
    } catch (error) {
      console.error("Error creating tenant:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create tenant. Please try again."
      );
    }
  };

  const handleUpdateTenant = async () => {
    if (!validateForm() || !editingTenant) {
      return;
    }

    try {
      console.log("Updating tenant:", editingTenant._id);

      const fullName = `${editForm.first_name.trim()} ${editForm.middle_name.trim() ? editForm.middle_name.trim() + " " : ""}${editForm.last_name.trim()}`;

      const response = await fetch("/api/admin/update-tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: editingTenant._id,
          name: fullName,
          email: editForm.email,
          status: editForm.status,
          address: editForm.address.trim() || "n/a",
          gender: editForm.gender,
          dateOfBirth: editForm.age, // Send date string
          phoneNumber: editForm.phoneNumber.trim() || "n/a",
        }),
      });

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update tenant");
      }

      setTenants((prev) =>
        prev.map((t) =>
          t._id === editingTenant._id
            ? {
                ...t,
                user_name: fullName,
                user_email: editForm.email,
                status: editForm.status,
                address: editForm.address,
                gender: editForm.gender,
                age: parseInt(editForm.age) || 0,
                phoneNumber: editForm.phoneNumber,
              }
            : t
        )
      );

      setShowEditModal(false);
      setEditingTenant(null);
      setEditForm(defaultForm);
      toast.success("Tenant updated successfully!");
    } catch (error) {
      console.error("Error updating tenant:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update tenant. Please try again."
      );
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
        <Group>
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
                        color="blue"
                        onClick={() => {
                          setViewingTenant(tenant);
                          setShowViewModal(true);
                        }}
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
            label="First Name"
            value={editForm.first_name}
            onChange={(e) =>
              setEditForm({ ...editForm, first_name: e.currentTarget.value })
            }
            required
            error={formErrors.first_name}
          />
          <TextInput
            label="Middle Name (Optional)"
            value={editForm.middle_name}
            onChange={(e) =>
              setEditForm({ ...editForm, middle_name: e.currentTarget.value })
            }
            error={formErrors.middle_name}
          />
          <TextInput
            label="Last Name"
            value={editForm.last_name}
            onChange={(e) =>
              setEditForm({ ...editForm, last_name: e.currentTarget.value })
            }
            required
            error={formErrors.last_name}
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
          <TextInput
            label="Address"
            value={editForm.address}
            onChange={(e) =>
              setEditForm({ ...editForm, address: e.currentTarget.value })
            }
            error={formErrors.address}
          />

          <TextInput
            label="Phone Number"
            value={editForm.phoneNumber}
            onChange={(e) =>
              setEditForm({ ...editForm, phoneNumber: e.currentTarget.value })
            }
            error={formErrors.phoneNumber}
          />

          <Group grow>
            <Select
              label="Gender"
              value={editForm.gender}
              onChange={(value) =>
                setEditForm({ ...editForm, gender: value || "" })
              }
              data={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]}
              required
              error={formErrors.gender}
            />
            <TextInput
              label="Date of Birth"
              type="date"
              value={editForm.age}
              onChange={(e) =>
                setEditForm({ ...editForm, age: e.currentTarget.value })
              }
              max={
                new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                  .toISOString()
                  .split("T")[0]
              }
              min={
                new Date(new Date().setFullYear(new Date().getFullYear() - 120))
                  .toISOString()
                  .split("T")[0]
              }
              required
              error={formErrors.age}
            />
          </Group>
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
            <Button
              onClick={editingTenant ? handleUpdateTenant : handleCreateTenant}
            >
              {editingTenant ? "Update Tenant" : "Create Tenant"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* View Modal */}
      <Modal
        opened={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Tenant Details"
        size="lg"
      >
        {viewingTenant && (
          <Stack gap="md">
            <Box className="rounded-lg p-4">
              <Text size="sm" fw={500} mb="sm">
                Personal Information
              </Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Full Name:
                  </Text>
                  <Text size="sm" fw={500}>
                    {viewingTenant.user_name}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Email:
                  </Text>
                  <Text size="sm" fw={500}>
                    {viewingTenant.user_email}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Phone Number:
                  </Text>
                  <Text size="sm" fw={500}>
                    {viewingTenant.phoneNumber || "N/A"}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Address:
                  </Text>
                  <Text size="sm" fw={500}>
                    {viewingTenant.address || "N/A"}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Gender:
                  </Text>
                  <Text size="sm" fw={500}>
                    {viewingTenant.gender
                      ? viewingTenant.gender.charAt(0).toUpperCase() +
                        viewingTenant.gender.slice(1)
                      : "N/A"}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Age:
                  </Text>
                  <Text size="sm" fw={500}>
                    {viewingTenant.age || "N/A"}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Status:
                  </Text>
                  <div>{getStatusBadge(viewingTenant.status)}</div>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Created At:
                  </Text>
                  <Text size="sm" fw={500}>
                    {new Date(viewingTenant.created_at).toLocaleDateString()}
                  </Text>
                </Group>
              </Stack>
            </Box>

            {viewingTenant.property && (
              <Box className=" rounded-lg p-4">
                <Text size="sm" fw={500} mb="sm">
                  Property Information
                </Text>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Property Title:
                    </Text>
                    <Text size="sm" fw={500}>
                      {viewingTenant.property.title}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Location:
                    </Text>
                    <Text size="sm" fw={500}>
                      {viewingTenant.property.location}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Type:
                    </Text>
                    <Text size="sm" fw={500}>
                      {viewingTenant.property.type}
                    </Text>
                  </Group>
                  {viewingTenant.property.bedrooms &&
                    viewingTenant.property.bedrooms > 0 && (
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          Bedrooms:
                        </Text>
                        <Text size="sm" fw={500}>
                          {viewingTenant.property.bedrooms}
                        </Text>
                      </Group>
                    )}
                  {viewingTenant.property.bathrooms &&
                    viewingTenant.property.bathrooms > 0 && (
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          Bathrooms:
                        </Text>
                        <Text size="sm" fw={500}>
                          {viewingTenant.property.bathrooms}
                        </Text>
                      </Group>
                    )}
                  {viewingTenant.property.sqft &&
                    viewingTenant.property.sqft > 0 && (
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          Square Footage:
                        </Text>
                        <Text size="sm" fw={500}>
                          {viewingTenant.property.sqft} sq ft
                        </Text>
                      </Group>
                    )}
                </Stack>
              </Box>
            )}

            <Group justify="flex-end" mt="md">
              <Button onClick={() => setShowViewModal(false)}>Close</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
};

export default TenantsSection;
