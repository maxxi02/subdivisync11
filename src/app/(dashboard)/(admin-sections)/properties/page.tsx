"use client";

import { useEffect, useState } from "react";
import {
  Title,
  Group,
  Card,
  Stack,
  Button,
  Text,
  Container,
  SimpleGrid,
  Modal,
  TextInput,
  Notification,
  Tabs,
  Grid,
  Box,
  Select,
  Badge,
  Divider,
  ActionIcon,
  Table,
  Avatar,
  Tooltip,
  Textarea,
  FileInput,
  MultiSelect,
} from "@mantine/core";
import {
  IconHome,
  IconExclamationMark,
  IconCash,
  IconUser,
  IconPhone,
  IconMapPin,
  IconCheck,
  IconBuilding,
  IconSearch,
  IconEye,
  IconEdit,
  IconCalendar,
  IconChartBar,
  IconUpload,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import {
  propertiesApi,
  CreatePropertyRequest,
  Property,
} from "@/lib/api/properties";

const AdminPropertiesSection = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [
    propertyModalOpened,
    { open: openPropertyModal, close: closePropertyModal },
  ] = useDisclosure(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [
    createModalOpened,
    { open: openCreateModal, close: closeCreateModal },
  ] = useDisclosure(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreatePropertyRequest>({
    title: "",
    location: "",
    size: "",
    price: "",
    type: "residential-lot",
    status: "available",
    image: "",
    amenities: [],
    description: "",
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
  });

  const availableAmenities = [
    { value: "swimming-pool", label: "Swimming Pool" },
    { value: "gym", label: "Gym/Fitness Center" },
    { value: "parking", label: "Parking Space" },
    { value: "security", label: "24/7 Security" },
    { value: "playground", label: "Playground" },
    { value: "garden", label: "Garden/Landscaping" },
    { value: "clubhouse", label: "Clubhouse" },
    { value: "basketball-court", label: "Basketball Court" },
    { value: "tennis-court", label: "Tennis Court" },
    { value: "jogging-path", label: "Jogging Path" },
    { value: "chapel", label: "Chapel" },
    { value: "commercial-area", label: "Commercial Area" },
    { value: "covered-court", label: "Covered Court" },
    { value: "function-hall", label: "Function Hall" },
    { value: "mini-market", label: "Mini Market" },
    { value: "laundry-area", label: "Laundry Area" },
    { value: "waste-management", label: "Waste Management" },
    { value: "water-system", label: "Water System" },
    { value: "electrical-system", label: "Electrical System" },
    { value: "internet-ready", label: "Internet Ready" },
  ];

  const handleImageUpload = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      handleInputChange("image", imageUrl);
    }
  };

  const handleInputChange = (
    field: keyof CreatePropertyRequest,
    value: string | number | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      location: "",
      size: "",
      price: "",
      type: "residential-lot",
      status: "available",
      image: "",
      amenities: [],
      description: "",
      bedrooms: 0,
      bathrooms: 0,
      sqft: 0,
    });
    setImageFile(null);
  };

  const handleCreateProperty = async () => {
    if (
      !formData.title ||
      !formData.location ||
      !formData.size ||
      !formData.price
    ) {
      showNotification("Please fill in all required fields", true);
      return;
    }

    try {
      setSubmitting(true);
      const response = await propertiesApi.create(formData);

      if (response.success) {
        showNotification(response.message || "Property created successfully!");
        closeCreateModal();
        resetForm();
        fetchProperties();
      } else {
        showNotification(response.error || "Failed to create property", true);
      }
    } catch (error) {
      showNotification("Failed to create property. Please try again.", true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAmenityChange = (value: string[]) => {
    handleInputChange("amenities", value);
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await propertiesApi.getAll({
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (response.success && response.properties) {
        setProperties(response.properties);
      } else {
        setError(response.error || "Failed to fetch properties");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [statusFilter]);

  const showNotification = (message: string, isError = false) => {
    if (isError) {
      setError(message);
    } else {
      setSuccessMessage(message);
    }

    setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
    }, 5000);
  };

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
    openPropertyModal();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sold":
        return "green";
      case "rented":
        return "blue";
      case "reserved":
        return "orange";
      case "available":
        return "gray";
      default:
        return "gray";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "green";
      case "partial":
        return "orange";
      case "pending":
        return "red";
      default:
        return "gray";
    }
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (property.owner?.fullName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: properties.length,
    rented: properties.filter((p) => p.status === "rented").length,
    available: properties.filter((p) => p.status === "available").length,
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        {error && (
          <Notification
            icon={<IconExclamationMark size={18} />}
            color="red"
            title="Error"
            onClose={() => setError(null)}
          >
            {error}
          </Notification>
        )}

        {successMessage && (
          <Notification
            icon={<IconCheck size={18} />}
            color="green"
            title="Success"
            onClose={() => setSuccessMessage(null)}
          >
            {successMessage}
          </Notification>
        )}

        <Group justify="space-between">
          <Group>
            <IconChartBar size={32} color="var(--mantine-color-blue-6)" />
            <Title order={1} size="h2">
              Property Management Dashboard
            </Title>
          </Group>
          <Button
            size="lg"
            onClick={openCreateModal}
            leftSection={<IconBuilding size={20} />}
          >
            Create New Property
          </Button>
        </Group>

        <Modal
          opened={createModalOpened}
          onClose={closeCreateModal}
          title="Create New Property"
          centered
          size="lg"
        >
          <Stack gap="md">
            <Box>
              <Title order={4} mb="md" c="blue">
                <IconBuilding size={20} style={{ marginRight: 8 }} />
                Property Information
              </Title>

              <Grid>
                <Grid.Col span={12}>
                  <TextInput
                    label="Property Title"
                    placeholder="Enter property title"
                    value={formData.title}
                    onChange={(e) =>
                      handleInputChange("title", e.currentTarget.value)
                    }
                    required
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <TextInput
                    label="Location/Address"
                    placeholder="Enter property location"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.currentTarget.value)
                    }
                    leftSection={<IconMapPin size={16} />}
                    required
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Size"
                    placeholder="e.g., 300 sqm"
                    value={formData.size}
                    onChange={(e) =>
                      handleInputChange("size", e.currentTarget.value)
                    }
                    required
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Price"
                    placeholder="e.g., ₱2,500,000"
                    value={formData.price}
                    onChange={(e) =>
                      handleInputChange("price", e.currentTarget.value)
                    }
                    leftSection={<IconCash size={16} />}
                    required
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Property Type"
                    value={formData.type}
                    onChange={(value) =>
                      handleInputChange("type", value || "residential-lot")
                    }
                    data={[
                      { value: "residential-lot", label: "Residential Lot" },
                      { value: "commercial", label: "Commercial" },
                      { value: "house-and-lot", label: "House and Lot" },
                      { value: "condo", label: "Condominium" },
                    ]}
                    required
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Status"
                    value={formData.status}
                    onChange={(value) =>
                      handleInputChange("status", value || "available")
                    }
                    data={[
                      { value: "available", label: "Available" },
                      { value: "reserved", label: "Reserved" },
                      { value: "sold", label: "Sold" },
                      { value: "rented", label: "Rented" },
                    ]}
                  />
                </Grid.Col>

                <Grid.Col span={12}>
                  <FileInput
                    label="Property Image"
                    placeholder="Select image from your device"
                    value={imageFile}
                    onChange={handleImageUpload}
                    leftSection={<IconUpload size={16} />}
                    accept="image/*"
                  />
                  {formData.image && (
                    <Box mt="sm">
                      <Text size="sm" c="dimmed" mb="xs">
                        Image Preview:
                      </Text>
                      <img
                        src={formData.image}
                        alt="Property preview"
                        style={{
                          width: "100%",
                          maxWidth: "200px",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid #e9ecef",
                        }}
                      />
                    </Box>
                  )}
                </Grid.Col>

                <Grid.Col span={12}>
                  <Textarea
                    label="Description"
                    placeholder="Enter property description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.currentTarget.value)
                    }
                    autosize
                    minRows={3}
                  />
                </Grid.Col>

                {(formData.type === "house-and-lot" ||
                  formData.type === "condo") && (
                  <>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <TextInput
                        label="Bedrooms"
                        placeholder="Number of bedrooms"
                        type="number"
                        value={formData.bedrooms?.toString() || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "bedrooms",
                            Number(e.currentTarget.value) || 0
                          )
                        }
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <TextInput
                        label="Bathrooms"
                        placeholder="Number of bathrooms"
                        type="number"
                        value={formData.bathrooms?.toString() || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "bathrooms",
                            Number(e.currentTarget.value) || 0
                          )
                        }
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <TextInput
                        label="Floor Area (sqft)"
                        placeholder="Floor area in square feet"
                        type="number"
                        value={formData.sqft?.toString() || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "sqft",
                            Number(e.currentTarget.value) || 0
                          )
                        }
                      />
                    </Grid.Col>
                  </>
                )}

                <Grid.Col span={12}>
                  <MultiSelect
                    label="Amenities"
                    placeholder="Select available amenities"
                    value={formData.amenities || []}
                    onChange={handleAmenityChange}
                    data={availableAmenities}
                    searchable
                    clearable
                  />
                </Grid.Col>
              </Grid>
            </Box>

            <Group justify="right" mt="xl">
              <Button
                variant="outline"
                onClick={() => {
                  closeCreateModal();
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProperty}
                loading={submitting}
                leftSection={<IconCheck size={16} />}
              >
                Create Property
              </Button>
            </Group>
          </Stack>
        </Modal>

        <SimpleGrid cols={{ base: 2, sm: 2 }} spacing="md">
          <Card withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Total Properties
                </Text>
                <Text fw={700} size="xl">
                  {stats.total}
                </Text>
              </div>
              <IconBuilding size={24} color="var(--mantine-color-blue-6)" />
            </Group>
          </Card>

          <Card withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Rented
                </Text>
                <Text fw={700} size="xl" c="blue">
                  {stats.rented}
                </Text>
              </div>
              <IconHome size={24} color="var(--mantine-color-blue-6)" />
            </Group>
          </Card>
        </SimpleGrid>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="overview">Properties Overview</Tabs.Tab>
            <Tabs.Tab value="owners">Owner Details</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <Card withBorder p="md" radius="md">
              <Group mb="xl">
                <TextInput
                  placeholder="Search properties or owners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  leftSection={<IconSearch size={16} />}
                  style={{ flex: 1 }}
                />
                <Select
                  placeholder="Filter by status"
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value || "all")}
                  data={[
                    { value: "all", label: "All Status" },
                    { value: "available", label: "Available" },
                    { value: "sold", label: "Sold" },
                    { value: "rented", label: "Rented" },
                    { value: "reserved", label: "Reserved" },
                  ]}
                  w={200}
                />
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {filteredProperties.map((property) => (
                  <Card key={property._id} shadow="sm" radius="md" withBorder>
                    <Card.Section>
                      <img
                        src={property.image || "/placeholder.svg"}
                        alt={property.title}
                        style={{
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                        }}
                      />
                    </Card.Section>

                    <Card.Section withBorder inheritPadding py="xs">
                      <Group justify="space-between">
                        <Text fw={500}>{property.title}</Text>
                        <Badge
                          color={getStatusColor(property.status)}
                          variant="light"
                        >
                          {property.status.toUpperCase()}
                        </Badge>
                      </Group>
                    </Card.Section>

                    <Stack gap="sm" mt="md" px="md">
                      <Group>
                        <IconMapPin size={16} />
                        <Text size="sm">{property.location}</Text>
                      </Group>

                      <Group>
                        <IconBuilding size={16} />
                        <Text size="sm">{property.size}</Text>
                      </Group>

                      <Group>
                        <IconCash size={16} />
                        <Text size="lg" fw={700} c="blue">
                          {property.price}
                        </Text>
                      </Group>

                      <Divider />

                      <Box>
                        <Text size="sm" fw={500} mb="xs" c="green">
                          Property Owner:
                        </Text>
                        <Group>
                          <Avatar size="sm" color="blue">
                            {property.owner?.fullName
                              ?.split(" ")
                              .map((n: string) => n[0]) // Fixed: Added type annotation
                              .join("") || "U"}
                          </Avatar>
                          <div>
                            <Text size="sm" fw={500}>
                              {property.owner?.fullName || "Unknown Owner"}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {property.owner?.email || "No email"}
                            </Text>
                          </div>
                        </Group>
                        <Group mt="xs">
                          <Badge
                            size="xs"
                            color={getPaymentStatusColor(
                              property.owner?.paymentStatus || "pending"
                            )}
                            variant="light"
                          >
                            {property.owner?.paymentStatus || "pending"}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            Approved:{" "}
                            {new Date(property.created_at).toLocaleDateString()}{" "}
                            {/* Fixed: Use created_at */}
                          </Text>
                        </Group>
                      </Box>
                    </Stack>

                    <Group justify="space-between" mt="md" mx="md" mb="md">
                      <Button
                        variant="light"
                        size="sm"
                        leftSection={<IconEye size={16} />}
                        onClick={() => handleViewProperty(property)}
                      >
                        View Details
                      </Button>
                      <ActionIcon variant="light" color="blue">
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Group>
                  </Card>
                ))}
              </SimpleGrid>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="owners" pt="md">
            <Card withBorder p="md" radius="md">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Owner</Table.Th>
                    <Table.Th>Property</Table.Th>
                    <Table.Th>Contact</Table.Th>
                    <Table.Th>Payment Status</Table.Th>
                    <Table.Th>Created Date</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredProperties.map((property) => (
                    <Table.Tr key={property._id}>
                      <Table.Td>
                        <Group>
                          <Avatar size="sm" color="blue">
                            {property.owner?.fullName
                              ?.split(" ")
                              .map((n: string) => n[0]) // Fixed: Added type annotation
                              .join("") || "U"}
                          </Avatar>
                          <div>
                            <Text size="sm" fw={500}>
                              {property.owner?.fullName || "Unknown Owner"}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {property.owner?.email || "No email"}
                            </Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <div>
                          <Text size="sm" fw={500}>
                            {property.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {property.location}
                          </Text>
                          <Badge
                            size="xs"
                            color={getStatusColor(property.status)}
                            variant="light"
                            mt="xs"
                          >
                            {property.status}
                          </Badge>
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <div>
                          <Group gap="xs">
                            <IconPhone size={12} />
                            <Text size="xs">
                              {property.owner?.phone || "No phone"}
                            </Text>
                          </Group>
                          <Group gap="xs" mt="xs">
                            <IconMapPin size={12} />
                            <Text size="xs" c="dimmed">
                              {property.owner?.address || "No address"}
                            </Text>
                          </Group>
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={getPaymentStatusColor(
                            property.owner?.paymentStatus || "pending"
                          )}
                          variant="light"
                        >
                          {property.owner?.paymentStatus || "pending"}
                        </Badge>
                        <Text size="xs" c="dimmed" mt="xs">
                          {property.owner?.paymentMethod || "No method"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {new Date(property.created_at).toLocaleDateString()}{" "}
                          {/* Fixed: Use created_at */}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="View Details">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="sm"
                              onClick={() => handleViewProperty(property)}
                            >
                              <IconEye size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Edit">
                            <ActionIcon
                              variant="light"
                              color="orange"
                              size="sm"
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          </Tabs.Panel>
        </Tabs>

        <Modal
          opened={propertyModalOpened}
          onClose={closePropertyModal}
          title="Property Details"
          centered
          size="lg"
        >
          {selectedProperty && (
            <Stack gap="md">
              <img
                src={selectedProperty.image || "/placeholder.svg"}
                alt={selectedProperty.title}
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />

              <Box>
                <Group justify="space-between" mb="md">
                  <Title order={3}>{selectedProperty.title}</Title>
                  <Badge
                    color={getStatusColor(selectedProperty.status)}
                    size="lg"
                  >
                    {selectedProperty.status.toUpperCase()}
                  </Badge>
                </Group>

                <Grid>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Location
                    </Text>
                    <Text fw={500}>{selectedProperty.location}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Size
                    </Text>
                    <Text fw={500}>{selectedProperty.size}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Price
                    </Text>
                    <Text fw={700} c="blue" size="lg">
                      {selectedProperty.price}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Type
                    </Text>
                    <Text fw={500}>
                      {selectedProperty.type.replace("-", " ").toUpperCase()}
                    </Text>
                  </Grid.Col>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Title order={4} mb="md" c="green">
                  <IconUser size={20} style={{ marginRight: 8 }} />
                  Owner Information
                </Title>

                <Grid>
                  <Grid.Col span={12}>
                    <Group>
                      <Avatar size="lg" color="blue">
                        {selectedProperty.owner?.fullName
                          ?.split(" ")
                          .map((n: string) => n[0]) // Fixed: Added type annotation
                          .join("") || "U"}
                      </Avatar>
                      <div>
                        <Text fw={700} size="lg">
                          {selectedProperty.owner?.fullName || "Unknown Owner"}
                        </Text>
                        <Group gap="xs">
                          <Badge
                            color={getPaymentStatusColor(
                              selectedProperty.owner?.paymentStatus || "pending"
                            )}
                            variant="light"
                          >
                            {selectedProperty.owner?.paymentStatus || "pending"}
                          </Badge>
                          <Text size="sm" c="dimmed">
                            {selectedProperty.owner?.email || "No email"}
                          </Text>
                        </Group>
                      </div>
                    </Group>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="sm" c="dimmed">
                      Phone
                    </Text>
                    <Text fw={500}>
                      {selectedProperty.owner?.phone || "No phone number"}
                    </Text>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="sm" c="dimmed">
                      Payment Method
                    </Text>
                    <Text fw={500}>
                      {selectedProperty.owner?.paymentMethod || "Not specified"}
                    </Text>
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Text size="sm" c="dimmed">
                      Address
                    </Text>
                    <Text fw={500}>
                      {selectedProperty.owner?.address || "No address provided"}
                    </Text>
                  </Grid.Col>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Title order={4} mb="md">
                  Property Details
                </Title>

                {selectedProperty.description && (
                  <>
                    <Text size="sm" c="dimmed" mb="xs">
                      Description
                    </Text>
                    <Text fw={500} mb="md">
                      {selectedProperty.description}
                    </Text>
                  </>
                )}

                {(selectedProperty.bedrooms ||
                  selectedProperty.bathrooms ||
                  selectedProperty.sqft) && (
                  <Grid>
                    {selectedProperty.bedrooms && (
                      <Grid.Col span={4}>
                        <Text size="sm" c="dimmed">
                          Bedrooms
                        </Text>
                        <Text fw={500}>{selectedProperty.bedrooms}</Text>
                      </Grid.Col>
                    )}

                    {selectedProperty.bathrooms && (
                      <Grid.Col span={4}>
                        <Text size="sm" c="dimmed">
                          Bathrooms
                        </Text>
                        <Text fw={500}>{selectedProperty.bathrooms}</Text>
                      </Grid.Col>
                    )}

                    {selectedProperty.sqft && (
                      <Grid.Col span={4}>
                        <Text size="sm" c="dimmed">
                          Area (sqft)
                        </Text>
                        <Text fw={500}>{selectedProperty.sqft}</Text>
                      </Grid.Col>
                    )}
                  </Grid>
                )}

                {selectedProperty.amenities &&
                  selectedProperty.amenities.length > 0 && (
                    <>
                      <Text size="sm" c="dimmed" mt="md" mb="xs">
                        Amenities
                      </Text>
                      <Group gap="xs">
                        {selectedProperty.amenities.map((amenity, index) => (
                          <Badge key={index} variant="light" color="blue">
                            {availableAmenities.find((a) => a.value === amenity)
                              ?.label || amenity}
                          </Badge>
                        ))}
                      </Group>
                    </>
                  )}
              </Box>

              <Divider />

              <Box>
                <Title order={4} mb="md">
                  <IconCalendar size={20} style={{ marginRight: 8 }} />
                  Timeline
                </Title>

                <Grid>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">
                      Created Date
                    </Text>
                    <Text fw={500}>
                      {new Date(
                        selectedProperty.created_at
                      ).toLocaleDateString()}
                    </Text>
                  </Grid.Col>

                  {selectedProperty.updated_at && (
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">
                        Last Updated
                      </Text>
                      <Text fw={500}>
                        {new Date(
                          selectedProperty.updated_at
                        ).toLocaleDateString()}
                      </Text>
                    </Grid.Col>
                  )}
                </Grid>
              </Box>

              <Group justify="right" mt="md">
                <Button variant="outline" onClick={closePropertyModal}>
                  Close
                </Button>
                <Button leftSection={<IconEdit size={16} />}>
                  Edit Property
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>
      </Stack>
    </Container>
  );
};

export default AdminPropertiesSection;
