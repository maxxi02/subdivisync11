"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Container,
  Title,
  Group,
  Text,
  TextInput,
  Badge,
  SimpleGrid,
  Modal,
  Stack,
  LoadingOverlay,
  Notification,
  Card,
  useMantineTheme,
  useMantineColorScheme,
  rgba,
  Button as MantineButton,
  ActionIcon,
} from "@mantine/core";
import {
  IconSearch,
  IconEye,
  IconExclamationMark,
  IconFileText,
  IconClock,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import CustomCarousel from "./_components/announcement-carousel";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: "low" | "medium" | "high";
  scheduledDate: string;
  images: { url: string; publicId: string }[];
  created_by: string;
  created_at: string;
  updated_at?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface NotificationType {
  type: "success" | "error";
  message: string;
}

const ViewAnnouncementsPage = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationType | null>(
    null
  );
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 12,
    pages: 1,
  });

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

  const fetchAnnouncements = useCallback(
    async (page = 1, searchTerm = debouncedSearchQuery) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        });
        if (searchTerm) {
          params.append("search", searchTerm);
        }

        const response = await fetch(
          `/api/announcements?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch announcements");
        }
        setAnnouncements(data.announcements);
        setPagination(data.pagination);
        showNotification(
          "success",
          searchTerm
            ? `Found ${data.pagination.total} matching announcements`
            : "Announcements loaded successfully"
        );
      } catch (error) {
        console.error("Error fetching announcements:", error);
        showNotification(
          "error",
          (error as Error).message || "Failed to fetch announcements"
        );
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, debouncedSearchQuery]
  );

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch announcements on mount and when debounced search query or page changes
  useEffect(() => {
    fetchAnnouncements(1, debouncedSearchQuery);
  }, [debouncedSearchQuery, fetchAnnouncements]);

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

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60)
      return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  };

  return (
    <Container size="100%" py="xl">
      <LoadingOverlay visible={loading} />
      {notification && (
        <Notification
          icon={
            notification.type === "success" ? (
              <IconCheck size={18} />
            ) : (
              <IconExclamationMark size={18} />
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
        <Stack gap="xs">
          <Title order={1} size="h2" fw={600} c={primaryTextColor}>
            Community Announcements
          </Title>
          <Text c={primaryTextColor} size="md" lh={1.5}>
            Stay updated with the latest news and updates from our community
          </Text>
        </Stack>

        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          <Card
            shadow="sm"
            padding="lg"
            radius="lg"
            withBorder
            style={{ boxShadow: getDefaultShadow() }}
          >
            <Group justify="space-between" align="center">
              <Stack gap="xs">
                <Text size="sm" c={primaryTextColor} fw={500}>
                  Total Announcements
                </Text>
                <Text size="xl" fw={700} c={primaryTextColor}>
                  {pagination.total}
                </Text>
              </Stack>
              <Group
                className="h-12 w-12 bg-blue-100 rounded-lg"
                justify="center"
              >
                <IconFileText size={24} color="blue" />
              </Group>
            </Group>
          </Card>
          <Card
            shadow="sm"
            padding="lg"
            radius="lg"
            withBorder
            style={{ boxShadow: getDefaultShadow() }}
          >
            <Group justify="space-between" align="center">
              <Stack gap="xs">
                <Text size="sm" c={primaryTextColor} fw={500}>
                  High Priority
                </Text>
                <Text size="xl" fw={700} c="red.6">
                  {announcements.filter((a) => a.priority === "high").length}
                </Text>
              </Stack>
              <Group
                className="h-12 w-12 bg-red-100 rounded-lg"
                justify="center"
              >
                <IconExclamationMark size={24} color="red" />
              </Group>
            </Group>
          </Card>
          <Card
            shadow="sm"
            padding="lg"
            radius="lg"
            withBorder
            style={{ boxShadow: getDefaultShadow() }}
          >
            <Group justify="space-between" align="center">
              <Stack gap="xs">
                <Text size="sm" c={primaryTextColor} fw={500}>
                  Recent Announcements
                </Text>
                <Text size="xl" fw={700} c="green.6">
                  {
                    announcements.filter(
                      (a) =>
                        (new Date().getTime() -
                          new Date(a.created_at).getTime()) /
                          (1000 * 60 * 60 * 24) <
                        7
                    ).length
                  }
                </Text>
              </Stack>
              <Group
                className="h-12 w-12 bg-green-100 rounded-lg"
                justify="center"
              >
                <IconClock size={24} color="green" />
              </Group>
            </Group>
          </Card>
        </SimpleGrid>

        {/* Announcements Grid */}
        <Card
          shadow="sm"
          padding="lg"
          radius="lg"
          withBorder
          style={{ boxShadow: getDefaultShadow() }}
        >
          {announcements.length === 0 && !loading ? (
            <Stack align="center" gap="md" py="xl">
              <IconFileText size={64} color="gray" />
              <Text size="xl" fw={500} c={primaryTextColor}>
                No announcements found
              </Text>
              <Text size="sm" c={primaryTextColor}>
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "No announcements are currently available."}
              </Text>
            </Stack>
          ) : (
            <SimpleGrid cols={{ base: 1, lg: 2, xl: 3 }} spacing="lg">
              {announcements.map((announcement) => (
                <Card
                  key={announcement._id}
                  padding="lg"
                  radius="lg"
                  withBorder
                  style={{
                    boxShadow: getDefaultShadow(),
                  }}
                >
                  <Stack gap="md">
                    {/* Featured Image */}
                    <div
                      style={{
                        position: "relative",
                        height: 200,
                        overflow: "hidden",
                        borderRadius: 8,
                      }}
                    >
                      {announcement.images && announcement.images.length > 0 ? (
                        <Image
                          src={announcement.images[0].url || "/placeholder.svg"}
                          alt={announcement.title}
                          fill
                          style={{
                            objectFit: "cover",
                            transition: "transform 0.3s",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#f3f4f6",
                          }}
                        >
                          <IconFileText size={48} color="gray" />
                        </div>
                      )}
                      <Badge
                        color={getPriorityColor(announcement.priority)}
                        variant="light"
                        size="sm"
                        radius="md"
                        style={{ position: "absolute", top: 12, left: 12 }}
                      >
                        {announcement.priority.charAt(0).toUpperCase() +
                          announcement.priority.slice(1)}
                      </Badge>
                    </div>

                    {/* Content */}
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Group gap="xs">
                          <IconClock size={16} color="gray" />
                          <Text size="sm" c={primaryTextColor}>
                            {getRelativeTime(announcement.created_at)}
                          </Text>
                        </Group>
                        <Badge
                          variant="light"
                          color="gray"
                          size="sm"
                          radius="md"
                        >
                          {announcement.category
                            .replace("-", " ")
                            .toUpperCase()}
                        </Badge>
                      </Group>
                      <Text
                        size="lg"
                        fw={700}
                        c={primaryTextColor}
                        lineClamp={2}
                      >
                        {announcement.title}
                      </Text>
                      <Text size="sm" c={primaryTextColor} lineClamp={3}>
                        {announcement.content}
                      </Text>
                      <MantineButton
                        size="xs"
                        color="blue"
                        onClick={() => {
                          setSelectedAnnouncement(announcement);
                          setViewModalOpen(true);
                          showNotification(
                            "success",
                            "Viewing announcement details"
                          );
                        }}
                        leftSection={<IconEye size={16} />}
                      >
                        View
                      </MantineButton>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Card>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <Group justify="center" mt="lg">
            <MantineButton
              variant="outline"
              color="gray"
              disabled={pagination.page === 1}
              onClick={() =>
                fetchAnnouncements(pagination.page - 1, debouncedSearchQuery)
              }
            >
              Previous
            </MantineButton>
            <Text size="sm" c={primaryTextColor}>
              Page {pagination.page} of {pagination.pages}
            </Text>
            <MantineButton
              variant="outline"
              color="gray"
              disabled={pagination.page === pagination.pages}
              onClick={() =>
                fetchAnnouncements(pagination.page + 1, debouncedSearchQuery)
              }
            >
              Next
            </MantineButton>
          </Group>
        )}

        {/* View Announcement Modal */}
        <Modal
          opened={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedAnnouncement(null);
          }}
          title={
            <Text fw={600} c={primaryTextColor}>
              Announcement Details
            </Text>
          }
          centered
          size="xl"
        >
          {selectedAnnouncement && (
            <Stack gap="md">
              {/* Priority and Category */}
              <Group justify="space-between">
                <Badge
                  color={getPriorityColor(selectedAnnouncement.priority)}
                  variant="light"
                  size="lg"
                  radius="md"
                >
                  {selectedAnnouncement.priority.charAt(0).toUpperCase() +
                    selectedAnnouncement.priority.slice(1)}
                </Badge>
                <Badge variant="light" color="gray" size="sm" radius="md">
                  {selectedAnnouncement.category
                    .replace("-", " ")
                    .toUpperCase()}
                </Badge>
              </Group>

              {/* Images */}
              {selectedAnnouncement.images &&
              selectedAnnouncement.images.length > 0 ? (
                <CustomCarousel
                  images={selectedAnnouncement.images.map((img) => img.url)}
                  height={400}
                  alt={selectedAnnouncement.title}
                />
              ) : (
                <Card
                  shadow="sm"
                  padding="lg"
                  radius="lg"
                  withBorder
                  style={{ boxShadow: getDefaultShadow() }}
                >
                  <Stack align="center" gap="sm">
                    <IconFileText size={64} color="gray" />
                    <Text size="sm" c={primaryTextColor}>
                      No images available
                    </Text>
                  </Stack>
                </Card>
              )}

              {/* Announcement Details */}
              <Card
                shadow="sm"
                padding="lg"
                radius="lg"
                withBorder
                style={{ boxShadow: getDefaultShadow() }}
              >
                <Stack gap="xs">
                  <Text size="sm" c={primaryTextColor}>
                    Title
                  </Text>
                  <Text fw={500} c={primaryTextColor}>
                    {selectedAnnouncement.title}
                  </Text>
                </Stack>
              </Card>

              <Card
                shadow="sm"
                padding="lg"
                radius="lg"
                withBorder
                style={{ boxShadow: getDefaultShadow() }}
              >
                <Stack gap="xs">
                  <Text size="sm" c={primaryTextColor}>
                    Content
                  </Text>
                  <Text c={primaryTextColor} style={{ whiteSpace: "pre-wrap" }}>
                    {selectedAnnouncement.content}
                  </Text>
                </Stack>
              </Card>

              <Card
                shadow="sm"
                padding="lg"
                radius="lg"
                withBorder
                style={{ boxShadow: getDefaultShadow() }}
              >
                <Stack gap="xs">
                  <Text size="sm" c={primaryTextColor}>
                    Published
                  </Text>
                  <Text fw={500} c={primaryTextColor}>
                    {formatDate(selectedAnnouncement.created_at)}
                  </Text>
                  {selectedAnnouncement.updated_at && (
                    <>
                      <Text size="sm" c={primaryTextColor}>
                        Updated
                      </Text>
                      <Text fw={500} c={primaryTextColor}>
                        {formatDate(selectedAnnouncement.updated_at)}
                      </Text>
                    </>
                  )}
                </Stack>
              </Card>

              <MantineButton
                onClick={() => {
                  setViewModalOpen(false);
                  setSelectedAnnouncement(null);
                }}
                variant="outline"
                color="gray"
                fullWidth
              >
                Close
              </MantineButton>
            </Stack>
          )}
        </Modal>
      </Stack>
    </Container>
  );
};

export default ViewAnnouncementsPage;
