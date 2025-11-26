"use client";

import React, { useState, useEffect } from "react";
import {
  Title,
  Text,
  Grid,
  Card,
  Group,
  Stack,
  Badge,
  SimpleGrid,
  Container,
  Flex,
  Box,
  ThemeIcon,
  Notification,
  useMantineTheme,
  useMantineColorScheme,
  rgba,
  Tabs,
  ActionIcon,
  Modal,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconClipboardCheck,
  IconCheck,
  IconX,
  IconStar,
  IconStarFilled,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { getServerSession } from "@/better-auth/action";
import Image from "next/image";
import { Button, Textarea, ScrollArea } from "@mantine/core";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: string;
  scheduledDate: Date;
  images: { url: string }[];
}

interface Property {
  _id: string;
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number;
  downPayment: number;
  monthlyPayment: number;
  interestRate: number;
  leaseDuration: number;
  totalAmount: number;
  startDate: Date;
  currentMonth: number;
  remainingBalance: number;
  nextPaymentDate: Date;
  status: string;
  tenant: {
    fullName: string;
    email: string;
    phone: string;
    created_at: string;
    updated_at: string;
  };
}

interface ServiceRequest {
  id: string;
  category: string;
  description: string;
  status: string;
  created_at: Date;
  priority: "low" | "medium" | "high";
}

interface MonthlyPayment {
  _id: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
}

interface NotificationType {
  type: "success" | "error";
  message: string | React.ReactNode;
}

interface Feedback {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  message: string;
  createdAt: Date;
}

const TenantDashboard = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [payments, setPayments] = useState<MonthlyPayment[]>([]);
  const [notification, setNotification] = useState<NotificationType | null>(
    null
  );
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([]);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("your");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editMessage, setEditMessage] = useState("");

  const primaryTextColor = colorScheme === "dark" ? "white" : "dark";
  const getDefaultShadow = () => {
    const baseShadow = "0 1px 3px";
    const opacity = colorScheme === "dark" ? 0.2 : 0.12;
    return `${baseShadow} ${rgba(theme.black, opacity)}`;
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch("/api/feedbacks?limit=10");
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.feedbacks);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    }
  };

  const fetchAllFeedbacks = async () => {
    try {
      const res = await fetch("/api/feedbacks?limit=20&viewAll=true");
      const data = await res.json();
      if (data.success) {
        setAllFeedbacks(data.feedbacks);
      }
    } catch (error) {
      console.error("Error fetching all feedbacks:", error);
    }
  };

  const handleEditFeedback = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    setEditRating(feedback.rating);
    setEditMessage(feedback.message);
    setEditModalOpen(true);
  };

  const handleUpdateFeedback = async () => {
    if (!editingFeedback || editRating === 0 || !editMessage.trim()) {
      showNotification("error", "Please provide rating and message");
      return;
    }

    setSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedbacks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId: editingFeedback._id,
          rating: editRating,
          message: editMessage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification("success", "Feedback updated successfully!");
        setEditModalOpen(false);
        setEditingFeedback(null);
        fetchFeedbacks();
        if (activeTab === "all") fetchAllFeedbacks();
      } else {
        showNotification("error", data.error || "Failed to update feedback");
      }
    } catch (error) {
      console.error("Error updating feedback:", error);
      showNotification("error", "Failed to update feedback. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm("Are you sure you want to delete this feedback?")) {
      return;
    }

    try {
      const res = await fetch(`/api/feedbacks?id=${feedbackId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        showNotification("success", "Feedback deleted successfully!");
        fetchFeedbacks();
        if (activeTab === "all") fetchAllFeedbacks();
      } else {
        showNotification("error", data.error || "Failed to delete feedback");
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
      showNotification("error", "Failed to delete feedback. Please try again.");
    }
  };

  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) {
      showNotification("error", "Please select a rating");
      return;
    }
    if (!feedbackMessage.trim()) {
      showNotification("error", "Please enter your feedback message");
      return;
    }

    setSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: feedbackRating,
          message: feedbackMessage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification("success", "Feedback submitted successfully!");
        setFeedbackRating(0);
        setFeedbackMessage("");
        fetchFeedbacks(); // Refresh the list
      } else {
        // Check if this is a rate limit error with an existing feedback ID
        if (data.feedbackId) {
          // Find the feedback in the list
          const existingFeedback = feedbacks.find(fb => fb._id === data.feedbackId);
          if (existingFeedback) {
            // Show a friendly notification without action button
            setNotification({
              type: "error",
              message: data.error,
            });
          } else {
            showNotification("error", data.error);
          }
        } else {
          showNotification("error", data.error || "Failed to submit feedback");
        }
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      showNotification("error", "Failed to submit feedback. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getServerSession();
        if (session?.user?.role !== "tenant") {
          router.push("/admin-dashboard");
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        showNotification(
          "error",
          "Failed to verify session. Please try again."
        );
      }
    };
    fetchSession();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch latest announcements (limit to 5)
        const annRes = await fetch("/api/announcements?limit=5&page=1");
        const annData = await annRes.json();
        if (annData.success) {
          setAnnouncements(annData.announcements);
        } else {
          showNotification(
            "error",
            annData.error || "Failed to load announcements"
          );
        }

        // Fetch payment plans
        const propRes = await fetch("/api/tenant/payment-plans");
        const propData = await propRes.json();
        if (propData.success) {
          setProperties(propData.paymentPlans);
        } else {
          showNotification(
            "error",
            propData.error || "Failed to load payment plans"
          );
        }

        // Fetch service requests history
        const srRes = await fetch("/api/service-requests");
        const srData = await srRes.json();
        if (srData.success) {
          setServiceRequests(srData.serviceRequests);
        } else {
          showNotification(
            "error",
            srData.error || "Failed to load service requests"
          );
        }

        // Fetch payments and calculate overdue
        const payRes = await fetch("/api/tenant/monthly-payments");
        const payData = await payRes.json();
        if (payData.success) {
          const today = new Date("2025-09-29"); // Use provided current date
          const updatedPayments = payData.payments.map((p: MonthlyPayment) => {
            if (p.status === "pending" && new Date(p.dueDate) < today) {
              return { ...p, status: "overdue" as const };
            }
            return p;
          });
          setPayments(updatedPayments);
        } else {
          showNotification("error", payData.error || "Failed to load payments");
        }

        // Fetch feedbacks
        await fetchFeedbacks();
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        showNotification(
          "error",
          (error as Error).message ||
            "Failed to load dashboard data. Please try again."
        );
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "all") {
      fetchAllFeedbacks();
    }
  }, [activeTab]);
  const stats = [
    {
      title: "Announcements",
      value: announcements.length.toString(),
      icon: IconAlertCircle,
      color: "teal",
    },
    {
      title: "Pending Requests",
      value: serviceRequests
        .filter((s) => s.status === "pending")
        .length.toString(),
      icon: IconClipboardCheck,
      color: "yellow",
    },
    {
      title: "In Progress",
      value: serviceRequests
        .filter((s) => s.status === "in-progress")
        .length.toString(),
      icon: IconClipboardCheck,
      color: "blue",
    },
    {
      title: "Completed",
      value: serviceRequests
        .filter((s) => s.status === "completed")
        .length.toString(),
      icon: IconCheck,
      color: "green",
    },
    {
      title: "High Priority",
      value: serviceRequests // Changed from announcements
        .filter((s) => s.priority === "high") // Changed from a.priority
        .length.toString(),
      icon: IconAlertCircle,
      color: "red",
    },
  ];

  return (
    <Container size="100%" py="xl">
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
          title={notification.type === "success" ? "Success" : ""}
          onClose={() => setNotification(null)}
          style={{ position: "fixed", top: 20, right: 20, zIndex: 1000 }}
        >
          {notification.message}
        </Notification>
      )}
      <Stack gap="xl">
        <Box py="md">
          <Title order={1} size="h2" fw={600} c={primaryTextColor}>
            Homeowner&#39;s Dashboard
          </Title>
          <Text c={primaryTextColor} size="md" lh={1.5}>
            Welcome back! Here&#39;s what&#39;s happening with your dashboard
            today.
          </Text>
        </Box>

        <SimpleGrid
          cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 5 }}
          spacing={{ base: "md", sm: "lg" }}
          verticalSpacing={{ base: "md", sm: "lg" }}
          style={{ width: "100%" }}
        >
          {stats.map((stat) => (
            <Card
              key={stat.title}
              padding="md"
              radius="md"
              withBorder
              style={{
                backgroundColor: "white",
                boxShadow: getDefaultShadow(),
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                cursor: "pointer",
                minWidth: 0,
                width: "100%",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = getDefaultShadow();
              }}
            >
              <Group 
                align="center" 
                gap="sm"
                wrap="wrap"
                style={{ width: "100%" }}
              >
                <ThemeIcon
                  variant="filled"
                  color={stat.color}
                  size="lg"
                  radius="md"
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                  }}
                >
                  <stat.icon size={18} />
                </ThemeIcon>
                <Stack gap={2} style={{ flex: 1, minWidth: "100px" }}>
                  <Text
                    c="dimmed"
                    size="xs"
                    tt="uppercase"
                    fw={600}
                    lts={0.5}
                    role="heading"
                    aria-level={3}
                    style={{
                      wordBreak: "break-word",
                      lineHeight: 1.3,
                    }}
                  >
                    {stat.title}
                  </Text>
                  <Text
                    fw={700}
                    size="lg"
                    c="black"
                    lh={1.2}
                  >
                    {stat.value}
                  </Text>
                </Stack>
              </Group>
            </Card>
          ))}
        </SimpleGrid>

        <Grid gutter={{ base: "md", md: "xl" }}>
          {/* Left Column - Announcements and Service Requests */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Stack gap="xl">
              {/* Latest Announcements with Images */}
            <Card
              padding="xl"
              radius="lg"
              withBorder
              style={{ boxShadow: getDefaultShadow() }}
            >
              <Stack gap="lg">
                <Group justify="space-between" align="center">
                  <Title order={3} size="h4" fw={600} c={primaryTextColor}>
                    Latest Announcements
                  </Title>
                  <span
                    className="text-blue-500 p-1 text-sm cursor-pointer hover:underline"
                    onClick={() => router.push("/view-announcements")}
                  >
                    View All
                  </span>
                </Group>
                <Stack gap="xl">
                  {announcements.length === 0 ? (
                    <Text c={primaryTextColor}>
                      No announcements available.
                    </Text>
                  ) : (
                    announcements.map((ann) => (
                      <Card
                        key={ann._id}
                        padding="md"
                        radius="md"
                        withBorder
                        style={{
                          backgroundColor:
                            colorScheme === "dark"
                              ? theme.colors.dark[6]
                              : theme.white,
                          minWidth: 0,
                          width: "100%",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <Grid gutter="md" style={{ minWidth: 0 }}>
                          {/* Image Section */}
                          {ann.images && ann.images.length > 0 && (
                            <Grid.Col span={{ base: 12, sm: 4 }}>
                              <Box
                                style={{
                                  width: "100%",
                                  height: 150,
                                  borderRadius: theme.radius.md,
                                  overflow: "hidden",
                                  backgroundColor:
                                    colorScheme === "dark"
                                      ? theme.colors.dark[5]
                                      : theme.colors.gray[1],
                                }}
                              >
                                <Image
                                  width={500}
                                  height={500}
                                  src={ann.images[0].url}
                                  alt={ann.title}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              </Box>
                            </Grid.Col>
                          )}

                          {/* Content Section */}
                          <Grid.Col
                            span={{
                              base: 12,
                              sm: ann.images && ann.images.length > 0 ? 8 : 12,
                            }}
                          >
                            <Stack gap="xs" style={{ minWidth: 0 }}>
                              <Group 
                                justify="space-between" 
                                align="flex-start"
                                wrap="nowrap"
                                gap="xs"
                                style={{ minWidth: 0 }}
                              >
                                <Title
                                  order={4}
                                  size="h5"
                                  fw={600}
                                  c={primaryTextColor}
                                  style={{ 
                                    flex: 1,
                                    minWidth: 0,
                                    fontSize: "clamp(0.875rem, 2vw, 1rem)",
                                  }}
                                >
                                  {ann.title}
                                </Title>
                                <Badge
                                  color={
                                    ann.priority === "high"
                                      ? "red"
                                      : ann.priority === "medium"
                                        ? "yellow"
                                        : "green"
                                  }
                                  variant="light"
                                  size="sm"
                                  radius="md"
                                  style={{ flexShrink: 0 }}
                                >
                                  {ann.priority}
                                </Badge>
                              </Group>

                              <Text
                                size="xs"
                                c={primaryTextColor}
                                lineClamp={2}
                                style={{
                                  wordBreak: "break-word",
                                  overflowWrap: "break-word",
                                  fontSize: "clamp(0.75rem, 1.5vw, 0.875rem)",
                                }}
                              >
                                {ann.content}
                              </Text>

                              <Group gap="xs" mt="xs" wrap="nowrap">
                                <IconAlertCircle
                                  size={14}
                                  style={{
                                    flexShrink: 0,
                                    width: "clamp(0.75rem, 1.5vw, 0.875rem)",
                                    height: "clamp(0.75rem, 1.5vw, 0.875rem)",
                                  }}
                                  color={
                                    colorScheme === "dark"
                                      ? theme.colors.gray[5]
                                      : theme.colors.gray[6]
                                  }
                                />
                                <Text
                                  size="xs"
                                  c={
                                    colorScheme === "dark"
                                      ? theme.colors.gray[5]
                                      : theme.colors.gray[6]
                                  }
                                  style={{
                                    fontSize: "clamp(0.65rem, 1.5vw, 0.75rem)",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  Posted on{" "}
                                  {new Date(
                                    ann.scheduledDate
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </Text>
                              </Group>
                            </Stack>
                          </Grid.Col>
                        </Grid>
                      </Card>
                    ))
                  )}
                </Stack>
              </Stack>
            </Card>

            {/* Service Requests */}
            <Card
              padding="xl"
              radius="lg"
              withBorder
              style={{ boxShadow: getDefaultShadow() }}
            >
              <Stack gap="lg">
                <Group justify="space-between" align="center">
                  <Title order={3} size="h4" fw={600} c={primaryTextColor}>
                    Service Requests
                  </Title>
                  <span
                    className="text-blue-500 p-1 text-sm cursor-pointer hover:underline"
                    onClick={() => router.push("/service-requests")}
                  >
                    View All
                  </span>
                </Group>
                <Stack gap="md">
                  {serviceRequests.length === 0 ? (
                    <Text c={primaryTextColor}>No service requests.</Text>
                  ) : (
                    serviceRequests.slice(0, 5).map((sr) => (
                      <Card
                        key={sr.id}
                        padding="sm"
                        radius="md"
                        withBorder
                        style={{
                          backgroundColor:
                            colorScheme === "dark"
                              ? theme.colors.dark[6]
                              : theme.colors.gray[0],
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <Stack gap="xs">
                          <Group justify="space-between" align="flex-start">
                            <Text size="sm" fw={600} c={primaryTextColor}>
                              {sr.category}
                            </Text>
                            <Badge
                              color={
                                sr.status === "completed"
                                  ? "green"
                                  : sr.status === "in-progress"
                                    ? "blue"
                                    : sr.status === "cancelled"
                                      ? "red"
                                      : "yellow"
                              }
                              variant="light"
                              size="xs"
                              radius="md"
                            >
                              {sr.status}
                            </Badge>
                          </Group>

                          <Text size="xs" c={primaryTextColor} lineClamp={2}>
                            {sr.description}
                          </Text>

                          <Group gap="xs" mt="xs">
                            <IconClipboardCheck
                              size={14}
                              color={
                                colorScheme === "dark"
                                  ? theme.colors.gray[6]
                                  : theme.colors.gray[5]
                              }
                            />
                            <Text
                              size="xs"
                              c={
                                colorScheme === "dark"
                                  ? theme.colors.gray[6]
                                  : theme.colors.gray[5]
                              }
                            >
                              {new Date(sr.created_at).toLocaleDateString()}
                            </Text>
                          </Group>
                        </Stack>
                      </Card>
                    ))
                  )}
                </Stack>
              </Stack>
            </Card>
            </Stack>
          </Grid.Col>

          {/* Right Column - Feedback Section */}
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Card
              padding="xl"
              radius="lg"
              withBorder
              style={{ 
                boxShadow: getDefaultShadow(),
                height: "100%",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <Stack gap="lg" style={{ flex: 1 }}>
                <Title order={3} size="h4" fw={600} c={primaryTextColor}>
                  Feedback
                </Title>

                {/* Feedback Form */}
                <Stack gap="md">
                  <Box>
                    <Text size="sm" fw={500} c={primaryTextColor} mb="xs">
                      Rate your experience
                    </Text>
                    <Group gap="xs">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Box
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          style={{ cursor: "pointer" }}
                        >
                          {star <= feedbackRating ? (
                            <IconStarFilled
                              size={28}
                              color={theme.colors.yellow[6]}
                            />
                          ) : (
                            <IconStar
                              size={28}
                              color={theme.colors.gray[4]}
                            />
                          )}
                        </Box>
                      ))}
                    </Group>
                  </Box>

                  <Textarea
                    placeholder="Share your feedback with us..."
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.currentTarget.value)}
                    minRows={3}
                    maxRows={4}
                    styles={{
                      input: {
                        backgroundColor:
                          colorScheme === "dark"
                            ? theme.colors.dark[6]
                            : theme.white,
                      },
                    }}
                  />

                  <Button
                    onClick={handleSubmitFeedback}
                    loading={submittingFeedback}
                    disabled={feedbackRating === 0 || !feedbackMessage.trim()}
                  >
                    Submit Feedback
                  </Button>
                </Stack>

                {/* Feedback List with Tabs */}
                <Box style={{ flex: 1, minHeight: 0 }}>
                  <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List mb="md">
                      <Tabs.Tab value="your">Your Feedback</Tabs.Tab>
                      <Tabs.Tab value="all">All Feedbacks</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="your">
                      <ScrollArea style={{ height: "400px" }}>
                        <Stack gap="md">
                          {feedbacks.length === 0 ? (
                            <Text size="sm" c="dimmed">
                              No feedback submitted yet.
                            </Text>
                          ) : (
                            feedbacks.map((fb) => (
                              <Card
                                key={fb._id}
                                padding="md"
                                radius="md"
                                withBorder
                                style={{
                                  backgroundColor:
                                    colorScheme === "dark"
                                      ? theme.colors.dark[6]
                                      : theme.colors.gray[0],
                                  transition: "all 0.2s ease",
                                  cursor: "default",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-2px)";
                                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "none";
                                }}
                              >
                                <Stack gap="xs">
                                  <Group justify="space-between" align="flex-start">
                                    <Group gap="xs">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Box key={star}>
                                          {star <= fb.rating ? (
                                            <IconStarFilled
                                              size={16}
                                              color={theme.colors.yellow[6]}
                                            />
                                          ) : (
                                            <IconStar
                                              size={16}
                                              color={theme.colors.gray[4]}
                                            />
                                          )}
                                        </Box>
                                      ))}
                                    </Group>
                                    <Group gap="xs">
                                      <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        color="blue"
                                        onClick={() => handleEditFeedback(fb)}
                                      >
                                        <IconEdit size={16} />
                                      </ActionIcon>
                                      <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        color="red"
                                        onClick={() => handleDeleteFeedback(fb._id)}
                                      >
                                        <IconTrash size={16} />
                                      </ActionIcon>
                                    </Group>
                                  </Group>
                                  <Text size="xs" c="dimmed">
                                    {new Date(fb.createdAt).toLocaleDateString()} at{" "}
                                    {new Date(fb.createdAt).toLocaleTimeString()}
                                  </Text>
                                  <Text size="sm" c={primaryTextColor}>
                                    {fb.message}
                                  </Text>
                                </Stack>
                              </Card>
                            ))
                          )}
                        </Stack>
                      </ScrollArea>
                    </Tabs.Panel>

                    <Tabs.Panel value="all">
                      <ScrollArea style={{ height: "400px" }}>
                        <Stack gap="md">
                          {allFeedbacks.length === 0 ? (
                            <Text size="sm" c="dimmed">
                              No feedbacks available.
                            </Text>
                          ) : (
                            allFeedbacks.map((fb) => (
                              <Card
                                key={fb._id}
                                padding="md"
                                radius="md"
                                withBorder
                                style={{
                                  backgroundColor:
                                    colorScheme === "dark"
                                      ? theme.colors.dark[6]
                                      : theme.colors.gray[0],
                                  transition: "all 0.2s ease",
                                  cursor: "default",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-2px)";
                                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "none";
                                }}
                              >
                                <Stack gap="xs">
                                  <Group justify="space-between" align="flex-start">
                                    <Group gap="xs">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Box key={star}>
                                          {star <= fb.rating ? (
                                            <IconStarFilled
                                              size={16}
                                              color={theme.colors.yellow[6]}
                                            />
                                          ) : (
                                            <IconStar
                                              size={16}
                                              color={theme.colors.gray[4]}
                                            />
                                          )}
                                        </Box>
                                      ))}
                                    </Group>
                                  </Group>
                                  <Group justify="space-between" align="center">
                                    <Text size="xs" fw={500} c={primaryTextColor}>
                                      {fb.userName?.split(' ')[0] || "Anonymous"}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                      {new Date(fb.createdAt).toLocaleDateString()}
                                    </Text>
                                  </Group>
                                  <Text size="sm" c={primaryTextColor}>
                                    {fb.message}
                                  </Text>
                                </Stack>
                              </Card>
                            ))
                          )}
                        </Stack>
                      </ScrollArea>
                    </Tabs.Panel>
                  </Tabs>
                </Box>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>

      {/* Edit Feedback Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingFeedback(null);
        }}
        title="Edit Feedback"
        size="md"
      >
        <Stack gap="md">
          <Box>
            <Text size="sm" fw={500} c={primaryTextColor} mb="xs">
              Rating
            </Text>
            <Group gap="xs">
              {[1, 2, 3, 4, 5].map((star) => (
                <Box
                  key={star}
                  onClick={() => setEditRating(star)}
                  style={{ cursor: "pointer" }}
                >
                  {star <= editRating ? (
                    <IconStarFilled
                      size={28}
                      color={theme.colors.yellow[6]}
                    />
                  ) : (
                    <IconStar
                      size={28}
                      color={theme.colors.gray[4]}
                    />
                  )}
                </Box>
              ))}
            </Group>
          </Box>

          <Textarea
            label="Message"
            placeholder="Share your feedback..."
            value={editMessage}
            onChange={(e) => setEditMessage(e.currentTarget.value)}
            minRows={4}
            maxRows={6}
          />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              onClick={() => {
                setEditModalOpen(false);
                setEditingFeedback(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateFeedback}
              loading={submittingFeedback}
              disabled={editRating === 0 || !editMessage.trim()}
            >
              Update Feedback
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default TenantDashboard;
