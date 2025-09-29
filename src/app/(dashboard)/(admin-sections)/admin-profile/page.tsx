"use client";
import { getServerSession } from "@/better-auth/action";
import React, { useEffect, useState } from "react";
import { Session } from "@/better-auth/auth-types";
import {
  Button,
  TextInput,
  FileInput,
  Title,
  Text,
  Paper,
  Avatar,
  Alert,
  Loader,
  Stack,
  Divider,
} from "@mantine/core";
import { IconUpload, IconAlertCircle } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { authClient } from "@/lib/auth-client";

const AdminProfilePage = () => {
  const [session, setSession] = useState<null | Session>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");

  const profileForm = useForm({
    initialValues: {
      name: "",
      image: null as File | null,
    },
    validate: {
      name: (value) =>
        value.trim().length < 2 ? "Name must be at least 2 characters" : null,
      image: (value) =>
        value && value.size > 5 * 1024 * 1024
          ? "Image must be less than 5MB"
          : value &&
            ![
              "image/jpeg",
              "image/jpg",
              "image/png",
              "image/gif",
              "image/webp",
            ].includes(value.type)
          ? "Image must be JPEG, PNG, GIF, or WebP"
          : null,
    },
  });

  const passwordForm = useForm({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    validate: {
      currentPassword: (value) =>
        value.length < 8
          ? "Current password must be at least 8 characters"
          : null,
      newPassword: (value) =>
        value.length < 8 ? "New password must be at least 8 characters" : null,
      confirmNewPassword: (value, values) =>
        value !== values.newPassword ? "Passwords do not match" : null,
    },
  });

  const twoFactorForm = useForm({
    initialValues: {
      password: "",
    },
    validate: {
      password: (value) =>
        value.length < 8 ? "Password must be at least 8 characters" : null,
    },
  });

  useEffect(() => {
    const fetchTenantProfile = async () => {
      const session = await getServerSession();
      setSession(session);

      profileForm.setValues({ name: session?.user?.name || "" });
      setImagePreview(session?.user?.image || "");
    };

    fetchTenantProfile();
  }, []);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (file: File | null) => {
    profileForm.setFieldValue("image", file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(session?.user?.image || "");
    }
    if (error) setError("");
  };

  const handleProfileSubmit = async (values: typeof profileForm.values) => {
    const validationError = profileForm.validate();
    if (validationError.hasErrors) {
      setError(
        String(Object.values(validationError.errors)[0]) || "Invalid input"
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      let imageData = session?.user?.image || "";
      if (values.image) {
        imageData = await convertFileToBase64(values.image);
      }

      await authClient.updateUser({
        name: values.name.trim(),
        image: imageData,
      });

      const updatedSession = await getServerSession();
      setSession(updatedSession);
      setImagePreview(updatedSession?.user?.image || "");

      notifications.show({
        title: "Success",
        message: "Profile updated successfully",
        color: "green",
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
      notifications.show({
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to update profile",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: typeof passwordForm.values) => {
    const validationError = passwordForm.validate();
    if (validationError.hasErrors) {
      setError(
        String(Object.values(validationError.errors)[0]) || "Invalid input"
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: authError } = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      });

      if (authError) {
        setError(authError.message || "Failed to change password");
        notifications.show({
          title: "Error",
          message: authError.message || "Failed to change password",
          color: "red",
        });
        return;
      }

      notifications.show({
        title: "Success",
        message: "Password changed successfully",
        color: "green",
      });
      passwordForm.reset();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to change password"
      );
      notifications.show({
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to change password",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (values: typeof twoFactorForm.values) => {
    const validationError = twoFactorForm.validate();
    if (validationError.hasErrors) {
      setError(
        String(Object.values(validationError.errors)[0]) || "Invalid input"
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await authClient.twoFactor.enable({
        password: values.password,
        issuer: "TenantApp",
      });

      if (authError) {
        setError(
          authError.message || "Failed to enable two-factor authentication"
        );
        notifications.show({
          title: "Error",
          message:
            authError.message || "Failed to enable two-factor authentication",
          color: "red",
        });
        return;
      }

      // Refresh session to update twoFactorEnabled status
      const updatedSession = await getServerSession();
      setSession(updatedSession);

      notifications.show({
        title: "Success",
        message: "Two-factor authentication enabled successfully",
        color: "green",
      });
      twoFactorForm.reset();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to enable two-factor authentication"
      );
      notifications.show({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to enable two-factor authentication",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <Paper
        className="w-full max-w-sm bg-white/95 backdrop-blur-sm"
        p="xl"
        radius="md"
        withBorder
      >
        <div className="text-center">
          <Loader size="sm" />
          <Text>Loading...</Text>
        </div>
      </Paper>
    );
  }

  return (
    <Paper
      className="w-full max-w-vwh bg-white/95 backdrop-blur-sm"
      p="xl"
      radius="md"
      withBorder
    >
      <Title order={2} className="text-xl text-gray-900 mb-2" ta="center">
        Manage Your Profile
      </Title>
      <Text size="sm" c="dimmed" ta="center" mb="lg">
        Update your profile information
      </Text>

      <Stack gap="md">
        {error && (
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            color="red"
            variant="light"
          >
            {error}
          </Alert>
        )}

        {/* Profile Update Section */}
        <form onSubmit={profileForm.onSubmit(handleProfileSubmit)}>
          <Stack gap="md">
            <div className="text-center">
              <div className="mb-3">
                <Avatar
                  src={
                    imagePreview ||
                    session.user?.image ||
                    "/default-profile.png"
                  }
                  size="lg"
                  radius="xl"
                  mx="auto"
                  className="border-2 border-gray-200"
                >
                  {session.user?.name?.charAt(0).toUpperCase()}
                </Avatar>
              </div>
              <FileInput
                label="Profile Picture"
                placeholder="Choose image file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                leftSection={<IconUpload size="1rem" />}
                {...profileForm.getInputProps("image")}
                onChange={handleFileChange}
                styles={{
                  label: {
                    color: "#374151",
                    fontWeight: 500,
                    textAlign: "center",
                  },
                }}
                clearable
                disabled={loading}
              />
              <Text size="xs" c="dimmed" mt="xs">
                Max file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
              </Text>
            </div>

            <TextInput
              label="Name"
              placeholder="Enter your name"
              {...profileForm.getInputProps("name")}
              styles={{ label: { color: "#374151", fontWeight: 500 } }}
              disabled={loading}
            />
            <Text size="sm" c="dimmed">
              Email: {session.user?.email}
            </Text>
            <Text size="sm" c="dimmed">
              Role: {session.user?.role}
            </Text>
            <Text size="sm" c="dimmed">
              Two-Factor Authentication:{" "}
              {session.user?.twoFactorEnabled ? "Enabled" : "Disabled"}
            </Text>
            <Text size="sm" c="dimmed">
              Created At: {session.user?.createdAt.toLocaleDateString()}
            </Text>
            <Text size="sm" c="dimmed">
              Updated At: {session.user?.updatedAt.toLocaleDateString()}
            </Text>

            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              size="md"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {loading ? <Loader size="sm" /> : "Update Profile"}
            </Button>
          </Stack>
        </form>

        <Divider label="Change Password" labelPosition="center" />

        {/* Password Change Section */}
        <form onSubmit={passwordForm.onSubmit(handlePasswordSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Current Password"
              placeholder="Enter your current password"
              type="password"
              {...passwordForm.getInputProps("currentPassword")}
              styles={{ label: { color: "#374151", fontWeight: 500 } }}
              disabled={loading}
            />
            <TextInput
              label="New Password"
              placeholder="Enter your new password"
              type="password"
              {...passwordForm.getInputProps("newPassword")}
              styles={{ label: { color: "#374151", fontWeight: 500 } }}
              disabled={loading}
            />
            <TextInput
              label="Confirm New Password"
              placeholder="Confirm your new password"
              type="password"
              {...passwordForm.getInputProps("confirmNewPassword")}
              styles={{ label: { color: "#374151", fontWeight: 500 } }}
              disabled={loading}
            />
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              size="md"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {loading ? <Loader size="sm" /> : "Change Password"}
            </Button>
          </Stack>
        </form>

        <Divider label="Two-Factor Authentication" labelPosition="center" />

        {/* Two-Factor Authentication Section */}
        {session.user?.twoFactorEnabled ? (
          <Text size="sm" c="dimmed" ta="center">
            Two-Factor Authentication is already enabled.
          </Text>
        ) : (
          <form onSubmit={twoFactorForm.onSubmit(handleTwoFactorSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Password"
                placeholder="Enter your password"
                type="password"
                {...twoFactorForm.getInputProps("password")}
                styles={{ label: { color: "#374151", fontWeight: 500 } }}
                disabled={loading}
              />
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                size="md"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {loading ? (
                  <Loader size="sm" />
                ) : (
                  "Enable Two-Factor Authentication"
                )}
              </Button>
            </Stack>
          </form>
        )}
      </Stack>
    </Paper>
  );
};

export default AdminProfilePage;
