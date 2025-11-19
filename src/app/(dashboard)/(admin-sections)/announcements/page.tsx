"use client";

import React, { useState, useEffect } from "react";
import {
  Title,
  Text,
  Card,
  Stack,
  Group,
  Badge,
  Loader,
  Center,
  Container,
  Notification,
  Modal,
  TextInput,
  Textarea,
  Button as MantineButton,
  ThemeIcon,
  ActionIcon,
  SimpleGrid,
  useMantineTheme,
  useMantineColorScheme,
  Box,
  Flex,
  FileInput,
  Image as MantineImage,
  rgba,
} from "@mantine/core";
import {
  IconCheck,
  IconX,
  IconTrash,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconFileText,
  IconEdit,
  IconHome,
  IconBed,
  IconBath,
} from "@tabler/icons-react";
import { getServerSession } from "@/better-auth/action";
import { useRouter } from "next/navigation";

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
  property?: {
    title: string;
    location: string;
    type: string;
    sqft?: number;
    bedrooms?: number;
    bathrooms?: number;
  };
}

interface NotificationType {
  type: "success" | "error";
  message: string;
}

const AnnouncementCard = ({
  announcement,
  onEdit,
  onDelete,
}: {
  announcement: Announcement;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = announcement.images;

  const prev = () =>
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () =>
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));

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

  const primaryTextColor = colorScheme === "dark" ? "white" : "dark.9";
  const getDefaultShadow = () => {
    const baseShadow = "0 1px 3px";
    const opacity = colorScheme === "dark" ? 0.2 : 0.12;
    return `${baseShadow} ${rgba(theme.black, opacity)}`;
  };

  return (
    <Card
      withBorder
      radius="lg"
      shadow="sm"
      style={{ boxShadow: getDefaultShadow() }}
    >
      {images.length === 0 ? (
        <Box h={150} bg="violet.1" />
      ) : (
        <Box pos="relative">
          <Box h={300} style={{ overflow: "hidden" }}>
            <Box
              style={{
                display: "flex",
                transform: `translateX(-${currentIndex * 100}%)`,
                transition: "transform 0.3s ease-in-out",
              }}
            >
              {images.map((image, idx) => (
                <Box
                  key={image.publicId}
                  style={{
                    minWidth: "100%",
                    width: "100%",
                    flexShrink: 0,
                  }}
                >
                  <MantineImage
                    src={image.url}
                    alt={announcement.title}
                    h={300}
                    w="100%"
                    fit="cover"
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                </Box>
              ))}
            </Box>
          </Box>
          {images.length > 1 && (
            <>
              <ActionIcon
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                pos="absolute"
                left={8}
                top="50%"
                style={{ transform: "translateY(-50%)", zIndex: 10 }}
                variant="filled"
                color="white"
                bg="rgba(255, 255, 255, 0.7)"
                radius="xl"
                size="lg"
              >
                <IconChevronLeft size={18} color="black" />
              </ActionIcon>
              <ActionIcon
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                pos="absolute"
                right={8}
                top="50%"
                style={{ transform: "translateY(-50%)", zIndex: 10 }}
                variant="filled"
                color="white"
                bg="rgba(255, 255, 255, 0.7)"
                radius="xl"
                size="lg"
              >
                <IconChevronRight size={18} color="black" />
              </ActionIcon>

              {/* Optional: Add indicators */}
              <Group
                gap={4}
                justify="center"
                pos="absolute"
                bottom={8}
                left={0}
                right={0}
                style={{ zIndex: 10 }}
              >
                {images.map((_, idx) => (
                  <Box
                    key={idx}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor:
                        currentIndex === idx
                          ? "white"
                          : "rgba(255, 255, 255, 0.5)",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                  />
                ))}
              </Group>
            </>
          )}
        </Box>
      )}
      <Card.Section p="md">
        <Stack gap="sm">
          <Title order={3} size="h3" fw={600} c={primaryTextColor}>
            {announcement.title}
          </Title>
          <Text size="sm" c="dimmed" lineClamp={3}>
            {announcement.content}
          </Text>
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Category:
            </Text>
            <Badge color="gray" variant="light">
              {announcement.category}
            </Badge>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Priority:
            </Text>
            <Badge
              color={getPriorityColor(announcement.priority)}
              variant="light"
            >
              {announcement.priority.charAt(0).toUpperCase() +
                announcement.priority.slice(1)}
            </Badge>
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Scheduled:
            </Text>
            <Badge color="gray" variant="light">
              {new Date(announcement.scheduledDate).toLocaleDateString()}
            </Badge>
          </Group>
          {announcement.property && (
            <Card withBorder radius="md" p="sm" bg="gray.0">
              <Group gap="xs" mb="xs">
                <IconHome size={16} />
                <Text fw={500} c={primaryTextColor}>
                  Property Information
                </Text>
              </Group>
              <Stack gap="xs">
                <Text size="sm">Title: {announcement.property.title}</Text>
                <Text size="sm">
                  Location: {announcement.property.location}
                </Text>
                {(announcement.property.type === "house-and-lot" ||
                  announcement.property.type === "condo") && (
                  <>
                    {announcement.property.bedrooms &&
                      announcement.property.bedrooms > 0 && (
                        <Group gap="xs">
                          <IconBed size={14} />
                          <Text size="sm">
                            {announcement.property.bedrooms} Bedroom
                            {announcement.property.bedrooms > 1 ? "s" : ""}
                          </Text>
                        </Group>
                      )}
                    {announcement.property.bathrooms &&
                      announcement.property.bathrooms > 0 && (
                        <Group gap="xs">
                          <IconBath size={14} />
                          <Text size="sm">
                            {announcement.property.bathrooms} Bathroom
                            {announcement.property.bathrooms > 1 ? "s" : ""}
                          </Text>
                        </Group>
                      )}
                    {announcement.property.sqft &&
                      announcement.property.sqft > 0 && (
                        <Group gap="xs">
                          <IconFileText size={14} />
                          <Text size="sm">
                            {announcement.property.sqft} sq ft
                          </Text>
                        </Group>
                      )}
                  </>
                )}
              </Stack>
            </Card>
          )}
          <Group gap="xs">
            <MantineButton
              size="xs"
              color="yellow"
              leftSection={<IconEdit size={14} />}
              onClick={() => onEdit(announcement)}
            >
              Edit
            </MantineButton>
            <MantineButton
              size="xs"
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={() => onDelete(announcement._id)}
            >
              Delete
            </MantineButton>
          </Group>
        </Stack>
      </Card.Section>
    </Card>
  );
};

// Custom Select Component
const CustomSelect = ({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label
        style={{
          display: "block",
          marginBottom: "0.5rem",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: isDark ? "#c1c2c5" : "#212529",
        }}
      >
        {label} {required && <span style={{ color: "red" }}>*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          width: "100%",
          padding: "0.5rem 0.75rem",
          fontSize: "0.875rem",
          lineHeight: "1.5",
          color: isDark ? "#c1c2c5" : "#212529",
          backgroundColor: isDark ? "#25262b" : "#fff",
          border: `1px solid ${isDark ? "#373a40" : "#ced4da"}`,
          borderRadius: "0.25rem",
          outline: "none",
          cursor: "pointer",
          transition: "border-color 0.15s ease-in-out",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#228be6";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = isDark ? "#373a40" : "#ced4da";
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const ManageAnnouncementSection = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notification, setNotification] = useState<NotificationType | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    content: "",
    category: "",
    priority: "low" as "low" | "medium" | "high",
    scheduledDate: "",
    images: [] as File[],
    imagesToDelete: [] as string[],
  });

  const [dataFetched, setDataFetched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const primaryTextColor = colorScheme === "dark" ? "white" : "dark.9";
  const getDefaultShadow = () => {
    const baseShadow = "0 1px 3px";
    const opacity = colorScheme === "dark" ? 0.2 : 0.12;
    return `${baseShadow} ${rgba(theme.black, opacity)}`;
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Check admin access
  useEffect(() => {
    const checkSession = async () => {
      const session = await getServerSession();
      if (!session || session.user.role !== "admin") {
        setIsAdmin(false);
        router.push("/dashboard");
      } else {
        setIsAdmin(true);
      }
    };
    checkSession();
  }, [router]);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/announcements?public=false");
        const data = await response.json();
        if (data.success) {
          setAnnouncements(data.announcements);
          showNotification("success", "Announcements fetched successfully");
        } else {
          throw new Error(data.error || "Failed to fetch announcements");
        }
      } catch (err) {
        showNotification(
          "error",
          "An error occurred while fetching announcements"
        );
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin && !dataFetched) {
      fetchAnnouncements();
      setDataFetched(true);
    }
  }, [isAdmin, dataFetched]);

  useEffect(() => {
    return () => {
      formData.images.forEach((file) => {
        URL.revokeObjectURL(URL.createObjectURL(file));
      });
    };
  }, [formData.images]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (files: File[] | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...filesArray],
    }));
  };

  // Handle image deletion
  const handleRemoveImage = (index: number | string) => {
    if (typeof index === "number") {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        imagesToDelete: [...prev.imagesToDelete, index],
      }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      id: "",
      title: "",
      content: "",
      category: "",
      priority: "low",
      scheduledDate: "",
      images: [],
      imagesToDelete: [],
    });
    setIsEditing(false);
    setShowFormModal(false);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (
      !formData.title ||
      !formData.content ||
      !formData.category ||
      !formData.scheduledDate
    ) {
      showNotification("error", "Please fill all required fields");
      return;
    }

    // Add this check for creating new announcements (not editing)
    if (!isEditing && announcements.length >= 5) {
      showNotification(
        "error",
        "Maximum of 5 announcements allowed. Please delete an existing announcement before creating a new one."
      );
      return;
    }

    setSubmitting(true);

    const form = new FormData();
    form.append("title", formData.title);
    form.append("content", formData.content);
    form.append("category", formData.category);
    form.append("priority", formData.priority);
    form.append("scheduledDate", formData.scheduledDate);
    if (isEditing) {
      form.append("id", formData.id);
      form.append("imagesToDelete", JSON.stringify(formData.imagesToDelete));
    }
    formData.images.forEach((image) => form.append("images", image));

    try {
      const url = "/api/announcements";
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        body: form,
      });
      const data = await response.json();

      if (data.success) {
        if (isEditing) {
          setAnnouncements((prev) =>
            prev.map((ann) =>
              ann._id === data.announcement._id ? data.announcement : ann
            )
          );
          showNotification("success", "Announcement updated successfully");
        } else {
          setAnnouncements((prev) => [data.announcement, ...prev]);
          showNotification("success", "Announcement created successfully");
        }
        resetForm();
      } else {
        showNotification("error", data.error || "Failed to save announcement");
      }
    } catch (err) {
      showNotification(
        "error",
        "An error occurred while saving the announcement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit button click
  const handleEdit = (announcement: Announcement) => {
    setFormData({
      id: announcement._id,
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      priority: announcement.priority,
      scheduledDate: new Date(announcement.scheduledDate)
        .toISOString()
        .split("T")[0],
      images: [],
      imagesToDelete: [],
    });
    setIsEditing(true);
    setShowFormModal(true);
  };

  // Handle delete button click
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?"))
      return;

    try {
      const response = await fetch(`/api/announcements?id=${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        setAnnouncements((prev) => prev.filter((ann) => ann._id !== id));
        showNotification("success", "Announcement deleted successfully");
      } else {
        throw new Error(data.error || "Failed to delete announcement");
      }
    } catch (err) {
      showNotification(
        "error",
        "An error occurred while deleting the announcement"
      );
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Container size="xl" py="xl">
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
        <Box py="md">
          <Title order={1} size="h2" fw={600} c={primaryTextColor} mb="xs">
            Manage Announcements
          </Title>
          <Text c="dimmed" size="md" lh={1.5}>
            Create and manage property announcements
          </Text>
        </Box>

        {/* Stats Card */}
        <Card
          padding="xl"
          radius="lg"
          withBorder
          shadow="sm"
          style={{
            background:
              "linear-gradient(135deg, var(--mantine-color-blue-6) 0%, var(--mantine-color-blue-7) 100%)",
            color: "white",
            boxShadow: getDefaultShadow(),
          }}
        >
          <Flex justify="space-between" align="flex-start" gap="md">
            <Stack gap="xs" flex={1}>
              <Text c="blue.2" size="sm" tt="uppercase" fw={600}>
                Total Announcements
              </Text>
              <Text fw={700} size="xl" c="white" lh={1.2}>
                {announcements.length}
              </Text>
            </Stack>
            <ThemeIcon variant="light" color="blue" size="xl" radius="lg">
              <IconFileText size="1.5rem" />
            </ThemeIcon>
          </Flex>
        </Card>

        {/* Create Announcement Button */}
        <Group justify="flex-end">
          <MantineButton
            color="blue"
            leftSection={<IconEdit size={16} />}
            onClick={() => {
              resetForm();
              setShowFormModal(true);
            }}
            disabled={announcements.length >= 5}
          >
            Create Announcement {announcements.length >= 5 && "(Limit Reached)"}
          </MantineButton>
        </Group>

        {/* Announcements List */}
        {loading ? (
          <Center style={{ height: 400 }}>
            <Loader size="lg" />
          </Center>
        ) : announcements.length === 0 ? (
          <Card withBorder radius="lg" p="xl">
            <Center>
              <Stack align="center" gap="md">
                <ThemeIcon size={48} radius="xl" color="gray">
                  <IconFileText size={24} />
                </ThemeIcon>
                <Text size="lg" fw={500} c={primaryTextColor}>
                  No announcements found
                </Text>
                <Text c="dimmed">Create a new announcement to get started</Text>
              </Stack>
            </Center>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement._id}
                announcement={announcement}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </SimpleGrid>
        )}

        {/* Form Modal */}
        <Modal
          opened={showFormModal}
          onClose={resetForm}
          title={isEditing ? "Edit Announcement" : "Create Announcement"}
          size="xl"
          centered
          overlayProps={{
            backgroundOpacity: 0.55,
            blur: 3,
          }}
          styles={{
            body: {
              maxHeight: "calc(100vh - 120px)",
              overflowY: "auto",
            },
          }}
          zIndex={999}
        >
          <Stack gap="lg">
            <TextInput
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Enter announcement title"
            />
            <Textarea
              label="Content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              placeholder="Enter announcement content"
              minRows={4}
            />
            {/* <TextInput
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              placeholder="Enter category (e.g., Property Update)"
            /> */}
            <CustomSelect
              label="Category"
              value={formData.category}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  category: value,
                }))
              }
              options={[
                { value: "", label: "Select a category" },
                { value: "Security & Safety", label: "Security & Safety" },
                {
                  value: "Maintenance & Utilities",
                  label: "Maintenance & Utilities",
                },
                {
                  value: "Community Rules & Policies",
                  label: "Community Rules & Policies",
                },
                { value: "Events & Activities", label: "Events & Activities" },
                {
                  value: "Administrative Announcements",
                  label: "Administrative Announcements",
                },
                {
                  value: "Construction & Development",
                  label: "Construction & Development",
                },
                {
                  value: "General Community Information",
                  label: "General Community Information",
                },
              ]}
              required
            />
            <CustomSelect
              label="Priority"
              value={formData.priority}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  priority: value as "low" | "medium" | "high",
                }))
              }
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
              ]}
              required
            />
            <TextInput
              label="Scheduled Date"
              name="scheduledDate"
              type="date"
              value={formData.scheduledDate}
              onChange={handleInputChange}
              required
            />
            <FileInput
              label="Images"
              placeholder="Upload images"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              multiple
              onChange={(files) => {
                if (files) {
                  handleFileChange(Array.isArray(files) ? files : [files]);
                }
              }}
              value={undefined}
              clearable
              description="Select multiple images"
            />
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
              {formData.images.map((file, index) => {
                const previewUrl = URL.createObjectURL(file);
                return (
                  <Box key={index} pos="relative">
                    <MantineImage
                      src={previewUrl}
                      alt={`Preview ${index}`}
                      w={100}
                      h={100}
                      fit="cover"
                      radius="md"
                      loading="lazy"
                    />
                    <ActionIcon
                      pos="absolute"
                      top={-8}
                      right={-8}
                      color="red"
                      variant="filled"
                      radius="xl"
                      size="sm"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  </Box>
                );
              })}
              {isEditing &&
                announcements
                  .find((ann) => ann._id === formData.id)
                  ?.images.filter(
                    (img) => !formData.imagesToDelete.includes(img.publicId)
                  )
                  .map((image) => (
                    <Box key={image.publicId} pos="relative">
                      <MantineImage
                        src={image.url}
                        alt="Existing image"
                        w={100}
                        h={100}
                        fit="cover"
                        radius="md"
                        loading="lazy"
                      />
                      <ActionIcon
                        pos="absolute"
                        top={-8}
                        right={-8}
                        color="red"
                        variant="filled"
                        radius="xl"
                        size="sm"
                        onClick={() => handleRemoveImage(image.publicId)}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    </Box>
                  ))}
            </SimpleGrid>
            <Group justify="apart">
              <MantineButton
                color="blue"
                leftSection={<IconCheck size={16} />}
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting}
              >
                {isEditing ? "Update Announcement" : "Create Announcement"}
              </MantineButton>
              <MantineButton variant="outline" onClick={resetForm}>
                Cancel
              </MantineButton>
            </Group>
          </Stack>
        </Modal>

        {/* Refresh Button */}
        <Group justify="flex-end">
          <MantineButton
            leftSection={<IconRefresh size={16} />}
            onClick={async () => {
              setLoading(true);
              try {
                const response = await fetch("/api/announcements?public=false");
                const data = await response.json();
                if (data.success) {
                  setAnnouncements(data.announcements);
                  showNotification(
                    "success",
                    "Announcements refreshed successfully"
                  );
                } else {
                  throw new Error(
                    data.error || "Failed to refresh announcements"
                  );
                }
              } catch (err) {
                showNotification("error", "Failed to refresh announcements");
              } finally {
                setLoading(false);
              }
            }}
          >
            Refresh
          </MantineButton>
        </Group>
      </Stack>
    </Container>
  );
};

export default ManageAnnouncementSection;
