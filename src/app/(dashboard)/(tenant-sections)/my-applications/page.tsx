"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Title,
  Text,
  Table,
  Badge,
  Group,
  Stack,
  Button,
  Modal,
  Loader,
  Center,
  SimpleGrid,
  Card,
} from "@mantine/core";
import {
  Calendar,
  DollarSign,
  Eye,
  MapPin,
  Clock,
  CreditCard,
  User,
  Square,
  Bed,
  Bath,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { getServerSession } from "@/better-auth/action";
import { Session } from "@/better-auth/auth-types";
import PropertyCarousel from "./_components/property-carousel";

// Types
interface Inquiry {
  fullName: string;
  email: string;
  phone: string;
  reason: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

interface Property {
  _id: string;
  title: string;
  location: string;
  size: string;
  price: number;
  type: "residential-lot" | "commercial" | "house-and-lot" | "condo";
  status: string;
  images?: string[];
  amenities: string[];
  description?: string;
  sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  created_by: string;
  created_at: string;
  updated_at?: string;
  owner?: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    paymentStatus: "paid" | "partial" | "pending";
    paymentMethod?: string;
  };
  inquiries?: Inquiry[];
}

interface InquiryWithProperty extends Inquiry {
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number;
  propertyLocation: string;
  propertyStatus: string;
  propertyType: string;
  propertyImages?: string[];
  sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
}

interface PaymentPlan {
  propertyPrice: number;
  downPayment: number;
  monthlyPayment: number;
  interestRate: number;
  leaseDuration: number;
  totalAmount: number;
  startDate: string;
  status: "active" | "inactive" | "completed";
  currentMonth: number;
  remainingBalance: number;
  nextPaymentDate: string;
}

const MyApplication = () => {
  const [inquiries, setInquiries] = useState<InquiryWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] =
    useState<InquiryWithProperty | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [paymentPlanData, setPaymentPlanData] = useState<PaymentPlan | null>(
    null
  );
  const [isFetchingPayment, setIsFetchingPayment] = useState(false);

  // Validate inquiry data
  const validateInquiry = (inquiry: InquiryWithProperty) => {
    const errors: string[] = [];

    if (!inquiry.fullName || inquiry.fullName.trim().length < 2) {
      errors.push("Full name is invalid (must be at least 2 characters)");
    } else if (!/^[a-zA-Z\s-]+$/.test(inquiry.fullName)) {
      errors.push("Full name contains invalid characters");
    }

    if (!inquiry.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email)) {
      errors.push("Email address is invalid");
    }

    if (
      inquiry.phone &&
      !/^\+?\d{10,12}$/.test(inquiry.phone.replace(/\s/g, ""))
    ) {
      errors.push("Phone number is invalid (must be 10-12 digits)");
    }

    if (!inquiry.reason || inquiry.reason.trim().length < 10) {
      errors.push("Reason for application is too short");
    }

    return errors;
  };

  // Fetch session
  useEffect(() => {
    const getSession = async () => {
      try {
        const session = await getServerSession();
        setSession(session);
        toast.success("Session loaded successfully");
      } catch (error) {
        toast.error("Failed to load session. Please try again.");
      }
    };
    getSession();
  }, []);

  // Fetch payment plan
  const fetchPaymentPlan = async (propertyId: string, tenantEmail: string) => {
    try {
      setIsFetchingPayment(true);
      const response = await fetch(
        `/api/payments/create?propertyId=${propertyId}&tenantEmail=${tenantEmail}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        setPaymentPlanData(data.paymentPlan);
        toast.success("Payment plan loaded successfully");
      } else {
        throw new Error(data.error || "Failed to fetch payment plan");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fetch payment plan. Please try again."
      );
    } finally {
      setIsFetchingPayment(false);
    }
  };

  // Fetch all properties with inquiries and filter for current user
  const fetchInquiries = useCallback(async () => {
    if (!session?.user.email) return;

    try {
      setLoading(true);
      const response = await fetch("/api/properties?myInquiries=true");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        const userInquiries: InquiryWithProperty[] = [];
        data.properties.forEach((property: Property) => {
          if (property.inquiries && property.inquiries.length > 0) {
            property.inquiries.forEach((inquiry: Inquiry) => {
              if (inquiry.email === session.user.email) {
                userInquiries.push({
                  ...inquiry,
                  propertyId: property._id,
                  propertyTitle: property.title,
                  propertyPrice: property.price,
                  propertyLocation: property.location,
                  propertyStatus: property.status,
                  propertyType: property.type,
                  propertyImages: property.images,
                  sqft: property.sqft,
                  bedrooms: property.bedrooms,
                  bathrooms: property.bathrooms,
                });
              }
            });
          }
        });
        setInquiries(userInquiries);
        toast.success("Applications loaded successfully");
      } else {
        throw new Error(data.error || "Failed to fetch applications");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fetch applications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchInquiries();
    }
  }, [session, fetchInquiries]);

  const getStatusBadge = (status: string, propertyStatus?: string) => {
    if (propertyStatus === "LEASED") {
      return "blue";
    }
    switch (status) {
      case "pending":
        return "yellow";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      default:
        return "gray";
    }
  };

  if (loading || !session) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ height: 400 }}>
          <Stack align="center">
            <Loader size="lg" />
            <Text c="gray.6">Loading your applications...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Stack gap="xs">
          <Title order={1} size="h2" fw={600} c="gray.9">
            My Applications
          </Title>
          <Text c="gray.6" size="md" lh={1.5}>
            View your submitted property inquiries
          </Text>
        </Stack>

        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" align="center">
              <Stack gap="xs">
                <Text size="sm" c="gray.6" fw={500}>
                  Total Applications
                </Text>
                <Text size="xl" fw={700} c="gray.9">
                  {inquiries.length}
                </Text>
              </Stack>
              <Center className="h-12 w-12 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </Center>
            </Group>
          </Card>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" align="center">
              <Stack gap="xs">
                <Text size="sm" c="gray.6" fw={500}>
                  Pending
                </Text>
                <Text size="xl" fw={700} c="yellow.6">
                  {
                    inquiries.filter(
                      (inq) =>
                        inq.status === "pending" &&
                        inq.propertyStatus !== "LEASED"
                    ).length
                  }
                </Text>
              </Stack>
              <Center className="h-12 w-12 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </Center>
            </Group>
          </Card>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" align="center">
              <Stack gap="xs">
                <Text size="sm" c="gray.6" fw={500}>
                  Approved/Leased
                </Text>
                <Text size="xl" fw={700} c="green.6">
                  {
                    inquiries.filter(
                      (inq) =>
                        inq.status === "approved" ||
                        inq.propertyStatus === "LEASED"
                    ).length
                  }
                </Text>
              </Stack>
              <Center className="h-12 w-12 bg-green-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-green-600" />
              </Center>
            </Group>
          </Card>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" align="center">
              <Stack gap="xs">
                <Text size="sm" c="gray.6" fw={500}>
                  Rejected
                </Text>
                <Text size="xl" fw={700} c="red.6">
                  {inquiries.filter((inq) => inq.status === "rejected").length}
                </Text>
              </Stack>
              <Center className="h-12 w-12 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </Center>
            </Group>
          </Card>
        </SimpleGrid>

        {/* Applications Table */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Property</Table.Th>
                <Table.Th>Application Date</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {inquiries.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={4} ta="center" py="xl">
                    <Text c="gray.6">No applications found.</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                inquiries.map((inquiry, index) => (
                  <Table.Tr
                    key={`${inquiry.propertyId}-${inquiry.email}-${index}`}
                  >
                    <Table.Td>
                      <Stack gap="xs">
                        <Text fw={500} c="gray.9">
                          {inquiry.propertyTitle}
                        </Text>
                        <Group gap="xs">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <Text size="sm" c="gray.6">
                            {inquiry.propertyLocation}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <Text size="sm" c="gray.6">
                            {new Intl.NumberFormat("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            }).format(inquiry.propertyPrice)}
                          </Text>
                        </Group>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <Text size="sm" c="gray.9">
                          {new Date(inquiry.submittedAt).toLocaleDateString()}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getStatusBadge(
                          inquiry.status,
                          inquiry.propertyStatus
                        )}
                      >
                        {inquiry.propertyStatus === "LEASED"
                          ? "Leased"
                          : inquiry.status.charAt(0).toUpperCase() +
                            inquiry.status.slice(1)}
                      </Badge>
                      {inquiry.status === "rejected" &&
                        inquiry.rejectionReason && (
                          <Text size="xs" c="red.6" mt="xs">
                            <Group gap="xs">
                              <AlertCircle className="h-3 w-3" />
                              {inquiry.rejectionReason}
                            </Group>
                          </Text>
                        )}
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        color="blue"
                        onClick={async () => {
                          const errors = validateInquiry(inquiry);
                          if (errors.length > 0) {
                            toast.error(errors[0]);
                            return;
                          }
                          setSelectedInquiry(inquiry);
                          setShowViewModal(true);
                          toast.success("Viewing application details");
                          if (
                            inquiry.propertyStatus === "LEASED" ||
                            inquiry.status === "approved"
                          ) {
                            await fetchPaymentPlan(
                              inquiry.propertyId,
                              inquiry.email
                            );
                          }
                        }}
                        disabled={isFetchingPayment}
                        leftSection={<Eye className="h-4 w-4" />}
                      >
                        View
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Card>

        {/* View Details Modal */}
        <Modal
          opened={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedInquiry(null);
            setPaymentPlanData(null);
          }}
          size="xl"
          title={<Title order={2}>Application Details</Title>}
          centered
        >
          {selectedInquiry && (
            <Stack gap="md">
              {/* Status Badge */}
              <Badge
                color={getStatusBadge(
                  selectedInquiry.status,
                  selectedInquiry.propertyStatus
                )}
                size="lg"
              >
                {selectedInquiry.propertyStatus === "LEASED"
                  ? "Leased"
                  : selectedInquiry.status.charAt(0).toUpperCase() +
                    selectedInquiry.status.slice(1)}
              </Badge>

              {/* Property Images */}
              {selectedInquiry.propertyImages &&
                selectedInquiry.propertyImages.length > 0 && (
                  <PropertyCarousel
                    images={selectedInquiry.propertyImages}
                    alt={selectedInquiry.propertyTitle}
                    showIndicators={true}
                    autoPlay={true}
                    autoPlayInterval={4000}
                  />
                )}

              {/* Applicant Information */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group gap="xs" mb="md">
                  <Image
                    className="h-10 w-10 rounded-full object-cover"
                    src={session?.user.image || "/placeholder.svg"}
                    alt="User Image"
                    width={40}
                    height={40}
                  />
                  <Text fw={600} c="gray.8">
                    Applicant Information
                  </Text>
                </Group>
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <Stack gap="xs">
                    <Text size="sm" c="gray.6">
                      Full Name
                    </Text>
                    <Text fw={500} c="gray.9">
                      {validateInquiry(selectedInquiry).length === 0 &&
                      selectedInquiry.fullName
                        ? selectedInquiry.fullName
                        : "Not provided"}
                    </Text>
                  </Stack>
                  <Stack gap="xs">
                    <Text size="sm" c="gray.6">
                      Email Address
                    </Text>
                    <Text fw={500} c="gray.9">
                      {validateInquiry(selectedInquiry).length === 0 &&
                      selectedInquiry.email
                        ? selectedInquiry.email
                        : "Not provided"}
                    </Text>
                  </Stack>
                  <Stack gap="xs">
                    <Text size="sm" c="gray.6">
                      Phone Number
                    </Text>
                    <Text fw={500} c="gray.9">
                      {validateInquiry(selectedInquiry).length === 0 &&
                      selectedInquiry.phone
                        ? selectedInquiry.phone
                        : "Not provided"}
                    </Text>
                  </Stack>
                  <Stack gap="xs">
                    <Text size="sm" c="gray.6">
                      Application Date
                    </Text>
                    <Text fw={500} c="gray.9">
                      {new Date(selectedInquiry.submittedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </Text>
                  </Stack>
                </SimpleGrid>
              </Card>

              {/* Property Information */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group gap="xs" mb="md">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <Text fw={600} c="gray.8">
                    Property Information
                  </Text>
                </Group>
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <Stack gap="xs">
                    <Text size="sm" c="gray.6">
                      Property Title
                    </Text>
                    <Text fw={500} c="gray.9">
                      {selectedInquiry.propertyTitle}
                    </Text>
                  </Stack>
                  <Stack gap="xs">
                    <Text size="sm" c="gray.6">
                      Location
                    </Text>
                    <Text fw={500} c="gray.9">
                      {selectedInquiry.propertyLocation}
                    </Text>
                  </Stack>
                  <Stack gap="xs">
                    <Text size="sm" c="gray.6">
                      Price
                    </Text>
                    <Text fw={500} c="gray.9">
                      {new Intl.NumberFormat("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      }).format(selectedInquiry.propertyPrice)}
                    </Text>
                  </Stack>
                  <Stack gap="xs">
                    <Text size="sm" c="gray.6">
                      Type
                    </Text>
                    <Text fw={500} c="gray.9">
                      {selectedInquiry.propertyType
                        .replace("-", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </Stack>
                  {(selectedInquiry.propertyType === "house-and-lot" ||
                    selectedInquiry.propertyType === "condo") && (
                    <>
                      {(selectedInquiry.bedrooms ?? 0) > 0 && (
                        <Stack gap="xs">
                          <Text size="sm" c="gray.6">
                            Bedrooms
                          </Text>
                          <Text fw={500} c="gray.9">
                            {selectedInquiry.bedrooms} Bedroom
                            {selectedInquiry.bedrooms !== 1 ? "s" : ""}
                          </Text>
                        </Stack>
                      )}
                      {(selectedInquiry.bathrooms ?? 0) > 0 && (
                        <Stack gap="xs">
                          <Text size="sm" c="gray.6">
                            Bathrooms
                          </Text>
                          <Text fw={500} c="gray.9">
                            {selectedInquiry.bathrooms} Bathroom
                            {selectedInquiry.bathrooms !== 1 ? "s" : ""}
                          </Text>
                        </Stack>
                      )}
                      {(selectedInquiry.sqft ?? 0) > 0 && (
                        <Stack gap="xs">
                          <Text size="sm" c="gray.6">
                            Square Footage
                          </Text>
                          <Text fw={500} c="gray.9">
                            {selectedInquiry.sqft} sq ft
                          </Text>
                        </Stack>
                      )}
                    </>
                  )}
                </SimpleGrid>
              </Card>

              {/* Application Reason */}
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text fw={600} c="gray.8" mb="md">
                  Reason for Application
                </Text>
                <Text c="gray.7">
                  {validateInquiry(selectedInquiry).length === 0 &&
                  selectedInquiry.reason
                    ? selectedInquiry.reason
                    : "Not provided"}
                </Text>
              </Card>

              {/* Rejection Reason (if rejected) */}
              {selectedInquiry.status === "rejected" &&
                selectedInquiry.rejectionReason && (
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group gap="xs" mb="md">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <Text fw={600} c="red.8">
                        Rejection Reason
                      </Text>
                    </Group>
                    <Text c="red.7">{selectedInquiry.rejectionReason}</Text>
                  </Card>
                )}

              {/* Approval Status (if approved) */}
              {selectedInquiry.status === "approved" && (
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group gap="xs" mb="md">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <Text fw={600} c="green.8">
                      Application Status
                    </Text>
                  </Group>
                  <Text c="green.7">
                    This application has been approved and a payment plan has
                    been created.
                  </Text>
                </Card>
              )}

              {/* Payment Plan Details (if leased or approved) */}
              {(selectedInquiry.propertyStatus === "LEASED" ||
                selectedInquiry.status === "approved") &&
                paymentPlanData && (
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group gap="xs" mb="md">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      <Text fw={600} c="green.8">
                        Payment Plan Details
                      </Text>
                    </Group>
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                      <Stack gap="xs">
                        <Text size="sm" c="green.6">
                          Property Price
                        </Text>
                        <Text fw={500} c="green.9">
                          {new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }).format(paymentPlanData.propertyPrice)}
                        </Text>
                      </Stack>
                      <Stack gap="xs">
                        <Text size="sm" c="green.6">
                          Down Payment
                        </Text>
                        <Text fw={500} c="green.9">
                          {new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }).format(paymentPlanData.downPayment)}
                        </Text>
                      </Stack>
                      <Stack gap="xs">
                        <Text size="sm" c="green.6">
                          Monthly Payment
                        </Text>
                        <Text fw={500} c="green.9">
                          {new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }).format(paymentPlanData.monthlyPayment)}
                        </Text>
                      </Stack>
                      <Stack gap="xs">
                        <Text size="sm" c="green.6">
                          Interest Rate
                        </Text>
                        <Text fw={500} c="green.9">
                          {paymentPlanData.interestRate}% per annum
                        </Text>
                      </Stack>
                      <Stack gap="xs">
                        <Text size="sm" c="green.6">
                          Lease Duration
                        </Text>
                        <Text fw={500} c="green.9">
                          {paymentPlanData.leaseDuration} months
                          <Text size="sm" c="green.6" component="span">
                            {" "}
                            ({Math.floor(
                              paymentPlanData.leaseDuration / 12
                            )}{" "}
                            years {paymentPlanData.leaseDuration % 12} months)
                          </Text>
                        </Text>
                      </Stack>
                      <Stack gap="xs">
                        <Text size="sm" c="green.6">
                          Total Amount
                        </Text>
                        <Text fw={500} c="green.9">
                          {new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }).format(paymentPlanData.totalAmount)}
                        </Text>
                      </Stack>
                      <Stack gap="xs">
                        <Text size="sm" c="green.6">
                          Start Date
                        </Text>
                        <Text fw={500} c="green.9">
                          {new Date(
                            paymentPlanData.startDate
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </Text>
                      </Stack>
                      <Stack gap="xs">
                        <Text size="sm" c="green.6">
                          Plan Status
                        </Text>
                        <Badge
                          color={
                            paymentPlanData.status === "active"
                              ? "green"
                              : "gray"
                          }
                          size="sm"
                        >
                          {paymentPlanData.status.charAt(0).toUpperCase() +
                            paymentPlanData.status.slice(1)}
                        </Badge>
                      </Stack>
                      <Stack gap="xs">
                        <Text size="sm" c="green.6">
                          Current Month
                        </Text>
                        <Text fw={500} c="green.9">
                          {paymentPlanData.currentMonth} of{" "}
                          {paymentPlanData.leaseDuration}
                        </Text>
                      </Stack>
                      <Stack gap="xs">
                        <Text size="sm" c="green.6">
                          Remaining Balance
                        </Text>
                        <Text fw={500} c="green.9">
                          {new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }).format(paymentPlanData.remainingBalance)}
                        </Text>
                      </Stack>
                      <Stack gap="xs">
                        <Text size="sm" c="green.6">
                          Next Payment Date
                        </Text>
                        <Text fw={500} c="green.9">
                          {new Date(
                            paymentPlanData.nextPaymentDate
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </Text>
                      </Stack>
                      <Stack gap="xs">
                        <Text size="sm" c="green.6">
                          Total Interest
                        </Text>
                        <Text fw={500} c="orange.6">
                          {new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }).format(
                            paymentPlanData.totalAmount -
                              paymentPlanData.propertyPrice
                          )}
                        </Text>
                      </Stack>
                    </SimpleGrid>
                  </Card>
                )}

              {/* Property Status (if leased) */}
              {selectedInquiry.propertyStatus === "LEASED" && (
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group gap="xs" mb="md">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <Text fw={600} c="blue.8">
                      Property Status
                    </Text>
                  </Group>
                  <Text c="blue.7">
                    This property has been leased and a payment plan is active.
                  </Text>
                </Card>
              )}

              <Button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedInquiry(null);
                  setPaymentPlanData(null);
                }}
                variant="outline"
                color="gray"
                fullWidth
              >
                Close
              </Button>
            </Stack>
          )}
        </Modal>
      </Stack>
    </Container>
  );
};

export default MyApplication;
