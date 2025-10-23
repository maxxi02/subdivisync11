"use client";

import { useState, useEffect } from "react";
import {
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
  Box,
  Stack,
  Grid,
  Textarea,
  Image as MantineImage,
  Divider,
  useMantineTheme,
  useMantineColorScheme,
  rem,
  rgba,
  darken,
  ScrollArea,
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
import { Session } from "@/better-auth/auth-types";
import { getServerSession } from "@/better-auth/action";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

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
  property?: {
    title: string;
    location: string;
    type: string;
    sqft?: number;
    bedrooms?: number;
    bathrooms?: number;
  };
}

const ServicesSection = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [session, setSession] = useState<Session | null>(null);
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
  const [dataFetched, setDataFetched] = useState(false);
  const router = useRouter();

  // Theme-aware helpers
  const primaryTextColor =
    colorScheme === "dark" ? theme.colors.gray[0] : theme.colors.dark[9];
  const secondaryTextColor =
    colorScheme === "dark" ? theme.colors.gray[4] : theme.colors.gray[6];
  const cardBackground =
    colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.white[0];
  const hoverBackground =
    colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[0];
  const getDefaultShadow = () => {
    return theme.shadows.sm;
  };

  useEffect(() => {
    if (!dataFetched) {
      fetchServiceRequests();
      setDataFetched(true);
    }
  }, [dataFetched]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dataFetched) {
        fetchServiceRequests();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, dataFetched]);

  useEffect(() => {
    const getSession = async () => {
      const session = await getServerSession();
      setSession(session);

      if (session?.user?.role !== "admin") {
        router.push("/");
      }
    };
    getSession();
  }, [router]);

  useEffect(() => {
    fetchServiceRequests();
    toast.success("Service requests fetched successfully");
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
        throw new Error(
          response.data.error || "Failed to fetch service requests"
        );
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.message
        : "An error occurred while fetching service requests";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const assignTechnician = async () => {
    if (
      !selectedRequest ||
      !technician ||
      !scheduledDate ||
      !assignmentMessage
    ) {
      toast.error("Please fill all required fields");
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
        toast.success(
          `Technician assigned successfully. ${
            response.data.notificationSent ? "Notification sent to tenant." : ""
          }`
        );
        closeAssign();
        resetModalFields();
      } else {
        throw new Error(response.data.error || "Failed to assign technician");
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.message
        : "Failed to assign technician";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const provideEstimate = async () => {
    if (!selectedRequest || estimatedCost === "") {
      toast.error("Please provide an estimated cost");
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
        toast.success(
          `Estimate provided successfully. ${
            response.data.notificationSent ? "Notification sent to tenant." : ""
          }`
        );
        closeEstimate();
        resetModalFields();
      } else {
        throw new Error(response.data.error || "Failed to provide estimate");
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.message
        : "Failed to provide estimate";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const completeRequest = async () => {
    if (!selectedRequest || finalCost === "") {
      toast.error("Please provide a final cost");
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
        toast.success(
          `Request marked as completed. ${
            response.data.notificationSent ? "Notification sent to tenant." : ""
          }`
        );
        closeComplete();
        resetModalFields();
      } else {
        throw new Error(response.data.error || "Failed to complete request");
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.message
        : "Failed to complete request";
      toast.error(errorMessage);
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
        return theme.colors.red[6];
      case "medium":
        return theme.colors.yellow[6];
      case "low":
        return theme.colors.green[6];
      default:
        return theme.colors.gray[6];
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
    <Stack gap="lg">
      <LoadingOverlay
        visible={loading}
        overlayProps={{ radius: "sm", blur: 2 }}
        loaderProps={{ color: theme.colors.blue[6], size: "lg" }}
      />
      {/* Header */}
      <Box
        p="md"
        style={{
          backgroundColor: cardBackground,
          borderRadius: theme.radius.md,
          boxShadow: getDefaultShadow(),
          border: `1px solid ${
            colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[2]
          }`,
        }}
      >
        <Group justify="space-between" align="center">
          <Group gap="md">
            <IconSettings size={28} color={theme.colors.blue[6]} stroke={1.5} />
            <Stack gap={2}>
              <Title order={2} size="h3" c={primaryTextColor} fw={600}>
                Service Management
              </Title>
              <Text size="sm" c={secondaryTextColor}>
                Manage and track service requests
              </Text>
            </Stack>
          </Group>
          <Button
            variant="gradient"
            gradient={{
              from: theme.colors.blue[5],
              to: theme.colors.blue[7],
              deg: 45,
            }}
            radius="md"
            onClick={fetchServiceRequests}
            leftSection={<IconRefresh size={16} stroke={1.5} />}
          >
            Refresh
          </Button>
        </Group>
      </Box>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        {[
          {
            title: "Pending Requests",
            value: stats.pending,
            color: theme.colors.orange[6],
            icon: IconCalendar,
          },
          {
            title: "In Progress",
            value: stats.inProgress,
            color: theme.colors.blue[6],
            icon: IconSettings,
          },
          {
            title: "Completed",
            value: stats.completed,
            color: theme.colors.green[6],
            icon: IconCheck,
          },
          {
            title: "High Priority",
            value: stats.highPriority,
            color: theme.colors.red[6],
            icon: IconExclamationMark,
          },
        ].map((stat) => (
          <Box
            key={stat.title}
            p="md"
            style={{
              background: `linear-gradient(135deg, ${stat.color} 0%, ${darken(
                stat.color,
                0.1
              )} 100%)`,
              color: "white",
              borderRadius: theme.radius.md,
              boxShadow: getDefaultShadow(),
              border: `1px solid ${rgba(stat.color, 0.2)}`,
            }}
          >
            <Group justify="space-between" align="center">
              <Stack gap={4}>
                <Text size="xs" c={rgba("white", 0.8)} fw={500}>
                  {stat.title}
                </Text>
                <Text size="lg" fw={700}>
                  {stat.value}
                </Text>
              </Stack>
              <Box
                style={{
                  height: 40,
                  width: 40,
                  backgroundColor: rgba("white", 0.15),
                  borderRadius: theme.radius.sm,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <stat.icon size={20} stroke={1.5} />
              </Box>
            </Group>
          </Box>
        ))}
      </SimpleGrid>

      {/* Priority Alert */}
      {stats.highPriority > 0 && (
        <Box
          p="sm"
          style={{
            backgroundColor:
              colorScheme === "dark"
                ? rgba(theme.colors.red[9], 0.9)
                : theme.colors.red[0],
            border: `1px solid ${theme.colors.red[4]}`,
            borderRadius: theme.radius.md,
            boxShadow: getDefaultShadow(),
          }}
        >
          <Group gap="sm">
            <IconExclamationMark
              size={18}
              color={theme.colors.red[6]}
              stroke={1.5}
            />
            <Stack gap={0}>
              <Text
                size="sm"
                fw={600}
                c={
                  colorScheme === "dark"
                    ? theme.colors.red[2]
                    : theme.colors.red[7]
                }
              >
                High Priority Alert
              </Text>
              <Text
                size="xs"
                c={
                  colorScheme === "dark"
                    ? theme.colors.red[3]
                    : theme.colors.red[6]
                }
              >
                You have {stats.highPriority} high-priority request
                {stats.highPriority > 1 ? "s" : ""} requiring immediate
                attention.
              </Text>
            </Stack>
          </Group>
        </Box>
      )}

      {/* Search Bar */}
      <Box
        p="md"
        style={{
          backgroundColor: cardBackground,
          borderRadius: theme.radius.md,
          boxShadow: getDefaultShadow(),
          border: `1px solid ${
            colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[2]
          }`,
        }}
      >
        <Box style={{ position: "relative" }}>
          <IconSearch
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              height: 16,
              width: 16,
              color: secondaryTextColor,
            }}
          />
          <TextInput
            placeholder="Search requests by tenant, category, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            radius="md"
            styles={{
              input: {
                paddingLeft: 36,
                backgroundColor:
                  colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
                color: primaryTextColor,
                border: `1px solid ${
                  colorScheme === "dark"
                    ? theme.colors.dark[4]
                    : theme.colors.gray[3]
                }`,
              },
            }}
          />
        </Box>
      </Box>

      {/* Requests Table */}
      <Box
        style={{
          backgroundColor: cardBackground,
          borderRadius: theme.radius.md,
          boxShadow: getDefaultShadow(),
          border: `1px solid ${
            colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[2]
          }`,
          overflow: "hidden",
        }}
      >
        <ScrollArea type="auto">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead
              style={{
                backgroundColor:
                  colorScheme === "dark"
                    ? theme.colors.dark[8]
                    : theme.colors.gray[0],
              }}
            >
              <tr>
                {[
                  "Tenant",
                  "Category",
                  "Date",
                  "Priority",
                  "Status",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: theme.spacing.sm,
                      textAlign: "left",
                      fontSize: theme.fontSizes.xs,
                      fontWeight: 600,
                      color: secondaryTextColor,
                      textTransform: "uppercase",
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ color: primaryTextColor }}>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: theme.spacing.lg,
                      textAlign: "center",
                      color: secondaryTextColor,
                      fontSize: theme.fontSizes.sm,
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
                      backgroundColor:
                        colorScheme === "dark"
                          ? theme.colors.dark[7]
                          : theme.white,
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = hoverBackground)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        colorScheme === "dark"
                          ? theme.colors.dark[7]
                          : theme.white)
                    }
                  >
                    <td style={{ padding: theme.spacing.sm }}>
                      <Stack gap={2}>
                        <Text size="sm" fw={500} c={primaryTextColor}>
                          {request.user_name}
                        </Text>
                        <Text size="xs" c={secondaryTextColor}>
                          {request.user_email}
                        </Text>
                      </Stack>
                    </td>
                    <td style={{ padding: theme.spacing.sm }}>
                      <Text size="sm" c={primaryTextColor}>
                        {request.category}
                      </Text>
                    </td>
                    <td style={{ padding: theme.spacing.sm }}>
                      <Text size="sm" c={primaryTextColor}>
                        {request.date}
                      </Text>
                    </td>
                    <td style={{ padding: theme.spacing.sm }}>
                      <Badge
                        color={getPriorityColor(request.priority)}
                        variant="filled"
                        radius="sm"
                        size="sm"
                      >
                        {request.priority.toUpperCase()}
                      </Badge>
                    </td>
                    <td style={{ padding: theme.spacing.sm }}>
                      <Badge
                        color={
                          request.status === "pending"
                            ? theme.colors.yellow[6]
                            : request.status === "in-progress"
                              ? theme.colors.blue[6]
                              : request.status === "completed"
                                ? theme.colors.green[6]
                                : theme.colors.red[6]
                        }
                        variant="filled"
                        radius="sm"
                        size="sm"
                      >
                        {request.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td style={{ padding: theme.spacing.sm }}>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="outline"
                          color={colorScheme === "dark" ? "gray.4" : "gray.6"}
                          radius="sm"
                          leftSection={<IconEye size={12} stroke={1.5} />}
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
                              variant="gradient"
                              gradient={{
                                from: theme.colors.blue[5],
                                to: theme.colors.blue[7],
                                deg: 45,
                              }}
                              radius="sm"
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
                              color={
                                colorScheme === "dark" ? "blue.4" : "blue.6"
                              }
                              radius="sm"
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
                              variant="gradient"
                              gradient={{
                                from: theme.colors.green[5],
                                to: theme.colors.green[7],
                                deg: 45,
                              }}
                              radius="sm"
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
                                color={
                                  colorScheme === "dark" ? "blue.4" : "blue.6"
                                }
                                radius="sm"
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
        </ScrollArea>
      </Box>

      {/* View Details Modal */}
      <Modal
        opened={viewModalOpened}
        onClose={closeView}
        title="Service Request Details"
        centered
        size="lg"
        styles={{
          content: {
            backgroundColor: cardBackground,
            borderRadius: theme.radius.md,
          },
          header: {
            backgroundColor: cardBackground,
            padding: theme.spacing.md,
          },
          title: {
            color: primaryTextColor,
            fontSize: theme.fontSizes.lg,
            fontWeight: 600,
          },
        }}
      >
        <Stack gap="md">
          <Box
            p="md"
            style={{
              backgroundColor:
                colorScheme === "dark"
                  ? theme.colors.dark[8]
                  : theme.colors.gray[0],
              borderRadius: theme.radius.md,
              border: `1px solid ${
                colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[2]
              }`,
            }}
          >
            <Text size="sm" fw={600} c={primaryTextColor} mb="xs">
              Request Overview
            </Text>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="xs" c={secondaryTextColor}>
                  Tenant
                </Text>
                <Text size="sm" fw={500} c={primaryTextColor}>
                  {selectedRequest?.user_name}
                </Text>
                <Text size="xs" c={secondaryTextColor}>
                  {selectedRequest?.user_email}
                </Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="xs" c={secondaryTextColor}>
                  Category
                </Text>
                <Text size="sm" c={primaryTextColor}>
                  {selectedRequest?.category}
                </Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="xs" c={secondaryTextColor}>
                  Created Date
                </Text>
                <Text size="sm" c={primaryTextColor}>
                  {formatDate(selectedRequest?.created_at)}
                </Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="xs" c={secondaryTextColor}>
                  Priority
                </Text>
                <Badge
                  color={getPriorityColor(selectedRequest?.priority || "low")}
                  variant="filled"
                  radius="sm"
                  size="sm"
                >
                  {(selectedRequest?.priority || "low").toUpperCase()}
                </Badge>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="xs" c={secondaryTextColor}>
                  Status
                </Text>
                <Badge
                  color={
                    selectedRequest?.status === "pending"
                      ? theme.colors.yellow[6]
                      : selectedRequest?.status === "in-progress"
                        ? theme.colors.blue[6]
                        : selectedRequest?.status === "completed"
                          ? theme.colors.green[6]
                          : theme.colors.red[6]
                  }
                  variant="filled"
                  radius="sm"
                  size="sm"
                >
                  {selectedRequest?.status?.toUpperCase()}
                </Badge>
              </Grid.Col>
              {selectedRequest?.scheduled_date && (
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Text size="xs" c={secondaryTextColor}>
                    Scheduled Date
                  </Text>
                  <Text size="sm" c={primaryTextColor}>
                    {formatDate(selectedRequest.scheduled_date)}
                  </Text>
                </Grid.Col>
              )}
              {selectedRequest?.assigned_technician && (
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Text size="xs" c={secondaryTextColor}>
                    Assigned Technician
                  </Text>
                  <Text size="sm" c={primaryTextColor}>
                    {selectedRequest.assigned_technician}
                  </Text>
                </Grid.Col>
              )}
            </Grid>
          </Box>

          {selectedRequest?.property && (
            <Box
              p="md"
              style={{
                backgroundColor:
                  colorScheme === "dark"
                    ? theme.colors.dark[8]
                    : theme.colors.gray[0],
                borderRadius: theme.radius.md,
                border: `1px solid ${
                  colorScheme === "dark"
                    ? theme.colors.dark[6]
                    : theme.colors.gray[2]
                }`,
              }}
            >
              <Text size="sm" fw={600} c={primaryTextColor} mb="xs">
                Property Information
              </Text>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Text size="xs" c={secondaryTextColor}>
                    Property Title
                  </Text>
                  <Text size="sm" c={primaryTextColor}>
                    {selectedRequest.property.title}
                  </Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Text size="xs" c={secondaryTextColor}>
                    Location
                  </Text>
                  <Text size="sm" c={primaryTextColor}>
                    {selectedRequest.property.location}
                  </Text>
                </Grid.Col>
                {(selectedRequest.property.type === "house-and-lot" ||
                  selectedRequest.property.type === "condo") && (
                  <>
                    {selectedRequest.property.bedrooms &&
                      selectedRequest.property.bedrooms > 0 && (
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <Text size="xs" c={secondaryTextColor}>
                            Bedrooms
                          </Text>
                          <Text size="sm" c={primaryTextColor}>
                            {selectedRequest.property.bedrooms} Bedroom
                            {selectedRequest.property.bedrooms > 1 ? "s" : ""}
                          </Text>
                        </Grid.Col>
                      )}
                    {selectedRequest.property.bathrooms &&
                      selectedRequest.property.bathrooms > 0 && (
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <Text size="xs" c={secondaryTextColor}>
                            Bathrooms
                          </Text>
                          <Text size="sm" c={primaryTextColor}>
                            {selectedRequest.property.bathrooms} Bathroom
                            {selectedRequest.property.bathrooms > 1 ? "s" : ""}
                          </Text>
                        </Grid.Col>
                      )}
                    {selectedRequest.property.sqft &&
                      selectedRequest.property.sqft > 0 && (
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <Text size="xs" c={secondaryTextColor}>
                            Square Footage
                          </Text>
                          <Text size="sm" c={primaryTextColor}>
                            {selectedRequest.property.sqft} sq ft
                          </Text>
                        </Grid.Col>
                      )}
                  </>
                )}
              </Grid>
            </Box>
          )}

          <Divider
            style={{
              borderColor:
                colorScheme === "dark"
                  ? theme.colors.dark[5]
                  : theme.colors.gray[3],
            }}
          />

          <Box>
            <Text size="sm" fw={600} c={primaryTextColor} mb="xs">
              Issue Description
            </Text>
            <Text size="sm" c={primaryTextColor}>
              {selectedRequest?.description}
            </Text>
          </Box>

          {selectedRequest?.images && selectedRequest.images.length > 0 && (
            <Box>
              <Text size="sm" fw={600} c={primaryTextColor} mb="xs">
                Attached Images
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {selectedRequest.images.map((imageUrl, index) => (
                  <MantineImage
                    key={index}
                    src={imageUrl}
                    alt={`Issue image ${index + 1}`}
                    height={180}
                    fit="cover"
                    radius="sm"
                    style={{
                      border: `1px solid ${
                        colorScheme === "dark"
                          ? theme.colors.dark[5]
                          : theme.colors.gray[3]
                      }`,
                      boxShadow: theme.shadows.xs,
                    }}
                  />
                ))}
              </SimpleGrid>
            </Box>
          )}

          {selectedRequest?.assignment_message && (
            <Box>
              <Text size="sm" fw={600} c={primaryTextColor} mb="xs">
                Assignment Message
              </Text>
              <Text size="sm" c={secondaryTextColor}>
                {selectedRequest.assignment_message}
              </Text>
            </Box>
          )}

          {selectedRequest?.technician_notes && (
            <Box>
              <Text size="sm" fw={600} c={primaryTextColor} mb="xs">
                Technician Notes
              </Text>
              <Text size="sm" c={secondaryTextColor}>
                {selectedRequest.technician_notes}
              </Text>
            </Box>
          )}

          {selectedRequest?.estimated_cost && (
            <Box>
              <Text size="sm" fw={600} c={primaryTextColor} mb="xs">
                Estimated Cost
              </Text>
              <Text size="sm" c={primaryTextColor}>
                {formatCurrency(selectedRequest.estimated_cost)}
              </Text>
            </Box>
          )}

          {selectedRequest?.completion_notes && (
            <Box>
              <Text size="sm" fw={600} c={primaryTextColor} mb="xs">
                Completion Notes
              </Text>
              <Text size="sm" c={secondaryTextColor}>
                {selectedRequest.completion_notes}
              </Text>
            </Box>
          )}

          {selectedRequest?.final_cost && (
            <Box>
              <Text size="sm" fw={600} c={primaryTextColor} mb="xs">
                Final Cost
              </Text>
              <Text size="sm" c={primaryTextColor}>
                {formatCurrency(selectedRequest.final_cost)}
              </Text>
            </Box>
          )}

          {selectedRequest?.payment_status && (
            <Box>
              <Text size="sm" fw={600} c={primaryTextColor} mb="xs">
                Payment Status
              </Text>
              <Badge
                color={
                  selectedRequest.payment_status === "paid"
                    ? theme.colors.green[6]
                    : selectedRequest.payment_status === "failed"
                      ? theme.colors.red[6]
                      : theme.colors.yellow[6]
                }
                variant="filled"
                radius="sm"
                size="sm"
              >
                {selectedRequest.payment_status.toUpperCase()}
              </Badge>
            </Box>
          )}

          <Group justify="right">
            <Button
              variant="outline"
              color={colorScheme === "dark" ? "gray.4" : "gray.6"}
              radius="sm"
              onClick={closeView}
            >
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
        styles={{
          content: {
            backgroundColor: cardBackground,
            borderRadius: theme.radius.md,
          },
          header: {
            backgroundColor: cardBackground,
            padding: theme.spacing.md,
          },
          title: {
            color: primaryTextColor,
            fontSize: theme.fontSizes.lg,
            fontWeight: 600,
          },
        }}
      >
        <LoadingOverlay
          visible={submitting}
          overlayProps={{ radius: "sm", blur: 2 }}
          loaderProps={{ color: theme.colors.blue[6], size: "lg" }}
        />
        <Stack gap="md">
          <Box
            p="md"
            style={{
              backgroundColor:
                colorScheme === "dark"
                  ? theme.colors.dark[8]
                  : theme.colors.gray[0],
              borderRadius: theme.radius.md,
              border: `1px solid ${
                colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[2]
              }`,
            }}
          >
            <Text size="sm" fw={600} c={primaryTextColor} mb="xs">
              Request Details
            </Text>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="xs" c={secondaryTextColor}>
                  Tenant
                </Text>
                <Text size="sm" c={primaryTextColor}>
                  {selectedRequest?.user_name}
                </Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="xs" c={secondaryTextColor}>
                  Category
                </Text>
                <Text size="sm" c={primaryTextColor}>
                  {selectedRequest?.category}
                </Text>
              </Grid.Col>
            </Grid>
          </Box>
          <TextInput
            label="Technician Name"
            placeholder="Enter technician name"
            value={technician}
            onChange={(e) => setTechnician(e.currentTarget.value)}
            required
            radius="sm"
            styles={{
              label: {
                color: primaryTextColor,
                fontSize: theme.fontSizes.sm,
                fontWeight: 500,
              },
              input: {
                backgroundColor:
                  colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
                color: primaryTextColor,
                border: `1px solid ${
                  colorScheme === "dark"
                    ? theme.colors.dark[4]
                    : theme.colors.gray[3]
                }`,
              },
            }}
          />
          <TextInput
            label="Scheduled Date"
            type="date"
            placeholder="Select date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.currentTarget.value)}
            required
            radius="sm"
            styles={{
              label: {
                color: primaryTextColor,
                fontSize: theme.fontSizes.sm,
                fontWeight: 500,
              },
              input: {
                backgroundColor:
                  colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
                color: primaryTextColor,
                border: `1px solid ${
                  colorScheme === "dark"
                    ? theme.colors.dark[4]
                    : theme.colors.gray[3]
                }`,
              },
            }}
          />
          <Textarea
            label="Assignment Message"
            placeholder="e.g., Please bear with it, I already sent a technician"
            value={assignmentMessage}
            onChange={(e) => setAssignmentMessage(e.currentTarget.value)}
            autosize
            minRows={2}
            required
            radius="sm"
            styles={{
              label: {
                color: primaryTextColor,
                fontSize: theme.fontSizes.sm,
                fontWeight: 500,
              },
              input: {
                backgroundColor:
                  colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
                color: primaryTextColor,
                border: `1px solid ${
                  colorScheme === "dark"
                    ? theme.colors.dark[4]
                    : theme.colors.gray[3]
                }`,
              },
            }}
          />
          <Group justify="right">
            <Button
              variant="outline"
              color={colorScheme === "dark" ? "gray.4" : "gray.6"}
              radius="sm"
              onClick={closeAssign}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              gradient={{
                from: theme.colors.blue[5],
                to: theme.colors.blue[7],
                deg: 45,
              }}
              radius="sm"
              onClick={assignTechnician}
              loading={submitting}
            >
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
        styles={{
          content: {
            backgroundColor: cardBackground,
            borderRadius: theme.radius.md,
          },
          header: {
            backgroundColor: cardBackground,
            padding: theme.spacing.md,
          },
          title: {
            color: primaryTextColor,
            fontSize: theme.fontSizes.lg,
            fontWeight: 600,
          },
        }}
      >
        <LoadingOverlay
          visible={submitting}
          overlayProps={{ radius: "sm", blur: 2 }}
          loaderProps={{ color: theme.colors.blue[6], size: "lg" }}
        />
        <Stack gap="md">
          <Box
            p="md"
            style={{
              backgroundColor:
                colorScheme === "dark"
                  ? theme.colors.dark[8]
                  : theme.colors.gray[0],
              borderRadius: theme.radius.md,
              border: `1px solid ${
                colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[2]
              }`,
            }}
          >
            <Text size="sm" fw={600} c={primaryTextColor} mb="xs">
              Request Details
            </Text>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="xs" c={secondaryTextColor}>
                  Tenant
                </Text>
                <Text size="sm" c={primaryTextColor}>
                  {selectedRequest?.user_name}
                </Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="xs" c={secondaryTextColor}>
                  Category
                </Text>
                <Text size="sm" c={primaryTextColor}>
                  {selectedRequest?.category}
                </Text>
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
            thousandSeparator=","
            required
            radius="sm"
            styles={{
              label: {
                color: primaryTextColor,
                fontSize: theme.fontSizes.sm,
                fontWeight: 500,
              },
              input: {
                backgroundColor:
                  colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
                color: primaryTextColor,
                border: `1px solid ${
                  colorScheme === "dark"
                    ? theme.colors.dark[4]
                    : theme.colors.gray[3]
                }`,
              },
            }}
          />
          <Textarea
            label="Estimate Notes"
            placeholder="Explanation of costs, parts needed, etc."
            value={estimateNotes}
            onChange={(e) => setEstimateNotes(e.currentTarget.value)}
            autosize
            minRows={3}
            radius="sm"
            styles={{
              label: {
                color: primaryTextColor,
                fontSize: theme.fontSizes.sm,
                fontWeight: 500,
              },
              input: {
                backgroundColor:
                  colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
                color: primaryTextColor,
                border: `1px solid ${
                  colorScheme === "dark"
                    ? theme.colors.dark[4]
                    : theme.colors.gray[3]
                }`,
              },
            }}
          />
          <Group justify="right">
            <Button
              variant="outline"
              color={colorScheme === "dark" ? "gray.4" : "gray.6"}
              radius="sm"
              onClick={closeEstimate}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              gradient={{
                from: theme.colors.blue[5],
                to: theme.colors.blue[7],
                deg: 45,
              }}
              radius="sm"
              onClick={provideEstimate}
              loading={submitting}
            >
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
        styles={{
          content: {
            backgroundColor: cardBackground,
            borderRadius: theme.radius.md,
          },
          header: {
            backgroundColor: cardBackground,
            padding: theme.spacing.md,
          },
          title: {
            color: primaryTextColor,
            fontSize: theme.fontSizes.lg,
            fontWeight: 600,
          },
        }}
      >
        <LoadingOverlay
          visible={submitting}
          overlayProps={{ radius: "sm", blur: 2 }}
          loaderProps={{ color: theme.colors.blue[6], size: "lg" }}
        />
        <Stack gap="md">
          <Box
            p="md"
            style={{
              backgroundColor:
                colorScheme === "dark"
                  ? theme.colors.dark[8]
                  : theme.colors.gray[0],
              borderRadius: theme.radius.md,
              border: `1px solid ${
                colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[2]
              }`,
            }}
          >
            <Text size="sm" fw={600} c={primaryTextColor} mb="xs">
              Request Details
            </Text>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="xs" c={secondaryTextColor}>
                  Tenant
                </Text>
                <Text size="sm" c={primaryTextColor}>
                  {selectedRequest?.user_name}
                </Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="xs" c={secondaryTextColor}>
                  Category
                </Text>
                <Text size="sm" c={primaryTextColor}>
                  {selectedRequest?.category}
                </Text>
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
            thousandSeparator=","
            required
            radius="sm"
            styles={{
              label: {
                color: primaryTextColor,
                fontSize: theme.fontSizes.sm,
                fontWeight: 500,
              },
              input: {
                backgroundColor:
                  colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
                color: primaryTextColor,
                border: `1px solid ${
                  colorScheme === "dark"
                    ? theme.colors.dark[4]
                    : theme.colors.gray[3]
                }`,
              },
            }}
          />
          <Textarea
            label="Completion Notes"
            placeholder="Describe work completed, parts used, etc."
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.currentTarget.value)}
            autosize
            minRows={3}
            radius="sm"
            styles={{
              label: {
                color: primaryTextColor,
                fontSize: theme.fontSizes.sm,
                fontWeight: 500,
              },
              input: {
                backgroundColor:
                  colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
                color: primaryTextColor,
                border: `1px solid ${
                  colorScheme === "dark"
                    ? theme.colors.dark[4]
                    : theme.colors.gray[3]
                }`,
              },
            }}
          />
          <Group justify="right">
            <Button
              variant="outline"
              color={colorScheme === "dark" ? "gray.4" : "gray.6"}
              radius="sm"
              onClick={closeComplete}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              gradient={{
                from: theme.colors.green[5],
                to: theme.colors.green[7],
                deg: 45,
              }}
              radius="sm"
              onClick={completeRequest}
              loading={submitting}
            >
              Mark as Completed
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default ServicesSection;
