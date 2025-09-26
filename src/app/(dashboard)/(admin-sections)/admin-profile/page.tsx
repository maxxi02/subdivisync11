"use client";
import React, { useState } from "react";
import {
  Card,
  Text,
  Switch,
  TextInput,
  Button,
  Group,
  Stack,
  Box,
  LoadingOverlay,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconLoader, IconShield, IconShieldCheck } from "@tabler/icons-react";
import { authClient } from "@/lib/auth-client";

interface TwoFactorForm {
  state: boolean;
  password: string;
}

interface Enable2FAProps {
  session: {
    user: {
      twoFactorEnabled?: boolean;
    };
  };
}

const Enable2FA: React.FC<Enable2FAProps> = ({ session }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TwoFactorForm>({
    initialValues: {
      state: session?.user?.twoFactorEnabled || false,
      password: "",
    },
    validate: {
      password: (value) => {
        if (value.length < 8) {
          return "Password must have at least 8 characters";
        }
        if (value.length > 100) {
          return "Password must have at most 100 characters";
        }
        return null;
      },
    },
  });

  const handleSubmit = async (data: TwoFactorForm) => {
    const { state, password } = data;
    setIsSubmitting(true);

    try {
      if (state) {
        await authClient.twoFactor.enable({ password });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        notifications.show({
          title: "Success",
          message: "2 Factor Authentication enabled! 😺",
          color: "green",
        });
        form.setFieldValue("password", ""); // Clear password field
      } else {
        await authClient.twoFactor.disable({ password });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        notifications.show({
          title: "Success",
          message: "2 Factor Authentication disabled! 😺",
          color: "green",
        });
        form.setFieldValue("password", ""); // Clear password field
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: `Something went wrong ${
          state ? "enabling" : "disabling"
        } 2FA! 😿${error}`,
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      withBorder
      shadow="sm"
      radius="md"
      p="lg"
      style={{ position: "relative" }}
    >
      <LoadingOverlay visible={isSubmitting} />

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* 2FA Toggle Section */}
          <Box
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              padding: "16px",
              border: "1px solid #e9ecef",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
            }}
          >
            <Box style={{ flex: 1 }}>
              <Group gap="xs" mb="xs">
                {form.values.state ? (
                  <IconShieldCheck size={20} color="green" />
                ) : (
                  <IconShield size={20} />
                )}
                <Text fw={500} size="lg">
                  2 Factor Authentication
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                Enable or disable 2 Factor Authentication to add an extra layer
                of security to your account.
              </Text>
            </Box>

            <Switch
              {...form.getInputProps("state", { type: "checkbox" })}
              size="lg"
              color="blue"
            />
          </Box>

          {/* Password Input */}
          <TextInput
            label="Password"
            placeholder="⦁⦁⦁⦁⦁⦁⦁"
            type="password"
            required
            {...form.getInputProps("password")}
          />

          {/* Submit Button */}
          <Group justify="flex-start">
            <Button
              type="submit"
              loading={isSubmitting}
              leftSection={
                isSubmitting ? (
                  <IconLoader size={16} />
                ) : form.values.state ? (
                  <IconShieldCheck size={16} />
                ) : (
                  <IconShield size={16} />
                )
              }
              color={form.values.state ? "green" : "red"}
              variant="filled"
              size="md"
            >
              {form.values.state ? "Enable 2FA" : "Disable 2FA"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
};

const AdminProfileSection = () => {
  // Mock session data - replace with your actual session
  const session = {
    user: {
      twoFactorEnabled: false, // This would come from your actual session
    },
  };

  return (
    <div>
      <Text size="xl" fw={700} mb="lg">
        Admin Profile Section
      </Text>
      <Enable2FA session={session} />
    </div>
  );
};

export default AdminProfileSection;
