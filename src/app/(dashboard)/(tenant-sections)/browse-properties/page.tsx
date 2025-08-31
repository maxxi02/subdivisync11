"use client";

import { useState } from "react";
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
import axios from "axios";
import { propertyInquiriesApi } from "@/lib/api/property-inquiries";

interface PropertyInquiry {
  id: string;
  // Contact Information
  fullName: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  currentAddress: string;
  preferredContactMethod: "phone" | "email" | "text";
  preferredContactTime: string;

  // Property Interest Details
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
  const [activeTab, setActiveTab] = useState<string | null>("browse");
  const [inquiries, setInquiries] = useState<PropertyInquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inquiryModalOpened, { open: openInquiry, close: closeInquiry }] =
    useDisclosure(false);

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

  const handleInputChange = (field: keyof PropertyInquiry, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submitInquiry = async () => {
    // Validate required fields
    const requiredFields = [
      "fullName",
      "primaryPhone",
      "email",
      "currentAddress",
      "budgetRange",
    ];
    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof PropertyInquiry]
    );

    if (missingFields.length > 0) {
      showNotification("Please fill in all required fields", true);
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
        budgetRange: formData.budgetRange!,
        preferredLotSize: formData.preferredLotSize,
        timeline: formData.timeline || "flexible",
        paymentMethod: formData.paymentMethod || "financing",
        additionalRequirements: formData.additionalRequirements,
      };

      const response = await propertyInquiriesApi.create(inquiryData);

      if (response.success) {
        showNotification(
          response.message ||
            "Your property inquiry has been submitted successfully! We'll contact you soon."
        );
        closeInquiry();
        resetForm();
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

  // Sample properties for display
  const sampleProperties = [
    {
      id: "1",
      title: "Prime Residential Lot",
      location: "Subdivision A, Block 1, Lot 15",
      size: "300 sqm",
      price: "₱2,500,000",
      type: "Residential Lot",
      status: "Available",
      image: "/modern-residential-lot-with-trees-and-paved-roads.png",
      amenities: [
        "Paved Roads",
        "Street Lighting",
        "Water Connection",
        "Electricity Ready",
        "24/7 Security",
      ],
    },
    {
      id: "2",
      title: "Commercial Space",
      location: "Main Road, Corner Lot",
      size: "500 sqm",
      price: "₱8,000,000",
      type: "Commercial",
      status: "Available",
      image: "/commercial-corner-lot-with-wide-frontage-and-parki.png",
      amenities: [
        "Corner Lot",
        "Wide Frontage",
        "High Traffic Area",
        "Parking Space",
        "Near Public Transport",
      ],
    },
    {
      id: "3",
      title: "House and Lot Package",
      location: "Subdivision B, Block 3, Lot 8",
      size: "250 sqm lot, 120 sqm floor area",
      price: "₱4,200,000",
      type: "House and Lot",
      status: "Reserved",
      image: "/modern-two-story-house-with-garden-and-garage.png",
      amenities: [
        "3 Bedrooms",
        "2 Bathrooms",
        "Garage",
        "Garden Area",
        "Fully Furnished",
      ],
    },
  ];

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
            <Tabs.Tab value="featured">Featured Listings</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="browse" pt="md">
            <Card withBorder p="md" radius="md">
              {/* Property Type Filter */}
              <Group mb="xl">
                <Text fw={500}>Filter by Type:</Text>
                <Button variant="light" size="sm">
                  All Properties
                </Button>
                <Button variant="outline" size="sm">
                  Residential Lots
                </Button>
                <Button variant="outline" size="sm">
                  Commercial
                </Button>
                <Button variant="outline" size="sm">
                  House & Lot
                </Button>
              </Group>

              {/* Properties Grid */}
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {sampleProperties.map((property) => (
                  <Card key={property.id} shadow="sm" radius="md" withBorder>
                    {/* Property Image Section */}
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
                        <Text
                          size="sm"
                          c={
                            property.status === "Available" ? "green" : "orange"
                          }
                          fw={500}
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

                      <Text size="xs" c="dimmed">
                        {property.type}
                      </Text>

                      {/* Amenities Section */}
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
                                {amenity}
                              </Text>
                            ))}
                          {property.amenities.length > 3 && (
                            <Text size="xs" c="dimmed">
                              +{property.amenities.length - 3} more
                            </Text>
                          )}
                        </Group>
                      </Box>
                    </Stack>

                    <Button
                      fullWidth
                      mt="md"
                      mx="md"
                      mb="md"
                      variant="light"
                      onClick={openInquiry}
                      disabled={property.status !== "Available"}
                    >
                      {property.status === "Available"
                        ? "Inquire Now"
                        : "Not Available"}
                    </Button>
                  </Card>
                ))}
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
                <TextInput
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={formData.fullName || ""}
                  onChange={(e) =>
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
                  onChange={(e) =>
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
                  onChange={(e) =>
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
                  onChange={(e) =>
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
                  onChange={(e) =>
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
                    handleInputChange("preferredContactMethod", value)
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
                  onChange={(e) =>
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

          {/* Property Interest Section */}
          <Box>
            <Title order={3} size="h4" mb="md" c="green">
              <IconHome size={20} style={{ marginRight: 8 }} />
              Property Interest Details
            </Title>

            <Grid>
              <Grid.Col span={12}>
                <TextInput
                  label="Specific Lot/Unit of Interest"
                  placeholder="e.g., Block 1 Lot 15, or leave blank for general inquiry"
                  value={formData.specificLotUnit || ""}
                  onChange={(e) =>
                    handleInputChange("specificLotUnit", e.currentTarget.value)
                  }
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Property Type Preference"
                  value={formData.propertyType}
                  onChange={(value) => handleInputChange("propertyType", value)}
                  data={[
                    { value: "residential-lot", label: "Residential Lot" },
                    { value: "commercial", label: "Commercial" },
                    { value: "house-and-lot", label: "House and Lot" },
                    { value: "condo", label: "Condominium" },
                    { value: "other", label: "Other" },
                  ]}
                  required
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Budget Range"
                  placeholder="e.g., ₱2M - ₱5M"
                  value={formData.budgetRange || ""}
                  onChange={(e) =>
                    handleInputChange("budgetRange", e.currentTarget.value)
                  }
                  leftSection={<IconCash size={16} />}
                  required
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Preferred Lot Size"
                  placeholder="e.g., 300 sqm, 500 sqm"
                  value={formData.preferredLotSize || ""}
                  onChange={(e) =>
                    handleInputChange("preferredLotSize", e.currentTarget.value)
                  }
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Text size="sm" fw={500} mb="xs">
                  Payment Method Preference
                </Text>
                <Radio.Group
                  value={formData.paymentMethod}
                  onChange={(value) =>
                    handleInputChange("paymentMethod", value)
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
                  label="Additional Requirements or Questions"
                  placeholder="Any specific requirements, questions, or additional information you'd like to share..."
                  value={formData.additionalRequirements || ""}
                  onChange={(e) =>
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
    </Container>
  );
};

export default BrowsePropertiesSection;
