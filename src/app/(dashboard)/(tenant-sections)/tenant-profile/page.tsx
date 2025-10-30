"use client";

import { getServerSession } from "@/better-auth/action";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Session } from "@/better-auth/auth-types";
import {
  Container,
  Title,
  Text,
  Paper,
  Avatar,
  Loader,
  Stack,
  Divider,
  TextInput,
  FileInput,
  Button as MantineButton,
  Center,
  useMantineTheme,
  useMantineColorScheme,
  rgba,
  Notification,
  Group,
  Select,
} from "@mantine/core";
import { IconUpload, IconCheck, IconX } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { authClient } from "@/lib/auth-client";

interface NotificationType {
  type: "success" | "error";
  message: string;
}

const TenantProfilePage = () => {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [session, setSession] = useState<null | Session>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [notification, setNotification] = useState<NotificationType | null>(
    null
  );

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

  const profileForm = useForm({
    initialValues: {
      name: "",
      image: null as File | null,
      address: "",
      gender: "",
      age: "",
      phoneNumber: "",
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
      address: (value) =>
        value.trim().length < 5
          ? "Address must be at least 5 characters"
          : null,
      gender: (value) => (!value ? "Gender is required" : null),
      age: (value) =>
        !value
          ? "Age is required"
          : parseInt(value) < 18 || parseInt(value) > 120
            ? "Age must be between 18 and 120"
            : null,
      phoneNumber: (value) =>
        value.trim().length < 10
          ? "Phone number must be at least 10 characters"
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
      try {
        const session = await getServerSession();
        setSession(session);
        if (session?.user?.role !== "tenant") {
          router.push("/dashboard");
        } else {
          profileForm.setValues({
            name: session?.user?.name || "",
            address: session?.user?.address || "",
            gender: session?.user?.gender || "",
            age: session?.user?.age?.toString() || "",
            phoneNumber: session?.user?.phoneNumber || "",
          });
          setImagePreview(session?.user?.image || "");
          showNotification("success", "Profile data loaded successfully");
        }
      } catch (error) {
        showNotification(
          "error",
          "Failed to load profile data. Please try again."
        );
      }
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
  };

  const handleProfileSubmit = async (values: typeof profileForm.values) => {
    const validationError = profileForm.validate();
    if (validationError.hasErrors) {
      showNotification(
        "error",
        String(Object.values(validationError.errors)[0]) || "Invalid input"
      );
      return;
    }

    setProfileLoading(true);

    try {
      let imageData = session?.user?.image || "";
      if (values.image) {
        imageData = await convertFileToBase64(values.image);
      }

      const response = await fetch("/api/auth/update-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name.trim(),
          image: imageData,
          address: values.address.trim(),
          gender: values.gender,
          age: parseInt(values.age),
          phoneNumber: values.phoneNumber.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      const updatedSession = await getServerSession();
      setSession(updatedSession);
      setImagePreview(updatedSession?.user?.image || "");

      showNotification("success", "Profile updated successfully");
    } catch (error) {
      showNotification(
        "error",
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: typeof passwordForm.values) => {
    const validationError = passwordForm.validate();
    if (validationError.hasErrors) {
      showNotification(
        "error",
        String(Object.values(validationError.errors)[0]) || "Invalid input"
      );
      return;
    }

    setPasswordLoading(true);

    try {
      const { error: authError } = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      });

      if (authError) {
        showNotification(
          "error",
          authError.message || "Failed to change password"
        );
        return;
      }

      showNotification("success", "Password changed successfully");
      passwordForm.reset();
    } catch (error) {
      showNotification(
        "error",
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (values: typeof twoFactorForm.values) => {
    const validationError = twoFactorForm.validate();
    if (validationError.hasErrors) {
      showNotification(
        "error",
        String(Object.values(validationError.errors)[0]) || "Invalid input"
      );
      return;
    }

    setTwoFactorLoading(true);

    try {
      const { error: authError } = await authClient.twoFactor.enable({
        password: values.password,
        issuer: "TenantApp",
      });

      if (authError) {
        showNotification(
          "error",
          authError.message || "Failed to enable two-factor authentication"
        );
        return;
      }

      const updatedSession = await getServerSession();
      setSession(updatedSession);

      showNotification(
        "success",
        "Two-factor authentication enabled successfully"
      );
      twoFactorForm.reset();
    } catch (error) {
      showNotification(
        "error",
        error instanceof Error
          ? error.message
          : "Failed to enable two-factor authentication"
      );
    } finally {
      setTwoFactorLoading(false);
    }
  };

  if (!session) {
    return (
      <Container size="sm" py="xl">
        <Paper
          p="xl"
          radius="lg"
          withBorder
          shadow="sm"
          style={{
            maxWidth: 500,
            margin: "auto",
            boxShadow: getDefaultShadow(),
          }}
        >
          <Center>
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text c={primaryTextColor}>Loading...</Text>
            </Stack>
          </Center>
        </Paper>
      </Container>
    );
  }

  return (
    <>
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
      <Paper
        p="xl"
        radius="lg"
        withBorder
        shadow="sm"
        style={{
          maxWidth: "100%",
          margin: "auto",
          boxShadow: getDefaultShadow(),
        }}
      >
        <Stack gap="lg">
          <Title order={2} size="h2" fw={600} ta="center" c={primaryTextColor}>
            Manage Your Profile
          </Title>
          <Text size="md" c="dimmed" ta="center">
            Update your profile information
          </Text>

          <form
            onSubmit={profileForm.onSubmit(handleProfileSubmit)}
            method="dialog"
          >
            <Stack gap="md">
              <Center>
                <Stack align="center" gap="md">
                  <Avatar
                    src={
                      imagePreview ||
                      session.user?.image ||
                      "/default-profile.png"
                    }
                    size={100}
                    radius="xl"
                    style={{ border: `2px solid ${theme.colors.gray[2]}` }}
                  >
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <FileInput
                    label="Profile Picture"
                    placeholder="Choose image file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    leftSection={<IconUpload size={16} />}
                    {...profileForm.getInputProps("image")}
                    onChange={handleFileChange}
                    clearable
                    disabled={profileLoading}
                    style={{ width: "100%", maxWidth: 300 }}
                  />
                  <Text size="xs" c="dimmed">
                    Max file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                  </Text>
                </Stack>
              </Center>

              <TextInput
                label="Name"
                placeholder="Enter your name"
                {...profileForm.getInputProps("name")}
                disabled={profileLoading}
              />

              <TextInput
                label="Address"
                placeholder="Enter your address"
                {...profileForm.getInputProps("address")}
                disabled={profileLoading}
              />

              <TextInput
                label="Phone Number"
                placeholder="Enter your phone number"
                type="tel"
                {...profileForm.getInputProps("phoneNumber")}
                disabled={profileLoading}
              />
              <Group grow>
                <Select
                  label="Gender"
                  placeholder="Select your gender"
                  data={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                  ]}
                  {...profileForm.getInputProps("gender")}
                  disabled={profileLoading}
                />
                <TextInput
                  label="Age"
                  placeholder="Enter your age"
                  type="number"
                  {...profileForm.getInputProps("age")}
                  disabled={profileLoading}
                />
              </Group>

              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  Email: {session.user?.email}
                </Text>
                <Text size="sm" c="dimmed">
                  Role: {session.user?.role}
                </Text>
                <Text size="sm" c="dimmed">
                  Status: {session.user?.status || "Active"}
                </Text>
                <Text size="sm" c="dimmed">
                  Two-Factor Authentication:{" "}
                  {session.user?.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Text>
                <Text size="sm" c="dimmed">
                  Created At:{" "}
                  {new Date(session.user?.createdAt).toLocaleDateString()}
                </Text>
              </Stack>

              <MantineButton
                type="submit"
                color="blue"
                size="md"
                fullWidth
                loading={profileLoading}
                disabled={profileLoading}
              >
                Update Profile
              </MantineButton>
            </Stack>
          </form>

          <Divider label="Change Password" labelPosition="center" />

          <form
            onSubmit={passwordForm.onSubmit(handlePasswordSubmit)}
            method="dialog"
          >
            <Stack gap="md">
              <TextInput
                label="Current Password"
                placeholder="Enter your current password"
                type="password"
                {...passwordForm.getInputProps("currentPassword")}
                disabled={passwordLoading}
              />
              <TextInput
                label="New Password"
                placeholder="Enter your new password"
                type="password"
                {...passwordForm.getInputProps("newPassword")}
                disabled={passwordLoading}
              />
              <TextInput
                label="Confirm New Password"
                placeholder="Confirm your new password"
                type="password"
                {...passwordForm.getInputProps("confirmNewPassword")}
                disabled={passwordLoading}
              />
              <MantineButton
                type="submit"
                color="blue"
                size="md"
                fullWidth
                loading={passwordLoading}
                disabled={passwordLoading}
              >
                Change Password
              </MantineButton>
            </Stack>
          </form>

          <Divider label="Two-Factor Authentication" labelPosition="center" />

          {session.user?.twoFactorEnabled ? (
            <Text size="sm" c="dimmed" ta="center">
              Two-Factor Authentication is already enabled.
            </Text>
          ) : (
            <form
              onSubmit={twoFactorForm.onSubmit(handleTwoFactorSubmit)}
              method="dialog"
            >
              <Stack gap="md">
                <TextInput
                  label="Password"
                  placeholder="Enter your password"
                  type="password"
                  {...twoFactorForm.getInputProps("password")}
                  disabled={twoFactorLoading}
                />
                <MantineButton
                  type="submit"
                  color="blue"
                  size="md"
                  fullWidth
                  loading={twoFactorLoading}
                  disabled={twoFactorLoading}
                >
                  Enable Two-Factor Authentication
                </MantineButton>
              </Stack>
            </form>
          )}
        </Stack>
      </Paper>
    </>
  );
};

export default TenantProfilePage;
