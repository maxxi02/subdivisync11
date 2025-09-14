"use client";

import { useState, ChangeEvent, useEffect } from "react";
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
  LoadingOverlay,
  Notification,
  Tabs,
  Textarea,
  Grid,
  Box,
  Select,
  Radio,
  Divider,
} from "@mantine/core";
import {
  IconHome,
  IconExclamationMark,
  IconCash,
  IconUser,
  IconPhone,
  IconMail,
  IconMapPin,
  IconCheck,
  IconBuilding,
  IconSearch,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { propertyInquiriesApi } from "@/lib/api/property-inquiries";
import { propertiesApi, Property } from "@/lib/api/properties";
import CustomCarousel from "./_components/carousel";
interface PropertyInquiry {
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

  // Additional Details
  additionalRequirements?: string;

  // System fields
  status: "new" | "contacted" | "viewing-scheduled" | "negotiating" | "closed";
  submittedAt: string;
  priority: "high" | "medium" | "low";
}

const BrowsePropertiesSection = () => {
  const [appliedProperties, setAppliedProperties] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>("browse");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inquiryModalOpened, { open: openInquiry, close: closeInquiry }] =
    useDisclosure(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [selectedPropertyType, setSelectedPropertyType] =
    useState<string>("all");

  //view property details
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [
    propertyModalOpened,
    { open: openPropertyModal, close: closePropertyModal },
  ] = useDisclosure(false);

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
    openPropertyModal();
  };

  // Form state
  const [formData, setFormData] = useState<Partial<PropertyInquiry>>({
    preferredContactMethod: "email",
    propertyType: "residential-lot",
    timeline: "flexible",
    paymentMethod: "financing",
  });

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

  const fetchAppliedProperties = async () => {
    try {
      const response = await propertyInquiriesApi.getAll();
      if (response.success && response.data?.inquiries) {
        const propertyIds: string[] = response.data.inquiries
          .map((inquiry) => inquiry.selectedPropertyId)
          .filter((id): id is string => Boolean(id));
        setAppliedProperties(propertyIds);
      }
    } catch (error) {
      console.error("Failed to fetch applied properties:", error);
    }
  };

  const hasAppliedToProperty = (propertyId: string) => {
    return appliedProperties.includes(propertyId);
  };

  useEffect(() => {
    fetchProperties();
    fetchAppliedProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await propertiesApi.getAll({
        status: "available", // Only show available properties to tenants
      });

      if (response.success && response.properties) {
        setProperties(response.properties);
        setFilteredProperties(response.properties);
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
  }, []);

  const handleTypeFilter = (type: string) => {
    setSelectedPropertyType(type);

    if (type === "all") {
      setFilteredProperties(properties);
    } else {
      // Map display types to API types
      const typeMapping: Record<string, string> = {
        "residential-lot": "residential-lot",
        commercial: "commercial",
        "house-and-lot": "house-and-lot",
        condo: "condo",
      };

      const apiType = typeMapping[type] || type;
      const filtered = properties.filter(
        (property) => property.type === apiType
      );
      setFilteredProperties(filtered);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "available":
        return "green";
      case "reserved":
        return "orange";
      case "sold":
        return "gray";
      case "rented":
        return "blue";
      default:
        return "gray";
    }
  };

  const handleInputChange = (
    field: keyof PropertyInquiry,
    value: string | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange = (
    field: keyof PropertyInquiry,
    value: string | null
  ) => {
    if (value !== null) {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleRadioChange = (field: keyof PropertyInquiry, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submitInquiry = async () => {
    const requiredFields = [
      "fullName",
      "primaryPhone",
      "email",
      "currentAddress",
    ];
    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof PropertyInquiry]
    );

    if (missingFields.length > 0) {
      showNotification("Please fill in all required contact fields", true);
      return;
    }

    try {
      setSubmitting(true);

      const inquiryData = {
        fullName: formData.fullName!,
        primaryPhone: formData.primaryPhone!,
        secondaryPhone: formData.secondaryPhone,
        email: formData.email!,
        currentAddress: formData.currentAddress!,
        preferredContactMethod: formData.preferredContactMethod || "email",
        preferredContactTime: formData.preferredContactTime || "",
        specificLotUnit: formData.specificLotUnit,
        propertyType: formData.propertyType || "residential-lot",
        budgetRange: formData.budgetRange || "",
        preferredLotSize: formData.preferredLotSize,
        timeline: formData.timeline || "flexible",
        paymentMethod: formData.paymentMethod || "financing",
        additionalRequirements: formData.additionalRequirements,
        selectedPropertyId: formData.selectedPropertyId,
      };

      const response = await propertyInquiriesApi.create(inquiryData);

      if (response.success) {
        showNotification(
          response.message ||
            "Your property inquiry has been submitted successfully! We'll contact you soon."
        );
        closeInquiry();
        resetForm();
        await fetchAppliedProperties();
      } else {
        showNotification(
          response.error || "Failed to submit inquiry. Please try again.",
          true
        );
      }
    } catch (err) {
      showNotification("Failed to submit inquiry. Please try again.", true);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      preferredContactMethod: "email",
      propertyType: "residential-lot",
      timeline: "flexible",
      paymentMethod: "financing",
    });
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        {/* Notifications */}
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

        {/* Header */}
        <Group justify="space-between">
          <Group>
            <IconHome size={32} color="var(--mantine-color-blue-6)" />
            <Title order={1} size="h2">
              Property Listings
            </Title>
          </Group>
          <Button
            size="lg"
            onClick={openInquiry}
            leftSection={<IconSearch size={20} />}
          >
            Inquire About Property
          </Button>
        </Group>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="browse">Browse Properties</Tabs.Tab>
            <Tabs.Tab value="featured">Owned Properties</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="browse" pt="md">
            <Card withBorder p="md" radius="md">
              {/* Property Type Filter */}
              <Group mb="xl">
                <Text fw={500}>Filter by Type:</Text>
                <Button
                  variant={selectedPropertyType === "all" ? "filled" : "light"}
                  size="sm"
                  onClick={() => handleTypeFilter("all")}
                >
                  All Properties
                </Button>
                <Button
                  variant={
                    selectedPropertyType === "residential-lot"
                      ? "filled"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleTypeFilter("residential-lot")}
                >
                  Residential Lots
                </Button>
                <Button
                  variant={
                    selectedPropertyType === "commercial" ? "filled" : "outline"
                  }
                  size="sm"
                  onClick={() => handleTypeFilter("commercial")}
                >
                  Commercial
                </Button>
                <Button
                  variant={
                    selectedPropertyType === "house-and-lot"
                      ? "filled"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleTypeFilter("house-and-lot")}
                >
                  House & Lot
                </Button>
                <Button
                  variant={
                    selectedPropertyType === "condo" ? "filled" : "outline"
                  }
                  size="sm"
                  onClick={() => handleTypeFilter("condo")}
                >
                  Condominiums
                </Button>
              </Group>

              {/* Properties Grid */}
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} shadow="sm" radius="md" withBorder>
                      <Card.Section>
                        <div
                          style={{
                            width: "100%",
                            height: "200px",
                            backgroundColor: "#f8f9fa",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text c="dimmed">Loading...</Text>
                        </div>
                      </Card.Section>
                      <Stack gap="sm" mt="md" px="md" pb="md">
                        <div
                          style={{
                            height: "20px",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "4px",
                          }}
                        />
                        <div
                          style={{
                            height: "16px",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "4px",
                            width: "70%",
                          }}
                        />
                        <div
                          style={{
                            height: "16px",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "4px",
                            width: "50%",
                          }}
                        />
                      </Stack>
                    </Card>
                  ))
                ) : filteredProperties.length === 0 ? (
                  <Card
                    shadow="sm"
                    radius="md"
                    withBorder
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <Text ta="center" c="dimmed" py="xl">
                      No properties found for the selected criteria.
                    </Text>
                  </Card>
                ) : (
                  filteredProperties.map((property) => (
                    <Card key={property._id} shadow="sm" radius="md" withBorder>
                      <Card.Section>
                        <CustomCarousel
                          images={
                            property.images && property.images.length > 0
                              ? property.images
                              : ["/placeholder.svg"]
                          }
                          height={200}
                          alt={property.title}
                        />
                      </Card.Section>

                      <Card.Section withBorder inheritPadding py="xs">
                        <Group justify="space-between">
                          <Text fw={500}>{property.title}</Text>
                          <Text
                            size="sm"
                            c={getStatusBadgeColor(property.status)}
                            fw={500}
                            tt="uppercase"
                          >
                            {property.status}
                          </Text>
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

                        <Text size="xs" c="dimmed" tt="capitalize">
                          {property.type.replace("-", " ")}
                        </Text>

                        {/* Show bedrooms/bathrooms/sqft for applicable types */}
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

                        {/* Amenities Section */}
                        {property.amenities &&
                          property.amenities.length > 0 && (
                            <Box mt="sm">
                              <Text size="sm" fw={500} mb="xs">
                                Key Features:
                              </Text>
                              <Group gap="xs">
                                {property.amenities
                                  .slice(0, 3)
                                  .map((amenity, index) => (
                                    <Text
                                      key={index}
                                      size="xs"
                                      px="xs"
                                      py={2}
                                      bg="blue.0"
                                      c="blue.7"
                                      style={{
                                        borderRadius: "12px",
                                        border:
                                          "1px solid var(--mantine-color-blue-2)",
                                      }}
                                    >
                                      {amenity
                                        .replace("-", " ")
                                        .replace(/\b\w/g, (l) =>
                                          l.toUpperCase()
                                        )}
                                    </Text>
                                  ))}
                                {property.amenities.length > 3 && (
                                  <Text size="xs" c="dimmed">
                                    +{property.amenities.length - 3} more
                                  </Text>
                                )}
                              </Group>
                            </Box>
                          )}

                        {/* Description preview */}
                        {property.description && (
                          <Box mt="sm">
                            <Text size="xs" c="dimmed" lineClamp={2}>
                              {property.description}
                            </Text>
                          </Box>
                        )}
                      </Stack>
                      <Group mt="md" mx="md" mb="md" justify="space-between">
                        <Button
                          flex={1}
                          variant="outline"
                          leftSection={<IconSearch size={16} />}
                          onClick={() => handleViewProperty(property)}
                        >
                          View Details
                        </Button>
                        <Button
                          flex={1}
                          variant={
                            hasAppliedToProperty(property._id)
                              ? "filled"
                              : "light"
                          }
                          onClick={() => {
                            if (hasAppliedToProperty(property._id)) {
                              window.location.href = "/my-applications";
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                selectedPropertyId: property._id,
                                propertyType: property.type,
                                budgetRange: property.price,
                              }));
                              openInquiry();
                            }
                          }}
                          disabled={
                            property.status !== "available" &&
                            !hasAppliedToProperty(property._id)
                          }
                        >
                          {property.status !== "available"
                            ? "Not Available"
                            : hasAppliedToProperty(property._id)
                            ? "Pending"
                            : "Inquire Now"}
                        </Button>
                      </Group>
                    </Card>
                  ))
                )}
              </SimpleGrid>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="featured" pt="md">
            <Card withBorder p="xl">
              <Text c="dimmed" ta="center" size="lg">
                Featured properties coming soon...
              </Text>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Property Inquiry Modal */}
      <Modal
        opened={inquiryModalOpened}
        onClose={closeInquiry}
        title="Property Inquiry Form"
        centered
        size="lg"
      >
        <LoadingOverlay visible={submitting} />
        <Stack gap="md">
          {/* Contact Information Section */}
          <Box>
            <Title order={3} size="h4" mb="md" c="blue">
              <IconUser size={20} style={{ marginRight: 8 }} />
              Contact Information
            </Title>

            <Grid>
              <Grid.Col span={12}>
                <Select
                  label="Select Property (Optional)"
                  placeholder="Choose a specific property from our listings"
                  value={formData.selectedPropertyId || ""}
                  onChange={(value) =>
                    handleSelectChange("selectedPropertyId", value)
                  }
                  data={[
                    { value: "", label: "General Inquiry" },
                    ...properties.map((property) => ({
                      value: property._id,
                      label: `${property.title} - ${property.location} (${property.price})`,
                    })),
                  ]}
                  searchable
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <TextInput
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={formData.fullName || ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("fullName", e.currentTarget.value)
                  }
                  required
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Primary Phone Number"
                  placeholder="+63 XXX XXX XXXX"
                  value={formData.primaryPhone || ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("primaryPhone", e.currentTarget.value)
                  }
                  leftSection={<IconPhone size={16} />}
                  required
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Secondary Phone Number"
                  placeholder="+63 XXX XXX XXXX (Optional)"
                  value={formData.secondaryPhone || ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("secondaryPhone", e.currentTarget.value)
                  }
                  leftSection={<IconPhone size={16} />}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <TextInput
                  label="Email Address"
                  placeholder="your.email@example.com"
                  value={formData.email || ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("email", e.currentTarget.value)
                  }
                  leftSection={<IconMail size={16} />}
                  required
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Textarea
                  label="Current Address"
                  placeholder="Enter your current complete address"
                  value={formData.currentAddress || ""}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    handleInputChange("currentAddress", e.currentTarget.value)
                  }
                  autosize
                  minRows={2}
                  required
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Preferred Contact Method"
                  value={formData.preferredContactMethod}
                  onChange={(value) =>
                    handleSelectChange("preferredContactMethod", value)
                  }
                  data={[
                    { value: "phone", label: "Phone Call" },
                    { value: "email", label: "Email" },
                    { value: "text", label: "Text Message" },
                  ]}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Preferred Contact Time"
                  placeholder="e.g., Weekdays 9AM-5PM"
                  value={formData.preferredContactTime || ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(
                      "preferredContactTime",
                      e.currentTarget.value
                    )
                  }
                />
              </Grid.Col>
            </Grid>
          </Box>

          <Divider />

          {/* Property Interest Section - NOW OPTIONAL */}
          <Box>
            <Title order={3} size="h4" mb="md" c="green">
              <IconHome size={20} style={{ marginRight: 8 }} />
              Property Interest Details (Optional)
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              Providing these details helps us serve you better, but they are
              not required.
            </Text>

            <Grid>
              <Grid.Col span={12}>
                <TextInput
                  label="Specific Lot/Unit of Interest (Optional)"
                  placeholder="e.g., Block 1 Lot 15, or leave blank for general inquiry"
                  value={formData.specificLotUnit || ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("specificLotUnit", e.currentTarget.value)
                  }
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Property Type Preference (Optional)"
                  placeholder="Select property type"
                  value={formData.propertyType}
                  onChange={(value) =>
                    handleSelectChange("propertyType", value)
                  }
                  data={[
                    { value: "residential-lot", label: "Residential Lot" },
                    { value: "commercial", label: "Commercial" },
                    { value: "house-and-lot", label: "House and Lot" },
                    { value: "condo", label: "Condominium" },
                    { value: "other", label: "Other" },
                  ]}
                  clearable
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Budget Range (Optional)"
                  placeholder="e.g., ₱2M - ₱5M"
                  value={formData.budgetRange || ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("budgetRange", e.currentTarget.value)
                  }
                  leftSection={<IconCash size={16} />}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Preferred Lot Size (Optional)"
                  placeholder="e.g., 300 sqm, 500 sqm"
                  value={formData.preferredLotSize || ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("preferredLotSize", e.currentTarget.value)
                  }
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Purchase Timeline (Optional)"
                  placeholder="Select timeline"
                  value={formData.timeline}
                  onChange={(value) => handleSelectChange("timeline", value)}
                  data={[
                    { value: "immediate", label: "Immediate (within 1 month)" },
                    { value: "1-3-months", label: "1-3 months" },
                    { value: "3-6-months", label: "3-6 months" },
                    { value: "6-12-months", label: "6-12 months" },
                    { value: "flexible", label: "Flexible timeline" },
                  ]}
                  clearable
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Text size="sm" fw={500} mb="xs">
                  Payment Method Preference (Optional)
                </Text>
                <Radio.Group
                  value={formData.paymentMethod}
                  onChange={(value) =>
                    handleRadioChange("paymentMethod", value)
                  }
                >
                  <Group>
                    <Radio value="cash" label="Cash" />
                    <Radio value="financing" label="Bank Financing" />
                    <Radio value="installment" label="Installment" />
                  </Group>
                </Radio.Group>
              </Grid.Col>

              <Grid.Col span={12}>
                <Textarea
                  label="Additional Requirements or Questions (Optional)"
                  placeholder="Any specific requirements, questions, or additional information you'd like to share..."
                  value={formData.additionalRequirements || ""}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    handleInputChange(
                      "additionalRequirements",
                      e.currentTarget.value
                    )
                  }
                  autosize
                  minRows={3}
                />
              </Grid.Col>
            </Grid>
          </Box>

          <Group justify="right" mt="xl">
            <Button
              variant="outline"
              onClick={closeInquiry}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={submitInquiry}
              loading={submitting}
              leftSection={<IconCheck size={16} />}
            >
              Submit Inquiry
            </Button>
          </Group>
        </Stack>
      </Modal>

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

            {/* Property Information */}
            <Grid>
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Stack gap="sm">
                  <Group>
                    <Title order={2}>{selectedProperty.title}</Title>
                    <Text
                      size="lg"
                      c={getStatusBadgeColor(selectedProperty.status)}
                      fw={600}
                      tt="uppercase"
                    >
                      {selectedProperty.status}
                    </Text>
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
                        {selectedProperty.sqft && selectedProperty.sqft > 0 && (
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
                {/* Action Card */}
                <Card withBorder p="md">
                  <Title order={4} mb="sm" c="blue">
                    Interested in this property?
                  </Title>
                  <Button
                    fullWidth
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        selectedPropertyId: selectedProperty._id,
                      }));
                      closePropertyModal();
                      openInquiry();
                    }}
                    disabled={selectedProperty.status !== "available"}
                  >
                    {selectedProperty.status === "available"
                      ? "Inquire About This Property"
                      : "Property Not Available"}
                  </Button>
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
    </Container>
  );
};

export default BrowsePropertiesSection;
