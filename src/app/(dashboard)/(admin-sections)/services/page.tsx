"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Group,
  Button,
  Text,
  Badge,
  SimpleGrid,
  Modal,
  TextInput,
  NumberInput,
  LoadingOverlay,
  Notification,
  Box,
  Stack,
  Grid,
  Textarea,
  Image as MantineImage,
  Divider,
} from "@mantine/core";
import {
  IconSettings,
  IconExclamationMark,
  IconCheck,
  IconCalendar,
  IconSearch,
  IconRefresh,
  IconEye,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import axios from "axios";
import Image from "next/image";
import { Session } from "@/better-auth/auth-types";
import { getServerSession } from "@/better-auth/action";
import { useRouter } from "next/navigation";
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
  const [viewModalOpened, { open: openView, close: closeView }] =
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
  const [searchTerm, setSearchTerm] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const session = await getServerSession();
      setSession(session);

      if (session?.user?.role !== "admin") {
        router.push("/");
      }
    };
    getSession();
  }, []);

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
          `Technician assigned successfully. ${
            response.data.notificationSent ? "Notification sent to tenant." : ""
          }`
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
          `Estimate provided successfully. ${
            response.data.notificationSent ? "Notification sent to tenant." : ""
          }`
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
          `Request marked as completed. ${
            response.data.notificationSent ? "Notification sent to tenant." : ""
          }`
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
        request.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
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
                    Service Management
                  </Title>
                  <Text size="sm" c="dimmed">
                    Manage and track service requests
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
                  <IconCalendar size={24} />
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
                    {stats.highPriority > 1 ? "s" : ""} requiring immediate
                    attention.
                  </Text>
                </Stack>
              </Group>
            </div>
          )}

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <TextInput
                placeholder="Search requests by tenant, category, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
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
                        <Group>
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Image
                              src={session?.user.image || "/placeholder.png"}
                              alt="User Image"
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          </div>
                          <Stack gap={0}>
                            <Text size="sm" fw={500}>
                              {request.user_name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {request.user_email}
                            </Text>
                          </Stack>
                        </Group>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Text size="sm">{request.category}</Text>
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
                          color={
                            request.status === "pending"
                              ? "yellow"
                              : request.status === "in-progress"
                              ? "blue"
                              : request.status === "completed"
                              ? "green"
                              : "red"
                          }
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
                            disabled={submitting}
                          >
                            View
                          </Button>
                          {request.status === "pending" && (
                            <>
                              <Button
                                size="xs"
                                variant="filled"
                                color="blue"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  openAssign();
                                }}
                                disabled={submitting}
                              >
                                Assign
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  openEstimate();
                                }}
                                disabled={submitting}
                              >
                                Estimate
                              </Button>
                            </>
                          )}
                          {request.status === "in-progress" && (
                            <>
                              <Button
                                size="xs"
                                variant="filled"
                                color="green"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  openComplete();
                                }}
                                disabled={submitting}
                              >
                                Complete
                              </Button>
                              {!request.estimated_cost && (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    openEstimate();
                                  }}
                                  disabled={submitting}
                                >
                                  Estimate
                                </Button>
                              )}
                            </>
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
                      Tenant
                    </Text>
                    <Text size="sm" fw={500}>
                      {selectedRequest?.user_name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {selectedRequest?.user_email}
                    </Text>
                  </Grid.Col>
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
                      color={
                        selectedRequest?.status === "pending"
                          ? "yellow"
                          : selectedRequest?.status === "in-progress"
                          ? "blue"
                          : selectedRequest?.status === "completed"
                          ? "green"
                          : "red"
                      }
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

          {/* Assign Technician Modal */}
          <Modal
            opened={assignModalOpened}
            onClose={closeAssign}
            title="Assign Technician"
            centered
          >
            <LoadingOverlay visible={submitting} />
            <Stack>
              <Box className="bg-gray-50 rounded-lg p-4">
                <Text size="sm" fw={500} mb="sm">
                  Request Details
                </Text>
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">
                      Tenant
                    </Text>
                    <Text size="sm">{selectedRequest?.user_name}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">
                      Category
                    </Text>
                    <Text size="sm">{selectedRequest?.category}</Text>
                  </Grid.Col>
                </Grid>
              </Box>
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
              <Box className="bg-gray-50 rounded-lg p-4">
                <Text size="sm" fw={500} mb="sm">
                  Request Details
                </Text>
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">
                      Tenant
                    </Text>
                    <Text size="sm">{selectedRequest?.user_name}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">
                      Category
                    </Text>
                    <Text size="sm">{selectedRequest?.category}</Text>
                  </Grid.Col>
                </Grid>
              </Box>
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
              <Box className="bg-gray-50 rounded-lg p-4">
                <Text size="sm" fw={500} mb="sm">
                  Request Details
                </Text>
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">
                      Tenant
                    </Text>
                    <Text size="sm">{selectedRequest?.user_name}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c="dimmed">
                      Category
                    </Text>
                    <Text size="sm">{selectedRequest?.category}</Text>
                  </Grid.Col>
                </Grid>
              </Box>
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
        </Stack>
      </Container>
    </div>
  );
};

export default ServicesSection;
