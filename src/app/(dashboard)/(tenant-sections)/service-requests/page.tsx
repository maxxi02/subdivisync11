"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Title,
  Group,
  Button as MantineButton,
  Text,
  Badge,
  SimpleGrid,
  Modal,
  Textarea,
  LoadingOverlay,
  Notification,
  Select,
  Stack,
  Grid,
  TextInput,
  Divider,
  Box,
  Card,
  useMantineTheme,
  useMantineColorScheme,
  rgba,
} from "@mantine/core";
import {
  IconUpload,
  IconPhoto,
  IconX,
  IconCheck,
  IconClock,
  IconSettings,
  IconCash,
  IconExclamationMark,
  IconSearch,
  IconRefresh,
  IconEye,
  IconLock,
  IconBolt,
  IconHome,
  IconQuestionMark,
} from "@tabler/icons-react";
import { Dropzone } from "@mantine/dropzone";
import { useDisclosure } from "@mantine/hooks";
import axios from "axios";
import Image from "next/image";
import { Wrench } from "lucide-react";
import ServiceRequestCarousel from "./_components/serveice-carousel";

interface ServiceRequest {
  _id?: string;
  id: string;
  category: string;
  description: string;
  date: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  images?: string[];
  amount?: number;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  created_at?: string;
  updated_at?: string;
  assigned_technician?: string;
  technician_notes?: string;
  completion_notes?: string;
  estimated_cost?: number;
  final_cost?: number;
  scheduled_date?: string;
  assignment_message?: string;
  payment_status: string;
}

interface NotificationType {
  type: "success" | "error";
  message: string;
}

const categories = [
  {
    id: "plumbing",
    title: "Plumbing Issues",
    icon: Wrench,
    description: "Leaks, clogs, and pipe repairs",
    defaultDescription:
      "I have a plumbing issue that needs attention. The problem involves...",
  },
  {
    id: "security",
    title: "Security Concerns",
    icon: IconLock,
    description: "Locks, alarms, and safety issues",
    defaultDescription:
      "I have a security concern that needs to be addressed. The issue is...",
  },
  {
    id: "electrical",
    title: "Electrical Problems",
    icon: IconBolt,
    description: "Wiring, outlets, and lighting",
    defaultDescription:
      "I'm experiencing electrical problems. The issue involves...",
  },
  {
    id: "maintenance",
    title: "General Maintenance",
    icon: IconHome,
    description: "Repairs, cleaning, and upkeep",
    defaultDescription: "I need maintenance assistance. The issue requires...",
  },
  {
    id: "other",
    title: "Other Issues",
    icon: IconQuestionMark,
    description: "Any other service requests",
    defaultDescription:
      "I have an issue that needs attention. Please find details below...",
  },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low - Can wait" },
  { value: "medium", label: "Medium - Normal urgency" },
  { value: "high", label: "High - Urgent" },
];

const ServiceRequestsSection = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [issueDescription, setIssueDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationType | null>(
    null
  );
  const [opened, { open, close }] = useDisclosure(false);
  const [paymentRequest, setPaymentRequest] = useState<ServiceRequest | null>(
    null
  );
  const [priority, setPriority] = useState<string>("medium");
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewModalOpened, { open: openView, close: closeView }] =
    useDisclosure(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(
    null
  );
  const primaryTextColor = colorScheme === "dark" ? "white" : "dark";
  const secondaryTextColor =
    colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[6];
  const getDefaultShadow = () => {
    const baseShadow = "0 1px 3px";
    const opacity = colorScheme === "dark" ? 0.2 : 0.12;
    return `${baseShadow} ${rgba(theme.black, opacity)}`;
  };
  
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    const timeoutId = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timeoutId);
  };

  useEffect(() => {
    fetchServiceRequests();
  }, []);
  useEffect(() => {
    return () => {
      // Cleanup image preview URLs on unmount
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleCashPayment = async (request: ServiceRequest) => {
    if (
      !confirm(
        "Have you paid in cash? This will notify the admin for verification."
      )
    )
      return;

    try {
      setPaymentLoading(true);
      const response = await axios.post("/api/cash-payment-request", {
        requestId: request._id,
        amount: request.final_cost,
        category: request.category,
      });

      if (response.data.success) {
        // Update local state to show pending verification
        setRequests(
          requests.map((req) =>
            req.id === request.id
              ? { ...req, payment_status: "pending_verification" }
              : req
          )
        );
        showNotification(
          "success",
          "Cash payment submitted for admin verification"
        );
      } else {
        showNotification(
          "error",
          response.data.error || "Failed to submit cash payment"
        );
      }
    } catch (error) {
      console.error("Cash payment error:", error);
      showNotification("error", "Failed to submit cash payment request");
    } finally {
      setPaymentLoading(false);
    }
  };

  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/service-requests");
      console.log("API Response:", response.data); // Debug log
      if (response.data.success && response.data.serviceRequests) {
        const transformedRequests = response.data.serviceRequests.map(
          (request: ServiceRequest) => ({
            ...request,
            id: request._id || request.id, // Use _id as primary identifier
            date: request.created_at
              ? new Date(request.created_at).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : new Date().toLocaleDateString("en-PH"),
            amount: request.final_cost || request.estimated_cost,
          })
        );
        console.log("Transformed Requests:", transformedRequests); // Debug log
        setRequests(transformedRequests);
        showNotification("success", "Service requests loaded successfully");
      } else {
        showNotification(
          "error",
          response.data.error || "Failed to fetch service requests"
        );
      }
    } catch (err) {
      console.error("Fetch error:", err); // Debug log
      const errorMessage = axios.isAxiosError(err)
        ? err.message
        : "An error occurred";
      showNotification("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "green";
      case "in-progress":
        return "blue";
      case "pending":
        return "yellow";
      case "cancelled":
        return "red";
      default:
        return "gray";
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "red";
      case "medium":
        return "yellow";
      case "low":
        return "green";
      default:
        return "gray";
    }
  };
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIssueDescription("");
  };
  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    try {
      const response = await axios.post(
        "/api/service-upload-images",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (response.data.success) {
        return response.data.imageUrls || [];
      } else {
        throw new Error(response.data.error || "Failed to upload images");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    }
  };
  const handleFilesChange = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };
  const removeFile = (index: number) => {
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setFiles(files.filter((_, i) => i !== index));
    setImagePreviewUrls(imagePreviewUrls.filter((_, i) => i !== index));
  };
  const handleCancelRequest = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;
    try {
      const response = await axios.put("/api/service-requests", {
        requestId: id,
        status: "cancelled",
      });
      if (response.data.success) {
        setRequests(
          requests.map((request) =>
            request.id === id ? { ...request, status: "cancelled" } : request
          )
        );
        showNotification("success", "Service request cancelled successfully");
      } else {
        showNotification(
          "error",
          response.data.error || "Failed to cancel service request"
        );
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.message
        : "Failed to cancel service request";
      showNotification("error", errorMessage);
    }
  };
  const handlePayment = async (request: ServiceRequest) => {
    if (!request.final_cost) {
      showNotification("error", "No final cost available for payment");
      return;
    }
    try {
      setPaymentLoading(true);
      setPaymentRequest(request);
      open();
      const paymentResponse = await axios.post("/api/create-payment", {
        amount: request.final_cost,
        description: `Payment for ${request.category} service`,
        requestId: request._id,
      });
      if (paymentResponse.data.success) {
        window.location.href = paymentResponse.data.checkout_url;
      } else {
        showNotification(
          "error",
          paymentResponse.data.error || "Failed to create payment"
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      showNotification("error", "Payment failed. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };
  const submitRequest = async () => {
    if (!selectedCategory || !issueDescription.trim()) {
      showNotification(
        "error",
        "Please select a category and describe your issue"
      );
      return;
    }
    try {
      setSubmitting(true);
      let imageUrls: string[] = [];
      if (files.length > 0) {
        try {
          imageUrls = await uploadImages(files);
          console.log("Images uploaded successfully:", imageUrls);
        } catch (uploadError) {
          console.error("Failed to upload images:", uploadError);
          showNotification(
            "error",
            "Failed to upload images. Please try again."
          );
          setSubmitting(false);
          return;
        }
      }
      const categoryTitle =
        categories.find((c) => c.id === selectedCategory)?.title || "Other";
      const response = await axios.post("/api/service-requests", {
        category: categoryTitle,
        description: issueDescription,
        priority: priority,
        images: imageUrls,
      });
      if (response.data.success && response.data.serviceRequest) {
        const newRequest = {
          ...response.data.serviceRequest,
          id:
            response.data.serviceRequest._id || response.data.serviceRequest.id,
          date: response.data.serviceRequest.created_at
            ? new Date(
                response.data.serviceRequest.created_at
              ).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : new Date().toLocaleDateString("en-PH"),
        };
        setRequests([newRequest, ...requests]);
        setSelectedCategory(null);
        setIssueDescription("");
        setFiles([]);
        imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
        setImagePreviewUrls([]);
        setPriority("medium");
        showNotification("success", "Service request submitted successfully!");
      } else {
        showNotification(
          "error",
          response.data.error || "Failed to submit service request"
        );
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : "Failed to submit service request";
      showNotification("error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriorityChange = (value: string | null) => {
    setPriority(value || "medium");
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "Not set";
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const filteredRequests = requests
    .filter(
      (request) =>
        request.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  const stats = {
    pending: requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in-progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
    highPriority: requests.filter((r) => r.priority === "high").length,
  };
  return (
    <Container size="100%" py="md">
      <LoadingOverlay visible={loading} />
      {notification && (
        <Notification
          icon={
            notification.type === "success" ? (
              <IconCheck size={18} />
            ) : (
              <IconX size={18} />
            )
          }
          color={notification.type === "success" ? "green" : "red"}
          title={notification.type === "success" ? "Success" : "Error"}
          onClose={() => setNotification(null)}
          style={{ position: "fixed", top: 20, right: 20, zIndex: 1000 }}
        >
          {notification.message}
        </Notification>
      )}
      <Stack gap="xl">
        {/* Header */}
        <Card
          padding="xl"
          radius="lg"
          withBorder
          style={{
            boxShadow: getDefaultShadow(),
            backgroundColor:
              colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "white",
          }}
        >
          <Group justify="space-between" align="center">
            <Group>
              <IconSettings size={32} color="blue" />
              <Stack gap={4}>
                <Title order={1} size="h2" c={primaryTextColor}>
                  Service Requests
                </Title>
                <Text size="sm" c={primaryTextColor}>
                  Submit and track service requests
                </Text>
              </Stack>
            </Group>
            <MantineButton
              variant="filled"
              color="blue"
              onClick={fetchServiceRequests}
              leftSection={<IconRefresh size={16} />}
            >
              Refresh
            </MantineButton>
          </Group>
        </Card>
        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md">
          <Card
            padding="xl"
            radius="lg"
            withBorder
            style={{
              boxShadow: getDefaultShadow(),
              background: "linear-gradient(90deg, #fb8c00, #f57c00)",
            }}
          >
            <Group justify="space-between">
              <Stack gap={4}>
                <Text size="sm" c={primaryTextColor}>
                  Pending Requests
                </Text>
                <Text size="xl" fw={700} c={primaryTextColor}>
                  {stats.pending}
                </Text>
              </Stack>
              <Box
                style={{
                  width: 48,
                  height: 48,
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconClock size={24} color="white" />
              </Box>
            </Group>
          </Card>
          <Card
            padding="xl"
            radius="lg"
            withBorder
            style={{
              boxShadow: getDefaultShadow(),
              background: "linear-gradient(90deg, #1976d2, #1565c0)",
            }}
          >
            <Group justify="space-between">
              <Stack gap={4}>
                <Text size="sm" c={primaryTextColor}>
                  In Progress
                </Text>
                <Text size="xl" fw={700} c={primaryTextColor}>
                  {stats.inProgress}
                </Text>
              </Stack>
              <Box
                style={{
                  width: 48,
                  height: 48,
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconSettings size={24} color="white" />
              </Box>
            </Group>
          </Card>
          <Card
            padding="xl"
            radius="lg"
            withBorder
            style={{
              boxShadow: getDefaultShadow(),
              background: "linear-gradient(90deg, #2e7d32, #1b5e20)",
            }}
          >
            <Group justify="space-between">
              <Stack gap={4}>
                <Text size="sm" c={primaryTextColor}>
                  Completed
                </Text>
                <Text size="xl" fw={700} c={primaryTextColor}>
                  {stats.completed}
                </Text>
              </Stack>
              <Box
                style={{
                  width: 48,
                  height: 48,
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconCheck size={24} color="white" />
              </Box>
            </Group>
          </Card>
          <Card
            padding="xl"
            radius="lg"
            withBorder
            style={{
              boxShadow: getDefaultShadow(),
              background: "linear-gradient(90deg, #d32f2f, #b71c1c)",
            }}
          >
            <Group justify="space-between">
              <Stack gap={4}>
                <Text size="sm" c={primaryTextColor}>
                  High Priority
                </Text>
                <Text size="xl" fw={700} c={primaryTextColor}>
                  {stats.highPriority}
                </Text>
              </Stack>
              <Box
                style={{
                  width: 48,
                  height: 48,
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconExclamationMark size={24} color="white" />
              </Box>
            </Group>
          </Card>
        </SimpleGrid>
        {/* Priority Alert */}
        {stats.highPriority > 0 && (
          <Card
            padding="lg"
            radius="lg"
            withBorder
            style={{
              boxShadow: getDefaultShadow(),
              backgroundColor:
                colorScheme === "dark" ? "rgba(239, 68, 68, 0.1)" : "#fef2f2",
            }}
          >
            <Group gap={8}>
              <IconExclamationMark size={20} color="red" />
              <Stack gap={0}>
                <Text size="sm" fw={500} c="red.8">
                  High Priority Alert
                </Text>
                <Text size="sm" c="red.7">
                  You have {stats.highPriority} high-priority request
                  {stats.highPriority > 1 ? "s" : ""} submitted.
                </Text>
              </Stack>
            </Group>
          </Card>
        )}
        {/* Request Categories */}
        <Card
          padding="xl"
          radius="lg"
          withBorder
          style={{
            boxShadow: getDefaultShadow(),
            backgroundColor:
              colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "white",
          }}
        >
          <Title order={2} size="h3" mb="md" c={primaryTextColor}>
            Submit a New Request
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {categories.map((category) => (
              <Card
                key={category.id}
                padding="xl"
                radius="lg"
                withBorder
                style={{
                  boxShadow: getDefaultShadow(),
                  cursor: "pointer",
                  backgroundColor:
                    selectedCategory === category.id
                      ? colorScheme === "dark"
                        ? "rgba(59, 130, 246, 0.2)"
                        : "#e3f2fd"
                      : colorScheme === "dark"
                        ? "rgba(255, 255, 255, 0.05)"
                        : "white",
                  border:
                    selectedCategory === category.id
                      ? "2px solid #3b82f6"
                      : "1px solid #e5e7eb",
                }}
                onClick={() => handleCategorySelect(category.id)}
              >
                <Stack align="center" gap="sm">
                  <category.icon
                    size={32}
                    color={selectedCategory === category.id ? "blue" : "gray"}
                  />
                  <Text
                    fw={500}
                    c={
                      selectedCategory === category.id
                        ? "blue"
                        : primaryTextColor
                    }
                  >
                    {category.title}
                  </Text>
                  <Text size="sm" c={primaryTextColor} ta="center">
                    {category.description}
                  </Text>
                  {selectedCategory === category.id && (
                    <Text size="xs" c="blue" fw={500}>
                      Selected
                    </Text>
                  )}
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Card>
        {selectedCategory && (
          <>
            {/* Issue Description Input */}
            <Card
              padding="xl"
              radius="lg"
              withBorder
              style={{
                boxShadow: getDefaultShadow(),
                backgroundColor:
                  colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "white",
              }}
            >
              <Title order={2} size="h3" mb="md" c={primaryTextColor}>
                Describe Your Issue
              </Title>
              <Textarea
                placeholder="Please describe the issue in detail..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.currentTarget.value)}
                autosize
                minRows={3}
                maxRows={6}
              />
            </Card>
            {/* Priority Selection */}
            <Card
              padding="xl"
              radius="lg"
              withBorder
              style={{
                boxShadow: getDefaultShadow(),
                backgroundColor:
                  colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "white",
              }}
            >
              <Title order={2} size="h3" mb="md" c={primaryTextColor}>
                Select Priority
              </Title>
              <Select
                label="Priority Level"
                placeholder="Select priority"
                data={PRIORITY_OPTIONS}
                value={priority}
                onChange={handlePriorityChange}
                searchable={false}
                clearable={false}
              />
            </Card>
            {/* Image Upload */}
            <Card
              padding="xl"
              radius="lg"
              withBorder
              style={{
                boxShadow: getDefaultShadow(),
                backgroundColor:
                  colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "white",
              }}
            >
              <Title order={2} size="h3" mb="md" c={primaryTextColor}>
                Attach Photos (Optional)
              </Title>
              <Dropzone
                onDrop={handleFilesChange}
                onReject={() => showNotification("error", "Rejected files")}
                accept={["image/*"]}
                multiple
              >
                <Group
                  justify="center"
                  gap="xl"
                  mih={120}
                  style={{ pointerEvents: "none" }}
                >
                  <Dropzone.Accept>
                    <IconUpload size={52} color="blue" stroke={1.5} />
                  </Dropzone.Accept>
                  <Dropzone.Reject>
                    <IconX size={52} color="red" stroke={1.5} />
                  </Dropzone.Reject>
                  <Dropzone.Idle>
                    <IconPhoto size={52} color="gray" stroke={1.5} />
                  </Dropzone.Idle>
                  <Stack gap={4} align="center">
                    <Text size="sm" c={primaryTextColor}>
                      Drag images here or click to select files
                    </Text>
                    <Text size="xs" c={primaryTextColor}>
                      Attach photos of the issue to help our technicians
                    </Text>
                  </Stack>
                </Group>
              </Dropzone>
              {files.length > 0 && (
                <Stack mt="md" gap="md">
                  <Text size="sm" fw={500} c={primaryTextColor}>
                    Uploaded files ({files.length}):
                  </Text>
                  <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
                    {files.map((file, index) => (
                      <Box key={index} style={{ position: "relative" }}>
                        <Card
                          padding="xs"
                          radius="lg"
                          withBorder
                          style={{ boxShadow: getDefaultShadow() }}
                        >
                          <Image
                            src={imagePreviewUrls[index]}
                            alt={file.name}
                            width={300}
                            height={200}
                            style={{
                              width: "100%",
                              height: "96px",
                              objectFit: "cover",
                            }}
                          />
                          <Text
                            size="xs"
                            lineClamp={1}
                            mt="xs"
                            px="xs"
                            c={primaryTextColor}
                            title={file.name}
                          >
                            {file.name}
                          </Text>
                        </Card>
                        <MantineButton
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            backgroundColor: "#dc2626",
                            padding: 4,
                            borderRadius: "50%",
                          }}
                          size="xs"
                          onClick={() => removeFile(index)}
                        >
                          <IconX size={12} />
                        </MantineButton>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Stack>
              )}
            </Card>
            {/* Submit/Cancel Buttons */}
            <Group justify="center" mt="md">
              <MantineButton
                variant="filled"
                color="blue"
                onClick={submitRequest}
                loading={submitting}
                disabled={submitting}
                leftSection={<IconCheck size={16} />}
              >
                {submitting
                  ? "Submitting..."
                  : files.length > 0
                    ? `Submit Request (${files.length} images)`
                    : "Submit Request"}
              </MantineButton>
              <MantineButton
                variant="outline"
                color="gray"
                onClick={() => {
                  setSelectedCategory(null);
                  setFiles([]);
                  setImagePreviewUrls([]);
                  setIssueDescription("");
                  setPriority("medium");
                }}
                disabled={submitting}
              >
                Cancel
              </MantineButton>
            </Group>
          </>
        )}
        {/* Search Bar */}
        <Card
          padding="xl"
          radius="lg"
          withBorder
          style={{
            boxShadow: getDefaultShadow(),
            backgroundColor:
              colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "white",
          }}
        >
          <Group align="center" style={{ position: "relative" }}>
            <IconSearch
              size={16}
              color="gray"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <TextInput
              placeholder="Search requests by tenant, category, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              style={{ paddingLeft: 36 }}
            />
          </Group>
        </Card>
        {/* Request History Table */}
        <Card
          padding="xl"
          radius="lg"
          withBorder
          style={{
            boxShadow: getDefaultShadow(),
            backgroundColor:
              colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "white",
          }}
        >
          <Title order={2} size="h3" mb="md" c={primaryTextColor}>
            Request History
          </Title>
          {/* Desktop View - Table */}
          <Box display={{ base: "none", md: "block" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead
                  style={{
                    backgroundColor:
                      colorScheme === "dark"
                        ? theme.colors.dark[8]
                        : theme.colors.gray[0],
                    borderBottom: `1px solid ${
                      colorScheme === "dark"
                        ? theme.colors.dark[5]
                        : theme.colors.gray[3]
                    }`,
                  }}
                >
                  <tr>
                    {[
                      "Category",
                      "Description",
                      "Priority",
                      "Status",
                      "Date",
                      "Actions",
                    ].map((header) => (
                      <th
                        key={header}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: secondaryTextColor,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: "32px",
                          textAlign: "center",
                          color: secondaryTextColor,
                        }}
                      >
                        No service requests found
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request) => (
                      <tr
                        key={request.id}
                        style={{
                          borderBottom: `1px solid ${
                            colorScheme === "dark"
                              ? theme.colors.dark[5]
                              : theme.colors.gray[2]
                          }`,
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            colorScheme === "dark"
                              ? theme.colors.dark[6]
                              : theme.colors.gray[0])
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <Text size="sm" fw={500} c={primaryTextColor}>
                            {request.category}
                          </Text>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <Text size="sm" lineClamp={2} c={primaryTextColor}>
                            {request.description}
                          </Text>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <Badge
                            color={getPriorityColor(request.priority)}
                            variant="light"
                            size="sm"
                            radius="md"
                          >
                            {request.priority.toUpperCase()}
                          </Badge>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <Stack gap={4}>
                            <Badge
                              color={getStatusColor(request.status)}
                              variant="light"
                              size="sm"
                              radius="md"
                            >
                              {request.status.toUpperCase()}
                            </Badge>
                            {request.payment_status === "paid" ? (
                              <Badge color="green" variant="light" size="sm">
                                Paid
                              </Badge>
                            ) : request.payment_status ===
                              "pending_verification" ? (
                              <Badge color="orange" variant="light" size="sm">
                                Pending Verification
                              </Badge>
                            ) : null}
                          </Stack>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <Text size="sm" c={primaryTextColor}>
                            {request.date}
                          </Text>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <Group gap="xs">
                            <MantineButton
                              size="xs"
                              variant="outline"
                              color="gray"
                              leftSection={<IconEye size={12} />}
                              onClick={() => {
                                setSelectedRequest(request);
                                openView();
                              }}
                            >
                              View
                            </MantineButton>
                            {request.status === "completed" &&
                              request.final_cost &&
                              request.payment_status !== "paid" &&
                              request.payment_status !==
                                "pending_verification" && (
                                <Group gap="xs">
                                  <MantineButton
                                    size="xs"
                                    variant="filled"
                                    color="blue"
                                    onClick={() => handlePayment(request)}
                                    loading={paymentLoading}
                                    disabled={paymentLoading}
                                    leftSection={<IconCash size={14} />}
                                  >
                                    Pay Online
                                  </MantineButton>
                                  <MantineButton
                                    size="xs"
                                    variant="outline"
                                    color="green"
                                    onClick={() => handleCashPayment(request)}
                                    loading={paymentLoading}
                                    disabled={paymentLoading}
                                    leftSection={<IconCash size={14} />}
                                  >
                                    Pay Cash
                                  </MantineButton>
                                </Group>
                              )}
                            {request.status === "completed" &&
                              (request.payment_status === "paid" ||
                                request.payment_status ===
                                  "pending_verification") && (
                                <Badge
                                  color={
                                    request.payment_status === "paid"
                                      ? "green"
                                      : "orange"
                                  }
                                  variant="light"
                                  size="sm"
                                >
                                  {request.payment_status === "paid"
                                    ? "Paid"
                                    : "Pending Verification"}
                                </Badge>
                              )}
                            {request.status === "pending" && (
                              <MantineButton
                                size="xs"
                                variant="outline"
                                color="red"
                                onClick={() => handleCancelRequest(request.id)}
                              >
                                Cancel
                              </MantineButton>
                            )}
                          </Group>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Box>
          {/* Mobile View - Cards */}
          <Stack display={{ base: "block", md: "none" }} gap="md">
            {filteredRequests.length === 0 ? (
              <Text ta="center" c={primaryTextColor} py="xl">
                No service requests found
              </Text>
            ) : (
              filteredRequests.map((request) => (
                <Card
                  key={request.id}
                  padding="md"
                  radius="lg"
                  withBorder
                  style={{ boxShadow: getDefaultShadow() }}
                >
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text fw={500} size="sm" c={primaryTextColor}>
                        {request.category}
                      </Text>
                      <Badge
                        color={getStatusColor(request.status)}
                        variant="light"
                        size="sm"
                      >
                        {request.status.toUpperCase()}
                      </Badge>
                    </Group>
                    <Text size="sm" lineClamp={2} c={primaryTextColor}>
                      {request.description}
                    </Text>
                    <Group gap="xs">
                      <Badge
                        color={getPriorityColor(request.priority)}
                        variant="light"
                        size="sm"
                      >
                        {request.priority.toUpperCase()}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {request.date}
                      </Text>
                    </Group>
                    <Group gap="xs" mt="xs">
                      <MantineButton
                        size="xs"
                        variant="outline"
                        color="gray"
                        leftSection={<IconEye size={12} />}
                        onClick={() => {
                          setSelectedRequest(request);
                          openView();
                        }}
                        fullWidth
                      >
                        View
                      </MantineButton>
                      {request.status === "completed" &&
                        request.final_cost &&
                        (request.payment_status !== "paid" ? (
                          <Group gap="xs">
                            <MantineButton
                              size="xs"
                              variant="filled"
                              color="blue"
                              onClick={() => handlePayment(request)}
                              loading={paymentLoading}
                              disabled={paymentLoading}
                              leftSection={<IconCash size={14} />}
                            >
                              Pay Online
                            </MantineButton>
                            <MantineButton
                              size="xs"
                              variant="outline"
                              color="green"
                              onClick={() => handleCashPayment(request)}
                              leftSection={<IconCash size={14} />}
                            >
                              Pay Cash
                            </MantineButton>
                          </Group>
                        ) : (
                          <Badge color="green" variant="light" size="sm">
                            Paid
                          </Badge>
                        ))}
                      {request.status === "pending" && (
                        <MantineButton
                          size="xs"
                          variant="outline"
                          color="red"
                          onClick={() => handleCancelRequest(request.id)}
                          fullWidth
                        >
                          Cancel
                        </MantineButton>
                      )}
                    </Group>
                  </Stack>
                </Card>
              ))
            )}
          </Stack>
        </Card>
        {/* View Details Modal */}
        <Modal
          opened={viewModalOpened}
          onClose={closeView}
          title={
            <Title order={2} c={primaryTextColor}>
              Service Request Details
            </Title>
          }
          centered
          size="lg"
        >
          <Stack gap="md">
            <Card
              padding="lg"
              radius="lg"
              withBorder
              style={{
                boxShadow: getDefaultShadow(),
                backgroundColor:
                  colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "#f9fafb",
              }}
            >
              <Text size="sm" fw={500} mb="sm" c={primaryTextColor}>
                Request Overview
              </Text>
              <Grid>
                <Grid.Col span={6}>
                  <Text size="xs" c={primaryTextColor}>
                    Category
                  </Text>
                  <Text size="sm" c={primaryTextColor}>
                    {selectedRequest?.category}
                  </Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={primaryTextColor}>
                    Created Date
                  </Text>
                  <Text size="sm" c={primaryTextColor}>
                    {formatDate(selectedRequest?.created_at)}
                  </Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={primaryTextColor}>
                    Priority
                  </Text>
                  <Badge
                    color={getPriorityColor(selectedRequest?.priority || "low")}
                    variant="light"
                    size="sm"
                    radius="md"
                  >
                    {(selectedRequest?.priority || "low").toUpperCase()}
                  </Badge>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={primaryTextColor}>
                    Status
                  </Text>
                  <Badge
                    color={getStatusColor(selectedRequest?.status || "pending")}
                    variant="light"
                    size="sm"
                    radius="md"
                  >
                    {(selectedRequest?.status || "pending").toUpperCase()}
                  </Badge>
                </Grid.Col>
                {selectedRequest?.scheduled_date && (
                  <Grid.Col span={6}>
                    <Text size="xs" c={primaryTextColor}>
                      Scheduled Date
                    </Text>
                    <Text size="sm" c={primaryTextColor}>
                      {formatDate(selectedRequest.scheduled_date)}
                    </Text>
                  </Grid.Col>
                )}
                {selectedRequest?.assigned_technician && (
                  <Grid.Col span={6}>
                    <Text size="xs" c={primaryTextColor}>
                      Assigned Technician
                    </Text>
                    <Text size="sm" c={primaryTextColor}>
                      {selectedRequest.assigned_technician}
                    </Text>
                  </Grid.Col>
                )}
              </Grid>
            </Card>
            <Divider />
            <Box>
              <Text size="sm" fw={500} mb="sm" c={primaryTextColor}>
                Issue Description
              </Text>
              <Text size="sm" c={primaryTextColor}>
                {selectedRequest?.description}
              </Text>
            </Box>
            {selectedRequest?.images && selectedRequest.images.length > 0 && (
              <Box>
                <Text size="sm" fw={500} mb="sm" c={primaryTextColor}>
                  Attached Images
                </Text>
                <ServiceRequestCarousel
                  images={selectedRequest.images}
                  alt={`${selectedRequest.category} issue`}
                  showIndicators={true}
                  autoPlay={true}
                  autoPlayInterval={4000}
                />
              </Box>
            )}
            {selectedRequest?.assignment_message && (
              <Box>
                <Text size="sm" fw={500} mb="sm" c={primaryTextColor}>
                  Assignment Message
                </Text>
                <Text size="sm" c={primaryTextColor}>
                  {selectedRequest.assignment_message}
                </Text>
              </Box>
            )}
            {selectedRequest?.technician_notes && (
              <Box>
                <Text size="sm" fw={500} mb="sm" c={primaryTextColor}>
                  Technician Notes
                </Text>
                <Text size="sm" c={primaryTextColor}>
                  {selectedRequest.technician_notes}
                </Text>
              </Box>
            )}
            {selectedRequest?.estimated_cost && (
              <Box>
                <Text size="sm" fw={500} mb="sm" c={primaryTextColor}>
                  Estimated Cost
                </Text>
                <Text size="sm" c="green.6">
                  {formatCurrency(selectedRequest.estimated_cost)}
                </Text>
              </Box>
            )}
            {selectedRequest?.completion_notes && (
              <Box>
                <Text size="sm" fw={500} mb="sm" c={primaryTextColor}>
                  Completion Notes
                </Text>
                <Text size="sm" c={primaryTextColor}>
                  {selectedRequest.completion_notes}
                </Text>
              </Box>
            )}
            {selectedRequest?.final_cost && (
              <Box>
                <Text size="sm" fw={500} mb="sm" c={primaryTextColor}>
                  Final Cost
                </Text>
                <Text size="sm" c="green.6">
                  {formatCurrency(selectedRequest.final_cost)}
                </Text>
              </Box>
            )}
            {selectedRequest?.payment_status && (
              <Box>
                <Text size="sm" fw={500} mb="sm" c={primaryTextColor}>
                  Payment Status
                </Text>
                <Badge
                  color={
                    selectedRequest.payment_status === "paid"
                      ? "green"
                      : selectedRequest.payment_status === "failed"
                        ? "red"
                        : "yellow"
                  }
                  variant="light"
                  size="sm"
                  radius="md"
                >
                  {selectedRequest.payment_status.toUpperCase()}
                </Badge>
              </Box>
            )}
            <Group justify="right">
              <MantineButton variant="outline" color="gray" onClick={closeView}>
                Close
              </MantineButton>
            </Group>
          </Stack>
        </Modal>
        {/* Payment Modal */}
        <Modal
          opened={opened}
          onClose={close}
          title={
            <Title order={2} c={primaryTextColor}>
              Processing Payment
            </Title>
          }
          centered
        >
          <LoadingOverlay visible={paymentLoading} />
          <Stack>
            {paymentLoading ? (
              <Text ta="center" c={primaryTextColor}>
                Creating payment session...
              </Text>
            ) : (
              <>
                <Text c={primaryTextColor}>
                  Payment will be processed through PayMongo.
                </Text>
                {paymentRequest && (
                  <Card
                    padding="lg"
                    radius="lg"
                    withBorder
                    style={{
                      boxShadow: getDefaultShadow(),
                      backgroundColor:
                        colorScheme === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "#f9fafb",
                    }}
                  >
                    <Text size="sm" fw={500} mb="sm" c={primaryTextColor}>
                      Request Details
                    </Text>
                    <Grid>
                      <Grid.Col span={6}>
                        <Text size="xs" c={primaryTextColor}>
                          Category
                        </Text>
                        <Text size="sm" c={primaryTextColor}>
                          {paymentRequest.category}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Text size="xs" c={primaryTextColor}>
                          Amount
                        </Text>
                        <Text size="sm" c="green.6">
                          {formatCurrency(paymentRequest.amount)}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={12}>
                        <Text size="xs" c={primaryTextColor}>
                          Description
                        </Text>
                        <Text size="sm" lineClamp={2} c={primaryTextColor}>
                          {paymentRequest.description}
                        </Text>
                      </Grid.Col>
                    </Grid>
                  </Card>
                )}
              </>
            )}
            <Group justify="right">
              <MantineButton
                variant="outline"
                color="gray"
                onClick={close}
                disabled={paymentLoading}
              >
                Cancel
              </MantineButton>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
};

export default ServiceRequestsSection;
