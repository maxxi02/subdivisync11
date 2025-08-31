"use client";

import React, { useState } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Switch,
  Button,
  Group,
  Stack,
  Alert,
  FileInput,
  Image,
  Text,
  Box,
  ActionIcon,
} from "@mantine/core";
import {
  IconSpeakerphone,
  IconAlertCircle,
  IconCheck,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import axios from "axios";

interface CreateAnnouncementFormProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AnnouncementFormData {
  title: string;
  content: string;
  category: string;
  priority: string;
  isPinned: boolean;
  imageFile: File | null;
  scheduledDate: string;
}

const CreateAnnouncementForm: React.FC<CreateAnnouncementFormProps> = ({
  opened,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: "",
    content: "",
    category: "",
    priority: "medium",
    isPinned: false,
    imageFile: null,
    scheduledDate: "",
  });

  const categoryOptions = [
    { value: "general", label: "General" },
    { value: "maintenance", label: "Maintenance" },
    { value: "event", label: "Event" },
    { value: "community", label: "Community" },
    { value: "urgent", label: "Urgent" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const handleImageChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, imageFile: file }));

    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image file size must be less than 5MB");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPEG, PNG, GIF, and WebP images are allowed");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(""); // Clear any previous errors
    } else {
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, imageFile: null }));
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }
      if (!formData.content.trim()) {
        throw new Error("Content is required");
      }
      if (!formData.category) {
        throw new Error("Category is required");
      }
      if (!formData.priority) {
        throw new Error("Priority is required");
      }

      const submitData = new FormData();
      submitData.append("title", formData.title.trim());
      submitData.append("content", formData.content.trim());
      submitData.append("category", formData.category);
      submitData.append("priority", formData.priority);
      submitData.append("isPinned", formData.isPinned.toString());

      if (formData.imageFile) {
        submitData.append("image", formData.imageFile);
      }

      const response = await axios.post("/api/announcements", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess("Announcement created successfully!");

        // Reset form
        setFormData({
          title: "",
          content: "",
          category: "",
          priority: "medium",
          isPinned: false,
          imageFile: null,
          scheduledDate: "",
        });
        setImagePreview(null);

        // Close modal and refresh parent component after a short delay
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccess("");
        }, 1500);
      } else {
        throw new Error(response.data.error || "Failed to create announcement");
      }
    } catch (error: unknown) {
      console.error("Error creating announcement:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { error?: string } };
        };
        if (axiosError.response?.data?.error) {
          setError(axiosError.response.data.error);
        } else {
          setError("Failed to create announcement");
        }
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to create announcement");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof AnnouncementFormData,
    value: string | boolean | File | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      title: "",
      content: "",
      category: "",
      priority: "medium",
      isPinned: false,
      imageFile: null,
      scheduledDate: "",
    });
    setImagePreview(null);
    setError("");
    setSuccess("");
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Create New Announcement"
      size="lg"
      centered
    >
      <Stack gap="md">
        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} color="red">
            {error}
          </Alert>
        )}

        {success && (
          <Alert icon={<IconCheck size="1rem" />} color="green">
            {success}
          </Alert>
        )}

        <TextInput
          label="Title"
          placeholder="Enter announcement title"
          required
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          leftSection={<IconSpeakerphone size="1rem" />}
        />

        <Textarea
          label="Content"
          placeholder="Enter announcement content"
          required
          minRows={4}
          value={formData.content}
          onChange={(e) => handleInputChange("content", e.target.value)}
        />

        <Group grow>
          <Select
            label="Category"
            placeholder="Select category"
            required
            data={categoryOptions}
            value={formData.category}
            onChange={(value) => handleInputChange("category", value)}
          />

          <Select
            label="Priority"
            placeholder="Select priority"
            required
            data={priorityOptions}
            value={formData.priority}
            onChange={(value) => handleInputChange("priority", value)}
          />
        </Group>

        {/* Image Upload Section */}
        <Stack gap="sm">
          <FileInput
            label="Image (Optional)"
            placeholder="Choose an image file"
            value={formData.imageFile}
            onChange={handleImageChange}
            leftSection={<IconUpload size="1rem" />}
            accept="image/*"
            description="Max file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP"
          />

          {/* Image Preview */}
          {imagePreview && (
            <Box>
              <Group justify="space-between" align="center" mb="xs">
                <Text size="sm" fw={500}>
                  Image Preview:
                </Text>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={removeImage}
                  size="sm"
                >
                  <IconX size="1rem" />
                </ActionIcon>
              </Group>
              <Box style={{ position: "relative", maxWidth: "300px" }}>
                <Image
                  src={imagePreview}
                  alt="Preview"
                  radius="md"
                  style={{ maxHeight: "200px", objectFit: "contain" }}
                />
              </Box>
              {formData.imageFile && (
                <Text size="xs" color="dimmed" mt="xs">
                  File: {formData.imageFile.name} (
                  {(formData.imageFile.size / 1024 / 1024).toFixed(2)} MB)
                </Text>
              )}
            </Box>
          )}
        </Stack>

        <Group justify="space-between">
          <Switch
            label="Pin this announcement"
            description="Pinned announcements appear at the top"
            checked={formData.isPinned}
            onChange={(e) =>
              handleInputChange("isPinned", e.currentTarget.checked)
            }
          />
        </Group>

        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            leftSection={<IconSpeakerphone size="1rem" />}
          >
            Create Announcement
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default CreateAnnouncementForm;
