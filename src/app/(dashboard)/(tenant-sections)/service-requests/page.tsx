"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Title,
  Group,
  Button,
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
  Image as MantineImage,
  Box,
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
} from "@tabler/icons-react";
import { Dropzone } from "@mantine/dropzone";
import { useDisclosure } from "@mantine/hooks";
import axios from "axios";
import Image from "next/image";

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

const categories = [
  {
    id: "plumbing",
    title: "Plumbing Issues",
    icon: "🔧",
    description: "Leaks, clogs, and pipe repairs",
    defaultDescription:
      "I have a plumbing issue that needs attention. The problem involves...",
  },
  {
    id: "security",
    title: "Security Concerns",
    icon: "🔒",
    description: "Locks, alarms, and safety issues",
    defaultDescription:
      "I have a security concern that needs to be addressed. The issue is...",
  },
  {
    id: "electrical",
    title: "Electrical Problems",
    icon: "⚡",
    description: "Wiring, outlets, and lighting",
    defaultDescription:
      "I'm experiencing electrical problems. The issue involves...",
  },
  {
    id: "maintenance",
    title: "General Maintenance",
    icon: "🏠",
    description: "Repairs, cleaning, and upkeep",
    defaultDescription: "I need maintenance assistance. The issue requires...",
  },
  {
    id: "other",
    title: "Other Issues",
    icon: "❓",
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [issueDescription, setIssueDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/service-requests");
      if (response.data.success && response.data.serviceRequests) {
        const transformedRequests = response.data.serviceRequests.map(
          (request: ServiceRequest) => ({
            ...request,
            id: request._id || request.id,
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
        setRequests(transformedRequests);
      } else {
        showNotification(
          response.data.error || "Failed to fetch service requests",
          true
        );
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.message
        : "An error occurred";
      showNotification(errorMessage, true);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, isError: boolean = false) => {
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
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      setIssueDescription(category.defaultDescription);
    }
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

  // const handleDeleteRequest = async (id: string) => {
  //   if (!confirm("Are you sure you want to delete this request?")) return;
  //   try {
  //     const response = await axios.delete(
  //       `/api/service-requests?requestId=${id}`
  //     );
  //     if (response.data.success) {
  //       setRequests(requests.filter((request) => request.id !== id));
  //       showNotification("Service request deleted successfully");
  //     } else {
  //       showNotification(
  //         response.data.error || "Failed to delete service request",
  //         true
  //       );
  //     }
  //   } catch (err) {
  //     const errorMessage = axios.isAxiosError(err)
  //       ? err.message
  //       : "Failed to delete service request";
  //     showNotification(errorMessage, true);
  //   }
  // };

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
        showNotification("Service request cancelled successfully");
      } else {
        showNotification(
          response.data.error || "Failed to cancel service request",
          true
        );
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.message
        : "Failed to cancel service request";
      showNotification(errorMessage, true);
    }
  };

  const handlePayment = async (request: ServiceRequest) => {
    if (!request.final_cost) {
      showNotification("No final cost available for payment", true);
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
          paymentResponse.data.error || "Failed to create payment",
          true
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      showNotification("Payment failed. Please try again.", true);
    } finally {
      setPaymentLoading(false);
    }
  };

  const submitRequest = async () => {
    if (!selectedCategory || !issueDescription.trim()) {
      showNotification(
        "Please select a category and describe your issue",
        true
      );
      return;
    }
    try {
      setSubmitting(true);
      let imageUrls: string[] = [];
      if (files.length > 0) {
        showNotification(`Uploading ${files.length} image(s)...`);
        imageUrls = await uploadImages(files);
        showNotification(`${files.length} image(s) uploaded successfully`);
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
        setImagePreviewUrls([]);
        setPriority("medium");
        showNotification("Service request submitted successfully!");
      } else {
        showNotification(
          response.data.error || "Failed to submit service request",
          true
        );
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.message
        : "Failed to submit service request";
      showNotification(errorMessage, true);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriorityChange = useCallback((value: string | null) => {
    setPriority(value || "medium");
  }, []);

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
    <div className="min-h-screen bg-gray-50 p-6">
      <Container size="xl" py="md">
        <LoadingOverlay visible={loading} />
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Group justify="space-between" align="center">
              <Group>
                <IconSettings size={32} color="var(--mantine-color-blue-6)" />
                <Stack gap={4}>
                  <Title order={1} size="h2">
                    Service Requests
                  </Title>
                  <Text size="sm" c="dimmed">
                    Submit and track service requests
                  </Text>
                </Stack>
              </Group>
              <Button
                variant="filled"
                color="blue"
                onClick={fetchServiceRequests}
                leftSection={<IconRefresh size={16} />}
              >
                Refresh
              </Button>
            </Group>
          </div>

          {/* Stats Cards */}
          <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-sm p-6 text-white">
              <Group justify="space-between">
                <Stack gap={4}>
                  <Text size="sm" c="orange.1">
                    Pending Requests
                  </Text>
                  <Text size="xl" fw={700}>
                    {stats.pending}
                  </Text>
                </Stack>
                <div className="h-12 w-12 bg-orange-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                  <IconClock size={24} />
                </div>
              </Group>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
              <Group justify="space-between">
                <Stack gap={4}>
                  <Text size="sm" c="blue.1">
                    In Progress
                  </Text>
                  <Text size="xl" fw={700}>
                    {stats.inProgress}
                  </Text>
                </Stack>
                <div className="h-12 w-12 bg-blue-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                  <IconSettings size={24} />
                </div>
              </Group>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
              <Group justify="space-between">
                <Stack gap={4}>
                  <Text size="sm" c="green.1">
                    Completed
                  </Text>
                  <Text size="xl" fw={700}>
                    {stats.completed}
                  </Text>
                </Stack>
                <div className="h-12 w-12 bg-green-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                  <IconCheck size={24} />
                </div>
              </Group>
            </div>
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-sm p-6 text-white">
              <Group justify="space-between">
                <Stack gap={4}>
                  <Text size="sm" c="red.1">
                    High Priority
                  </Text>
                  <Text size="xl" fw={700}>
                    {stats.highPriority}
                  </Text>
                </Stack>
                <div className="h-12 w-12 bg-red-400 bg-opacity-30 rounded-lg flex items-center justify-center">
                  <IconExclamationMark size={24} />
                </div>
              </Group>
            </div>
          </SimpleGrid>

          {/* Priority Alert */}
          {stats.highPriority > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <Group gap={8}>
                <IconExclamationMark
                  size={20}
                  color="var(--mantine-color-red-6)"
                />
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
            </div>
          )}

          {/* Request Categories */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Title order={2} size="h3" mb="md">
              Submit a New Request
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`rounded-lg shadow-sm p-6 cursor-pointer transition-all ${
                    selectedCategory === category.id
                      ? "border-2 border-blue-500 bg-blue-50"
                      : "border border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <Stack align="center" gap="sm">
                    <Text className="text-2xl">{category.icon}</Text>
                    <Text
                      fw={500}
                      c={selectedCategory === category.id ? "blue" : "gray.9"}
                    >
                      {category.title}
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      {category.description}
                    </Text>
                    {selectedCategory === category.id && (
                      <Text size="xs" c="blue" fw={500}>
                        Selected
                      </Text>
                    )}
                  </Stack>
                </div>
              ))}
            </SimpleGrid>
          </div>

          {selectedCategory && (
            <>
              {/* Issue Description Input */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <Title order={2} size="h3" mb="md">
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
              </div>

              {/* Priority Selection */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <Title order={2} size="h3" mb="md">
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
              </div>

              {/* Image Upload */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <Title order={2} size="h3" mb="md">
                  Attach Photos (Optional)
                </Title>
                <Dropzone
                  onDrop={handleFilesChange}
                  onReject={() => console.log("rejected files")}
                  maxSize={5 * 1024 ** 2}
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
                      <IconUpload
                        size={52}
                        color="var(--mantine-color-blue-6)"
                        stroke={1.5}
                      />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <IconX
                        size={52}
                        color="var(--mantine-color-red-6)"
                        stroke={1.5}
                      />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <IconPhoto
                        size={52}
                        color="var(--mantine-color-dimmed)"
                        stroke={1.5}
                      />
                    </Dropzone.Idle>
                    <Stack gap={4} align="center">
                      <Text size="sm" inline>
                        Drag images here or click to select files
                      </Text>
                      <Text size="xs" c="dimmed" inline>
                        Attach photos of the issue to help our technicians
                      </Text>
                    </Stack>
                  </Group>
                </Dropzone>
                {files.length > 0 && (
                  <Stack mt="md" gap="md">
                    <Text size="sm" fw={500}>
                      Uploaded files ({files.length}):
                    </Text>
                    <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
                      {files.map((file, index) => (
                        <div key={index} className="relative">
                          <div className="rounded-lg border border-gray-200 overflow-hidden">
                            <Image
                              src={imagePreviewUrls[index]}
                              alt={file.name}
                              width={300}
                              height={200}
                              className="w-full h-24 object-cover"
                            />
                            <Text
                              size="xs"
                              lineClamp={1}
                              mt="xs"
                              px="xs"
                              title={file.name}
                            >
                              {file.name}
                            </Text>
                          </div>
                          <button
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                            onClick={() => removeFile(index)}
                          >
                            <IconX size={12} />
                          </button>
                        </div>
                      ))}
                    </SimpleGrid>
                  </Stack>
                )}
              </div>

              {/* Submit/Cancel Buttons */}
              <Group justify="center" mt="md">
                <Button
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
                </Button>
                <Button
                  variant="outline"
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
                </Button>
              </Group>
            </>
          )}

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <TextInput
                placeholder="Search requests by tenant, category, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Request History Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <Title order={2} size="h3" p="md">
              Request History
            </Title>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No service requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Text size="sm">{request.category}</Text>
                      </td>
                      <td className="px-6 py-4">
                        <Text size="sm" lineClamp={2}>
                          {request.description}
                        </Text>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Text size="sm">{request.date}</Text>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          color={getPriorityColor(request.priority)}
                          variant="filled"
                        >
                          {request.priority.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          color={getStatusColor(request.status)}
                          variant="filled"
                        >
                          {request.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Group gap="xs">
                          <Button
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
                          </Button>
                          {request.status === "completed" &&
                            request.final_cost &&
                            (request.payment_status !== "paid" ? (
                              <Button
                                size="xs"
                                variant="filled"
                                color="blue"
                                onClick={() => handlePayment(request)}
                                loading={paymentLoading}
                                disabled={paymentLoading}
                                leftSection={<IconCash size={14} />}
                              >
                                Pay ({formatCurrency(request.final_cost)})
                              </Button>
                            ) : (
                              <Badge color="green" variant="filled" size="sm">
                                Paid
                              </Badge>
                            ))}
                          {request.status === "pending" && (
                            <Button
                              size="xs"
                              variant="outline"
                              color="red"
                              onClick={() => handleCancelRequest(request.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </Group>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* View Details Modal */}
          <Modal
            opened={viewModalOpened}
            onClose={closeView}
            title="Service Request Details"
            centered
            size="lg"
          >
            <Stack gap="md">
              <Box className="bg-gray-50 rounded-lg p-4">
                <Text size="sm" fw={500} mb="sm">
                  Request Overview
                </Text>
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">
                      Category
                    </Text>
                    <Text size="sm">{selectedRequest?.category}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">
                      Created Date
                    </Text>
                    <Text size="sm">
                      {formatDate(selectedRequest?.created_at)}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">
                      Priority
                    </Text>
                    <Badge
                      color={getPriorityColor(
                        selectedRequest?.priority || "low"
                      )}
                      variant="filled"
                    >
                      {(selectedRequest?.priority || "low").toUpperCase()}
                    </Badge>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">
                      Status
                    </Text>
                    <Badge
                      color={getStatusColor(
                        selectedRequest?.status || "pending"
                      )}
                      variant="filled"
                    >
                      {selectedRequest?.status?.toUpperCase()}
                    </Badge>
                  </Grid.Col>
                  {selectedRequest?.scheduled_date && (
                    <Grid.Col span={6}>
                      <Text size="xs" c="dimmed">
                        Scheduled Date
                      </Text>
                      <Text size="sm">
                        {formatDate(selectedRequest.scheduled_date)}
                      </Text>
                    </Grid.Col>
                  )}
                  {selectedRequest?.assigned_technician && (
                    <Grid.Col span={6}>
                      <Text size="xs" c="dimmed">
                        Assigned Technician
                      </Text>
                      <Text size="sm">
                        {selectedRequest.assigned_technician}
                      </Text>
                    </Grid.Col>
                  )}
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Text size="sm" fw={500} mb="sm">
                  Issue Description
                </Text>
                <Text size="sm">{selectedRequest?.description}</Text>
              </Box>

              {selectedRequest?.images && selectedRequest.images.length > 0 && (
                <Box>
                  <Text size="sm" fw={500} mb="sm">
                    Attached Images
                  </Text>
                  <SimpleGrid cols={2} spacing="md">
                    {selectedRequest.images.map((imageUrl, index) => (
                      <MantineImage
                        key={index}
                        src={imageUrl}
                        alt={`Issue image ${index + 1}`}
                        height={200}
                        fit="cover"
                        radius="md"
                      />
                    ))}
                  </SimpleGrid>
                </Box>
              )}

              {selectedRequest?.assignment_message && (
                <Box>
                  <Text size="sm" fw={500} mb="sm">
                    Assignment Message
                  </Text>
                  <Text size="sm" c="dimmed">
                    {selectedRequest.assignment_message}
                  </Text>
                </Box>
              )}

              {selectedRequest?.technician_notes && (
                <Box>
                  <Text size="sm" fw={500} mb="sm">
                    Technician Notes
                  </Text>
                  <Text size="sm" c="dimmed">
                    {selectedRequest.technician_notes}
                  </Text>
                </Box>
              )}

              {selectedRequest?.estimated_cost && (
                <Box>
                  <Text size="sm" fw={500} mb="sm">
                    Estimated Cost
                  </Text>
                  <Text size="sm">
                    {formatCurrency(selectedRequest.estimated_cost)}
                  </Text>
                </Box>
              )}

              {selectedRequest?.completion_notes && (
                <Box>
                  <Text size="sm" fw={500} mb="sm">
                    Completion Notes
                  </Text>
                  <Text size="sm" c="dimmed">
                    {selectedRequest.completion_notes}
                  </Text>
                </Box>
              )}

              {selectedRequest?.final_cost && (
                <Box>
                  <Text size="sm" fw={500} mb="sm">
                    Final Cost
                  </Text>
                  <Text size="sm">
                    {formatCurrency(selectedRequest.final_cost)}
                  </Text>
                </Box>
              )}

              {selectedRequest?.payment_status && (
                <Box>
                  <Text size="sm" fw={500} mb="sm">
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
                    variant="filled"
                  >
                    {selectedRequest.payment_status.toUpperCase()}
                  </Badge>
                </Box>
              )}

              <Group justify="right">
                <Button variant="outline" onClick={closeView}>
                  Close
                </Button>
              </Group>
            </Stack>
          </Modal>

          {/* Payment Modal */}
          <Modal
            opened={opened}
            onClose={close}
            title="Processing Payment"
            centered
          >
            <LoadingOverlay visible={paymentLoading} />
            <Stack>
              {paymentLoading ? (
                <Text ta="center">Creating payment session...</Text>
              ) : (
                <>
                  <Text>Payment will be processed through PayMongo.</Text>
                  {paymentRequest && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <Text size="sm" fw={500} mb="sm">
                        Request Details
                      </Text>
                      <Grid>
                        <Grid.Col span={6}>
                          <Text size="xs" c="dimmed">
                            Category
                          </Text>
                          <Text size="sm">{paymentRequest.category}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Text size="xs" c="dimmed">
                            Amount
                          </Text>
                          <Text size="sm">
                            {formatCurrency(paymentRequest.amount)}
                          </Text>
                        </Grid.Col>
                        <Grid.Col span={12}>
                          <Text size="xs" c="dimmed">
                            Description
                          </Text>
                          <Text size="sm" lineClamp={2}>
                            {paymentRequest.description}
                          </Text>
                        </Grid.Col>
                      </Grid>
                    </div>
                  )}
                </>
              )}
              <Group justify="right">
                <Button
                  variant="outline"
                  onClick={close}
                  disabled={paymentLoading}
                >
                  Cancel
                </Button>
              </Group>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </div>
  );
};

export default ServiceRequestsSection;
