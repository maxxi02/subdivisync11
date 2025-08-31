"use client";

import { useState, useEffect } from "react";
import {
  Title,
  Group,
  Card,
  Stack,
  Button,
  Text,
  Badge,
  Container,
  SimpleGrid,
  Modal,
  TextInput,
  NumberInput,
  LoadingOverlay,
  Notification,
  Tabs,
  Textarea,
  Grid,
  Box,
} from "@mantine/core";
import {
  IconSettings,
  IconExclamationMark,
  IconCash,
  IconUser,
  IconCalendar,
  IconCheck,
  IconPhoto,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import axios from "axios";
import Image from "next/image";
import { Session } from "@/better-auth/auth-types";
import { getServerSession } from "@/better-auth/action";

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
  payment_status?: "pending" | "paid" | "failed";
  payment_intent_id?: string;
  payment_id?: string;
  paid_at?: string;
}

const ServicesSection = () => {
  const [activeTab, setActiveTab] = useState<string | null>("dashboard");
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [assignModalOpened, { open: openAssign, close: closeAssign }] =
    useDisclosure(false);
  const [estimateModalOpened, { open: openEstimate, close: closeEstimate }] =
    useDisclosure(false);
  const [completeModalOpened, { open: openComplete, close: closeComplete }] =
    useDisclosure(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(
    null
  );
  const [technician, setTechnician] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [estimatedCost, setEstimatedCost] = useState<number | string>("");
  const [estimateNotes, setEstimateNotes] = useState("");
  const [finalCost, setFinalCost] = useState<number | string>("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const getSession = async () => {
      const session = await getServerSession();
      setSession(session);
    };
    getSession();
  }, []);

  //payments
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

  const assignTechnician = async () => {
    if (
      !selectedRequest ||
      !technician ||
      !scheduledDate ||
      !assignmentMessage
    ) {
      showNotification("Please fill all required fields", true);
      return;
    }

    try {
      setSubmitting(true);

      const response = await axios.put("/api/service-requests", {
        requestId: selectedRequest.id,
        status: "in-progress",
        assigned_technician: technician,
        scheduled_date: scheduledDate,
        assignment_message: assignmentMessage,
      });

      if (response.data.success) {
        // Update the request locally
        const updatedRequests = requests.map((request) =>
          request.id === selectedRequest.id
            ? {
                ...request,
                status: "in-progress" as const,
                assigned_technician: technician,
                scheduled_date: scheduledDate,
                assignment_message: assignmentMessage,
              }
            : request
        );

        setRequests(updatedRequests);
        showNotification(
          `Technician assigned successfully. ${response.data.notificationSent ? "Notification sent to tenant." : ""}`
        );
        closeAssign();
        resetModalFields();
      } else {
        showNotification(
          response.data.error || "Failed to assign technician",
          true
        );
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.message
        : "Failed to assign technician";
      showNotification(errorMessage, true);
    } finally {
      setSubmitting(false);
    }
  };

  const provideEstimate = async () => {
    if (!selectedRequest || estimatedCost === "") {
      showNotification("Please provide an estimated cost", true);
      return;
    }

    try {
      setSubmitting(true);

      const response = await axios.put("/api/service-requests", {
        requestId: selectedRequest.id,
        estimated_cost: Number(estimatedCost),
        technician_notes: estimateNotes,
      });

      if (response.data.success) {
        // Update the request locally
        const updatedRequests = requests.map((request) =>
          request.id === selectedRequest.id
            ? {
                ...request,
                estimated_cost: Number(estimatedCost),
                technician_notes: estimateNotes,
                amount: Number(estimatedCost),
              }
            : request
        );

        setRequests(updatedRequests);
        showNotification(
          `Estimate provided successfully. ${response.data.notificationSent ? "Notification sent to tenant." : ""}`
        );
        closeEstimate();
        resetModalFields();
      } else {
        showNotification(
          response.data.error || "Failed to provide estimate",
          true
        );
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.message
        : "Failed to provide estimate";
      showNotification(errorMessage, true);
    } finally {
      setSubmitting(false);
    }
  };

  const completeRequest = async () => {
    if (!selectedRequest || finalCost === "") {
      showNotification("Please provide a final cost", true);
      return;
    }

    try {
      setSubmitting(true);

      const response = await axios.put("/api/service-requests", {
        requestId: selectedRequest.id,
        status: "completed",
        final_cost: Number(finalCost),
        completion_notes: completionNotes,
      });

      if (response.data.success) {
        // Update the request locally
        const updatedRequests = requests.map((request) =>
          request.id === selectedRequest.id
            ? {
                ...request,
                status: "completed" as const,
                final_cost: Number(finalCost),
                completion_notes: completionNotes,
                amount: Number(finalCost),
              }
            : request
        );

        setRequests(updatedRequests);
        showNotification(
          `Request marked as completed. ${response.data.notificationSent ? "Notification sent to tenant." : ""}`
        );
        closeComplete();
        resetModalFields();
      } else {
        showNotification(
          response.data.error || "Failed to complete request",
          true
        );
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.message
        : "Failed to complete request";
      showNotification(errorMessage, true);
    } finally {
      setSubmitting(false);
    }
  };

  const resetModalFields = () => {
    setTechnician("");
    setScheduledDate("");
    setAssignmentMessage("");
    setEstimatedCost("");
    setEstimateNotes("");
    setFinalCost("");
    setCompletionNotes("");
    setSelectedRequest(null);
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

  const getPendingRequests = () => {
    return requests
      .filter((req) => req.status === "pending")
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handlePayment = async (request: ServiceRequest) => {
    if (!request.final_cost) return;

    try {
      setPaymentLoading(true);

      // Create PayMongo payment method
      const paymentResponse = await axios.post("/api/create-payment", {
        amount: request.final_cost * 100, // Convert to centavos
        description: `Payment for ${request.category} service`,
        requestId: request.id,
      });

      if (paymentResponse.data.success) {
        // Redirect to PayMongo checkout or handle payment flow
        window.location.href = paymentResponse.data.checkout_url;
      } else {
        showNotification("Failed to create payment", true);
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
            <IconSettings size={32} color="var(--mantine-color-blue-6)" />
            <Title order={1} size="h2">
              Service Management
            </Title>
          </Group>
          <Button
            variant="outline"
            onClick={fetchServiceRequests}
            loading={loading}
          >
            Refresh
          </Button>
        </Group>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="dashboard">Requests Dashboard</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="dashboard" pt="md">
            <Card withBorder p="md" radius="md" pos="relative">
              <LoadingOverlay visible={loading} />

              {/* Quick Stats Cards */}
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="xl">
                <Card withBorder p="md" radius="md">
                  <Text size="lg" fw={700} c="orange">
                    {requests.filter((r) => r.status === "pending").length}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Pending
                  </Text>
                </Card>
                <Card withBorder p="md" radius="md">
                  <Text size="lg" fw={700} c="blue">
                    {requests.filter((r) => r.status === "in-progress").length}
                  </Text>
                  <Text size="sm" c="dimmed">
                    In Progress
                  </Text>
                </Card>
                <Card withBorder p="md" radius="md">
                  <Text size="lg" fw={700} c="green">
                    {requests.filter((r) => r.status === "completed").length}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Completed
                  </Text>
                </Card>
                <Card withBorder p="md" radius="md">
                  <Text size="lg" fw={700} c="red">
                    {requests.filter((r) => r.priority === "high").length}
                  </Text>
                  <Text size="sm" c="dimmed">
                    High Priority
                  </Text>
                </Card>
              </SimpleGrid>

              {/* Priority Queue - Pending Requests */}
              <Box mb="xl">
                <Title order={2} size="h3" mb="md" c="orange">
                  🚨 Priority Queue (Pending Requests)
                </Title>

                {getPendingRequests().length === 0 ? (
                  <Card withBorder p="xl">
                    <Text c="dimmed" ta="center">
                      No pending requests
                    </Text>
                  </Card>
                ) : (
                  getPendingRequests().map((request) => (
                    <Card
                      key={request.id}
                      shadow="sm"
                      radius="md"
                      p="lg"
                      withBorder
                      mb="md"
                      style={{
                        borderLeft: `4px solid ${
                          request.priority === "high"
                            ? "var(--mantine-color-red-6)"
                            : request.priority === "medium"
                              ? "var(--mantine-color-yellow-6)"
                              : "var(--mantine-color-green-6)"
                        }`,
                      }}
                    >
                      <Grid>
                        <Grid.Col span={{ base: 12, md: 8 }}>
                          <Stack gap="sm">
                            <Group>
                              <Badge
                                color={getPriorityColor(request.priority)}
                                variant="filled"
                              >
                                {request.priority.toUpperCase()} PRIORITY
                              </Badge>
                              <Badge variant="outline">
                                {request.category}
                              </Badge>
                              <Text size="sm" c="dimmed">
                                Submitted: {request.date}
                              </Text>
                            </Group>

                            <div>
                              <Text fw={500}>
                                <IconUser
                                  size={14}
                                  style={{ marginRight: 4 }}
                                />
                                {request.user_name}
                              </Text>
                              <Text size="sm" c="dimmed">
                                {request.user_email}
                              </Text>
                            </div>

                            <div>
                              <Text fw={500} size="sm">
                                Issue Description:
                              </Text>
                              <Text
                                size="sm"
                                style={{ whiteSpace: "pre-wrap" }}
                              >
                                {request.description}
                              </Text>
                            </div>

                            {/* Display images if they exist */}
                            {request.images && request.images.length > 0 && (
                              <div>
                                <Text size="sm" fw={500} mb="xs">
                                  <IconPhoto
                                    size={14}
                                    style={{ marginRight: 4 }}
                                  />
                                  Attached Images ({request.images.length}):
                                </Text>
                                <SimpleGrid
                                  cols={{ base: 2, sm: 3 }}
                                  spacing="xs"
                                >
                                  {request.images.map((imageUrl, index) => (
                                    <Card key={index} withBorder p="xs">
                                      <Card.Section>
                                        <Image
                                          width={200}
                                          height={150}
                                          src={imageUrl}
                                          alt={`Request image ${index + 1}`}
                                          style={{
                                            width: "100%",
                                            height: 80,
                                            objectFit: "cover",
                                          }}
                                        />
                                      </Card.Section>
                                    </Card>
                                  ))}
                                </SimpleGrid>
                              </div>
                            )}
                          </Stack>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <Stack gap="xs" align="flex-end">
                            <Button
                              size="sm"
                              variant="filled"
                              onClick={() => {
                                setSelectedRequest(request);
                                openAssign();
                              }}
                              disabled={submitting}
                            >
                              Assign Technician
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                openEstimate();
                              }}
                              disabled={submitting}
                            >
                              Provide Estimate
                            </Button>
                          </Stack>
                        </Grid.Col>
                      </Grid>
                    </Card>
                  ))
                )}
              </Box>

              {/* In Progress Requests */}
              <Box mb="xl">
                <Title order={2} size="h3" mb="md" c="blue">
                  🔧 Active Work Orders
                </Title>

                {requests.filter((r) => r.status === "in-progress").length ===
                0 ? (
                  <Card withBorder p="xl">
                    <Text c="dimmed" ta="center">
                      No active work orders
                    </Text>
                  </Card>
                ) : (
                  requests
                    .filter((r) => r.status === "in-progress")
                    .map((request) => (
                      <Card
                        key={request.id}
                        shadow="sm"
                        radius="md"
                        p="lg"
                        withBorder
                        mb="md"
                      >
                        <Grid>
                          <Grid.Col span={{ base: 12, md: 8 }}>
                            <Stack gap="sm">
                              <Group>
                                <Badge color="blue" variant="filled">
                                  IN PROGRESS
                                </Badge>
                                <Text fw={500}>{request.category}</Text>
                                <Text size="sm">
                                  Tenant: {request.user_name}
                                </Text>
                              </Group>

                              <Text size="sm">
                                <strong>Assigned to:</strong>{" "}
                                {request.assigned_technician}
                              </Text>

                              {request.scheduled_date && (
                                <Text size="sm">
                                  <IconCalendar
                                    size={14}
                                    style={{ marginRight: 4 }}
                                  />
                                  <strong>Scheduled:</strong>{" "}
                                  {formatDate(request.scheduled_date)}
                                </Text>
                              )}

                              {request.estimated_cost && (
                                <Text size="sm">
                                  <IconCash
                                    size={14}
                                    style={{ marginRight: 4 }}
                                  />
                                  <strong>Estimated Cost:</strong> ₱
                                  {request.estimated_cost}
                                </Text>
                              )}

                              {request.assignment_message && (
                                <div>
                                  <Text size="sm" fw={500}>
                                    Assignment Message:
                                  </Text>
                                  <Text
                                    size="sm"
                                    style={{ whiteSpace: "pre-wrap" }}
                                  >
                                    {request.assignment_message}
                                  </Text>
                                </div>
                              )}
                            </Stack>
                          </Grid.Col>

                          <Grid.Col span={{ base: 12, md: 4 }}>
                            <Stack gap="xs" align="flex-end">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  openComplete();
                                }}
                                disabled={submitting}
                              >
                                Mark as Completed
                              </Button>

                              {!request.estimated_cost && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    openEstimate();
                                  }}
                                  disabled={submitting}
                                >
                                  Provide Estimate
                                </Button>
                              )}
                            </Stack>
                          </Grid.Col>
                        </Grid>
                      </Card>
                    ))
                )}
              </Box>

              {/* Completed Requests */}
              <Box>
                <Title order={2} size="h3" mb="md" c="green">
                  ✅ Completed Requests
                </Title>

                {requests.filter((r) => r.status === "completed").length ===
                0 ? (
                  <Card withBorder p="xl">
                    <Text c="dimmed" ta="center">
                      No completed requests
                    </Text>
                  </Card>
                ) : (
                  requests
                    .filter((r) => r.status === "completed")
                    .map((request) => (
                      <Card
                        key={request.id}
                        shadow="sm"
                        radius="md"
                        p="lg"
                        withBorder
                        mb="md"
                      >
                        <Grid>
                          <Grid.Col span={{ base: 12, md: 8 }}>
                            <Stack gap="sm">
                              <Group>
                                <Badge color="green" variant="filled">
                                  COMPLETED
                                </Badge>
                                <Text fw={500}>{request.category}</Text>
                                <Text size="sm">
                                  Tenant: {request.user_name}
                                </Text>
                                {/* Add payment status badge */}
                                {request.payment_status && (
                                  <Badge
                                    color={
                                      request.payment_status === "paid"
                                        ? "blue"
                                        : "orange"
                                    }
                                    variant="outline"
                                  >
                                    {request.payment_status.toUpperCase()}
                                  </Badge>
                                )}
                              </Group>

                              <Text size="sm">
                                <strong>Assigned to:</strong>{" "}
                                {request.assigned_technician}
                              </Text>

                              {request.final_cost && (
                                <Text size="sm">
                                  <IconCash
                                    size={14}
                                    style={{ marginRight: 4 }}
                                  />
                                  <strong>Final Cost:</strong> ₱
                                  {request.final_cost}
                                </Text>
                              )}

                              {request.completion_notes && (
                                <div>
                                  <Text size="sm" fw={500}>
                                    Completion Notes:
                                  </Text>
                                  <Text
                                    size="sm"
                                    style={{ whiteSpace: "pre-wrap" }}
                                  >
                                    {request.completion_notes}
                                  </Text>
                                </div>
                              )}
                            </Stack>
                          </Grid.Col>

                          <Grid.Col span={{ base: 12, md: 4 }}>
                            <Stack gap="xs" align="flex-end">
                              {/* Payment status display for admins */}
                              {request.payment_status === "paid" ? (
                                <Badge color="green" variant="filled" size="sm">
                                  ✓ Payment Completed
                                </Badge>
                              ) : request.payment_status === "pending" ? (
                                <Badge
                                  color="orange"
                                  variant="outline"
                                  size="sm"
                                >
                                  Payment Pending
                                </Badge>
                              ) : request.final_cost ? (
                                <Badge color="red" variant="outline" size="sm">
                                  Payment Required: ${request.final_cost}
                                </Badge>
                              ) : (
                                <Text size="sm" c="dimmed">
                                  No payment required
                                </Text>
                              )}

                              {/* Show payment date if available */}
                              {request.paid_at && (
                                <Text size="xs" c="green">
                                  Paid:{" "}
                                  {new Date(
                                    request.paid_at
                                  ).toLocaleDateString()}
                                </Text>
                              )}
                            </Stack>
                          </Grid.Col>
                        </Grid>
                      </Card>
                    ))
                )}
              </Box>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Assign Technician Modal */}
      <Modal
        opened={assignModalOpened}
        onClose={closeAssign}
        title="Assign Technician"
        centered
      >
        <LoadingOverlay visible={submitting} />
        <Stack>
          <TextInput
            label="Technician Name"
            placeholder="Enter technician name"
            value={technician}
            onChange={(e) => setTechnician(e.currentTarget.value)}
            required
          />

          <TextInput
            label="Scheduled Date"
            type="date"
            placeholder="Select date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.currentTarget.value)}
            required
          />

          <Textarea
            label="Assignment Message"
            placeholder="e.g., Please bear with it, I already sent a technician"
            value={assignmentMessage}
            onChange={(e) => setAssignmentMessage(e.currentTarget.value)}
            autosize
            minRows={2}
            required
          />

          <Group justify="right">
            <Button
              variant="outline"
              onClick={closeAssign}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={assignTechnician} loading={submitting}>
              Assign Technician
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Provide Estimate Modal */}
      <Modal
        opened={estimateModalOpened}
        onClose={closeEstimate}
        title="Provide Cost Estimate"
        centered
      >
        <LoadingOverlay visible={submitting} />
        <Stack>
          <NumberInput
            label="Estimated Cost (₱)"
            placeholder="Enter estimated cost"
            value={estimatedCost}
            onChange={setEstimatedCost}
            min={0}
            decimalScale={2}
            required
          />

          <Textarea
            label="Estimate Notes"
            placeholder="Explanation of costs, parts needed, etc."
            value={estimateNotes}
            onChange={(e) => setEstimateNotes(e.currentTarget.value)}
            autosize
            minRows={3}
          />

          <Group justify="right">
            <Button
              variant="outline"
              onClick={closeEstimate}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={provideEstimate} loading={submitting}>
              Send Estimate
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Complete Request Modal */}
      <Modal
        opened={completeModalOpened}
        onClose={closeComplete}
        title="Complete Service Request"
        centered
      >
        <LoadingOverlay visible={submitting} />
        <Stack>
          <NumberInput
            label="Final Cost (₱)"
            placeholder="Enter final cost"
            value={finalCost}
            onChange={setFinalCost}
            min={0}
            decimalScale={2}
            required
          />

          <Textarea
            label="Completion Notes"
            placeholder="Describe work completed, parts used, etc."
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.currentTarget.value)}
            autosize
            minRows={3}
          />

          <Group justify="right">
            <Button
              variant="outline"
              onClick={closeComplete}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={completeRequest} loading={submitting}>
              Mark as Completed
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default ServicesSection;
