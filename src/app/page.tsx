"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Card,
  Badge,
  Avatar,
  Alert,
  Group,
  Stack,
  Flex,
  Loader,
  Center,
  Grid,
  Paper,
  Divider,
  Box,
  Anchor,
  AppShell,
  Image,
} from "@mantine/core";
import {
  IconCalendar,
  IconClock,
  IconArrowRight,
  IconShare,
  IconBookmark,
  IconAlertCircle,
  IconPin,
  IconUsers,
  IconSpeakerphone,
  IconChevronLeft,
  IconHome,
  IconBuilding,
  IconShield,
  IconBell,
} from "@tabler/icons-react";
import axios from "axios";
import type { Session } from "@/better-auth/auth-types";
import { Home } from "lucide-react";
import Link from "next/link";

// Types
interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  isPinned: boolean;
  imageUrl?: string;
  author: string;
  authorId: string;
  authorEmail: string;
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  isActive: boolean;
  readBy: Array<{
    userId: string;
    userEmail: string;
    readAt: string;
  }>;
  imageMetadata?: {
    originalName: string;
    size: number;
    type: string;
    uploadedAt: string;
    cloudinaryUrl?: string;
  };
}

const HomePageWidgets = ({ user }: { user: Session | null }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  // Fetch announcements from API
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/announcements", {
        params: {
          limit: 5, // Get latest 5 announcements for homepage
        },
      });

      if (response.data.success) {
        setAnnouncements(response.data.announcements);
      } else {
        setError("Failed to fetch announcements");
      }
    } catch (err) {
      setError("Error loading announcements");
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mark announcement as read
  const markAsRead = async (announcementId: string) => {
    if (!user) return;

    try {
      await axios.post("/api/announcements/read", {
        announcementId,
      });

      // Update local state
      setAnnouncements((prev) =>
        prev.map((ann) =>
          ann._id === announcementId
            ? {
                ...ann,
                readBy: [
                  ...ann.readBy.filter((r) => r.userId !== user.user.id),
                  {
                    userId: user.user.id,
                    userEmail: user.user.email,
                    readAt: new Date().toISOString(),
                  },
                ],
              }
            : ann
        )
      );

      // Update selected announcement if it's the same one
      if (selectedAnnouncement && selectedAnnouncement._id === announcementId) {
        setSelectedAnnouncement((prev) =>
          prev
            ? {
                ...prev,
                readBy: [
                  ...prev.readBy.filter((r) => r.userId !== user.user.id),
                  {
                    userId: user.user.id,
                    userEmail: user.user.email,
                    readAt: new Date().toISOString(),
                  },
                ],
              }
            : null
        );
      }
    } catch (err) {
      console.error("Error marking announcement as read:", err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "red";
      case "high":
        return "blue"; // Changed from orange to blue
      case "medium":
        return "blue";
      case "low":
        return "gray";
      default:
        return "gray";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "maintenance":
        return "🔧";
      case "event":
        return "📅";
      case "security":
        return "🔒";
      case "community":
        return "👥";
      case "urgent":
        return "🚨";
      case "general":
        return "📢";
      default:
        return "📢";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasUserRead = (announcement: Announcement) => {
    return user
      ? announcement.readBy.some((r) => r.userId === user.user.id)
      : false;
  };

  // Single announcement view
  if (selectedAnnouncement) {
    return (
      <AppShell>
        <AppShell.Header
          p="md"
          style={{ position: "sticky", top: 0, zIndex: 50 }}
        >
          <Container size="xl">
            <Flex justify="space-between" align="center" h="100%">
              <Group>
                <IconSpeakerphone
                  size={24}
                  color="var(--mantine-color-blue-6)"
                />
                <Title order={3}>SubdiviSync</Title>
              </Group>
              <Button
                variant="subtle"
                onClick={() => setSelectedAnnouncement(null)}
                leftSection={<IconChevronLeft size={16} />}
              >
                Back to Home
              </Button>
            </Flex>
          </Container>
        </AppShell.Header>

        <Container size="lg" py="xl">
          <Stack gap="xl">
            {/* Header Section */}
            <Stack gap="md" align="center">
              <Group gap="xs">
                <Badge
                  color={getPriorityColor(selectedAnnouncement.priority)}
                  size="lg"
                >
                  {getCategoryIcon(selectedAnnouncement.category)}{" "}
                  {selectedAnnouncement.category}
                </Badge>
                {selectedAnnouncement.isPinned && (
                  <Badge
                    color="gray"
                    size="lg"
                    leftSection={<IconPin size={12} />}
                  >
                    Pinned
                  </Badge>
                )}
              </Group>

              <Title
                order={1}
                size="h1"
                ta="center"
                style={{ lineHeight: 1.2 }}
              >
                {selectedAnnouncement.title}
              </Title>

              <Text size="xl" c="dimmed" ta="center" style={{ maxWidth: 600 }}>
                {selectedAnnouncement.content.length > 200
                  ? `${selectedAnnouncement.content.substring(0, 200)}...`
                  : selectedAnnouncement.content}
              </Text>
            </Stack>

            {/* Author Info */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Flex justify="space-between" align="center">
                <Group gap="md">
                  <Avatar size="lg" radius="xl">
                    {selectedAnnouncement.author.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <Text fw={600}>{selectedAnnouncement.author}</Text>
                    <Text size="sm" c="dimmed">
                      {selectedAnnouncement.authorEmail}
                    </Text>
                  </div>
                </Group>
                <Stack gap={4} align="flex-end">
                  <Group gap={4}>
                    <IconCalendar size={16} />
                    <Text size="sm" c="dimmed">
                      {formatDate(selectedAnnouncement.createdAt)}
                    </Text>
                  </Group>
                  <Group gap={4}>
                    <IconClock size={16} />
                    <Text size="sm" c="dimmed">
                      Priority: {selectedAnnouncement.priority}
                    </Text>
                  </Group>
                </Stack>
              </Flex>
            </Card>

            {/* Featured Image */}
            {selectedAnnouncement.imageUrl && (
              <Image
                src={selectedAnnouncement.imageUrl || "/placeholder.svg"}
                alt={selectedAnnouncement.title}
                radius="md"
                h={400}
                fit="cover"
                style={{
                  height: "200px",
                  "@media (min-width: 768px)": {
                    height: "400px",
                  },
                }}
              />
            )}

            {/* Content */}
            <Paper p="xl" radius="md">
              <Text size="lg" style={{ lineHeight: 1.6 }}>
                {selectedAnnouncement.content}
              </Text>
            </Paper>

            {/* Action Section */}
            {user && (
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                style={{
                  backgroundColor: hasUserRead(selectedAnnouncement)
                    ? "var(--mantine-color-green-6)"
                    : "var(--mantine-color-blue-6)",
                  color: "white",
                }}
              >
                <Stack gap="md" align="center">
                  <Title order={3} c="white">
                    {hasUserRead(selectedAnnouncement)
                      ? "Thank You!"
                      : "Action Required"}
                  </Title>
                  <Text c="white" opacity={0.9} ta="center">
                    {hasUserRead(selectedAnnouncement)
                      ? "You have already read this announcement."
                      : "Please confirm that you have read and understood this announcement."}
                  </Text>
                  {!hasUserRead(selectedAnnouncement) && (
                    <Button
                      size="lg"
                      variant="white"
                      color="blue"
                      rightSection={<IconArrowRight size={16} />}
                      onClick={() => markAsRead(selectedAnnouncement._id)}
                    >
                      Mark as Read & Acknowledge
                    </Button>
                  )}
                </Stack>
              </Card>
            )}

            {/* Social Actions */}
            <div>
              <Divider />
              <Flex justify="space-between" align="center" pt="md">
                <Group gap="xs">
                  <Button
                    variant="outline"
                    size="sm"
                    leftSection={<IconShare size={16} />}
                  >
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftSection={<IconBookmark size={16} />}
                  >
                    Save
                  </Button>
                </Group>
                <Text size="sm" c="dimmed">
                  {selectedAnnouncement.readBy.length} residents have read this
                  announcement
                </Text>
              </Flex>
            </div>
          </Stack>
        </Container>
      </AppShell>
    );
  }

  // Main homepage view
  return (
    <AppShell>
      <AppShell.Header
        p="md"
        style={{ position: "sticky", top: 0, zIndex: 50 }}
      >
        <Container size="xl">
          <Flex justify="space-between" align="center" h="100%">
            <Group gap="xs">
              <Home size={24} color="var(--mantine-color-blue-6)" />
              <Title order={3}>SubdiviSync</Title>
            </Group>
            <Group gap="xl" visibleFrom="md">
              <Anchor href="#features" size="sm" fw={500}>
                Features
              </Anchor>
              <Anchor href="#announcements" size="sm" fw={500}>
                Updates
              </Anchor>
              <Anchor href="#contact" size="sm" fw={500}>
                Contact
              </Anchor>
            </Group>
          </Flex>
        </Container>
      </AppShell.Header>

      {/* Hero Section */}
      <Box
        py={60}
        px="md"
        style={{
          background:
            "linear-gradient(135deg, var(--mantine-color-blue-6) 0%, var(--mantine-color-cyan-5) 100%)",
          "@media (min-width: 768px)": {
            paddingTop: "100px",
            paddingBottom: "100px",
          },
        }}
      >
        <Container size="lg">
          <Stack gap="xl" align="center">
            <Title order={1} ta="center" c="white" style={{ lineHeight: 1.1 }}>
              Your Subdivision,{" "}
              <Text component="span" c="blue.2" inherit>
                {" "}
                Connected
              </Text>
            </Title>

            <Text
              c="blue.1"
              ta="center"
              style={{ maxWidth: 700, lineHeight: 1.6 }}
            >
              SubdiviSync brings your community together with seamless
              communication, property management, and neighborhood services.
              Stay connected, stay informed, stay secure.
            </Text>

            <Group gap="md" pt="md" justify="center">
              <Button
                color="blue"
                variant="white"
                c="blue"
                rightSection={<IconArrowRight size={20} />}
              >
                <Link href={"/login"}>Join Your Community</Link>
              </Button>
              <Button
                variant="outline"
                c="white"
                style={{ borderColor: "white" }}
              >
                Learn More
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box
        py={40}
        px="md"
        style={{
          backgroundColor: "var(--mantine-color-gray-0)",
          "@media (min-width: 768px)": {
            paddingTop: "64px",
            paddingBottom: "64px",
          },
        }}
      >
        <Container size="xl">
          <Grid gutter="md">
            <Grid.Col span={{ base: 6, sm: 6, md: 3 }}>
              <Stack gap="xs" align="center">
                <IconHome size={32} color="var(--mantine-color-blue-6)" />
                <Title order={2} c="blue">
                  500+
                </Title>
                <Text c="dimmed" ta="center" size="sm">
                  Connected Properties
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 6, md: 3 }}>
              <Stack gap="xs" align="center">
                <IconUsers size={32} color="var(--mantine-color-blue-6)" />
                <Title order={2} c="blue">
                  1,200+
                </Title>
                <Text c="dimmed" ta="center" size="sm">
                  Active Residents
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 6, md: 3 }}>
              <Stack gap="xs" align="center">
                <IconShield size={32} color="var(--mantine-color-blue-6)" />
                <Title order={2} c="blue">
                  24/7
                </Title>
                <Text c="dimmed" ta="center" size="sm">
                  Security Monitoring
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 6, md: 3 }}>
              <Stack gap="xs" align="center">
                <IconBell size={32} color="var(--mantine-color-blue-6)" />
                <Title order={2} c="blue">
                  {announcements.length}
                </Title>
                <Text c="dimmed" ta="center" size="sm">
                  Recent Updates
                </Text>
              </Stack>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box
        id="features"
        py={60}
        px="md"
        style={{
          "@media (min-width: 768px)": {
            paddingTop: "80px",
            paddingBottom: "80px",
          },
        }}
      >
        <Container size="xl">
          <Stack gap="xl" align="center" mb="xl">
            <Title
              order={2}
              size="2rem"
              ta="center"
              style={{
                "@media (min-width: 768px)": {
                  fontSize: "2.5rem",
                },
              }}
            >
              Everything Your Community Needs
            </Title>
            <Text size="md" c="dimmed" ta="center" style={{ maxWidth: 600 }}>
              From announcements to security, property management to community
              events - we&#39;ve got your subdivision covered.
            </Text>
          </Stack>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card
                shadow="md"
                padding="lg"
                radius="md"
                h="100%"
                style={{
                  background:
                    "linear-gradient(135deg, var(--mantine-color-blue-0) 0%, var(--mantine-color-blue-1) 100%)",
                }}
              >
                <Stack gap="md" align="center" h="100%">
                  <IconSpeakerphone
                    size={48}
                    color="var(--mantine-color-blue-6)"
                  />
                  <Title order={3} ta="center" size="h4">
                    Community Announcements
                  </Title>
                  <Text c="dimmed" ta="center" style={{ flex: 1 }} size="sm">
                    Stay informed with real-time updates from your homeowners
                    association, security alerts, and community events.
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card
                shadow="md"
                padding="lg"
                radius="md"
                h="100%"
                style={{
                  background:
                    "linear-gradient(135deg, var(--mantine-color-blue-0) 0%, var(--mantine-color-blue-1) 100%)",
                }}
              >
                <Stack gap="md" align="center" h="100%">
                  <IconBuilding size={48} color="var(--mantine-color-blue-6)" />
                  <Title order={3} ta="center" size="h4">
                    Property Management
                  </Title>
                  <Text c="dimmed" ta="center" style={{ flex: 1 }} size="sm">
                    Manage your property details, track maintenance requests,
                    and communicate with property managers seamlessly.
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card
                shadow="md"
                padding="lg"
                radius="md"
                h="100%"
                style={{
                  background:
                    "linear-gradient(135deg, var(--mantine-color-blue-0) 0%, var(--mantine-color-blue-1) 100%)",
                }}
              >
                <Stack gap="md" align="center" h="100%">
                  <IconShield size={48} color="var(--mantine-color-blue-6)" />
                  <Title order={3} ta="center" size="h4">
                    Security & Safety
                  </Title>
                  <Text c="dimmed" ta="center" style={{ flex: 1 }} size="sm">
                    Enhanced security features with visitor management, incident
                    reporting, and emergency notification systems.
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* Announcements Section */}
      <Box
        id="announcements"
        py={60}
        px="md"
        style={{
          backgroundColor: "var(--mantine-color-gray-0)",
          "@media (min-width: 768px)": {
            paddingTop: "80px",
            paddingBottom: "80px",
          },
        }}
      >
        <Container size="xl">
          <Stack gap="xl" align="center" mb="xl">
            <Title
              order={2}
              size="2rem"
              style={{
                "@media (min-width: 768px)": {
                  fontSize: "2.5rem",
                },
              }}
            >
              Latest Community Updates
            </Title>
            <Text size="md" c="dimmed">
              Stay informed with the most recent news from your subdivision
            </Text>
          </Stack>

          {loading ? (
            <Center py={48}>
              <Stack gap="md" align="center">
                <Loader size="lg" />
                <Text c="dimmed">Loading community updates...</Text>
              </Stack>
            </Center>
          ) : error ? (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {error}
            </Alert>
          ) : announcements.length === 0 ? (
            <Center py={48}>
              <Stack gap="md" align="center">
                <IconSpeakerphone
                  size={64}
                  color="var(--mantine-color-gray-5)"
                />
                <Title order={3}>No announcements yet</Title>
                <Text c="dimmed">Check back soon for community updates</Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap="lg">
              {announcements.map((announcement) => (
                <Card
                  key={announcement._id}
                  shadow="sm"
                  padding="lg"
                  radius="md"
                  withBorder
                  style={{
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    borderLeft: announcement.isPinned
                      ? "4px solid var(--mantine-color-blue-6)"
                      : undefined,
                  }}
                  onClick={() => setSelectedAnnouncement(announcement)}
                >
                  <Stack gap="md">
                    <Flex justify="space-between" align="flex-start" gap="md">
                      <Stack gap="sm" style={{ flex: 1 }}>
                        <Group gap="xs">
                          <Badge
                            color={getPriorityColor(announcement.priority)}
                          >
                            {getCategoryIcon(announcement.category)}{" "}
                            {announcement.category}
                          </Badge>
                          {announcement.isPinned && (
                            <Badge
                              color="gray"
                              leftSection={<IconPin size={12} />}
                            >
                              Pinned
                            </Badge>
                          )}
                          {user && !hasUserRead(announcement) && (
                            <Badge variant="outline" color="red">
                              New
                            </Badge>
                          )}
                        </Group>
                        <Title order={3} style={{ lineHeight: 1.3 }}>
                          {announcement.title}
                        </Title>
                      </Stack>
                    </Flex>

                    <Text c="dimmed" size="md" lineClamp={2}>
                      {announcement.content}
                    </Text>

                    <Flex justify="space-between" align="center">
                      <Group gap="md">
                        <Avatar size="sm" radius="xl">
                          {announcement.author.charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                          <Text size="sm" fw={500}>
                            {announcement.author}
                          </Text>
                          <Group gap={4}>
                            <IconCalendar size={12} />
                            <Text size="xs" c="dimmed">
                              {formatDate(announcement.createdAt)}
                            </Text>
                          </Group>
                        </div>
                      </Group>

                      <Button
                        variant="subtle"
                        size="sm"
                        rightSection={<IconArrowRight size={14} />}
                      >
                        Read More
                      </Button>
                    </Flex>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        py={60}
        px="md"
        style={{
          background:
            "linear-gradient(135deg, var(--mantine-color-blue-7) 0%, var(--mantine-color-blue-6) 100%)",
          "@media (min-width: 768px)": {
            paddingTop: "80px",
            paddingBottom: "80px",
          },
        }}
      >
        <Container size="lg">
          <Stack gap="xl" align="center">
            <Title
              order={2}
              size="2rem"
              ta="center"
              c="white"
              style={{
                lineHeight: 1.2,
                "@media (min-width: 768px)": {
                  fontSize: "2.5rem",
                },
              }}
            >
              Ready to Connect Your Community?
            </Title>

            <Text
              size="md"
              c="blue.1"
              ta="center"
              style={{ maxWidth: 600, lineHeight: 1.6 }}
            >
              Join thousands of residents who have transformed their subdivision
              experience with SubdiviSync. Better communication, enhanced
              security, stronger community bonds.
            </Text>

            <Group gap="md" pt="md" justify="center">
              <Button
                size="lg"
                color="blue"
                variant="white"
                c="blue"
                rightSection={<IconArrowRight size={20} />}
              >
                Get Started Today
              </Button>
              <Button
                variant="outline"
                c="white"
                style={{ borderColor: "white" }}
              >
                Schedule Demo
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>
    </AppShell>
  );
};

export default HomePageWidgets;
