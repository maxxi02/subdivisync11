"use client";
import { useState, useEffect } from "react";
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
  IconBolt,
  IconCash,
  IconCheck,
  IconClock,
  IconEye,
  IconExclamationMark,
  IconHome,
  IconLock,
  IconPhoto,
  IconQuestionMark,
  IconReceipt,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { ThemeIcon } from "@mantine/core";
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
    receipt_url?: string; // Add this line
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
      setPayingRequestId(null);
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
  // Track which request is being paid
  const [payingRequestId, setPayingRequestId] = useState<string | null>(null);
  const [paymentModalOpened, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false);
  const [requestToPay, setRequestToPay] = useState<ServiceRequest | null>(null);

  // Show payment confirmation modal first
  const showPaymentModal = (request: ServiceRequest) => {
    if (!request.final_cost) {
      showNotification("error", "No final cost available for payment");
      return;
    }
    setRequestToPay(request);
    openPaymentModal();
  };

  const handlePayment = async (request: ServiceRequest) => {
    if (!request.final_cost) {
      showNotification("error", "No final cost available for payment");
      return;
    }
    
    try {
      closePaymentModal();
      setPayingRequestId(request.id);
      setPaymentLoading(true);
      
      // Create payment intent
      const paymentResponse = await axios.post("/api/create-payment", {
        amount: request.final_cost,
        description: `Payment for ${request.category} service`,
        requestId: request._id,
      });
      
      if (!paymentResponse.data.success) {
        showNotification(
          "error",
          paymentResponse.data.error || "Failed to create payment"
        );
        return;
      }
      
      // Store payment info in localStorage for cross-tab communication
      const paymentInfo = {
        paymentIntentId: paymentResponse.data.payment_intent_id,
        requestId: request._id,
        timestamp: Date.now(),
      };
      localStorage.setItem('pending_payment', JSON.stringify(paymentInfo));
      
      // Open PayMongo checkout in a new tab
      const paymentWindow = window.open(
        paymentResponse.data.checkout_url,
        '_blank',
        'noopener,noreferrer'
      );
      
      // Monitor if the window was blocked
      if (!paymentWindow) {
        localStorage.removeItem('pending_payment');
        showNotification(
          "error",
          "Please allow popups to proceed with payment"
        );
        return;
      }
      
      // Show notification
      showNotification(
        "success",
        "Payment window opened. Complete your payment in the new tab, then return here."
      );
      
      // Set up polling to check payment status when user returns to this tab
      const checkPaymentStatus = async () => {
        try {
          const storedPayment = localStorage.getItem('pending_payment');
          if (!storedPayment) {
            // Payment was completed and cleared
            return;
          }
          
          const paymentInfo = JSON.parse(storedPayment);
          
          // Verify payment status
          const verifyResponse = await axios.post("/api/create-payment/verify-payment", {
            paymentIntentId: paymentInfo.paymentIntentId,
            requestId: paymentInfo.requestId,
          });
          
          if (verifyResponse.data.success && verifyResponse.data.localStatus === "paid") {
            // Payment successful!
            localStorage.removeItem('pending_payment');
            showNotification("success", "Payment completed successfully!");
            fetchServiceRequests(); // Refresh the list
            return true; // Stop polling
          }
          
          return false; // Continue polling
        } catch (error) {
          console.error("Error checking payment status:", error);
          return false;
        }
      };
      
      // Poll every 3 seconds when tab has focus
      const pollInterval = setInterval(async () => {
        if (document.hasFocus()) {
          const isComplete = await checkPaymentStatus();
          if (isComplete) {
            clearInterval(pollInterval);
          }
        }
      }, 3000);
      
      // Also check when window regains focus
      const focusHandler = async () => {
        const isComplete = await checkPaymentStatus();
        if (isComplete) {
          window.removeEventListener('focus', focusHandler);
        }
      };
      window.addEventListener('focus', focusHandler);
      
      // Clear interval and listener after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        window.removeEventListener('focus', focusHandler);
        localStorage.removeItem('pending_payment');
      }, 10 * 60 * 1000);
      
    } catch (error) {
      console.error("Payment error:", error);
      localStorage.removeItem('pending_payment');
      showNotification("error", "Payment failed. Please try again.");
    } finally {
      setPaymentLoading(false);
      setPayingRequestId(null);
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
    unpaidHighPriority: requests.filter((r) => 
      r.priority === "high" && 
      r.payment_status !== "paid" && 
      (r.status === "completed" || r.status === "in-progress")
    ).length,
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
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
          <Card
            padding="md"
            radius="md"
            withBorder
            style={{
              backgroundColor: "white",
              boxShadow: getDefaultShadow(),
            }}
          >
            <Group align="center" gap="sm" wrap="wrap" style={{ width: "100%" }}>
              <ThemeIcon
                variant="filled"
                color="yellow"
                size="lg"
                radius="md"
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                }}
              >
                <IconClock size={18} />
              </ThemeIcon>
              <Stack gap={2} style={{ flex: 1, minWidth: "100px" }}>
                <Text
                  c="dimmed"
                  size="xs"
                  tt="uppercase"
                  fw={600}
                  lts={0.5}
                  style={{
                    wordBreak: "break-word",
                    lineHeight: 1.3,
                  }}
                >
                  Pending Requests
                </Text>
                <Text fw={700} size="lg" c="yellow.6" lh={1.2}>
                  {stats.pending}
                </Text>
              </Stack>
            </Group>
          </Card>
          <Card
            padding="md"
            radius="md"
            withBorder
            style={{
              backgroundColor: "white",
              boxShadow: getDefaultShadow(),
            }}
          >
            <Group align="center" gap="sm" wrap="wrap" style={{ width: "100%" }}>
              <ThemeIcon
                variant="filled"
                color="blue"
                size="lg"
                radius="md"
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                }}
              >
                <IconSettings size={18} />
              </ThemeIcon>
              <Stack gap={2} style={{ flex: 1, minWidth: "100px" }}>
                <Text
                  c="dimmed"
                  size="xs"
                  tt="uppercase"
                  fw={600}
                  lts={0.5}
                  style={{
                    wordBreak: "break-word",
                    lineHeight: 1.3,
                  }}
                >
                  In Progress
                </Text>
                <Text fw={700} size="lg" c="blue.6" lh={1.2}>
                  {stats.inProgress}
                </Text>
              </Stack>
            </Group>
          </Card>
          <Card
            padding="md"
            radius="md"
            withBorder
            style={{
              backgroundColor: "white",
              boxShadow: getDefaultShadow(),
            }}
          >
            <Group align="center" gap="sm" wrap="wrap" style={{ width: "100%" }}>
              <ThemeIcon
                variant="filled"
                color="green"
                size="lg"
                radius="md"
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                }}
              >
                <IconCheck size={18} />
              </ThemeIcon>
              <Stack gap={2} style={{ flex: 1, minWidth: "100px" }}>
                <Text
                  c="dimmed"
                  size="xs"
                  tt="uppercase"
                  fw={600}
                  lts={0.5}
                  style={{
                    wordBreak: "break-word",
                    lineHeight: 1.3,
                  }}
                >
                  Completed
                </Text>
                <Text fw={700} size="lg" c="green.6" lh={1.2}>
                  {stats.completed}
                </Text>
              </Stack>
            </Group>
          </Card>
          <Card
            padding="md"
            radius="md"
            withBorder
            style={{
              backgroundColor: "white",
              boxShadow: getDefaultShadow(),
            }}
          >
            <Group align="center" gap="sm" wrap="wrap" style={{ width: "100%" }}>
              <ThemeIcon
                variant="filled"
                color="red"
                size="lg"
                radius="md"
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                }}
              >
                <IconExclamationMark size={18} />
              </ThemeIcon>
              <Stack gap={2} style={{ flex: 1, minWidth: "100px" }}>
                <Text
                  c="dimmed"
                  size="xs"
                  tt="uppercase"
                  fw={600}
                  lts={0.5}
                  style={{
                    wordBreak: "break-word",
                    lineHeight: 1.3,
                  }}
                >
                  High Priority
                </Text>
                <Text fw={700} size="lg" c="red.6" lh={1.2}>
                  {stats.highPriority}
                </Text>
              </Stack>
            </Group>
          </Card>
        </SimpleGrid>
        {/* Priority Alert - Only show for unpaid high priority requests */}
        {stats.unpaidHighPriority > 0 && (
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
                  You have {stats.unpaidHighPriority} unpaid high-priority request
                  {stats.unpaidHighPriority > 1 ? "s" : ""} that require payment.
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
        {/* Request History with Integrated Search Bar */}
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
          <Group justify="space-between" align="center" mb="md">
            <Title order={2} size="h3" c={primaryTextColor}>
              Request History
            </Title>
            <div style={{ width: '300px', position: 'relative' }}>
              <TextInput
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                leftSection={<IconSearch size={16} />}
                radius="md"
                styles={(theme) => ({
                  input: {
                    '&:focus': {
                      borderColor: theme.colors.blue[5],
                      boxShadow: `0 0 0 2px ${theme.colors.blue[1]}`,
                    },
                  },
                })}
              />
            </div>
          </Group>
          <Box display={{ base: "none", md: "block" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead
                  style={{
                    backgroundColor:
                      colorScheme === "dark"
                        ? theme.colors.dark[8]
                        : theme.colors.blue[0],
                    borderBottom: `1px solid ${
                      colorScheme === "dark"
                        ? theme.colors.dark[5]
                        : theme.colors.blue[3]
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
                          padding: "14px 16px",
                          textAlign: "left",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: colorScheme === "dark" ? theme.colors.blue[3] : theme.colors.blue[8],
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
                          transition: "all 0.2s",
                          borderRadius: "8px",
                          marginBottom: "8px",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            colorScheme === "dark"
                              ? theme.colors.dark[6]
                              : theme.colors.blue[0];
                          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <td style={{ padding: "16px" }}>
                          <Text size="sm" fw={600} c={primaryTextColor}>
                            {request.category}
                          </Text>
                        </td>
                        <td style={{ padding: "16px", maxWidth: "250px" }}>
                          <Text size="sm" lineClamp={2} c={primaryTextColor} style={{ wordBreak: "break-word" }}>
                            {request.description}
                          </Text>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <Badge
                            color={getPriorityColor(request.priority)}
                            variant="filled"
                            size="sm"
                            radius="md"
                            style={{ padding: "6px 10px", fontWeight: 600 }}
                          >
                            {request.priority.toUpperCase()}
                          </Badge>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div>
                            <Group gap={8} mb={request.receipt_url ? 8 : 0}>
                              <Badge
                                color={getStatusColor(request.status)}
                                variant="filled"
                                size="sm"
                                radius="md"
                                style={{ padding: "6px 10px", fontWeight: 600 }}
                              >
                                {request.status.toUpperCase()}
                              </Badge>
                              {request.payment_status === "paid" && (
                                <Badge
                                  color="green"
                                  variant="filled"
                                  size="sm"
                                  style={{ padding: "6px 10px", fontWeight: 600 }}
                                >
                                  PAID
                                </Badge>
                              )}
                              {request.payment_status === "pending_verification" && (
                                <Badge
                                  color="orange"
                                  variant="filled"
                                  size="sm"
                                  style={{ padding: "6px 10px", fontWeight: 600 }}
                                >
                                  PENDING VERIFICATION
                                </Badge>
                              )}
                            </Group>
                          </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <Text size="sm" fw={500} c={primaryTextColor}>
                            {request.date}
                          </Text>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <Group gap="sm">
                            <MantineButton
                              size="xs"
                              variant="light"
                              color="blue"
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
                              (request.payment_status !== "paid" && request.payment_status !== "pending_verification" ? (
                                <Group gap="xs">
                                  <MantineButton
                                    size="xs"
                                    variant="gradient"
                                    gradient={{ from: "blue", to: "cyan" }}
                                    onClick={() => showPaymentModal(request)}
                                    loading={paymentLoading && payingRequestId === request.id}
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
                                    loading={false}
                                    disabled={paymentLoading}
                                    leftSection={<IconCash size={14} />}
                                  >
                                    Pay Cash
                                  </MantineButton>
                                </Group>
                              ) : (
                                <Stack gap="xs">
                                  <Badge
                                    color={request.payment_status === "paid" ? "green" : "orange"}
                                    variant="light"
                                    size="sm"
                                  >
                                    {request.payment_status === "paid" ? "Paid" : "Pending Verification"}
                                  </Badge>
                                  {/* Removed View Receipt button from actions column */}
                                </Stack>
                              ))}
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
                        (request.payment_status !== "paid" && request.payment_status !== "pending_verification" ? (
                          <Group gap="xs">
                            <MantineButton
                              size="xs"
                              variant="filled"
                              color="blue"
                              onClick={() => showPaymentModal(request)}
                              loading={paymentLoading && payingRequestId === request.id}
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
                          <Stack gap="xs">
                            <Badge
                              color={request.payment_status === "paid" ? "green" : "orange"}
                              variant="light"
                              size="sm"
                            >
                              {request.payment_status === "paid" ? "Paid" : "Pending Verification"}
                            </Badge>
                            {/* Removed View Receipt button from mobile view actions */}
                          </Stack>
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
            <Group justify="space-between" style={{ width: '100%' }}>
              <Title order={2} size="h3">Service Request Details</Title>
            </Group>
          }
          size="lg"
          styles={{
            header: { 
              padding: '20px 24px',
              marginBottom: 10,
              borderBottom: `1px solid ${colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.gray[3]}`,
              backgroundColor: colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[0],
            },
            title: { 
              width: '100%',
              margin: 0,
            },
            close: { 
              color: colorScheme === "dark" ? theme.colors.gray[5] : theme.colors.dark[4],
              '&:hover': {
                backgroundColor: colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[1],
              },
              width: 34,
              height: 34,
              borderRadius: theme.radius.md,
            },
            body: { padding: '10px 24px 24px' },
            overlay: { backdropFilter: 'blur(3px)' },
            root: { zIndex: 201 },
          }}
          centered
        >
          {selectedRequest && (
            <Stack gap="lg">
              {/* Request Overview Card */}
              <Card withBorder radius="md" padding="md" style={{ backgroundColor: colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[0] }}>
                <Title order={4} mb="md">Request Overview</Title>
                <SimpleGrid cols={2} spacing="md">
                  <div>
                    <Text size="sm" fw={600} c={secondaryTextColor} mb={4}>
                      Category
                    </Text>
                    <Text size="md" fw={600} c={primaryTextColor}>
                      {selectedRequest.category}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" fw={600} c={secondaryTextColor} mb={4}>
                      Created Date
                    </Text>
                    <Text size="md" fw={600} c={primaryTextColor}>
                      {selectedRequest.date}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" fw={600} c={secondaryTextColor} mb={4}>
                      Priority
                    </Text>
                    <Badge
                      color={getPriorityColor(selectedRequest.priority)}
                      variant="filled"
                      size="md"
                      radius="md"
                      style={{ padding: '6px 10px' }}
                    >
                      {selectedRequest.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Text size="sm" fw={600} c={secondaryTextColor} mb={4}>
                      Status
                    </Text>
                    <Group gap={8}>
                      <Badge
                        color={getStatusColor(selectedRequest.status)}
                        variant="filled"
                        size="md"
                        radius="md"
                        style={{ padding: '6px 10px' }}
                      >
                        {selectedRequest.status.toUpperCase()}
                      </Badge>
                      {selectedRequest.payment_status === "paid" && (
                        <Badge
                          color="green"
                          variant="filled"
                          size="md"
                          radius="md"
                          style={{ padding: '6px 10px' }}
                        >
                          PAID
                        </Badge>
                      )}
                    </Group>
                  </div>
                </SimpleGrid>
              </Card>

              {/* Issue Description */}
              <div>
                <Text size="md" fw={600} c={secondaryTextColor} mb={4}>
                  Issue Description
                </Text>
                <Text size="md" c={primaryTextColor} style={{ lineHeight: 1.6, padding: '10px', backgroundColor: colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[0], borderRadius: '8px' }}>
                  {selectedRequest.description}
                </Text>
              </div>

              {selectedRequest.images && selectedRequest.images.length > 0 && (
                <div>
                  <Text size="md" fw={600} c={secondaryTextColor} mb={4}>
                    Images
                  </Text>
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                    {selectedRequest.images.map((image, index) => (
                      <Card key={index} p="xs" withBorder radius="md" style={{ cursor: 'pointer' }}>
                        <Image
                          src={image}
                          alt={`Image ${index + 1}`}
                          width={300}
                          height={180}
                          style={{ objectFit: "cover", borderRadius: theme.radius.md, height: 180, width: "100%" }}
                          onClick={() => window.open(image, "_blank")}
                        />
                      </Card>
                    ))}
                  </SimpleGrid>
                </div>
              )}

              {selectedRequest.assignment_message && (
                <div>
                  <Text size="md" fw={600} c={secondaryTextColor} mb={4}>
                    Assignment Message
                  </Text>
                  <Text size="md" c={primaryTextColor} style={{ lineHeight: 1.6, padding: '10px', backgroundColor: colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[0], borderRadius: '8px' }}>
                    {selectedRequest.assignment_message}
                  </Text>
                </div>
              )}

              {selectedRequest.status === "completed" && (
                <Card withBorder radius="md" padding="md" style={{ backgroundColor: colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[0] }}>
                  <Title order={4} mb="md">Completion Details</Title>
                  <SimpleGrid cols={2} spacing="md" mb="md">
                    <div>
                      <Text size="sm" fw={600} c={secondaryTextColor} mb={4}>
                        Estimated Cost
                      </Text>
                      <Text size="md" fw={600} c={primaryTextColor}>
                        ₱{selectedRequest.estimated_cost?.toFixed(2) || "0.00"}
                      </Text>
                    </div>
                    <div>
                      <Text size="sm" fw={600} c={secondaryTextColor} mb={4}>
                        Final Cost
                      </Text>
                      <Text size="md" fw={600} c={primaryTextColor}>
                        ₱{selectedRequest.final_cost?.toFixed(2) || "0.00"}
                      </Text>
                    </div>
                  </SimpleGrid>

                  {selectedRequest.completion_notes && (
                    <div style={{ marginBottom: theme.spacing.md }}>
                      <Text size="sm" fw={600} c={secondaryTextColor} mb={4}>
                        Completion Notes
                      </Text>
                      <Text size="md" c={primaryTextColor} style={{ lineHeight: 1.6, padding: '10px', backgroundColor: colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[1], borderRadius: '8px' }}>
                        {selectedRequest.completion_notes}
                      </Text>
                    </div>
                  )}

                  {selectedRequest.payment_status && (
                    <div>
                      <Text size="sm" fw={600} c={secondaryTextColor} mb={4}>
                        Payment Status
                      </Text>
                      <Badge
                        color={
                          selectedRequest.payment_status === "paid"
                            ? "green"
                            : selectedRequest.payment_status === "pending_verification"
                              ? "orange"
                              : "yellow"
                        }
                        variant="filled"
                        size="md"
                        radius="md"
                        style={{ padding: '6px 10px' }}
                      >
                        {selectedRequest.payment_status === "pending_verification"
                          ? "PENDING VERIFICATION"
                          : selectedRequest.payment_status.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </Card>
              )}
            </Stack>
          )}
          <Group justify="flex-end" mt="xl" gap="md">
            {selectedRequest?.receipt_url && (
              <MantineButton
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
                onClick={() => window.open(selectedRequest.receipt_url, "_blank")}
                leftSection={<IconReceipt size={16} />}
                size="md"
                radius="md"
              >
                View Receipt
              </MantineButton>
            )}
            <MantineButton 
              variant="filled" 
              color="gray" 
              onClick={closeView}
              size="md"
              radius="md"
            >
              Close
            </MantineButton>
          </Group>
        </Modal>
        {/* Payment Confirmation Modal */}
        <Modal
          opened={paymentModalOpened}
          onClose={closePaymentModal}
          title={<Title order={3}>Confirm Payment</Title>}
          size="md"
          centered
          styles={{
            header: { 
              padding: '20px 24px',
              marginBottom: 10,
              borderBottom: `1px solid ${colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.gray[3]}`,
              backgroundColor: colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[0],
            },
            title: { 
              width: '100%',
              margin: 0,
            },
            close: { 
              color: colorScheme === "dark" ? theme.colors.gray[5] : theme.colors.dark[4],
              '&:hover': {
                backgroundColor: colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[1],
              },
              width: 34,
              height: 34,
              borderRadius: theme.radius.md,
            },
            body: { padding: '10px 24px 24px' },
            overlay: { backdropFilter: 'blur(3px)' },
          }}
        >
          {requestToPay && (
            <Stack gap="md">
              <Text size="md" fw={500}>
                You are about to make a payment for the following service request:
              </Text>
              
              <Card withBorder radius="md" padding="md" bg={colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[0]}>
                <Group justify="space-between" mb="xs">
                  <Text fw={600}>{requestToPay.category}</Text>
                  <Badge color={getStatusColor(requestToPay.status)} variant="filled">
                    {requestToPay.status.toUpperCase()}
                  </Badge>
                </Group>
                
                <Text size="sm" color="dimmed" mb="md" lineClamp={2}>
                  {requestToPay.description}
                </Text>
                
                <Group justify="space-between">
                  <Text fw={700} size="lg" color={colorScheme === "dark" ? theme.colors.blue[4] : theme.colors.blue[7]}>
                    ₱{requestToPay.final_cost?.toFixed(2)}
                  </Text>
                  <Text size="sm" color="dimmed">
                    {requestToPay.date}
                  </Text>
                </Group>
              </Card>
              
              <Text size="sm" c="dimmed">
                You will be redirected to PayMongo to complete your payment securely.
              </Text>
              
              <Group justify="flex-end" mt="md">
                <MantineButton variant="light" color="gray" onClick={closePaymentModal}>
                  Cancel
                </MantineButton>
                <MantineButton 
                  variant="gradient" 
                  gradient={{ from: 'blue', to: 'cyan' }}
                  onClick={() => handlePayment(requestToPay)}
                  loading={paymentLoading && payingRequestId === requestToPay.id}
                >
                  Proceed to Payment
                </MantineButton>
              </Group>
            </Stack>
          )}
        </Modal>
        
        {/* Old Payment Modal - Keeping for reference */}
        <Modal
          opened={opened}
          onClose={close}
          title="Processing Payment"
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
