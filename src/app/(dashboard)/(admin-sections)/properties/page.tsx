"use client";
import React, { useState, useEffect } from "react";
import {
  Container,
  Title,
  Button,
  Table,
  Modal,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Group,
  Stack,
  Badge,
  ActionIcon,
  Text,
  Paper,
  Grid,
  MultiSelect,
  Alert,
  LoadingOverlay,
  Card,
  Image,
  Center,
  Tabs,
  Switch,
  rem,
  FileInput,
  SimpleGrid,
  Box,
  CloseButton,
} from "@mantine/core";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconPhoto,
  IconHeart,
  IconSearch,
  IconBed,
  IconBath,
  IconSquare,
  IconEye,
  IconHeartFilled,
  IconSettings,
  IconUser,
  IconCalendar,
  IconClock,
  IconPhone,
  IconMail,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

// Types
type PropertyType = "Apartment" | "House" | "Penthouse" | "Studio";
type AvailabilityStatus = "Available" | "Pending" | "Rented";
type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

interface Property {
  _id: string;
  address: string;
  rent_amount: number;
  description: string;
  photos: string[];
  availability_status: AvailabilityStatus;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  type: PropertyType;
  amenities: string[];
  created_at: string;
  updated_at: string;
}

interface Appointment {
  _id: string;
  property_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  contact_phone?: string;
  preferred_contact_method: string;
  requested_date: string;
  requested_time: string;
  confirmed_date?: string;
  confirmed_time?: string;
  message: string;
  status: AppointmentStatus;
  admin_notes?: string;
  meeting_location?: string;
  property?: Property;
  created_at: string;
  updated_at: string;
}

// Constants
const PROPERTY_TYPES = [
  { value: "Apartment", label: "Apartment" },
  { value: "House", label: "House" },
  { value: "Penthouse", label: "Penthouse" },
  { value: "Studio", label: "Studio" },
];

const AMENITIES_OPTIONS = [
  "Gym",
  "Pool",
  "Parking",
  "Pet Friendly",
  "Garden",
  "Garage",
  "Fireplace",
  "Concierge",
  "Rooftop",
  "Valet",
  "WiFi",
  "Laundry",
  "Study Room",
  "Balcony",
  "Air Conditioning",
  "Dishwasher",
  "Elevator",
  "Security",
  "Storage",
];

const TIME_SLOTS = [
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
];

const PropertyManagement = () => {
  // State management
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);

  // Selected items
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Forms
  const [formData, setFormData] = useState({
    address: "",
    rent_amount: 0,
    description: "",
    photos: [] as string[],
    availability_status: "Available" as AvailabilityStatus,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 500,
    type: "Apartment" as PropertyType,
    amenities: [] as string[],
  });

  const [appointmentForm, setAppointmentForm] = useState({
    requested_date: "",
    requested_time: "",
    message: "",
    contact_phone: "",
    preferred_contact_method: "email",
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Fetch data
  useEffect(() => {
    fetchProperties();
    if (isAdmin) {
      fetchAppointments();
    }
  }, [isAdmin]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      // In a real app, this would be an API call
      // const response = await fetch("/api/properties");
      // const data = await response.json();

      // Mock data for demonstration
      setTimeout(() => {
        const mockProperties: Property[] = [
          {
            _id: "1",
            address: "123 Main St, Metro City",
            rent_amount: 2500,
            description: "Beautiful apartment in the heart of the city",
            photos: ["https://via.placeholder.com/600x400?text=Apartment+1"],
            availability_status: "Available",
            bedrooms: 2,
            bathrooms: 1,
            sqft: 850,
            type: "Apartment",
            amenities: ["Gym", "Pool", "Parking"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            _id: "2",
            address: "456 Oak Ave, Suburbia",
            rent_amount: 3500,
            description: "Spacious house with a garden",
            photos: ["https://via.placeholder.com/600x400?text=House+1"],
            availability_status: "Pending",
            bedrooms: 3,
            bathrooms: 2,
            sqft: 1200,
            type: "House",
            amenities: ["Garden", "Garage", "Pet Friendly"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        setProperties(mockProperties);
        setLoading(false);
      }, 500);
    } catch (error) {
      showNotification("Error", "Failed to load properties", "red");
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch("/api/appointments");
      // const data = await response.json();

      // Mock data for demonstration
      const mockAppointments: Appointment[] = [
        {
          _id: "1",
          property_id: "1",
          user_id: "user1",
          user_name: "John Doe",
          user_email: "john@example.com",
          contact_phone: "(555) 123-4567",
          preferred_contact_method: "phone",
          requested_date: new Date(Date.now() + 86400000)
            .toISOString()
            .split("T")[0],
          requested_time: "14:00",
          message: "I'd like to see the apartment in the afternoon",
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          property: properties.find((p) => p._id === "1"),
        },
      ];
      setAppointments(mockAppointments);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    }
  };

  const showNotification = (title: string, message: string, color: string) => {
    // In a real app, you would use a notification system
    alert(`${title}: ${message}`);
  };

  const handleImageUpload = async (files: File[]) => {
    setImageFiles(files);
    const base64Images = await Promise.all(
      files.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    );
    setImagePreviewUrls(base64Images);
    setFormData({ ...formData, photos: base64Images });
  };

  const removeImage = (indexToRemove: number) => {
    const newFiles = imageFiles.filter((_, index) => index !== indexToRemove);
    const newUrls = imagePreviewUrls.filter(
      (_, index) => index !== indexToRemove
    );
    setImageFiles(newFiles);
    setImagePreviewUrls(newUrls);
    setFormData({ ...formData, photos: newUrls });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // In a real app, this would be an API call
      // const method = editingProperty ? "PUT" : "POST";
      // const url = editingProperty
      //   ? `/api/properties/${editingProperty._id}`
      //   : "/api/properties";
      // const response = await fetch(url, {
      //   method,
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(formData),
      // });
      // const data = await response.json();

      // Mock response for demonstration
      setTimeout(() => {
        const newProperty: Property = {
          _id: editingProperty ? editingProperty._id : Math.random().toString(),
          ...formData,
          created_at: editingProperty
            ? editingProperty.created_at
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (editingProperty) {
          setProperties((prev) =>
            prev.map((prop) =>
              prop._id === editingProperty._id ? newProperty : prop
            )
          );
        } else {
          setProperties((prev) => [newProperty, ...prev]);
        }

        showNotification(
          "Success",
          `Property ${editingProperty ? "updated" : "created"} successfully`,
          "green"
        );
        setModalOpen(false);
        resetForm();
        setLoading(false);
      }, 500);
    } catch (error) {
      showNotification("Error", (error as Error).message, "red");
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      setLoading(true);
      // In a real app, this would be an API call
      // const response = await fetch(`/api/properties/${propertyId}`, {
      //   method: "DELETE",
      // });
      // const data = await response.json();

      // Mock response for demonstration
      setTimeout(() => {
        setProperties((prev) => prev.filter((prop) => prop._id !== propertyId));
        showNotification("Success", "Property deleted successfully", "green");
        setLoading(false);
      }, 500);
    } catch (error) {
      showNotification("Error", (error as Error).message, "red");
      setLoading(false);
    }
  };

  const handleAppointmentSubmit = async () => {
    if (!selectedProperty) return;

    try {
      setLoading(true);
      // In a real app, this would be an API call
      // const response = await fetch("/api/appointments", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     property_id: selectedProperty._id,
      //     ...appointmentForm,
      //   }),
      // });
      // const data = await response.json();

      // Mock response for demonstration
      setTimeout(() => {
        showNotification("Success", "Appointment request submitted!", "green");
        setAppointmentModalOpen(false);
        setAppointmentForm({
          requested_date: "",
          requested_time: "",
          message: "",
          contact_phone: "",
          preferred_contact_method: "email",
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      showNotification("Error", (error as Error).message, "red");
      setLoading(false);
    }
  };

  const handleAppointmentStatusUpdate = async (
    appointmentId: string,
    status: AppointmentStatus
  ) => {
    try {
      setLoading(true);
      // In a real app, this would be an API call
      // const response = await fetch(`/api/appointments/${appointmentId}`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ status }),
      // });
      // const data = await response.json();

      // Mock response for demonstration
      setTimeout(() => {
        setAppointments((prev) =>
          prev.map((apt) =>
            apt._id === appointmentId ? { ...apt, status } : apt
          )
        );
        showNotification("Success", "Appointment updated!", "green");
        setLoading(false);
      }, 500);
    } catch (error) {
      showNotification("Error", (error as Error).message, "red");
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      address: "",
      rent_amount: 0,
      description: "",
      photos: [],
      availability_status: "Available",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 500,
      type: "Apartment",
      amenities: [],
    });
    setImageFiles([]);
    setImagePreviewUrls([]);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingProperty(null);
    setModalOpen(true);
  };

  const openEditModal = (property: Property) => {
    setFormData({
      address: property.address,
      rent_amount: property.rent_amount,
      description: property.description,
      photos: property.photos,
      availability_status: property.availability_status,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqft: property.sqft,
      type: property.type,
      amenities: property.amenities,
    });
    setImagePreviewUrls(property.photos);
    setEditingProperty(property);
    setModalOpen(true);
  };

  const openDetailsModal = (property: Property) => {
    setSelectedProperty(property);
    setDetailsModalOpen(true);
  };

  const openAppointmentModal = (property: Property) => {
    setSelectedProperty(property);
    setAppointmentForm({
      requested_date: "",
      requested_time: "",
      message: "",
      contact_phone: "",
      preferred_contact_method: "email",
    });
    setAppointmentModalOpen(true);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Available":
      case "confirmed":
        return "green";
      case "Pending":
      case "pending":
        return "yellow";
      case "Rented":
      case "cancelled":
        return "red";
      case "completed":
        return "blue";
      default:
        return "gray";
    }
  };

  const toggleFavorite = (propertyId: string) => {
    setFavorites((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch = property.address
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType =
      selectedType === "all" || property.type.toLowerCase() === selectedType;
    const matchesPrice =
      priceRange === "all" ||
      (priceRange === "low" && property.rent_amount < 2000) ||
      (priceRange === "mid" &&
        property.rent_amount >= 2000 &&
        property.rent_amount < 4000) ||
      (priceRange === "high" && property.rent_amount >= 4000);
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "available" &&
        property.availability_status === "Available") ||
      (activeTab === "favorites" && favorites.includes(property._id));
    const matchesAvailability =
      isAdmin || property.availability_status === "Available";

    return (
      matchesSearch &&
      matchesType &&
      matchesPrice &&
      matchesTab &&
      matchesAvailability
    );
  });

  const PropertyCard = ({ property }: { property: Property }) => (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ height: "100%" }}
    >
      <Card.Section style={{ position: "relative" }}>
        <Image
          src={property.photos[0] || "https://via.placeholder.com/400x200"}
          height={200}
          alt={property.address}
        />
        {!isAdmin && (
          <ActionIcon
            variant="filled"
            color={favorites.includes(property._id) ? "red" : "gray"}
            style={{ position: "absolute", top: rem(8), right: rem(8) }}
            onClick={() => toggleFavorite(property._id)}
          >
            {favorites.includes(property._id) ? (
              <IconHeartFilled size={16} />
            ) : (
              <IconHeart size={16} />
            )}
          </ActionIcon>
        )}
        <Badge
          color={getStatusColor(property.availability_status)}
          style={{ position: "absolute", top: rem(8), left: rem(8) }}
        >
          {property.availability_status}
        </Badge>
      </Card.Section>

      <Stack gap="sm" mt="md">
        <Group justify="space-between" align="flex-start">
          <Text fw={600} size="lg" lineClamp={1}>
            {property.address}
          </Text>
          <Badge variant="outline">{property.type}</Badge>
        </Group>

        <Text size="xl" fw={700} c="blue">
          ₱{property.rent_amount.toLocaleString()}/mo
        </Text>

        <Group gap="lg">
          <Group gap={4}>
            <IconBed size={16} color="gray" />
            <Text size="sm" c="dimmed">
              {property.bedrooms} bed
            </Text>
          </Group>
          <Group gap={4}>
            <IconBath size={16} color="gray" />
            <Text size="sm" c="dimmed">
              {property.bathrooms} bath
            </Text>
          </Group>
          <Group gap={4}>
            <IconSquare size={16} color="gray" />
            <Text size="sm" c="dimmed">
              {property.sqft} sqft
            </Text>
          </Group>
        </Group>

        <Group gap={4}>
          {property.amenities.slice(0, 3).map((amenity) => (
            <Badge key={amenity} variant="light" size="xs">
              {amenity}
            </Badge>
          ))}
          {property.amenities.length > 3 && (
            <Badge variant="light" size="xs">
              +{property.amenities.length - 3} more
            </Badge>
          )}
        </Group>

        {isAdmin ? (
          <Group grow mt="md">
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => openEditModal(property)}
            >
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => handleDelete(property._id)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        ) : (
          <Group grow mt="md">
            <Button
              leftSection={<IconEye size={16} />}
              variant="filled"
              onClick={() => openDetailsModal(property)}
            >
              View
            </Button>
            <Button
              leftSection={<IconCalendar size={16} />}
              variant="outline"
              color="green"
              onClick={() => openAppointmentModal(property)}
              disabled={property.availability_status !== "Available"}
            >
              Schedule
            </Button>
          </Group>
        )}
      </Stack>
    </Card>
  );

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Stack gap="xs">
            <Title order={1}>
              {isAdmin ? "Property Management" : "Browse Properties"}
            </Title>
            <Text c="dimmed">
              {isAdmin
                ? "Manage properties and appointment requests"
                : "Find your perfect rental property"}
            </Text>
          </Stack>

          <Group gap="md">
            <Group gap="xs">
              <IconUser size={16} />
              <Switch
                checked={isAdmin}
                onChange={(event) => setIsAdmin(event.currentTarget.checked)}
                label="Admin Mode"
                color="blue"
              />
              <IconSettings size={16} />
            </Group>
            {isAdmin && (
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={openCreateModal}
              >
                Add Property
              </Button>
            )}
          </Group>
        </Group>

        {/* Admin View */}
        {isAdmin ? (
          <Tabs defaultValue="properties">
            <Tabs.List>
              <Tabs.Tab
                value="properties"
                leftSection={<IconSquare size={16} />}
              >
                Properties ({properties.length})
              </Tabs.Tab>
              <Tabs.Tab
                value="appointments"
                leftSection={<IconCalendar size={16} />}
              >
                Appointments ({appointments.length})
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="properties" pt="xl">
              <Paper shadow="xs" p="lg" radius="md" withBorder>
                <LoadingOverlay visible={loading} />
                {properties.length === 0 ? (
                  <Text ta="center" c="dimmed" py="xl">
                    No properties found. Click Add Property to get started.
                  </Text>
                ) : (
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Address</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Rent</Table.Th>
                        <Table.Th>Beds/Baths</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {properties.map((property) => (
                        <Table.Tr key={property._id}>
                          <Table.Td>
                            <Text size="sm" lineClamp={1}>
                              {property.address}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="outline">{property.type}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={600}>
                              ₱{property.rent_amount.toLocaleString()}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">
                              {property.bedrooms}bd / {property.bathrooms}ba
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={getStatusColor(
                                property.availability_status
                              )}
                            >
                              {property.availability_status}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                onClick={() => openEditModal(property)}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() => handleDelete(property._id)}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="appointments" pt="xl">
              <Paper shadow="xs" p="lg" radius="md" withBorder>
                <LoadingOverlay visible={loading} />
                {appointments.length === 0 ? (
                  <Text ta="center" c="dimmed" py="xl">
                    No appointment requests yet.
                  </Text>
                ) : (
                  <Stack gap="md">
                    {appointments.map((appointment) => (
                      <Card
                        key={appointment._id}
                        shadow="sm"
                        padding="lg"
                        radius="md"
                        withBorder
                      >
                        <Group justify="space-between" align="flex-start">
                          <Stack gap="xs" style={{ flex: 1 }}>
                            <Group gap="sm">
                              <Text fw={600}>{appointment.user_name}</Text>
                              <Badge color={getStatusColor(appointment.status)}>
                                {appointment.status}
                              </Badge>
                            </Group>

                            <Text size="sm" c="dimmed">
                              {appointment.property?.address}
                            </Text>

                            <Group gap="lg">
                              <Group gap="xs">
                                <IconCalendar size={16} color="gray" />
                                <Text size="sm">
                                  {new Date(
                                    appointment.requested_date
                                  ).toLocaleDateString()}
                                </Text>
                              </Group>
                              <Group gap="xs">
                                <IconClock size={16} color="gray" />
                                <Text size="sm">
                                  {appointment.requested_time}
                                </Text>
                              </Group>
                              <Group gap="xs">
                                <IconMail size={16} color="gray" />
                                <Text size="sm">{appointment.user_email}</Text>
                              </Group>
                              {appointment.contact_phone && (
                                <Group gap="xs">
                                  <IconPhone size={16} color="gray" />
                                  <Text size="sm">
                                    {appointment.contact_phone}
                                  </Text>
                                </Group>
                              )}
                            </Group>

                            {appointment.message && (
                              <Text size="sm" c="dimmed" lineClamp={2}>
                                {appointment.message}
                              </Text>
                            )}
                          </Stack>

                          {appointment.status === "pending" && (
                            <Group gap="xs">
                              <ActionIcon
                                variant="filled"
                                color="green"
                                onClick={() =>
                                  handleAppointmentStatusUpdate(
                                    appointment._id,
                                    "confirmed"
                                  )
                                }
                              >
                                <IconCheck size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="filled"
                                color="red"
                                onClick={() =>
                                  handleAppointmentStatusUpdate(
                                    appointment._id,
                                    "cancelled"
                                  )
                                }
                              >
                                <IconX size={16} />
                              </ActionIcon>
                            </Group>
                          )}
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Tabs.Panel>
          </Tabs>
        ) : (
          /* User View */
          <>
            <Paper shadow="xs" p="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="sm">
                  <IconSearch size={20} />
                  <Title order={4}>Search & Filter Properties</Title>
                </Group>
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      placeholder="Search by address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.currentTarget.value)}
                      leftSection={<IconSearch size={16} />}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Select
                      placeholder="Property Type"
                      value={selectedType}
                      onChange={(value) => setSelectedType(value || "all")}
                      data={[
                        { value: "all", label: "All Types" },
                        ...PROPERTY_TYPES.map((type) => ({
                          value: type.value.toLowerCase(),
                          label: type.label,
                        })),
                      ]}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Select
                      placeholder="Price Range"
                      value={priceRange}
                      onChange={(value) => setPriceRange(value || "all")}
                      data={[
                        { value: "all", label: "All Prices" },
                        { value: "low", label: "Under ₱2,000" },
                        { value: "mid", label: "₱2,000 - ₱4,000" },
                        { value: "high", label: "₱4,000+" },
                      ]}
                    />
                  </Grid.Col>
                </Grid>
              </Stack>
            </Paper>

            <Paper shadow="xs" p="lg" radius="md" withBorder>
              <LoadingOverlay visible={loading} />
              <Tabs
                value={activeTab}
                onChange={(value) => setActiveTab(value || "all")}
              >
                <Tabs.List grow>
                  <Tabs.Tab value="all">All Properties</Tabs.Tab>
                  <Tabs.Tab value="available">Available Now</Tabs.Tab>
                  <Tabs.Tab
                    value="favorites"
                    leftSection={<IconHeart size={16} />}
                  >
                    Favorites ({favorites.length})
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="all" pt="xl">
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                    {filteredProperties.map((property) => (
                      <PropertyCard key={property._id} property={property} />
                    ))}
                  </SimpleGrid>
                </Tabs.Panel>

                <Tabs.Panel value="available" pt="xl">
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                    {filteredProperties
                      .filter((p) => p.availability_status === "Available")
                      .map((property) => (
                        <PropertyCard key={property._id} property={property} />
                      ))}
                  </SimpleGrid>
                </Tabs.Panel>

                <Tabs.Panel value="favorites" pt="xl">
                  {favorites.length === 0 ? (
                    <Paper p="xl" radius="md" withBorder>
                      <Center>
                        <Stack align="center" gap="md">
                          <IconHeart size={48} color="gray" />
                          <Title order={3}>No Favorites Yet</Title>
                          <Text c="dimmed" ta="center">
                            Start browsing properties and click the heart icon!
                          </Text>
                        </Stack>
                      </Center>
                    </Paper>
                  ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                      {filteredProperties
                        .filter((p) => favorites.includes(p._id))
                        .map((property) => (
                          <PropertyCard
                            key={property._id}
                            property={property}
                          />
                        ))}
                    </SimpleGrid>
                  )}
                </Tabs.Panel>
              </Tabs>
            </Paper>
          </>
        )}
      </Stack>

      {/* Property Form Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProperty ? "Edit Property" : "Add New Property"}
        size="xl"
        centered
      >
        <Stack gap="md">
          <Grid>
            <Grid.Col span={12}>
              <TextInput
                label="Address"
                placeholder="123 Main St, City, State"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.currentTarget.value })
                }
                required
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label="Property Type"
                data={PROPERTY_TYPES}
                value={formData.type}
                onChange={(value) =>
                  setFormData({ ...formData, type: value as PropertyType })
                }
                required
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label="Status"
                data={[
                  { value: "Available", label: "Available" },
                  { value: "Pending", label: "Pending" },
                  { value: "Rented", label: "Rented" },
                ]}
                value={formData.availability_status}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    availability_status: value as AvailabilityStatus,
                  })
                }
                required
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <NumberInput
                label="Rent Amount (₱)"
                value={formData.rent_amount}
                onChange={(value) =>
                  setFormData({ ...formData, rent_amount: Number(value) || 0 })
                }
                min={0}
                required
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <NumberInput
                label="Bedrooms"
                value={formData.bedrooms}
                onChange={(value) =>
                  setFormData({ ...formData, bedrooms: Number(value) || 1 })
                }
                min={0}
                max={10}
                required
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <NumberInput
                label="Bathrooms"
                value={formData.bathrooms}
                onChange={(value) =>
                  setFormData({ ...formData, bathrooms: Number(value) || 1 })
                }
                min={0}
                max={10}
                step={0.5}
                required
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <NumberInput
                label="Square Feet"
                value={formData.sqft}
                onChange={(value) =>
                  setFormData({ ...formData, sqft: Number(value) || 500 })
                }
                min={1}
                required
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <MultiSelect
                label="Amenities"
                data={AMENITIES_OPTIONS}
                value={formData.amenities}
                onChange={(value) =>
                  setFormData({ ...formData, amenities: value })
                }
                placeholder="Select amenities"
                searchable
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label="Description"
                placeholder="Describe the property..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.currentTarget.value,
                  })
                }
                minRows={3}
                required
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <FileInput
                label="Property Photos"
                placeholder="Select images"
                multiple
                accept="image/*"
                onChange={(files) => handleImageUpload(files || [])}
                leftSection={<IconPhoto size={16} />}
                mb="md"
              />

              {imagePreviewUrls.length > 0 && (
                <SimpleGrid cols={3} spacing="sm">
                  {imagePreviewUrls.map((url, index) => (
                    <Box key={index} style={{ position: "relative" }}>
                      <Image
                        src={url}
                        height={120}
                        radius="md"
                        alt={`Preview ${index + 1}`}
                      />
                      <CloseButton
                        style={{
                          position: "absolute",
                          top: rem(4),
                          right: rem(4),
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                        }}
                        onClick={() => removeImage(index)}
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editingProperty ? "Update" : "Create"} Property
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Property Details Modal */}
      <Modal
        opened={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Property Details"
        size="lg"
        centered
      >
        {selectedProperty && (
          <Stack gap="md">
            <Image
              src={
                selectedProperty.photos[0] ||
                "https://via.placeholder.com/600x300"
              }
              height={300}
              alt={selectedProperty.address}
              radius="md"
            />

            <Group justify="space-between">
              <Title order={2}>{selectedProperty.address}</Title>
              <Badge
                color={getStatusColor(selectedProperty.availability_status)}
              >
                {selectedProperty.availability_status}
              </Badge>
            </Group>

            <Text size="xl" fw={700} c="blue">
              ₱{selectedProperty.rent_amount.toLocaleString()}/mo
            </Text>

            <Group gap="xl">
              <Group gap="xs">
                <IconBed size={20} color="gray" />
                <Text fw={600}>{selectedProperty.bedrooms} Bedrooms</Text>
              </Group>
              <Group gap="xs">
                <IconBath size={20} color="gray" />
                <Text fw={600}>{selectedProperty.bathrooms} Bathrooms</Text>
              </Group>
              <Group gap="xs">
                <IconSquare size={20} color="gray" />
                <Text fw={600}>{selectedProperty.sqft} sqft</Text>
              </Group>
            </Group>

            <Stack gap="xs">
              <Text fw={600}>Description</Text>
              <Text c="dimmed">{selectedProperty.description}</Text>
            </Stack>

            <Stack gap="xs">
              <Text fw={600}>Amenities</Text>
              <Group gap="xs">
                {selectedProperty.amenities.map((amenity) => (
                  <Badge key={amenity} variant="light">
                    {amenity}
                  </Badge>
                ))}
              </Group>
            </Stack>

            <Group justify="flex-end" gap="sm" mt="md">
              <Button
                variant="outline"
                onClick={() => setDetailsModalOpen(false)}
              >
                Close
              </Button>
              <Button
                color="green"
                onClick={() => {
                  setDetailsModalOpen(false);
                  openAppointmentModal(selectedProperty);
                }}
                disabled={selectedProperty.availability_status !== "Available"}
              >
                Schedule Viewing
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Appointment Request Modal */}
      <Modal
        opened={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        title="Schedule Property Viewing"
        size="md"
        centered
      >
        {selectedProperty && (
          <Stack gap="md">
            <Paper p="md" withBorder radius="md" bg="gray.0">
              <Group>
                <Image
                  src={
                    selectedProperty.photos[0] ||
                    "https://via.placeholder.com/80x60"
                  }
                  width={80}
                  height={60}
                  alt={selectedProperty.address}
                  radius="sm"
                />
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Text fw={600} size="sm">
                    {selectedProperty.address}
                  </Text>
                  <Text size="sm" c="dimmed">
                    ₱{selectedProperty.rent_amount.toLocaleString()}/mo
                  </Text>
                </Stack>
              </Group>
            </Paper>

            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  type="date"
                  label="Preferred Date"
                  placeholder="Select date"
                  value={appointmentForm.requested_date}
                  onChange={(e) =>
                    setAppointmentForm({
                      ...appointmentForm,
                      requested_date: e.currentTarget.value,
                    })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <Select
                  label="Preferred Time"
                  placeholder="Select time"
                  data={TIME_SLOTS}
                  value={appointmentForm.requested_time}
                  onChange={(value) =>
                    setAppointmentForm({
                      ...appointmentForm,
                      requested_time: value || "",
                    })
                  }
                  required
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <TextInput
                  label="Contact Phone"
                  placeholder="(555) 123-4567"
                  value={appointmentForm.contact_phone}
                  onChange={(e) =>
                    setAppointmentForm({
                      ...appointmentForm,
                      contact_phone: e.currentTarget.value,
                    })
                  }
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Select
                  label="Preferred Contact Method"
                  data={[
                    { value: "email", label: "Email" },
                    { value: "phone", label: "Phone" },
                    { value: "both", label: "Both" },
                  ]}
                  value={appointmentForm.preferred_contact_method}
                  onChange={(value) =>
                    setAppointmentForm({
                      ...appointmentForm,
                      preferred_contact_method: value || "email",
                    })
                  }
                  required
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Textarea
                  label="Message (Optional)"
                  placeholder="Any specific questions or requirements..."
                  value={appointmentForm.message}
                  onChange={(e) =>
                    setAppointmentForm({
                      ...appointmentForm,
                      message: e.currentTarget.value,
                    })
                  }
                  minRows={3}
                />
              </Grid.Col>
            </Grid>

            <Alert color="blue" variant="light">
              <Text size="sm">
                Your appointment request will be reviewed by the property
                manager. You&#39;ll receive confirmation within 24 hours.
              </Text>
            </Alert>

            <Group justify="flex-end" gap="sm" mt="md">
              <Button
                variant="outline"
                onClick={() => setAppointmentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAppointmentSubmit}
                loading={loading}
                disabled={
                  !appointmentForm.requested_date ||
                  !appointmentForm.requested_time
                }
              >
                Submit Request
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* No Results Message */}
      {!isAdmin && filteredProperties.length === 0 && (
        <Paper p="xl" radius="md" withBorder>
          <Center>
            <Stack align="center" gap="md">
              <IconSearch size={48} color="gray" />
              <Title order={3}>No Properties Found</Title>
              <Text c="dimmed" ta="center">
                Try adjusting your search filters or check back later for new
                listings.
              </Text>
            </Stack>
          </Center>
        </Paper>
      )}
    </Container>
  );
};

export default PropertyManagement;
