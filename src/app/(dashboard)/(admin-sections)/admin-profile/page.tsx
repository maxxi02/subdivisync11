"use client";

import { getServerSession } from "@/better-auth/action";
import React, { useEffect, useState } from "react";
import { Session } from "@/better-auth/auth-types";
import {
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
  Select,
  Container,
} from "@mantine/core";
import { IconUpload, IconCheck, IconX } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { authClient } from "@/lib/auth-client";
import { modals } from "@mantine/modals";
interface NotificationType {
  type: "success" | "error";
  message: string;
}

const AdminProfilePage = () => {
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
      firstName: "",
      middleName: "",
      lastName: "",
      image: null as File | null,
      address: "",
      gender: "",
      dateOfBirth: "",
      phoneNumber: "",
    },
    validate: {
      firstName: (value) =>
        value.trim().length < 2
          ? "First name must be at least 2 characters"
          : null,
      lastName: (value) =>
        value.trim().length < 2
          ? "Last name must be at least 2 characters"
          : null,
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
        value.trim().length > 0 && value.trim().length < 5
          ? "Address must be at least 5 characters if provided"
          : null,
      gender: (value) => (!value ? "Gender is required" : null),
      dateOfBirth: (value) => {
        if (!value) return "Date of birth is required";

        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        const actualAge =
          monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

        if (actualAge < 18) {
          return "You must be at least 18 years old";
        }
        if (actualAge > 120) {
          return "Please enter a valid date of birth";
        }
        return null;
      },
      phoneNumber: (value) => {
        if (value.trim().length > 0) {
          const phoneRegex = /^(09|\+639)\d{9}$/;
          if (!phoneRegex.test(value.trim())) {
            return "Invalid phone number format. Use 09XXXXXXXXX or +639XXXXXXXXX";
          }
        }
        return null;
      },
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
      newPassword: (value) => {
        if (value.length < 8) {
          return "New password must be at least 8 characters long";
        }
        if (!/[A-Z]/.test(value)) {
          return "Password must contain at least one uppercase letter";
        }
        if (!/[a-z]/.test(value)) {
          return "Password must contain at least one lowercase letter";
        }
        if (!/[0-9]/.test(value)) {
          return "Password must contain at least one number";
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
          return 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)';
        }
        return null;
      },
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

        // Split the full name into parts
        const nameParts = (session?.user?.name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName =
          nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
        const middleName =
          nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

        profileForm.setValues({
          firstName: firstName,
          middleName: middleName,
          lastName: lastName,
          address: session?.user?.address || "",
          gender: session?.user?.gender || "",
          dateOfBirth: session?.user?.dateOfBirth
            ? session.user.dateOfBirth instanceof Date
              ? session.user.dateOfBirth.toISOString().split("T")[0]
              : new Date(session.user.dateOfBirth).toISOString().split("T")[0]
            : "",
          phoneNumber: session?.user?.phoneNumber || "",
        });
        setImagePreview(session?.user?.image || "");
        showNotification("success", "Profile data loaded successfully");
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

    modals.openConfirmModal({
      title: "Confirm Profile Update",
      children: (
        <Text size="sm">
          Are you sure you want to update your profile information?
        </Text>
      ),
      labels: { confirm: "Update", cancel: "Cancel" },
      confirmProps: { color: "blue" },
      onConfirm: async () => {
        setProfileLoading(true);

        try {
          let imageData = session?.user?.image || "";
          if (values.image) {
            imageData = await convertFileToBase64(values.image);
          }

          // Combine the name fields
          const fullName = `${values.firstName.trim()} ${values.middleName.trim() ? values.middleName.trim() + " " : ""}${values.lastName.trim()}`;

          const response = await fetch("/api/auth/update-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: fullName,
              image: imageData,
              address: values.address.trim() || "n/a",
              gender: values.gender,
              dateOfBirth: values.dateOfBirth,
              phoneNumber: values.phoneNumber.trim() || "n/a",
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update profile");
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
      },
    });
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

    modals.openConfirmModal({
      title: "Confirm Password Change",
      children: (
        <Text size="sm">
          Are you sure you want to change your password? You will be logged out
          from all other sessions.
        </Text>
      ),
      labels: { confirm: "Change Password", cancel: "Cancel" },
      confirmProps: { color: "blue" },
      onConfirm: async () => {
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
      },
    });
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

    modals.openConfirmModal({
      title: "Enable Two-Factor Authentication",
      children: (
        <Text size="sm">
          Are you sure you want to enable two-factor authentication? This will
          add an extra layer of security to your account.
        </Text>
      ),
      labels: { confirm: "Enable", cancel: "Cancel" },
      confirmProps: { color: "blue" },
      onConfirm: async () => {
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
      },
    });
  };

  const handleTwoFactorDisable = async () => {
    // Validate password first
    const validationError = twoFactorForm.validate();
    if (validationError.hasErrors || !twoFactorForm.values.password) {
      showNotification(
        "error",
        "Please enter your password to disable two-factor authentication"
      );
      return;
    }

    modals.openConfirmModal({
      title: "Disable Two-Factor Authentication",
      children: (
        <Text size="sm">
          Are you sure you want to disable two-factor authentication? This will
          make your account less secure.
        </Text>
      ),
      labels: { confirm: "Disable", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        setTwoFactorLoading(true);

        try {
          const { error: authError } = await authClient.twoFactor.disable({
            password: twoFactorForm.values.password,
          });

          if (authError) {
            showNotification(
              "error",
              authError.message || "Failed to disable two-factor authentication"
            );
            return;
          }

          const updatedSession = await getServerSession();
          setSession(updatedSession);

          showNotification(
            "success",
            "Two-factor authentication disabled successfully"
          );
          twoFactorForm.reset();
        } catch (error) {
          showNotification(
            "error",
            error instanceof Error
              ? error.message
              : "Failed to disable two-factor authentication"
          );
        } finally {
          setTwoFactorLoading(false);
        }
      },
    });
  };

  if (!session) {
    return (
      <Paper
        p="xl"
        radius="lg"
        withBorder
        shadow="sm"
        style={{ maxWidth: 500, margin: "auto", boxShadow: getDefaultShadow() }}
      >
        <Center>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c={primaryTextColor}>Loading...</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Container size="xl" px="md" py="xl">
      <Paper
        p={{ base: "md", sm: "xl" }}
        radius="lg"
        withBorder
        shadow="sm"
        style={{
          maxWidth: "100%",
          margin: "auto",
          boxShadow: getDefaultShadow(),
        }}
      >
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
        <Stack gap="lg">
          <Title order={2} size="h2" fw={600} ta="center" c={primaryTextColor}>
            Manage Your Profile
          </Title>
          <Text size="md" c="dimmed" ta="center">
            Update your profile information
          </Text>

          <form onSubmit={profileForm.onSubmit(handleProfileSubmit)}>
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
                  />
                  <Text size="xs" c="dimmed">
                    Max file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                  </Text>
                </Stack>
              </Center>

              <TextInput
                label="First Name"
                placeholder="Enter your first name"
                {...profileForm.getInputProps("firstName")}
                disabled={profileLoading}
                required
              />

              <TextInput
                label="Middle Name (Optional)"
                placeholder="Enter your middle name"
                {...profileForm.getInputProps("middleName")}
                disabled={profileLoading}
              />

              <TextInput
                label="Last Name"
                placeholder="Enter your last name"
                {...profileForm.getInputProps("lastName")}
                disabled={profileLoading}
                required
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
                label="Date of Birth"
                type="date"
                placeholder="Select your date of birth"
                {...profileForm.getInputProps("dateOfBirth")}
                max={
                  new Date(
                    new Date().setFullYear(new Date().getFullYear() - 18)
                  )
                    .toISOString()
                    .split("T")[0]
                }
                min={
                  new Date(
                    new Date().setFullYear(new Date().getFullYear() - 120)
                  )
                    .toISOString()
                    .split("T")[0]
                }
                disabled={profileLoading}
              />

              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  Email: {session.user?.email}
                </Text>
                <Text size="sm" c="dimmed">
                  Role: {session.user?.role}
                </Text>
                <Text size="sm" c="dimmed">
                  Address: {session.user?.address || "Not provided"}
                </Text>
                <Text size="sm" c="dimmed">
                  Phone Number: {session.user?.phoneNumber || "Not provided"}
                </Text>
                <Text size="sm" c="dimmed">
                  Gender:{" "}
                  {session.user?.gender
                    ? session.user.gender.charAt(0).toUpperCase() +
                      session.user.gender.slice(1)
                    : "Not provided"}
                </Text>
                <Text size="sm" c="dimmed">
                  Age: {session.user?.age || "Not provided"} years old
                </Text>
                <Text size="sm" c="dimmed">
                  Date of Birth:{" "}
                  {session.user?.dateOfBirth
                    ? new Date(session.user.dateOfBirth).toLocaleDateString()
                    : "Not provided"}
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

          <form onSubmit={passwordForm.onSubmit(handlePasswordSubmit)}>
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTwoFactorDisable();
              }}
            >
              <Stack gap="md">
                <Text size="sm" c="green" ta="center" fw={500}>
                  Two-Factor Authentication is currently enabled.
                </Text>
                <TextInput
                  label="Password"
                  placeholder="Enter your password to disable"
                  type="password"
                  {...twoFactorForm.getInputProps("password")}
                  disabled={twoFactorLoading}
                />
                <MantineButton
                  type="submit"
                  color="red"
                  size="md"
                  fullWidth
                  loading={twoFactorLoading}
                  disabled={twoFactorLoading}
                >
                  Disable Two-Factor Authentication
                </MantineButton>
              </Stack>
            </form>
          ) : (
            <form onSubmit={twoFactorForm.onSubmit(handleTwoFactorSubmit)}>
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
    </Container>
  );
};

export default AdminProfilePage;
