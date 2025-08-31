"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Title,
  Button,
  Group,
  Stack,
  Card,
  Text,
  Badge,
  TextInput,
  Select,
  Paper,
  ActionIcon,
  Menu,
  Alert,
  Tooltip,
  Image,
  Avatar,
  Divider,
  Collapse,
  LoadingOverlay,
} from "@mantine/core";
import {
  IconSpeakerphone,
  IconPlus,
  IconSearch,
  IconFilter,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconPin,
  IconChevronDown,
  IconChevronUp,
  IconBell,
  IconCalendar,
  IconTools,
  IconUsers,
  IconAlertTriangle,
  IconInfoCircle,
  IconPinnedOff,
} from "@tabler/icons-react";
import CreateAnnouncementForm from "./_components/create-announcement-form";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: "maintenance" | "event" | "general" | "urgent" | "community";
  priority: "low" | "medium" | "high" | "urgent";
  isPinned: boolean;
  imageUrl?: string;
  author: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  readBy: Array<{
    userId: string;
    userEmail: string;
    readAt: string;
  }>;
}

const AdminAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/announcements");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch announcements");
      }

      setAnnouncements(data.announcements);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "maintenance":
        return <IconTools size={16} />;
      case "event":
        return <IconCalendar size={16} />;
      case "urgent":
        return <IconAlertTriangle size={16} />;
      case "community":
        return <IconUsers size={16} />;
      default:
        return <IconInfoCircle size={16} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "maintenance":
        return "orange";
      case "event":
        return "green";
      case "urgent":
        return "red";
      case "community":
        return "blue";
      default:
        return "gray";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "yellow";
      default:
        return "gray";
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const togglePin = async (
    announcementId: string,
    currentPinStatus: boolean
  ) => {
    try {
      const response = await fetch("/api/announcements", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: announcementId,
          isPinned: !currentPinStatus,
        }),
      });

      if (response.ok) {
        fetchAnnouncements();
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  const filteredAnnouncements = announcements
    .filter(
      (ann) =>
        ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((ann) => !categoryFilter || ann.category === categoryFilter)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <Container size="lg" px={0}>
      <LoadingOverlay visible={loading} />

      <Paper shadow="sm" p="xl" radius="md">
        <Group justify="space-between" mb="xl">
          <Group>
            <IconSpeakerphone size={28} />
            <div>
              <Title order={2}>Manage Announcements</Title>
              <Text size="sm" c="dimmed">
                Create and manage subdivision announcements
              </Text>
            </div>
          </Group>
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={() => setCreateModalOpen(true)}
          >
            New Announcement
          </Button>
        </Group>

        {error && (
          <Alert color="red" mb="md">
            {error}
          </Alert>
        )}

        <Group mb="lg">
          <TextInput
            placeholder="Search announcements..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by category"
            leftSection={<IconFilter size={16} />}
            data={[
              { value: "", label: "All Categories" },
              { value: "maintenance", label: "Maintenance" },
              { value: "event", label: "Events" },
              { value: "general", label: "General" },
              { value: "urgent", label: "Urgent" },
              { value: "community", label: "Community" },
            ]}
            value={categoryFilter}
            onChange={setCategoryFilter}
            clearable
          />
        </Group>

        <Stack gap="md">
          {filteredAnnouncements.map((announcement) => (
            <Card
              key={announcement._id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{
                borderLeft: `4px solid var(--mantine-color-${getPriorityColor(announcement.priority)}-6)`,
              }}
            >
              {announcement.imageUrl && (
                <Image
                  src={announcement.imageUrl}
                  alt={announcement.title}
                  height={200}
                  radius="md"
                  mb="md"
                  fit="cover"
                />
              )}

              <Group justify="space-between" mb="sm">
                <Group>
                  {announcement.isPinned && (
                    <Tooltip label="Pinned announcement">
                      <IconPin size={16} color="var(--mantine-color-red-6)" />
                    </Tooltip>
                  )}
                  <Badge
                    leftSection={getCategoryIcon(announcement.category)}
                    color={getCategoryColor(announcement.category)}
                    variant="light"
                  >
                    {announcement.category.charAt(0).toUpperCase() +
                      announcement.category.slice(1)}
                  </Badge>
                  <Badge
                    color={getPriorityColor(announcement.priority)}
                    variant="outline"
                    size="sm"
                  >
                    {announcement.priority.toUpperCase()}
                  </Badge>
                  <Badge color="blue" variant="light" size="sm">
                    {announcement.readBy.length} reads
                  </Badge>
                </Group>
                <Group>
                  <Text size="sm" c="dimmed">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </Text>
                  <Menu>
                    <Menu.Target>
                      <ActionIcon variant="subtle">
                        <IconDotsVertical size="1rem" />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={
                          announcement.isPinned ? (
                            <IconPinnedOff size="1rem" />
                          ) : (
                            <IconPin size="1rem" />
                          )
                        }
                        onClick={() =>
                          togglePin(announcement._id, announcement.isPinned)
                        }
                      >
                        {announcement.isPinned ? "Unpin" : "Pin"}
                      </Menu.Item>
                      <Menu.Item leftSection={<IconEdit size="1rem" />}>
                        Edit
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        leftSection={<IconTrash size="1rem" />}
                        color="red"
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Group>

              <Title order={4} mb="xs">
                {announcement.title}
              </Title>

              <Collapse in={expandedItems.has(announcement._id)}>
                <Text size="sm" mb="md">
                  {announcement.content}
                </Text>
                <Divider mb="sm" />
                <Group justify="space-between">
                  <Group>
                    <Avatar size="sm" radius="xl">
                      {announcement.author.charAt(0)}
                    </Avatar>
                    <Text size="sm" c="dimmed">
                      Posted by {announcement.author}
                    </Text>
                  </Group>
                </Group>
              </Collapse>

              <Group justify="space-between" mt="md">
                <Text
                  size="sm"
                  c="dimmed"
                  lineClamp={
                    expandedItems.has(announcement._id) ? undefined : 2
                  }
                >
                  {expandedItems.has(announcement._id)
                    ? ""
                    : announcement.content}
                </Text>
                <Button
                  variant="subtle"
                  size="sm"
                  rightSection={
                    expandedItems.has(announcement._id) ? (
                      <IconChevronUp size={16} />
                    ) : (
                      <IconChevronDown size={16} />
                    )
                  }
                  onClick={() => toggleExpanded(announcement._id)}
                >
                  {expandedItems.has(announcement._id)
                    ? "Show Less"
                    : "Read More"}
                </Button>
              </Group>
            </Card>
          ))}
        </Stack>

        {filteredAnnouncements.length === 0 && !loading && (
          <Paper p="xl" ta="center">
            <IconBell size={48} color="var(--mantine-color-gray-4)" />
            <Title order={3} c="dimmed" mt="md">
              No announcements found
            </Title>
            <Text c="dimmed">
              {searchTerm || categoryFilter
                ? "Try adjusting your search or filter criteria."
                : "Create your first announcement to get started."}
            </Text>
          </Paper>
        )}
      </Paper>

      <CreateAnnouncementForm
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchAnnouncements}
      />
    </Container>
  );
};

export default AdminAnnouncementsPage;
