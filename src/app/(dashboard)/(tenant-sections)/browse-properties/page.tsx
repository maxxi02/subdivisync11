"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Badge,
  Group,
  Stack,
  Button,
  Modal,
  TextInput,
  Textarea,
  Select,
  Loader,
  Center,
  Alert,
  AspectRatio,
} from "@mantine/core";
import {
  IconBuilding,
  IconMapPin,
  IconSquare,
  IconBed,
  IconBath,
  IconParkingCircle,
  IconWifi,
  IconBarbell,
  IconShield,
  IconTrees,
  IconAlertCircle,
  IconCheck,
  IconSearch,
} from "@tabler/icons-react";
import { useSession } from "@/lib/auth-client";
import { CustomCarousel } from "./_components/custom-carousel";

// Property interface
interface Property {
  _id: string;
  title: string;
  location: string;
  size: string;
  price: number;
  type: "residential-lot" | "commercial" | "house-and-lot" | "condo";
  status: "CREATED" | "UNDER_INQUIRY" | "APPROVED" | "REJECTED" | "LEASED";
  images?: string[];
  amenities: string[];
  description?: string;
  sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  inquiries?: {
    fullName: string;
    email: string;
    phone: string;
    reason: string;
    submittedAt: string;
    status: "pending" | "approved" | "rejected";
  }[];
}

// InquiryRequest interface
interface InquiryRequest {
  fullName: string;
  email: string;
  phone: string;
  reason: string;
}

const PropertyListingPage = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>(""); // New state for user email

  const [inquiryForm, setInquiryForm] = useState<InquiryRequest>({
    fullName: "",
    email: "",
    phone: "",
    reason: "",
  });

  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.email) {
      setUserEmail(session.user.email);
      setInquiryForm((prev) => ({
        ...prev,
        email: session.user.email,
      }));
    }
  }, [session]);

  // Load properties from API - Using public access
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          public: "true",
          limit: "50",
          page: "1",
        });

        const response = await fetch(`/api/properties?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch properties");
        }

        setProperties(data.properties || []);
        setFilteredProperties(data.properties || []);
      } catch (err) {
        console.error("Error loading properties:", err);
        setError((err as Error).message || "Failed to load properties");
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  // Filter properties based on search and filters
  useEffect(() => {
    let filtered = properties;

    if (searchQuery) {
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((property) => property.type === selectedType);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (property) => property.status === selectedStatus
      );
    }

    setFilteredProperties(filtered);
  }, [properties, searchQuery, selectedType, selectedStatus]);

  const handleInputChange = (field: keyof InquiryRequest, value: string) => {
    setInquiryForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (propertyId: string) => {
    setError(null);
    setSuccessMessage(null);

    const requiredFields: (keyof InquiryRequest)[] = [
      "fullName",
      "email",
      "phone",
      "reason",
    ];

    const missingFields = requiredFields.filter((field) => !inquiryForm[field]);

    if (missingFields.length > 0) {
      setError(
        `Please fill in all required fields: ${missingFields.join(", ")}`
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inquiry: {
            fullName: inquiryForm.fullName,
            email: inquiryForm.email,
            phone: inquiryForm.phone,
            reason: inquiryForm.reason,
            submittedAt: new Date().toISOString(),
            status: "pending",
          },
          isInquiry: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to submit inquiry");
      }

      setSuccessMessage("Your inquiry has been submitted successfully!");
      setSelectedProperty(null);
      setInquiryForm({
        fullName: "",
        email: session?.user?.email || userEmail,
        phone: "",
        reason: "",
      });

      const params = new URLSearchParams({
        public: "true",
        limit: "50",
        page: "1",
      });

      const refreshResponse = await fetch(
        `/api/properties?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setProperties(refreshData.properties || []);
          setFilteredProperties(refreshData.properties || []);
        }
      }
    } catch (err) {
      console.error("Error submitting inquiry:", err);
      setError(
        (err as Error).message || "Failed to submit inquiry. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CREATED":
        return "green";
      case "UNDER_INQUIRY":
        return "yellow";
      case "APPROVED":
        return "blue";
      case "REJECTED":
        return "red";
      case "LEASED":
        return "violet";
      default:
        return "gray";
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "CREATED":
        return "Available for Inquiry";
      case "UNDER_INQUIRY":
        return "Currently Under Review";
      case "APPROVED":
        return "Inquiry Approved";
      case "REJECTED":
        return "Inquiry Rejected";
      case "LEASED":
        return "Property Leased";
      default:
        return status;
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "parking":
        return <IconParkingCircle size={16} />;
      case "gym":
        return <IconBarbell size={16} />;
      case "security":
        return <IconShield size={16} />;
      case "internet-ready":
        return <IconWifi size={16} />;
      case "garden":
        return <IconTrees size={16} />;
      default:
        return <IconBuilding size={16} />;
    }
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

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ height: 400 }}>
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            {error}
          </Alert>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" px="md">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={1} size="h2" fw={600} c="gray.9">
            Properties
          </Title>
          <Text c="gray.6" size="md" lh={1.5}>
            Browse available properties
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <TextInput
            placeholder="Search by title, location, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<IconSearch size={16} />}
          />
          <Select
            value={selectedType}
            onChange={(value) => setSelectedType(value || "all")}
            data={[
              { value: "all", label: "All Types" },
              { value: "residential-lot", label: "Residential Lot" },
              { value: "commercial", label: "Commercial" },
              { value: "house-and-lot", label: "House and Lot" },
              { value: "condo", label: "Condo" },
            ]}
          />
          <Select
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value || "all")}
            data={[
              { value: "all", label: "All Status" },
              { value: "CREATED", label: "Available" },
              { value: "UNDER_INQUIRY", label: "Under Inquiry" },
              { value: "APPROVED", label: "Approved" },
              { value: "REJECTED", label: "Rejected" },
              { value: "LEASED", label: "Leased" },
            ]}
          />
        </SimpleGrid>

        <Text c="gray.6" size="sm">
          Showing {filteredProperties.length} of {properties.length} properties
        </Text>

        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
          {filteredProperties.map((property) => (
            <Card
              key={property._id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
            >
              <AspectRatio ratio={16 / 9}>
                {property.images && property.images.length > 0 ? (
                  <CustomCarousel
                    images={property.images}
                    alt={property.title}
                    showIndicators={true}
                    autoPlay={false}
                  />
                ) : (
                  <Center>
                    <IconBuilding size={48} color="gray" />
                  </Center>
                )}
              </AspectRatio>

              <Stack gap="md" mt="md">
                <Group justify="space-between" align="flex-start">
                  <Title order={3} size="h4" fw={600} c="gray.8">
                    {property.title}
                  </Title>
                  <Badge color={getStatusColor(property.status)}>
                    {getStatusMessage(property.status)}
                  </Badge>
                </Group>

                <Group gap="xs">
                  <IconMapPin size={16} color="gray" />
                  <Text size="sm" c="gray.7">
                    {property.location}
                  </Text>
                </Group>

                <Text fw={700} size="xl" c="green">
                  ₱{property.price.toLocaleString("en-PH")}
                </Text>

                <SimpleGrid cols={2}>
                  <Group gap="xs">
                    <IconBuilding size={16} color="gray" />
                    <Text size="sm" c="gray.7">
                      {property.type
                        .replace("-", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <IconSquare size={16} color="gray" />
                    <Text size="sm" c="gray.7">
                      {property.size}
                    </Text>
                  </Group>
                  {(property.bedrooms ?? 0) > 0 && (
                    <Group gap="xs">
                      <IconBed size={16} color="gray" />
                      <Text size="sm" c="gray.7">
                        {property.bedrooms} Bedrooms
                      </Text>
                    </Group>
                  )}
                  {(property.bathrooms ?? 0) > 0 && (
                    <Group gap="xs">
                      <IconBath size={16} color="gray" />
                      <Text size="sm" c="gray.7">
                        {property.bathrooms} Bathrooms
                      </Text>
                    </Group>
                  )}
                </SimpleGrid>

                {property.description && (
                  <Text size="sm" c="gray.7" lineClamp={2}>
                    {property.description}
                  </Text>
                )}

                {property.amenities && property.amenities.length > 0 && (
                  <Group gap="xs" grow wrap="nowrap">
                    {property.amenities.slice(0, 3).map((amenity, index) => (
                      <Badge key={index} variant="light" color="gray">
                        <p className="flex items-center gap-2 text-sm">
                          {amenity.replace("-", " ")}
                        </p>
                      </Badge>
                    ))}
                    {property.amenities.length > 3 && (
                      <Badge variant="light" color="gray">
                        +{property.amenities.length - 3} more
                      </Badge>
                    )}
                  </Group>
                )}

                <Button
                  onClick={() => setSelectedProperty(property)}
                  disabled={property.status !== "CREATED"}
                  fullWidth
                >
                  {property.status === "CREATED"
                    ? "View Details & Inquire"
                    : "View Details"}
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        {filteredProperties.length === 0 && (
          <Center py="xl">
            <Stack align="center">
              <IconBuilding size={48} color="gray" />
              <Text c="gray.6" size="md">
                No properties found matching your criteria.
              </Text>
            </Stack>
          </Center>
        )}
      </Stack>

      <Modal
        opened={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
        size="xl"
        title={<Title order={2}>{selectedProperty?.title}</Title>}
        centered
      >
        {selectedProperty && (
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
            <Stack>
              <AspectRatio ratio={16 / 9}>
                {selectedProperty.images &&
                selectedProperty.images.length > 0 ? (
                  <CustomCarousel
                    images={selectedProperty.images}
                    alt={selectedProperty.title}
                    showIndicators={true}
                    autoPlay={true}
                    autoPlayInterval={4000}
                  />
                ) : (
                  <Center>
                    <IconBuilding size={48} color="gray" />
                  </Center>
                )}
              </AspectRatio>

              <Group gap="xs">
                <IconMapPin size={18} color="gray" />
                <Text size="md" c="gray.7">
                  {selectedProperty.location}
                </Text>
              </Group>

              <Text fw={700} size="xl" c="green">
                ₱{selectedProperty.price.toLocaleString("en-PH")}
              </Text>

              <SimpleGrid cols={2}>
                <Group gap="xs">
                  <IconBuilding size={18} color="gray" />
                  <Text size="md" c="gray.7">
                    {selectedProperty.type
                      .replace("-", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconSquare size={18} color="gray" />
                  <Text size="md" c="gray.7">
                    {selectedProperty.size}
                  </Text>
                </Group>
                {(selectedProperty.bedrooms ?? 0) > 0 && (
                  <Group gap="xs">
                    <IconBed size={18} color="gray" />
                    <Text size="md" c="gray.7">
                      {selectedProperty.bedrooms} Bedrooms
                    </Text>
                  </Group>
                )}
                {(selectedProperty.bathrooms ?? 0) > 0 && (
                  <Group gap="xs">
                    <IconBath size={18} color="gray" />
                    <Text size="md" c="gray.7">
                      {selectedProperty.bathrooms} Bathrooms
                    </Text>
                  </Group>
                )}
              </SimpleGrid>

              {selectedProperty.description && (
                <Stack gap="xs">
                  <Title order={4} fw={600} c="gray.8">
                    Description
                  </Title>
                  <Text size="sm" c="gray.7">
                    {selectedProperty.description}
                  </Text>
                </Stack>
              )}

              {selectedProperty.amenities &&
                selectedProperty.amenities.length > 0 && (
                  <Stack gap="xs">
                    <Title order={4} fw={600} c="gray.8">
                      Amenities
                    </Title>
                    <SimpleGrid cols={2}>
                      {selectedProperty.amenities.map((amenity, index) => (
                        <Group key={index} gap="xs">
                          {getAmenityIcon(amenity)}
                          <Text size="sm" c="gray.7">
                            {amenity.replace("-", " ")}
                          </Text>
                        </Group>
                      ))}
                    </SimpleGrid>
                  </Stack>
                )}
            </Stack>

            <Stack>
              {selectedProperty.status === "CREATED" ? (
                <Stack gap="md">
                  <Title order={3} fw={600} c="gray.8">
                    Submit Inquiry
                  </Title>

                  {error && (
                    <Alert
                      icon={<IconAlertCircle size={16} />}
                      title="Error"
                      color="red"
                    >
                      {error}
                    </Alert>
                  )}

                  {successMessage && (
                    <Alert
                      icon={<IconCheck size={16} />}
                      title="Success"
                      color="green"
                    >
                      {successMessage}
                    </Alert>
                  )}

                  <TextInput
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={inquiryForm.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.currentTarget.value)
                    }
                    required
                  />

                  <TextInput
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    value={inquiryForm.email}
                    onChange={(e) =>
                      handleInputChange("email", e.currentTarget.value)
                    }
                    required
                  />

                  <TextInput
                    label="Phone"
                    placeholder="Enter your phone number"
                    value={inquiryForm.phone}
                    onChange={(e) =>
                      handleInputChange("phone", e.currentTarget.value)
                    }
                    required
                  />

                  <Textarea
                    label="Reason for Inquiry"
                    placeholder="Explain why you're interested in this property..."
                    value={inquiryForm.reason}
                    onChange={(e) =>
                      handleInputChange("reason", e.currentTarget.value)
                    }
                    minRows={4}
                    required
                  />

                  <Button
                    onClick={() => handleSubmit(selectedProperty._id)}
                    loading={submitting}
                    fullWidth
                  >
                    {submitting ? "Submitting..." : "Submit Inquiry"}
                  </Button>
                </Stack>
              ) : (
                <Center h={300}>
                  <Stack align="center" gap="md">
                    <Badge
                      color={getStatusColor(selectedProperty.status)}
                      size="lg"
                    >
                      {getStatusMessage(selectedProperty.status)}
                    </Badge>
                    <Text c="gray.6" size="md">
                      This property is not available for new inquiries.
                    </Text>
                  </Stack>
                </Center>
              )}
            </Stack>
          </SimpleGrid>
        )}
      </Modal>
    </Container>
  );
};

export default PropertyListingPage;
