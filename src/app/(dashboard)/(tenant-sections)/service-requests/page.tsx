"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Title,
  Group,
  Card,
  Stack,
  Button,
  Stepper,
  Accordion,
  Text,
  Badge,
  ActionIcon,
  rem,
  Container,
  Divider,
  SimpleGrid,
  Modal,
  Textarea,
  LoadingOverlay,
  Notification,
  Select,
} from "@mantine/core";
import {
  IconUpload,
  IconPhoto,
  IconX,
  IconCheck,
  IconClock,
  IconSettings,
  IconTrash,
  IconCash,
  IconExclamationMark,
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
  // Fetch service requests on component mount
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
              ? new Date(request.created_at).toLocaleDateString()
              : new Date().toLocaleDateString(),
            amount: request.final_cost || request.estimated_cost,
          })
        );

        setRequests(transformedRequests);
      } else {
        setError(response.data.error || "Failed to fetch service requests");
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.message
        : "An error occurred";
      setError(errorMessage);
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

    // Clear notifications after 5 seconds
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
        return "orange";
      case "cancelled":
        return "gray";
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

  const getStepFromStatus = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "in-progress":
        return 1;
      case "completed":
        return 2;
      default:
        return 0;
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
    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await axios.post("/api/upload-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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

    // Create preview URLs for new files
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  const removeFile = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);

    setFiles(files.filter((_, i) => i !== index));
    setImagePreviewUrls(imagePreviewUrls.filter((_, i) => i !== index));
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `/api/service-requests?requestId=${id}`
      );

      if (response.data.success) {
        setRequests(requests.filter((request) => request.id !== id));
        showNotification("Service request deleted successfully");
      } else {
        showNotification(
          response.data.error || "Failed to delete service request",
          true
        );
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.message
        : "Failed to delete service request";
      showNotification(errorMessage, true);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup object URLs when component unmounts
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleCancelRequest = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this request?")) {
      return;
    }

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

      // Create PayMongo payment
      const paymentResponse = await axios.post("/api/create-payment", {
        amount: request.final_cost,
        description: `Payment for ${request.category} service`,
        requestId: request.id,
      });

      if (paymentResponse.data.success) {
        // Redirect to PayMongo checkout
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");

    if (paymentStatus === "success") {
      showNotification("Payment completed successfully!");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh data to get updated payment status
      fetchServiceRequests();
    } else if (paymentStatus === "cancelled") {
      showNotification("Payment was cancelled", true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
        try {
          showNotification(`Uploading ${files.length} image(s)...`);
          imageUrls = await uploadImages(files);
          showNotification(`${files.length} image(s) uploaded successfully`);
        } catch (uploadError) {
          const errorMessage = axios.isAxiosError(uploadError)
            ? uploadError.message
            : "Failed to upload images";
          showNotification(`Failed to upload images: ${errorMessage}`, true);
          return;
        }
      }

      const categoryTitle =
        categories.find((c) => c.id === selectedCategory)?.title || "Other";

      // Submit service request with uploaded image URLs
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
              ).toLocaleDateString()
            : new Date().toLocaleDateString(),
        };

        setRequests([newRequest, ...requests]);

        // Clear form
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
        <Group justify="center">
          <IconSettings size={32} color="var(--mantine-color-blue-6)" />
          <Title order={1} size="h2">
            Service Requests
          </Title>
        </Group>

        {/* Request Categories */}
        <div>
          <Title order={2} size="h4" mb="md">
            Select Request Category
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {categories.map((category) => (
              <Card
                key={category.id}
                shadow="sm"
                radius="md"
                p="lg"
                withBorder
                style={{
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  transform:
                    selectedCategory === category.id
                      ? "translateY(-2px)"
                      : "none",
                  boxShadow:
                    selectedCategory === category.id
                      ? "0 8px 25px rgba(0,0,0,0.15)"
                      : undefined,
                  borderColor:
                    selectedCategory === category.id
                      ? "var(--mantine-color-blue-6)"
                      : undefined,
                  backgroundColor:
                    selectedCategory === category.id
                      ? "var(--mantine-color-blue-0)"
                      : undefined,
                }}
                onClick={() => handleCategorySelect(category.id)}
              >
                <Stack align="center" gap="sm">
                  <Text fz="xl">{category.icon}</Text>
                  <Title
                    order={4}
                    ta="center"
                    fz="h5"
                    c={selectedCategory === category.id ? "blue" : undefined}
                  >
                    {category.title}
                  </Title>
                  <Text size="sm" c="dimmed" ta="center">
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
        </div>

        {selectedCategory && (
          <>
            <Divider />

            {/* Issue Description Input */}
            <div>
              <Title order={2} size="h4" mb="md">
                Describe Your Issue
              </Title>
              <Card shadow="sm" radius="md" p="md" withBorder>
                <Textarea
                  placeholder="Please describe the issue in detail..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.currentTarget.value)}
                  autosize
                  minRows={3}
                  maxRows={6}
                />
              </Card>
            </div>

            <div>
              <Title order={2} size="h4" mb="md">
                Select Priority
              </Title>
              <Card shadow="sm" radius="md" p="md" withBorder>
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
            </div>

            {/* Image Upload */}
            <div>
              <Title order={2} size="h4" mb="md">
                Attach Photos (Optional)
              </Title>
              <Card shadow="sm" radius="md" p="md" withBorder>
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
                        style={{
                          width: rem(52),
                          height: rem(52),
                          color: "var(--mantine-color-blue-6)",
                        }}
                        stroke={1.5}
                      />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <IconX
                        style={{
                          width: rem(52),
                          height: rem(52),
                          color: "var(--mantine-color-red-6)",
                        }}
                        stroke={1.5}
                      />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <IconPhoto
                        style={{
                          width: rem(52),
                          height: rem(52),
                          color: "var(--mantine-color-dimmed)",
                        }}
                        stroke={1.5}
                      />
                    </Dropzone.Idle>

                    <div>
                      <Text size="sm" inline>
                        Drag images here or click to select files
                      </Text>
                      <Text size="xs" c="dimmed" inline mt={7}>
                        Attach photos of the issue to help our technicians
                      </Text>
                    </div>
                  </Group>
                </Dropzone>
                {files.length > 0 && (
                  <Stack mt="md" gap="md">
                    <Text size="sm" fw={500}>
                      Uploaded files ({files.length}):
                    </Text>

                    {/* Image Previews Grid */}
                    <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
                      {files.map((file, index) => (
                        <div key={index} style={{ position: "relative" }}>
                          <Card shadow="sm" radius="md" withBorder p="xs">
                            <Card.Section>
                              <Image
                                width={500}
                                height={500}
                                src={imagePreviewUrls[index]}
                                alt={file.name}
                                style={{
                                  width: "100%",
                                  height: 120,
                                  objectFit: "cover",
                                  borderRadius: "4px 4px 0 0",
                                }}
                              />
                            </Card.Section>
                            <Text
                              size="xs"
                              lineClamp={1}
                              mt="xs"
                              title={file.name}
                            >
                              {file.name}
                            </Text>
                          </Card>

                          {/* Remove button overlay */}
                          <ActionIcon
                            color="red"
                            variant="filled"
                            size="sm"
                            radius="xl"
                            style={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              zIndex: 1,
                            }}
                            onClick={() => removeFile(index)}
                          >
                            <IconX size={12} />
                          </ActionIcon>
                        </div>
                      ))}
                    </SimpleGrid>
                  </Stack>
                )}
              </Card>
            </div>

            <Group justify="center" mt="md">
              <Button
                onClick={submitRequest}
                loading={submitting}
                disabled={submitting}
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
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
            </Group>
          </>
        )}

        {/* Request History */}
        <div>
          <Title order={2} size="h4" mb="md">
            Request History
          </Title>

          <Card shadow="sm" radius="md" withBorder pos="relative">
            <LoadingOverlay visible={loading} />

            {requests.length === 0 && !loading ? (
              <Card p="xl">
                <Text c="dimmed" ta="center">
                  No service requests yet.
                </Text>
              </Card>
            ) : (
              <Accordion variant="separated">
                {requests.map((request) => (
                  <Accordion.Item key={request.id} value={request.id}>
                    <Accordion.Control>
                      <Group justify="space-between" wrap="nowrap">
                        <div style={{ flex: 1 }}>
                          <Text fw={500} size="sm">
                            {request.category}
                          </Text>
                          <Text size="sm" c="dimmed" lineClamp={1}>
                            {request.description}
                          </Text>
                        </div>
                        <Group gap="xs">
                          <Badge
                            color={getStatusColor(request.status)}
                            variant="light"
                            size="sm"
                          >
                            {request.status}
                          </Badge>
                          <Badge
                            color={getPriorityColor(request.priority)}
                            variant="outline"
                            size="sm"
                          >
                            {request.priority}
                          </Badge>
                        </Group>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="md">
                        <Group>
                          <Text size="sm" fw={500}>
                            Date:
                          </Text>
                          <Text size="sm">{request.date}</Text>
                        </Group>

                        {/* Status Tracking - Non-interactive */}
                        <div>
                          <Text size="sm" fw={500} mb="sm">
                            Request Progress:
                          </Text>
                          <Stepper
                            active={getStepFromStatus(request.status)}
                            allowNextStepsSelect={false}
                          >
                            <Stepper.Step
                              label="Pending"
                              description="Request submitted"
                              icon={<IconClock size={18} />}
                            />
                            <Stepper.Step
                              label="In Progress"
                              description="Technician assigned"
                              icon={<IconSettings size={18} />}
                            />
                            <Stepper.Step
                              label="Completed"
                              description="Work finished"
                              icon={<IconCheck size={18} />}
                            />
                          </Stepper>
                        </div>

                        <Group>
                          <Text size="sm" fw={500}>
                            Priority:
                          </Text>
                          <Badge
                            color={getPriorityColor(request.priority)}
                            variant="outline"
                            size="sm"
                          >
                            {request.priority}
                          </Badge>
                        </Group>

                        <div>
                          <Text size="sm" fw={500}>
                            Issue Description:
                          </Text>
                          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                            {request.description}
                          </Text>
                        </div>

                        {request.assigned_technician && (
                          <Group>
                            <Text size="sm" fw={500}>
                              Assigned Technician:
                            </Text>
                            <Text size="sm">{request.assigned_technician}</Text>
                          </Group>
                        )}

                        {request.technician_notes && (
                          <div>
                            <Text size="sm" fw={500}>
                              Technician Notes:
                            </Text>
                            <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                              {request.technician_notes}
                            </Text>
                          </div>
                        )}

                        {/* Display images if they exist */}
                        {request.images && request.images.length > 0 && (
                          <div>
                            <Text size="sm" fw={500} mb="sm">
                              Attached Images:
                            </Text>
                            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                              {request.images.map((imageUrl, index) => (
                                <Card key={index} withBorder p="xs">
                                  <Card.Section>
                                    <Image
                                      width={300}
                                      height={200}
                                      src={imageUrl}
                                      alt={`Request image ${index + 1}`}
                                      style={{
                                        width: "100%",
                                        height: 120,
                                        objectFit: "cover",
                                      }}
                                    />
                                  </Card.Section>
                                </Card>
                              ))}
                            </SimpleGrid>
                          </div>
                        )}

                        {request.status === "completed" &&
                          request.final_cost && (
                            <Group gap="xs">
                              {request.payment_status !== "paid" ? (
                                <Button
                                  size="xs"
                                  leftSection={<IconCash size={14} />}
                                  onClick={() => handlePayment(request)}
                                  loading={paymentLoading}
                                  disabled={paymentLoading}
                                >
                                  Pay Now (${request.final_cost})
                                </Button>
                              ) : (
                                <Badge color="green" variant="filled" size="sm">
                                  ✓ Payment Completed
                                </Badge>
                              )}
                              <ActionIcon
                                color="red"
                                variant="light"
                                onClick={() => handleDeleteRequest(request.id)}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Group>
                          )}

                        {request.status === "pending" && (
                          <Group justify="space-between">
                            <Button
                              variant="outline"
                              color="red"
                              size="xs"
                              onClick={() => handleCancelRequest(request.id)}
                            >
                              Cancel Request
                            </Button>
                            <ActionIcon
                              color="red"
                              variant="light"
                              onClick={() => handleDeleteRequest(request.id)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        )}

                        {request.status === "in-progress" && (
                          <Group justify="space-between">
                            <Text size="sm" c="blue">
                              Your request is being processed
                            </Text>
                            <ActionIcon
                              color="red"
                              variant="light"
                              onClick={() => handleDeleteRequest(request.id)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        )}

                        {request.status === "cancelled" && (
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed">
                              This request has been cancelled
                            </Text>
                            <ActionIcon
                              color="red"
                              variant="light"
                              onClick={() => handleDeleteRequest(request.id)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        )}
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            )}
          </Card>
        </div>
      </Stack>

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
                <div>
                  <Text fw={500}>{paymentRequest.category}</Text>
                  <Text size="sm" c="dimmed">
                    {paymentRequest.description}
                  </Text>
                  <Text size="lg" fw={700} mt="sm">
                    Amount: ${paymentRequest.amount}
                  </Text>
                </div>
              )}
            </>
          )}
        </Stack>
      </Modal>
    </Container>
  );
};

export default ServiceRequestsSection;
