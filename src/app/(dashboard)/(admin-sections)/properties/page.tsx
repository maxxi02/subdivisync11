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
  Tabs,
  Grid,
  Box,
  Select,
  Badge,
  Divider,
  ActionIcon,
  Table,
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
  IconChartBar,
  IconUpload,
  IconMail,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import {
  propertiesApi,
  CreatePropertyRequest,
  Property,
} from "@/lib/api/properties";
import {
  createImagePreview,
  uploadImageToServer,
  validateImageFile,
} from "@/lib/upload";
import { notifications } from "@mantine/notifications";
import CustomCarousel from "./_components/carousel";

const AdminPropertiesSection = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<string | null>("overview");
  const [loading, setLoading] = useState(true);
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
    images: [],
    amenities: [],
    description: "",
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
  });

  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false);
  const [editFormData, setEditFormData] = useState<CreatePropertyRequest>({
    title: "",
    location: "",
    size: "",
    price: "",
    type: "residential-lot",
    status: "available",
    images: [],
    amenities: [],
    description: "",
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [updating, setUpdating] = useState(false);

  const handleEditProperty = (property: Property) => {
    setEditFormData({
      title: property.title,
      location: property.location,
      size: property.size,
      price: property.price,
      type: property.type as CreatePropertyRequest["type"],
      status: property.status as CreatePropertyRequest["status"],
      images: property.images || [],
      amenities: property.amenities || [],
      description: property.description || "",
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      sqft: property.sqft || 0,
    });
    setSelectedProperty(property);
    setEditImageFiles([]);
    openEditModal();
  };

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

  const handleEditInputChange = (
    field: keyof CreatePropertyRequest,
    value: string | number | string[]
  ) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditImageUpload = (files: File[] | null) => {
    if (!files || files.length === 0) {
      return; // Don't clear existing images
    }

    // Validate each file
    const validFiles: File[] = [];
    const previewUrls: string[] = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
        previewUrls.push(createImagePreview(file));
      } else {
        showNotification(
          `Invalid file: ${file.name} - ${validation.error}`,
          true
        );
      }
    }

    // Accumulate files and images
    const existingFiles = editImageFiles || [];
    const existingImages = editFormData.images || [];

    setEditImageFiles([...existingFiles, ...validFiles]);
    const combinedImages = [...existingImages, ...previewUrls];
    handleEditInputChange("images", combinedImages);
  };

  const handleUpdateProperty = async () => {
    if (
      !selectedProperty ||
      !editFormData.title ||
      !editFormData.location ||
      !editFormData.size ||
      !editFormData.price
    ) {
      showNotification("Please fill in all required fields", true);
      return;
    }

    try {
      setUpdating(true);

      let finalImageUrls = editFormData.images || [];

      // Upload new images if files are selected
      if (editImageFiles.length > 0) {
        const uploadedUrls: string[] = [];

        for (const file of editImageFiles) {
          const uploadResult = await uploadImageToServer(file);

          if (!uploadResult.success) {
            showNotification(
              uploadResult.error || `Failed to upload ${file.name}`,
              true
            );
            return;
          }

          if (uploadResult.imageUrl) {
            uploadedUrls.push(uploadResult.imageUrl);
          }
        }

        // Combine existing images with newly uploaded ones
        const existingImages = selectedProperty?.images || [];
        finalImageUrls = [...existingImages, ...uploadedUrls];
      }

      // Prepare the update payload
      const updateData: CreatePropertyRequest = {
        ...editFormData,
        images: finalImageUrls,
      };

      const response = await propertiesApi.update(
        selectedProperty._id,
        updateData
      );

      if (response.success) {
        showNotification(response.message || "Property updated successfully!");
        closeEditModal();
        await fetchProperties();
      } else {
        showNotification(response.error || "Failed to update property", true);
      }
    } catch (error) {
      console.error("Error updating property:", error);
      showNotification("Failed to update property. Please try again.", true);
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpload = (files: File[] | null) => {
    if (!files || files.length === 0) {
      return; // Don't clear existing images when no new files selected
    }

    // Validate each file
    const validFiles: File[] = [];
    const previewUrls: string[] = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
        previewUrls.push(createImagePreview(file));
      } else {
        showNotification(
          `Invalid file: ${file.name} - ${validation.error}`,
          true
        );
      }
    }

    // Accumulate files and previews
    const existingFiles = imageFiles || [];
    const existingPreviews = formData.images || [];

    setImageFiles([...existingFiles, ...validFiles]);
    handleInputChange("images", [...existingPreviews, ...previewUrls]);
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

      const uploadedImageUrls: string[] = [];

      // Upload all images to server
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const uploadResult = await uploadImageToServer(file);

          if (!uploadResult.success) {
            showNotification(
              uploadResult.error || `Failed to upload ${file.name}`,
              true
            );
            return;
          }

          if (uploadResult.imageUrl) {
            uploadedImageUrls.push(uploadResult.imageUrl);
          }
        }
      }

      // Prepare the request payload
      const propertyData: CreatePropertyRequest = {
        ...formData,
        images:
          uploadedImageUrls.length > 0 ? uploadedImageUrls : formData.images,
      };

      const response = await propertiesApi.create(propertyData);

      if (response.success) {
        showNotification(response.message || "Property created successfully!");
        closeCreateModal();
        resetForm();
        await fetchProperties();
      } else {
        showNotification(response.error || "Failed to create property", true);
      }
    } catch (error) {
      console.error("Error creating property:", error);
      showNotification("Failed to create property. Please try again.", true);
    } finally {
      setSubmitting(false);
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
      images: [],
      amenities: [],
      description: "",
      bedrooms: 0,
      bathrooms: 0,
      sqft: 0,
    });
    setImageFiles([]);
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
        showNotification(response.error || "Failed to fetch properties", true);
      }
    } catch (error) {
      console.error("Network error:", error);
      showNotification(
        "Network error occurred while fetching properties",
        true
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [statusFilter]);

  const showNotification = (message: string, isError = false) => {
    if (isError) {
      notifications.show({
        title: "Error",
        message,
        color: "red",
        icon: <IconExclamationMark size={18} />,
      });
    } else {
      notifications.show({
        title: "Success",
        message,
        color: "green",
        icon: <IconCheck size={18} />,
      });
    }
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

  if (loading) {
    return (
      <Container size="xl" py="md">
        <Stack align="center" py="xl">
          <Text>Loading properties...</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
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
                    label="Property Images"
                    placeholder="Select images"
                    value={imageFiles}
                    onChange={handleImageUpload}
                    leftSection={<IconUpload size={16} />}
                    accept="image/*"
                    multiple
                  />
                  {formData.images?.length ||
                    (0 > 0 && (
                      <Group justify="space-between" mt="xs">
                        <Text size="sm" c="dimmed">
                          {formData.images?.length} image
                          {formData.images!.length > 1 ? "s" : ""} selected
                        </Text>
                        <Button
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={() => {
                            setImageFiles([]);
                            handleInputChange("images", []);
                          }}
                        >
                          Clear All Images
                        </Button>
                      </Group>
                    ))}
                  {formData.images?.length && (
                    <Box mt="sm">
                      <Text size="sm" c="dimmed" mb="xs">
                        Selected Images ({formData.images.length}):
                      </Text>
                      <Box style={{ maxWidth: 400 }}>
                        <CustomCarousel
                          images={formData.images}
                          height={120}
                          alt="Property preview"
                        />
                        <Button
                          size="xs"
                          variant="subtle"
                          color="red"
                          mt="xs"
                          onClick={() => {
                            setImageFiles([]);
                            handleInputChange("images", []);
                          }}
                        >
                          Clear All Images
                        </Button>
                      </Box>
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
                        placeholder="Number of bedrooms (0 for lots)"
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
                        placeholder="Number of bathrooms (0 for lots)"
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
                  Owned 
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
                      <CustomCarousel
                        images={property.images}
                        height={200}
                        alt={property.title}
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

                      {(property.type === "house-and-lot" ||
                        property.type === "condo") &&
                        (property.bedrooms ||
                          property.bathrooms ||
                          property.sqft) && (
                          <Group gap="md" mt="xs">
                            {property.bedrooms && property.bedrooms > 0 && (
                              <Text size="xs" c="dimmed">
                                {property.bedrooms} bed
                                {property.bedrooms > 1 ? "s" : ""}
                              </Text>
                            )}
                            {property.bathrooms && property.bathrooms > 0 && (
                              <Text size="xs" c="dimmed">
                                {property.bathrooms} bath
                                {property.bathrooms > 1 ? "s" : ""}
                              </Text>
                            )}
                            {property.sqft && property.sqft > 0 && (
                              <Text size="xs" c="dimmed">
                                {property.sqft} sqft
                              </Text>
                            )}
                          </Group>
                        )}

                      <Divider />

                      <Box>
                        <Text size="sm" fw={500} mb="xs" c="green">
                          Property Owner:
                        </Text>
                        <Group>
                          <Text size="sm">
                            {property.owner?.fullName || "No owner assigned"}
                          </Text>
                        </Group>
                      </Box>
                    </Stack>

                    <Group mt="md" px="md" pb="md" justify="space-between">
                      <Button
                        variant="light"
                        size="sm"
                        leftSection={<IconEye size={16} />}
                        onClick={() => handleViewProperty(property)}
                      >
                        View
                      </Button>
                      <Button
                        variant="subtle"
                        size="sm"
                        leftSection={<IconEdit size={16} />}
                        onClick={() => handleEditProperty(property)}
                      >
                        Edit
                      </Button>
                    </Group>
                  </Card>
                ))}
              </SimpleGrid>

              {filteredProperties.length === 0 && (
                <Box ta="center" py="xl">
                  <IconBuilding size={48} color="gray" />
                  <Text size="lg" fw={500} mt="md" c="dimmed">
                    No properties found
                  </Text>
                  <Text size="sm" c="dimmed" mt="xs">
                    Try adjusting your search or filter criteria
                  </Text>
                </Box>
              )}
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="owners" pt="md">
            <Card withBorder p="md" radius="md">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Owner</Table.Th>
                    <Table.Th>Contact</Table.Th>
                    <Table.Th>Properties</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {properties
                    .filter((property) => property.owner)
                    .map((property) => (
                      <Table.Tr key={property._id}>
                        <Table.Td>
                          <Group>
                            <div>
                              <Text fw={500}>{property.owner?.fullName}</Text>
                              <Text size="sm" c="dimmed">
                                {property.owner?.email}
                              </Text>
                            </div>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {property.owner?.phone || "N/A"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light">{property.title}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={getStatusColor(property.status)}
                            variant="light"
                          >
                            {property.status.toUpperCase()}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group>
                            <Tooltip label="View Owner">
                              <ActionIcon variant="subtle" color="blue">
                                <IconUser size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Contact">
                              <ActionIcon variant="subtle" color="green">
                                <IconPhone size={16} />
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

        {/* Property Detail Modal */}
        <Modal
          opened={propertyModalOpened}
          onClose={closePropertyModal}
          title={`Property Details - ${selectedProperty?.title}`}
          size="xl"
          centered
        >
          {selectedProperty && (
            <Stack gap="md">
              {/* Property Images */}
              {selectedProperty.images && selectedProperty.images.length > 0 ? (
                <CustomCarousel
                  images={selectedProperty.images}
                  height={300}
                  alt={selectedProperty.title}
                />
              ) : (
                <Box
                  style={{
                    height: 300,
                    backgroundColor: "#f8f9fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                  }}
                >
                  <Text c="dimmed">No images available</Text>
                </Box>
              )}

              {/* Property Information Grid */}
              <Grid>
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <Stack gap="sm">
                    <Group>
                      <Title order={2}>{selectedProperty.title}</Title>
                      <Badge
                        color={getStatusColor(selectedProperty.status)}
                        variant="light"
                        size="lg"
                      >
                        {selectedProperty.status.toUpperCase()}
                      </Badge>
                    </Group>

                    <Group>
                      <IconMapPin size={18} />
                      <Text size="lg">{selectedProperty.location}</Text>
                    </Group>

                    <Group>
                      <IconBuilding size={18} />
                      <Text>{selectedProperty.size}</Text>
                    </Group>

                    <Group>
                      <IconCash size={18} />
                      <Text size="xl" fw={700} c="blue">
                        {selectedProperty.price}
                      </Text>
                    </Group>

                    <Text size="sm" c="dimmed" tt="capitalize">
                      Property Type: {selectedProperty.type.replace("-", " ")}
                    </Text>

                    {/* House/Condo specific details */}
                    {(selectedProperty.type === "house-and-lot" ||
                      selectedProperty.type === "condo") &&
                      (selectedProperty.bedrooms ||
                        selectedProperty.bathrooms ||
                        selectedProperty.sqft) && (
                        <Group gap="lg">
                          {selectedProperty.bedrooms &&
                            selectedProperty.bedrooms > 0 && (
                              <Text>
                                <Text component="span" fw={500}>
                                  {selectedProperty.bedrooms}
                                </Text>{" "}
                                Bedroom
                                {selectedProperty.bedrooms > 1 ? "s" : ""}
                              </Text>
                            )}
                          {selectedProperty.bathrooms &&
                            selectedProperty.bathrooms > 0 && (
                              <Text>
                                <Text component="span" fw={500}>
                                  {selectedProperty.bathrooms}
                                </Text>{" "}
                                Bathroom
                                {selectedProperty.bathrooms > 1 ? "s" : ""}
                              </Text>
                            )}
                          {selectedProperty.sqft &&
                            selectedProperty.sqft > 0 && (
                              <Text>
                                <Text component="span" fw={500}>
                                  {selectedProperty.sqft}
                                </Text>{" "}
                                sq ft
                              </Text>
                            )}
                        </Group>
                      )}
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                  {/* Owner Information */}
                  <Card withBorder p="md">
                    <Title order={4} mb="sm" c="green">
                      Property Owner
                    </Title>
                    {selectedProperty.owner ? (
                      <Stack gap="xs">
                        <Group>
                          <IconUser size={16} />
                          <Text fw={500}>
                            {selectedProperty.owner.fullName}
                          </Text>
                        </Group>
                        <Group>
                          <IconMail size={16} />
                          <Text size="sm">{selectedProperty.owner.email}</Text>
                        </Group>
                        {selectedProperty.owner.phone && (
                          <Group>
                            <IconPhone size={16} />
                            <Text size="sm">
                              {selectedProperty.owner.phone}
                            </Text>
                          </Group>
                        )}
                      </Stack>
                    ) : (
                      <Text c="dimmed">No owner assigned</Text>
                    )}
                  </Card>
                </Grid.Col>
              </Grid>

              {/* Description */}
              {selectedProperty.description && (
                <Box>
                  <Title order={4} mb="sm">
                    Description
                  </Title>
                  <Text>{selectedProperty.description}</Text>
                </Box>
              )}

              {/* Amenities */}
              {selectedProperty.amenities &&
                selectedProperty.amenities.length > 0 && (
                  <Box>
                    <Title order={4} mb="sm">
                      Amenities & Features
                    </Title>
                    <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
                      {selectedProperty.amenities.map((amenity, index) => (
                        <Text
                          key={index}
                          size="sm"
                          px="sm"
                          py="xs"
                          bg="blue.0"
                          c="blue.7"
                          ta="center"
                          style={{
                            borderRadius: "16px",
                            border: "1px solid var(--mantine-color-blue-2)",
                          }}
                        >
                          {amenity
                            .replace("-", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Text>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}
            </Stack>
          )}
        </Modal>

        {/* Edit Property Modal */}
        <Modal
          opened={editModalOpened}
          onClose={closeEditModal}
          title="Edit Property"
          centered
          size="lg"
        >
          {selectedProperty && (
            <Stack gap="md">
              <Box>
                <Title order={4} mb="md" c="blue">
                  <IconEdit size={20} style={{ marginRight: 8 }} />
                  Edit Property Information
                </Title>

                <Grid>
                  <Grid.Col span={12}>
                    <TextInput
                      label="Property Title"
                      placeholder="Enter property title"
                      value={editFormData.title}
                      onChange={(e) =>
                        handleEditInputChange("title", e.currentTarget.value)
                      }
                      required
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <TextInput
                      label="Location/Address"
                      placeholder="Enter property location"
                      value={editFormData.location}
                      onChange={(e) =>
                        handleEditInputChange("location", e.currentTarget.value)
                      }
                      leftSection={<IconMapPin size={16} />}
                      required
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="Size"
                      placeholder="e.g., 300 sqm"
                      value={editFormData.size}
                      onChange={(e) =>
                        handleEditInputChange("size", e.currentTarget.value)
                      }
                      required
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="Price"
                      placeholder="e.g., ₱2,500,000"
                      value={editFormData.price}
                      onChange={(e) =>
                        handleEditInputChange("price", e.currentTarget.value)
                      }
                      leftSection={<IconCash size={16} />}
                      required
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      label="Property Type"
                      value={editFormData.type}
                      onChange={(value) =>
                        handleEditInputChange(
                          "type",
                          value || "residential-lot"
                        )
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
                      value={editFormData.status}
                      onChange={(value) =>
                        handleEditInputChange("status", value || "available")
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
                      label="Add More Images"
                      placeholder="Select additional images"
                      value={editImageFiles}
                      onChange={handleEditImageUpload}
                      leftSection={<IconUpload size={16} />}
                      accept="image/*"
                      multiple
                      clearable
                    />
                    {editFormData.images?.length && (
                      <Box mt="sm">
                        <Text size="sm" c="dimmed" mb="xs">
                          Current Images ({editFormData.images.length}):
                        </Text>
                        <Box style={{ maxWidth: 400 }}>
                          <CustomCarousel
                            images={editFormData.images}
                            height={120}
                            alt="Property images"
                          />
                          <Button
                            size="xs"
                            variant="subtle"
                            color="red"
                            mt="xs"
                            onClick={() => handleEditInputChange("images", [])}
                          >
                            Remove All Images
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Textarea
                      label="Description"
                      placeholder="Enter property description"
                      value={editFormData.description}
                      onChange={(e) =>
                        handleEditInputChange(
                          "description",
                          e.currentTarget.value
                        )
                      }
                      autosize
                      minRows={3}
                    />
                  </Grid.Col>

                  {(editFormData.type === "house-and-lot" ||
                    editFormData.type === "condo") && (
                    <>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <TextInput
                          label="Bedrooms"
                          placeholder="Number of bedrooms"
                          type="number"
                          value={editFormData.bedrooms?.toString() || ""}
                          onChange={(e) =>
                            handleEditInputChange(
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
                          value={editFormData.bathrooms?.toString() || ""}
                          onChange={(e) =>
                            handleEditInputChange(
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
                          value={editFormData.sqft?.toString() || ""}
                          onChange={(e) =>
                            handleEditInputChange(
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
                      value={editFormData.amenities || []}
                      onChange={(value) =>
                        handleEditInputChange("amenities", value)
                      }
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
                  onClick={closeEditModal}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProperty}
                  loading={updating}
                  leftSection={<IconCheck size={16} />}
                >
                  Update Property
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
