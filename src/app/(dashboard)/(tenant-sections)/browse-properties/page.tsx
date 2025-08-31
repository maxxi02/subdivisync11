"use client";
import React, { useState, useEffect } from "react";
import {
  Container,
  Title,
  Button,
  Modal,
  TextInput,
  Select,
  Group,
  Stack,
  Badge,
  ActionIcon,
  Text,
  Paper,
  Grid,
  Alert,
  LoadingOverlay,
  Card,
  Image,
  Center,
  Tabs,
  rem,
  Textarea,
  NumberInput,
  Table,
  ScrollArea,
  Notification,
} from "@mantine/core";
import {
  IconHeart,
  IconSearch,
  IconFilter,
  IconBed,
  IconBath,
  IconSquare,
  IconEye,
  IconHeartFilled,
  IconHome,
  IconCalendar,
  IconCreditCard,
  IconPhone,
  IconMail,
  IconUser,
  IconBuilding,
  IconReceipt,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconClock,
} from "@tabler/icons-react";
import axios from "axios";

// Property interface
export interface Property {
  _id: string;
  address: string;
  rent_amount: number;
  description: string;
  photos: string[];
  availability_status: "Available" | "Pending" | "Rented";
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  type: "Apartment" | "House" | "Penthouse" | "Studio";
  amenities: string[];
  created_at: string;
  updated_at: string;
}

// Tenant Property interface for properties rented by the current user
interface TenantWithProperty {
  _id: string;
  user_id: string;
  property_id: string;
  monthly_rent?: number;
  lease_start_date: string;
  lease_end_date: string;
  status: "Active" | "Terminated" | "Pending";
  created_at: string;
  updated_at: string;
  property: Property;
}

interface TenantPropertyDisplay extends Property {
  lease_start_date: string;
  lease_end_date: string;
  lease_status: "Active" | "Expiring Soon" | "Expired";
  monthly_rent_due: number;
  next_payment_due: string;
  security_deposit: number;
  tenant_id: string;
  lease_terms?: {
    duration_months: number;
    pet_allowed: boolean;
    smoking_allowed: boolean;
    subletting_allowed: boolean;
  };
  landlord_contact?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface RentPayment {
  _id: string;
  tenant_id: string;
  property_id: string;
  payment_month: number;
  payment_year: number;
  rent_amount: number;
  late_fee: number;
  total_amount: number;
  payment_status: "pending" | "paid" | "failed";
  due_date: string;
  paid_at?: string;
  failed_at?: string;
  failure_reason?: string;
  payment_method?: string;
  created_at: string;
  property: {
    _id: string;
    address: string;
    type: string;
    photos: string[];
  };
}

interface PaymentSummary {
  total_paid: number;
  total_pending: number;
  total_late_fees: number;
  payments_made: number;
  payments_pending: number;
  payments_failed: number;
}

interface NextPaymentDue {
  month: number;
  year: number;
  amount: number;
  due_date: string;
  is_overdue: boolean;
  property_address: string;
  tenant_id: string;
}

const PROPERTY_TYPES = [
  { value: "Apartment", label: "Apartment" },
  { value: "House", label: "House" },
  { value: "Penthouse", label: "Penthouse" },
  { value: "Studio", label: "Studio" },
];

const PROPERTY_TYPE_PREFERENCES = [
  { value: "residential_lot", label: "Residential Lot" },
  { value: "commercial", label: "Commercial" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "penthouse", label: "Penthouse" },
  { value: "studio", label: "Studio" },
  { value: "other", label: "Other" },
];

const BUDGET_RANGES = [
  { value: "under_50k", label: "Under $50,000" },
  { value: "50k_100k", label: "$50,000 - $100,000" },
  { value: "100k_200k", label: "$100,000 - $200,000" },
  { value: "200k_500k", label: "$200,000 - $500,000" },
  { value: "500k_1m", label: "$500,000 - $1,000,000" },
  { value: "over_1m", label: "Over $1,000,000" },
];

const TIMELINE_OPTIONS = [
  { value: "immediate", label: "Immediate (within 1 month)" },
  { value: "1_3_months", label: "1-3 months" },
  { value: "3_6_months", label: "3-6 months" },
  { value: "6_12_months", label: "6-12 months" },
  { value: "over_1_year", label: "Over 1 year" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "financing", label: "Bank Financing" },
  { value: "installment", label: "Installment Plan" },
  { value: "combination", label: "Combination" },
];

const CONTACT_METHOD_OPTIONS = [
  { value: "phone", label: "Phone Call" },
  { value: "email", label: "Email" },
  { value: "text", label: "Text Message" },
  { value: "whatsapp", label: "WhatsApp" },
];

const CONTACT_TIME_OPTIONS = [
  { value: "morning", label: "Morning (8AM - 12PM)" },
  { value: "afternoon", label: "Afternoon (12PM - 5PM)" },
  { value: "evening", label: "Evening (5PM - 8PM)" },
  { value: "anytime", label: "Anytime" },
];

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const BrowsePropertiesSection = () => {
  const [loading, setLoading] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentHistoryModalOpen, setPaymentHistoryModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [tenantProperties, setTenantProperties] = useState<
    TenantPropertyDisplay[]
  >([]);
  const [selectedTenantProperty, setSelectedTenantProperty] =
    useState<TenantPropertyDisplay | null>(null);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    total_paid: 0,
    total_pending: 0,
    total_late_fees: 0,
    payments_made: 0,
    payments_pending: 0,
    payments_failed: 0,
  });
  const [nextPaymentDue, setNextPaymentDue] = useState<NextPaymentDue | null>(
    null
  );

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>("all");
  const [priceRange, setPriceRange] = useState<string | null>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>("all");
  const [properties, setProperties] = useState<Property[]>([]);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    tenant_id: "",
    payment_month: new Date().getMonth() + 1,
    payment_year: new Date().getFullYear(),
  });

  const [inquiryForm, setInquiryForm] = useState({
    full_name: "",
    phone_primary: "",
    phone_secondary: "",
    email: "",
    current_address: "",
    preferred_contact_method: "",
    preferred_contact_time: "",
    specific_unit: "",
    property_type_preference: "",
    budget_range: "",
    preferred_lot_size: "",
    timeline: "",
    payment_method_preference: "",
    additional_notes: "",
  });

  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Utility functions
  const showNotification = (title: string, message: string, color: string) => {
    console.log(`${title}: ${message}`);
    // In a real app, you'd use a proper notification system
    alert(`${title}: ${message}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "green";
      case "Pending":
        return "yellow";
      case "Rented":
        return "red";
      default:
        return "gray";
    }
  };

  const getLeaseStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "green";
      case "Expiring Soon":
        return "yellow";
      case "Expired":
        return "red";
      default:
        return "gray";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "green";
      case "pending":
        return "yellow";
      case "failed":
        return "red";
      default:
        return "gray";
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <IconCheck size={16} />;
      case "pending":
        return <IconClock size={16} />;
      case "failed":
        return <IconX size={16} />;
      default:
        return <IconAlertCircle size={16} />;
    }
  };

  // API functions
  const fetchProperties = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (selectedType && selectedType !== "all") {
        queryParams.append("type", selectedType);
      }

      if (priceRange && priceRange !== "all") {
        switch (priceRange) {
          case "low":
            queryParams.append("maxPrice", "2000");
            break;
          case "mid":
            queryParams.append("minPrice", "2000");
            queryParams.append("maxPrice", "4000");
            break;
          case "high":
            queryParams.append("minPrice", "4000");
            break;
        }
      }

      const response = await fetch(`/api/properties?${queryParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProperties(data.properties || []);
      } else {
        showNotification(
          "Error",
          data.error || "Failed to fetch properties",
          "red"
        );
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      showNotification("Error", "Failed to load properties", "red");
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tenant/properties");
      const data = await response.json();

      if (data.success && data.properties) {
        const validTenants = data.properties.filter(
          (tenant: TenantWithProperty) => {
            return tenant.property && typeof tenant.property === "object";
          }
        );

        const transformedProperties: TenantPropertyDisplay[] = validTenants.map(
          (tenant: TenantWithProperty) => {
            const currentDate = new Date();
            const defaultLeaseStart =
              tenant.lease_start_date ||
              tenant.created_at ||
              currentDate.toISOString();
            const defaultLeaseEnd =
              tenant.lease_end_date ||
              new Date(
                currentDate.getTime() + 365 * 24 * 60 * 60 * 1000
              ).toISOString();

            const calculateLeaseStatus = (
              leaseEndDateString: string
            ): "Active" | "Expiring Soon" | "Expired" => {
              try {
                const leaseEndDate = new Date(leaseEndDateString);
                if (isNaN(leaseEndDate.getTime())) return "Active";

                const today = new Date();
                const daysUntilExpiry = Math.ceil(
                  (leaseEndDate.getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                if (daysUntilExpiry < 0) return "Expired";
                if (daysUntilExpiry <= 30) return "Expiring Soon";
                return "Active";
              } catch {
                return "Active";
              }
            };

            const calculateNextPaymentDate = (leaseStartDate: string) => {
              try {
                const today = new Date();
                const leaseStart = new Date(leaseStartDate);
                if (isNaN(leaseStart.getTime())) return today;

                const leaseStartDay = leaseStart.getDate();
                const nextPayment = new Date(today);
                nextPayment.setMonth(nextPayment.getMonth() + 1);

                const maxDayInTargetMonth = new Date(
                  nextPayment.getFullYear(),
                  nextPayment.getMonth() + 1,
                  0
                ).getDate();
                const targetDay = Math.min(leaseStartDay, maxDayInTargetMonth);
                nextPayment.setDate(targetDay);

                return nextPayment;
              } catch {
                return new Date();
              }
            };

            const lease_status = calculateLeaseStatus(defaultLeaseEnd);
            const nextPaymentDate = calculateNextPaymentDate(defaultLeaseStart);
            const property = tenant.property;
            const rentAmount = tenant.monthly_rent || property.rent_amount || 0;

            return {
              ...property,
              lease_start_date: defaultLeaseStart,
              lease_end_date: defaultLeaseEnd,
              lease_status,
              monthly_rent_due: rentAmount,
              next_payment_due: nextPaymentDate.toISOString(),
              security_deposit: rentAmount * 2,
              tenant_id: tenant._id,
            };
          }
        );

        setTenantProperties(transformedProperties);

        if (data.properties.length > validTenants.length) {
          showNotification(
            "Warning",
            `${data.properties.length - validTenants.length} properties could not be loaded due to missing data`,
            "yellow"
          );
        }
      } else {
        showNotification(
          "Error",
          data.error || "Failed to fetch your properties",
          "red"
        );
      }
    } catch (error) {
      console.error("Failed to fetch tenant properties:", error);
      showNotification("Error", "Failed to load your properties", "red");
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const openInquiryModal = (property: Property) => {
    setSelectedProperty(property);
    setInquiryModalOpen(true);
    setCurrentStep(0);
  };

  const openPaymentModal = (property: TenantPropertyDisplay) => {
    setSelectedTenantProperty(property);
    setPaymentForm({
      ...paymentForm,
      tenant_id: property.tenant_id,
    });
    setPaymentModalOpen(true);
  };

  const openPaymentHistoryModal = async (tenantId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/rent-payments?tenant_id=${tenantId}&limit=24`
      );
      const data = await response.json();

      if (data.success) {
        setRentPayments(data.payments || []);
        setPaymentSummary(
          data.summary || {
            total_paid: 0,
            total_pending: 0,
            total_late_fees: 0,
            payments_made: 0,
            payments_pending: 0,
            payments_failed: 0,
          }
        );
        setNextPaymentDue(data.next_payment_due || null);
        setPaymentHistoryModalOpen(true);
      } else {
        showNotification(
          "Error",
          data.error || "Failed to fetch payment history",
          "red"
        );
      }
    } catch (error) {
      console.error("Failed to fetch payment history:", error);
      showNotification("Error", "Failed to load payment history", "red");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (propertyId: string) => {
    setFavorites((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const openDetailsModal = (property: Property) => {
    setSelectedProperty(property);
    setSelectedTenantProperty(null);
    setDetailsModalOpen(true);
  };

  const openTenantPropertyDetails = (property: TenantPropertyDisplay) => {
    setSelectedTenantProperty(property);
    setSelectedProperty(null);
    setDetailsModalOpen(true);
  };

  const openContactModal = (property: Property) => {
    setSelectedProperty(property);
    setContactModalOpen(true);
  };

  // Form handlers
  const handleInquirySubmit = async () => {
    if (!selectedProperty) return;

    try {
      setLoading(true);

      const inquiryData = {
        property_id: selectedProperty._id,
        personal_info: {
          full_name: inquiryForm.full_name,
          phone_primary: inquiryForm.phone_primary,
          phone_secondary: inquiryForm.phone_secondary,
          email: inquiryForm.email,
          current_address: inquiryForm.current_address,
        },
        contact_preferences: {
          preferred_contact_method: inquiryForm.preferred_contact_method,
          preferred_contact_time: inquiryForm.preferred_contact_time,
        },
        property_interest: {
          specific_unit: inquiryForm.specific_unit,
          property_type_preference: inquiryForm.property_type_preference,
          budget_range: inquiryForm.budget_range,
          preferred_lot_size: inquiryForm.preferred_lot_size,
          timeline: inquiryForm.timeline,
          payment_method_preference: inquiryForm.payment_method_preference,
        },
        additional_notes: inquiryForm.additional_notes,
      };

      const response = await axios.post("/api/inquiries", inquiryData);
      const data = response.data;

      if (data.success) {
        showNotification(
          "Success",
          "Your inquiry has been submitted successfully! We will contact you soon based on your preferred contact method.",
          "green"
        );
        setInquiryModalOpen(false);
        setInquiryForm({
          full_name: "",
          phone_primary: "",
          phone_secondary: "",
          email: "",
          current_address: "",
          preferred_contact_method: "",
          preferred_contact_time: "",
          specific_unit: "",
          property_type_preference: "",
          budget_range: "",
          preferred_lot_size: "",
          timeline: "",
          payment_method_preference: "",
          additional_notes: "",
        });
      } else {
        throw new Error(data.error || "Failed to submit inquiry");
      }
    } catch (error) {
      console.error("Failed to submit inquiry:", error);
      showNotification("Error", (error as Error).message, "red");
    } finally {
      setLoading(false);
    }
  };

  const handleRentPayment = async () => {
    if (!selectedTenantProperty) return;

    try {
      setLoading(true);

      const response = await axios.post("/api/create-rent-payment", {
        tenant_id: paymentForm.tenant_id,
        payment_month: paymentForm.payment_month,
        payment_year: paymentForm.payment_year,
      });

      const data = response.data;

      if (data.success) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || "Failed to create payment session");
      }
    } catch (error) {
      console.error("Failed to create rent payment:", error);
      showNotification("Error", (error as Error).message, "red");
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return (
          inquiryForm.full_name.trim() !== "" &&
          inquiryForm.phone_primary.trim() !== "" &&
          inquiryForm.email.trim() !== "" &&
          inquiryForm.current_address.trim() !== ""
        );
      case 1:
        return (
          inquiryForm.preferred_contact_method.trim() !== "" &&
          inquiryForm.preferred_contact_time.trim() !== ""
        );
      case 2:
        return (
          inquiryForm.budget_range.trim() !== "" &&
          inquiryForm.timeline.trim() !== ""
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  // Effects
  useEffect(() => {
    fetchProperties();
  }, [selectedType, priceRange]);

  useEffect(() => {
    if (activeTab === "myproperties") {
      fetchTenantProperties();
    }
  }, [activeTab]);

  // Filter properties
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

    return matchesSearch && matchesType && matchesPrice && matchesTab;
  });

  // Property Card Component
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
          {formatCurrency(property.rent_amount)}/mo
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

        {property.amenities && property.amenities.length > 0 && (
          <Group gap="xs">
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
        )}

        <Group grow mt="md">
          <Button
            leftSection={<IconEye size={16} />}
            variant="filled"
            onClick={() => openDetailsModal(property)}
          >
            View Details
          </Button>
          <Button variant="outline" onClick={() => openInquiryModal(property)}>
            Make Inquiry
          </Button>
        </Group>
      </Stack>
    </Card>
  );

  // Tenant Property Card Component
  const TenantPropertyCard = ({
    property,
  }: {
    property: TenantPropertyDisplay;
  }) => (
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
        <Badge
          color={getLeaseStatusColor(property.lease_status)}
          style={{ position: "absolute", top: rem(8), left: rem(8) }}
        >
          {property.lease_status}
        </Badge>
        <Badge
          variant="filled"
          color="blue"
          style={{ position: "absolute", top: rem(8), right: rem(8) }}
        >
          My Property
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
          {formatCurrency(property.monthly_rent_due)}/mo
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

        <Group gap="xs">
          <Group gap={4}>
            <IconCalendar size={14} color="gray" />
            <Text size="xs" c="dimmed">
              Lease ends:{" "}
              {new Date(property.lease_end_date).toLocaleDateString()}
            </Text>
          </Group>
        </Group>

        <Group gap="xs">
          <Group gap={4}>
            <IconCreditCard size={14} color="gray" />
            <Text size="xs" c="dimmed">
              Next payment:{" "}
              {new Date(property.next_payment_due).toLocaleDateString()}
            </Text>
          </Group>
        </Group>

        <Button
          leftSection={<IconEye size={16} />}
          variant="filled"
          onClick={() => openTenantPropertyDetails(property)}
          mt="md"
        >
          View Property Details
        </Button>

        <Group grow mt="sm">
          <Button
            leftSection={<IconCreditCard size={16} />}
            variant="filled"
            color="green"
            onClick={() => openPaymentModal(property)}
          >
            Pay Rent
          </Button>
          <Button
            leftSection={<IconReceipt size={16} />}
            variant="outline"
            onClick={() => openPaymentHistoryModal(property.tenant_id)}
          >
            Payment History
          </Button>
        </Group>
      </Stack>
    </Card>
  );

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Stack gap="xs">
            <Title order={1}>Browse Properties</Title>
            <Text c="dimmed">
              Find your perfect rental property from our curated listings
            </Text>
          </Stack>
          <Badge variant="outline" size="lg">
            {activeTab === "myproperties"
              ? `${tenantProperties.length} My Properties`
              : `${filteredProperties.length} Properties`}
          </Badge>
        </Group>

        {/* Search and Filters - Hidden for My Properties tab */}
        {activeTab !== "myproperties" && (
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
                    onChange={setSelectedType}
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
                    onChange={setPriceRange}
                    data={[
                      { value: "all", label: "All Prices" },
                      { value: "low", label: "Under $2,000" },
                      { value: "mid", label: "$2,000 - $4,000" },
                      { value: "high", label: "$4,000+" },
                    ]}
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Paper>
        )}

        {/* Properties Display */}
        <Paper shadow="xs" p="lg" radius="md" withBorder>
          <LoadingOverlay visible={loading} />
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List grow>
              <Tabs.Tab value="all">All Properties</Tabs.Tab>
              <Tabs.Tab value="available">Available Now</Tabs.Tab>
              <Tabs.Tab value="favorites" leftSection={<IconHeart size={16} />}>
                Favorites ({favorites.length})
              </Tabs.Tab>
              <Tabs.Tab
                value="myproperties"
                leftSection={<IconHome size={16} />}
              >
                My Properties
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="all" pt="xl">
              {properties.length === 0 && !loading ? (
                <Paper p="xl" radius="md" withBorder>
                  <Center>
                    <Stack align="center" gap="md">
                      <IconFilter size={48} color="gray" />
                      <Title order={3}>No Properties Available</Title>
                      <Text c="dimmed" ta="center">
                        There are no properties available at the moment. Please
                        check back later.
                      </Text>
                    </Stack>
                  </Center>
                </Paper>
              ) : (
                <Grid>
                  {filteredProperties.map((property) => (
                    <Grid.Col
                      key={property._id}
                      span={{ base: 12, sm: 6, lg: 4 }}
                    >
                      <PropertyCard property={property} />
                    </Grid.Col>
                  ))}
                </Grid>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="available" pt="xl">
              {filteredProperties.filter(
                (p) => p.availability_status === "Available"
              ).length === 0 && !loading ? (
                <Paper p="xl" radius="md" withBorder>
                  <Center>
                    <Stack align="center" gap="md">
                      <IconFilter size={48} color="gray" />
                      <Title order={3}>No Available Properties</Title>
                      <Text c="dimmed" ta="center">
                        There are no available properties at the moment. Please
                        check back later.
                      </Text>
                    </Stack>
                  </Center>
                </Paper>
              ) : (
                <Grid>
                  {filteredProperties
                    .filter((p) => p.availability_status === "Available")
                    .map((property) => (
                      <Grid.Col
                        key={property._id}
                        span={{ base: 12, sm: 6, lg: 4 }}
                      >
                        <PropertyCard property={property} />
                      </Grid.Col>
                    ))}
                </Grid>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="favorites" pt="xl">
              {favorites.length === 0 ? (
                <Paper p="xl" radius="md" withBorder>
                  <Center>
                    <Stack align="center" gap="md">
                      <IconHeart size={48} color="gray" />
                      <Title order={3}>No Favorites Yet</Title>
                      <Text c="dimmed" ta="center">
                        Start browsing properties and click the heart icon to
                        save your favorites!
                      </Text>
                    </Stack>
                  </Center>
                </Paper>
              ) : (
                <Grid>
                  {filteredProperties
                    .filter((p) => favorites.includes(p._id))
                    .map((property) => (
                      <Grid.Col
                        key={property._id}
                        span={{ base: 12, sm: 6, lg: 4 }}
                      >
                        <PropertyCard property={property} />
                      </Grid.Col>
                    ))}
                </Grid>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="myproperties" pt="xl">
              {tenantProperties.length === 0 && !loading ? (
                <Paper p="xl" radius="md" withBorder>
                  <Center>
                    <Stack align="center" gap="md">
                      <IconHome size={48} color="gray" />
                      <Title order={3}>No Properties Rented</Title>
                      <Text c="dimmed" ta="center">
                        You don&#39;t have any rented properties yet. Browse our
                        available properties to find your perfect home!
                      </Text>
                    </Stack>
                  </Center>
                </Paper>
              ) : (
                <Grid>
                  {tenantProperties.map((property) => (
                    <Grid.Col
                      key={property._id}
                      span={{ base: 12, sm: 6, lg: 4 }}
                    >
                      <TenantPropertyCard property={property} />
                    </Grid.Col>
                  ))}
                </Grid>
              )}
            </Tabs.Panel>
          </Tabs>

          {filteredProperties.length === 0 &&
            activeTab !== "favorites" &&
            activeTab !== "myproperties" &&
            properties.length > 0 && (
              <Paper p="xl" radius="md" withBorder>
                <Center>
                  <Stack align="center" gap="md">
                    <IconFilter size={48} color="gray" />
                    <Title order={3}>No Properties Found</Title>
                    <Text c="dimmed" ta="center">
                      Try adjusting your search criteria or filters to find more
                      properties.
                    </Text>
                  </Stack>
                </Center>
              </Paper>
            )}
        </Paper>
      </Stack>

      {/* Property Details Modal */}
      <Modal
        opened={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={
          selectedTenantProperty ? "My Property Details" : "Property Details"
        }
        size="lg"
        centered
      >
        {selectedProperty && !selectedTenantProperty && (
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
              {formatCurrency(selectedProperty.rent_amount)}/month
            </Text>

            <Grid>
              <Grid.Col span={4}>
                <Text ta="center" fw={600}>
                  {selectedProperty.bedrooms}
                </Text>
                <Text ta="center" size="sm" c="dimmed">
                  Bedrooms
                </Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text ta="center" fw={600}>
                  {selectedProperty.bathrooms}
                </Text>
                <Text ta="center" size="sm" c="dimmed">
                  Bathrooms
                </Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text ta="center" fw={600}>
                  {selectedProperty.sqft}
                </Text>
                <Text ta="center" size="sm" c="dimmed">
                  Sq Ft
                </Text>
              </Grid.Col>
            </Grid>

            <Text>{selectedProperty.description}</Text>

            {selectedProperty.amenities &&
              selectedProperty.amenities.length > 0 && (
                <>
                  <Text fw={600}>Amenities</Text>
                  <Group gap="xs">
                    {selectedProperty.amenities.map((amenity) => (
                      <Badge key={amenity} variant="light">
                        {amenity}
                      </Badge>
                    ))}
                  </Group>
                </>
              )}

            <Button onClick={() => openContactModal(selectedProperty)}>
              Contact for More Info
            </Button>
          </Stack>
        )}

        {selectedTenantProperty && (
          <Stack gap="md">
            <Image
              src={
                selectedTenantProperty.photos[0] ||
                "https://via.placeholder.com/600x300"
              }
              height={300}
              alt={selectedTenantProperty.address}
              radius="md"
            />

            <Group justify="space-between">
              <Title order={2}>{selectedTenantProperty.address}</Title>
              <Badge
                color={getLeaseStatusColor(selectedTenantProperty.lease_status)}
              >
                {selectedTenantProperty.lease_status}
              </Badge>
            </Group>

            <Grid>
              <Grid.Col span={6}>
                <Text size="xl" fw={700} c="blue">
                  {formatCurrency(selectedTenantProperty.monthly_rent_due)}
                  /month
                </Text>
                <Text size="sm" c="dimmed">
                  Monthly Rent
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="lg" fw={600} c="green">
                  {formatCurrency(selectedTenantProperty.security_deposit)}
                </Text>
                <Text size="sm" c="dimmed">
                  Security Deposit
                </Text>
              </Grid.Col>
            </Grid>

            <Paper p="md" withBorder>
              <Title order={4} mb="sm">
                Lease Information
              </Title>
              <Grid>
                <Grid.Col span={6}>
                  <Text fw={500}>Lease Start</Text>
                  <Text size="sm">
                    {new Date(
                      selectedTenantProperty.lease_start_date
                    ).toLocaleDateString()}
                  </Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text fw={500}>Lease End</Text>
                  <Text size="sm">
                    {new Date(
                      selectedTenantProperty.lease_end_date
                    ).toLocaleDateString()}
                  </Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text fw={500}>Next Payment Due</Text>
                  <Text
                    size="sm"
                    c={
                      selectedTenantProperty.lease_status === "Expiring Soon"
                        ? "orange"
                        : "blue"
                    }
                  >
                    {new Date(
                      selectedTenantProperty.next_payment_due
                    ).toLocaleDateString()}
                  </Text>
                </Grid.Col>
              </Grid>
            </Paper>

            <Grid>
              <Grid.Col span={4}>
                <Text ta="center" fw={600}>
                  {selectedTenantProperty.bedrooms}
                </Text>
                <Text ta="center" size="sm" c="dimmed">
                  Bedrooms
                </Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text ta="center" fw={600}>
                  {selectedTenantProperty.bathrooms}
                </Text>
                <Text ta="center" size="sm" c="dimmed">
                  Bathrooms
                </Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text ta="center" fw={600}>
                  {selectedTenantProperty.sqft}
                </Text>
                <Text ta="center" size="sm" c="dimmed">
                  Sq Ft
                </Text>
              </Grid.Col>
            </Grid>

            <Text>{selectedTenantProperty.description}</Text>

            {selectedTenantProperty.amenities &&
              selectedTenantProperty.amenities.length > 0 && (
                <>
                  <Text fw={600}>Amenities</Text>
                  <Group gap="xs">
                    {selectedTenantProperty.amenities.map((amenity) => (
                      <Badge key={amenity} variant="light">
                        {amenity}
                      </Badge>
                    ))}
                  </Group>
                </>
              )}

            {selectedTenantProperty.lease_terms && (
              <Paper p="md" withBorder>
                <Title order={4} mb="sm">
                  Lease Terms
                </Title>
                <Grid>
                  <Grid.Col span={6}>
                    <Text fw={500}>Duration</Text>
                    <Text size="sm">
                      {selectedTenantProperty.lease_terms.duration_months}{" "}
                      months
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text fw={500}>Pet Policy</Text>
                    <Text
                      size="sm"
                      c={
                        selectedTenantProperty.lease_terms.pet_allowed
                          ? "green"
                          : "red"
                      }
                    >
                      {selectedTenantProperty.lease_terms.pet_allowed
                        ? "Pets Allowed"
                        : "No Pets"}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text fw={500}>Smoking Policy</Text>
                    <Text
                      size="sm"
                      c={
                        selectedTenantProperty.lease_terms.smoking_allowed
                          ? "orange"
                          : "green"
                      }
                    >
                      {selectedTenantProperty.lease_terms.smoking_allowed
                        ? "Smoking Allowed"
                        : "No Smoking"}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text fw={500}>Subletting</Text>
                    <Text
                      size="sm"
                      c={
                        selectedTenantProperty.lease_terms.subletting_allowed
                          ? "blue"
                          : "gray"
                      }
                    >
                      {selectedTenantProperty.lease_terms.subletting_allowed
                        ? "Subletting Allowed"
                        : "No Subletting"}
                    </Text>
                  </Grid.Col>
                </Grid>
              </Paper>
            )}

            {selectedTenantProperty.landlord_contact && (
              <Paper p="md" withBorder>
                <Title order={4} mb="sm">
                  Landlord Contact
                </Title>
                <Stack gap="sm">
                  <Group gap="sm">
                    <IconUser size={16} />
                    <Text fw={500}>
                      {selectedTenantProperty.landlord_contact.name}
                    </Text>
                  </Group>
                  <Group gap="sm">
                    <IconMail size={16} />
                    <Text size="sm">
                      {selectedTenantProperty.landlord_contact.email}
                    </Text>
                  </Group>
                  <Group gap="sm">
                    <IconPhone size={16} />
                    <Text size="sm">
                      {selectedTenantProperty.landlord_contact.phone}
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            )}
          </Stack>
        )}
      </Modal>

      {/* Property Inquiry Modal */}
      <Modal
        opened={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        title={`Property Inquiry - ${selectedProperty?.address}`}
        size="lg"
        centered
      >
        <Stack gap="md">
          <LoadingOverlay visible={loading} />

          {selectedProperty && (
            <Alert color="blue">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>{selectedProperty.address}</Text>
                  <Text size="sm" c="dimmed">
                    {formatCurrency(selectedProperty.rent_amount)}/month
                  </Text>
                </div>
                <Badge color="blue">Step {currentStep + 1} of 4</Badge>
              </Group>
            </Alert>
          )}

          {/* Step 0: Personal Information */}
          {currentStep === 0 && (
            <Stack gap="md">
              <Title order={4}>Personal Information</Title>

              <TextInput
                label="Full Name"
                placeholder="Enter your full name"
                value={inquiryForm.full_name}
                onChange={(e) =>
                  setInquiryForm({
                    ...inquiryForm,
                    full_name: e.currentTarget.value,
                  })
                }
                required
              />

              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Primary Phone Number"
                    placeholder="(555) 123-4567"
                    value={inquiryForm.phone_primary}
                    onChange={(e) =>
                      setInquiryForm({
                        ...inquiryForm,
                        phone_primary: e.currentTarget.value,
                      })
                    }
                    required
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Secondary Phone Number"
                    placeholder="(555) 987-6543 (Optional)"
                    value={inquiryForm.phone_secondary}
                    onChange={(e) =>
                      setInquiryForm({
                        ...inquiryForm,
                        phone_secondary: e.currentTarget.value,
                      })
                    }
                  />
                </Grid.Col>
              </Grid>

              <TextInput
                label="Email Address"
                placeholder="your.email@example.com"
                type="email"
                value={inquiryForm.email}
                onChange={(e) =>
                  setInquiryForm({
                    ...inquiryForm,
                    email: e.currentTarget.value,
                  })
                }
                required
              />

              <Textarea
                label="Current Address"
                placeholder="Enter your current residential address"
                value={inquiryForm.current_address}
                onChange={(e) =>
                  setInquiryForm({
                    ...inquiryForm,
                    current_address: e.currentTarget.value,
                  })
                }
                minRows={2}
                required
              />
            </Stack>
          )}

          {/* Step 1: Contact Preferences */}
          {currentStep === 1 && (
            <Stack gap="md">
              <Title order={4}>Contact Preferences</Title>

              <Select
                label="Preferred Contact Method"
                placeholder="How would you like us to contact you?"
                value={inquiryForm.preferred_contact_method}
                onChange={(value) =>
                  setInquiryForm({
                    ...inquiryForm,
                    preferred_contact_method: value || "",
                  })
                }
                data={CONTACT_METHOD_OPTIONS}
                required
              />

              <Select
                label="Preferred Contact Time"
                placeholder="When is the best time to contact you?"
                value={inquiryForm.preferred_contact_time}
                onChange={(value) =>
                  setInquiryForm({
                    ...inquiryForm,
                    preferred_contact_time: value || "",
                  })
                }
                data={CONTACT_TIME_OPTIONS}
                required
              />
            </Stack>
          )}

          {/* Step 2: Property Interest Details */}
          {currentStep === 2 && (
            <Stack gap="md">
              <Title order={4}>Property Interest Details</Title>

              <TextInput
                label="Specific Lot/Unit of Interest"
                placeholder="e.g., Unit 2B, Lot 15 (Optional)"
                value={inquiryForm.specific_unit}
                onChange={(e) =>
                  setInquiryForm({
                    ...inquiryForm,
                    specific_unit: e.currentTarget.value,
                  })
                }
              />

              <Select
                label="Property Type Preference"
                placeholder="What type of property are you looking for?"
                value={inquiryForm.property_type_preference}
                onChange={(value) =>
                  setInquiryForm({
                    ...inquiryForm,
                    property_type_preference: value || "",
                  })
                }
                data={PROPERTY_TYPE_PREFERENCES}
              />

              <Select
                label="Budget Range"
                placeholder="What is your budget range?"
                value={inquiryForm.budget_range}
                onChange={(value) =>
                  setInquiryForm({
                    ...inquiryForm,
                    budget_range: value || "",
                  })
                }
                data={BUDGET_RANGES}
                required
              />

              <TextInput
                label="Preferred Lot Size"
                placeholder="e.g., 100 sqm, 1000 sqft (Optional)"
                value={inquiryForm.preferred_lot_size}
                onChange={(e) =>
                  setInquiryForm({
                    ...inquiryForm,
                    preferred_lot_size: e.currentTarget.value,
                  })
                }
              />

              <Select
                label="Timeline for Purchase/Decision"
                placeholder="When are you planning to make a decision?"
                value={inquiryForm.timeline}
                onChange={(value) =>
                  setInquiryForm({
                    ...inquiryForm,
                    timeline: value || "",
                  })
                }
                data={TIMELINE_OPTIONS}
                required
              />

              <Select
                label="Payment Method Preference"
                placeholder="How do you plan to pay?"
                value={inquiryForm.payment_method_preference}
                onChange={(value) =>
                  setInquiryForm({
                    ...inquiryForm,
                    payment_method_preference: value || "",
                  })
                }
                data={PAYMENT_METHOD_OPTIONS}
              />
            </Stack>
          )}

          {/* Step 3: Additional Information */}
          {currentStep === 3 && (
            <Stack gap="md">
              <Title order={4}>Additional Information</Title>
              <Textarea
                label="Additional Notes or Questions"
                placeholder="Please share any specific questions, requirements, or additional information that would help us assist you better..."
                value={inquiryForm.additional_notes}
                onChange={(e) =>
                  setInquiryForm({
                    ...inquiryForm,
                    additional_notes: e.currentTarget.value,
                  })
                }
                minRows={4}
              />

              <Alert color="blue">
                <Text size="sm">
                  <strong>What happens next?</strong> After you submit your
                  inquiry, our team will review your information and contact you
                  within 24 hours using your preferred contact method and time.
                </Text>
              </Alert>
            </Stack>
          )}

          <Group justify="space-between" mt="xl">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep > 0) setCurrentStep(currentStep - 1);
                else setInquiryModalOpen(false);
              }}
            >
              {currentStep > 0 ? "Back" : "Cancel"}
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!isStepValid(currentStep)}
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleInquirySubmit}
                disabled={!isStepValid(currentStep)}
              >
                Submit Inquiry
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>

      {/* Contact Modal */}
      <Modal
        opened={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title={`Contact About ${selectedProperty?.address}`}
        size="md"
        centered
      >
        {selectedProperty && (
          <Stack gap="md">
            <Alert color="blue">
              <Text fw={500}>Interested in this property?</Text>
              <Text size="sm">
                Contact us for more information or to schedule a viewing.
              </Text>
            </Alert>

            <Group gap="sm">
              <IconMail size={20} />
              <div>
                <Text fw={500}>Email</Text>
                <Text size="sm">leasing@example.com</Text>
              </div>
            </Group>

            <Group gap="sm">
              <IconPhone size={20} />
              <div>
                <Text fw={500}>Phone</Text>
                <Text size="sm">(555) 123-4567</Text>
              </div>
            </Group>

            <Group gap="sm">
              <IconBuilding size={20} />
              <div>
                <Text fw={500}>Office Hours</Text>
                <Text size="sm">Mon-Fri: 9am-5pm</Text>
                <Text size="sm">Sat: 10am-2pm</Text>
              </div>
            </Group>

            <Button
              onClick={() => {
                setContactModalOpen(false);
                openInquiryModal(selectedProperty);
              }}
              mt="md"
            >
              Make Inquiry
            </Button>
          </Stack>
        )}
      </Modal>

      {/* Rent Payment Modal */}
      <Modal
        opened={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Pay Monthly Rent - ${selectedTenantProperty?.address}`}
        size="md"
        centered
      >
        <Stack gap="md">
          <LoadingOverlay visible={loading} />

          {selectedTenantProperty && (
            <Alert color="blue">
              <Group justify="space-between">
                <div>
                  <Text fw={500}>{selectedTenantProperty.address}</Text>
                  <Text size="sm" c="dimmed">
                    Monthly Rent:{" "}
                    {formatCurrency(selectedTenantProperty.monthly_rent_due)}
                  </Text>
                </div>
              </Group>
            </Alert>
          )}

          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Payment Month"
                data={MONTHS.map((m) => ({
                  value: m.value.toString(),
                  label: m.label,
                }))}
                value={paymentForm.payment_month.toString()}
                onChange={(value) =>
                  setPaymentForm({
                    ...paymentForm,
                    payment_month: parseInt(value || "1"),
                  })
                }
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Payment Year"
                value={paymentForm.payment_year}
                onChange={(value) =>
                  setPaymentForm({
                    ...paymentForm,
                    payment_year:
                      typeof value === "number"
                        ? value
                        : new Date().getFullYear(),
                  })
                }
                min={2020}
                max={2030}
              />
            </Grid.Col>
          </Grid>

          <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
            <Text size="sm">
              Late payments (after the 5th of the month) will incur a 5% late
              fee.
            </Text>
          </Alert>

          <Group justify="space-between" mt="md">
            <Button
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRentPayment} disabled={loading}>
              Proceed to Payment
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Payment History Modal */}
      <Modal
        opened={paymentHistoryModalOpen}
        onClose={() => setPaymentHistoryModalOpen(false)}
        title="Rent Payment History"
        size="xl"
        centered
      >
        <Stack gap="md">
          <LoadingOverlay visible={loading} />

          {/* Payment Summary */}
          <Paper p="md" withBorder>
            <Title order={4} mb="sm">
              Payment Summary
            </Title>
            <Grid>
              <Grid.Col span={4}>
                <Text ta="center" size="lg" fw={600} c="green">
                  {formatCurrency(paymentSummary.total_paid)}
                </Text>
                <Text ta="center" size="sm" c="dimmed">
                  Total Paid
                </Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text ta="center" size="lg" fw={600} c="yellow">
                  {formatCurrency(paymentSummary.total_pending)}
                </Text>
                <Text ta="center" size="sm" c="dimmed">
                  Pending
                </Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text ta="center" size="lg" fw={600} c="red">
                  {formatCurrency(paymentSummary.total_late_fees)}
                </Text>
                <Text ta="center" size="sm" c="dimmed">
                  Late Fees
                </Text>
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Next Payment Due */}
          {nextPaymentDue && (
            <Alert
              color={nextPaymentDue.is_overdue ? "red" : "blue"}
              icon={<IconCalendar size={16} />}
            >
              <Group justify="space-between">
                <div>
                  <Text fw={500}>
                    {nextPaymentDue.is_overdue ? "OVERDUE" : "UPCOMING"} Payment
                  </Text>
                  <Text size="sm">
                    {MONTHS[nextPaymentDue.month - 1]?.label}{" "}
                    {nextPaymentDue.year} -{" "}
                    {formatCurrency(nextPaymentDue.amount)}
                  </Text>
                </div>
                <Text size="sm" c="dimmed">
                  Due: {new Date(nextPaymentDue.due_date).toLocaleDateString()}
                </Text>
              </Group>
            </Alert>
          )}

          {/* Payment History Table */}
          <Paper p="md" withBorder>
            <Title order={4} mb="sm">
              Recent Payments
            </Title>
            {rentPayments.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No payment history available
              </Text>
            ) : (
              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Month/Year</Table.Th>
                      <Table.Th>Property</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th>Late Fee</Table.Th>
                      <Table.Th>Total</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Date Paid</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {rentPayments.map((payment) => (
                      <Table.Tr key={payment._id}>
                        <Table.Td>
                          {MONTHS[payment.payment_month - 1]?.label}{" "}
                          {payment.payment_year}
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={1}>
                            {payment.property.address}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {formatCurrency(payment.rent_amount)}
                        </Table.Td>
                        <Table.Td>
                          <Text c={payment.late_fee > 0 ? "red" : "dimmed"}>
                            {formatCurrency(payment.late_fee)}
                          </Text>
                        </Table.Td>
                        <Table.Td fw={500}>
                          {formatCurrency(payment.total_amount)}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            {getPaymentStatusIcon(payment.payment_status)}
                            <Badge
                              color={getPaymentStatusColor(
                                payment.payment_status
                              )}
                              size="sm"
                            >
                              {payment.payment_status}
                            </Badge>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          {payment.paid_at ? (
                            <Text size="sm">
                              {new Date(payment.paid_at).toLocaleDateString()}
                            </Text>
                          ) : payment.failed_at ? (
                            <Text size="sm" c="red">
                              Failed:{" "}
                              {new Date(payment.failed_at).toLocaleDateString()}
                            </Text>
                          ) : (
                            <Text size="sm" c="dimmed">
                              -
                            </Text>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
          </Paper>

          {/* Payment Statistics */}
          <Grid>
            <Grid.Col span={4}>
              <Paper p="md" withBorder ta="center">
                <Text size="lg" fw={600} c="green">
                  {paymentSummary.payments_made}
                </Text>
                <Text size="sm" c="dimmed">
                  Payments Made
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={4}>
              <Paper p="md" withBorder ta="center">
                <Text size="lg" fw={600} c="yellow">
                  {paymentSummary.payments_pending}
                </Text>
                <Text size="sm" c="dimmed">
                  Pending Payments
                </Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={4}>
              <Paper p="md" withBorder ta="center">
                <Text size="lg" fw={600} c="red">
                  {paymentSummary.payments_failed}
                </Text>
                <Text size="sm" c="dimmed">
                  Failed Payments
                </Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Stack>
      </Modal>
    </Container>
  );
};

export default BrowsePropertiesSection;
