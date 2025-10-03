"use client";

import type React from "react";
import {
  Container,
  Paper,
  Center,
  Stack,
  Title,
  Text,
  PinInput,
  ThemeIcon,
  Loader,
  Notification,
  Button as MantineButton,
  Group,
  Anchor,
  useMantineTheme,
  useMantineColorScheme,
  rgba,
} from "@mantine/core";
import { IconLock, IconCheck, IconX } from "@tabler/icons-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

interface NotificationType {
  type: "success" | "error";
  message: string;
}

interface TwoFactorVerificationFormProps {
  email?: string;
}

export function TwoFactorVerificationForm({
  email,
}: TwoFactorVerificationFormProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [code, setCode] = useState("");
  const [notification, setNotification] = useState<NotificationType | null>(
    null
  );
  const { push } = useRouter();

  const primaryTextColor = colorScheme === "dark" ? "white" : "dark";
  const getDefaultShadow = () => {
    const baseShadow = "0 1px 3px";
    const opacity = colorScheme === "dark" ? 0.2 : 0.12;
    return `${baseShadow} ${rgba(theme.black, opacity)}`;
  };

  const showNotification = useCallback(
    (type: "success" | "error", message: string) => {
      setNotification({ type, message });
      setTimeout(() => setNotification(null), 5000);
    },
    []
  );

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateCode = useCallback((code: string): string | null => {
    if (!code || code.length === 0) {
      return "Verification code is required";
    }
    if (code.length !== 6) {
      return "Verification code must be 6 digits";
    }
    if (!/^\d+$/.test(code)) {
      return "Verification code must contain only numbers";
    }
    return null;
  }, []);

  const onSubmit = useCallback(async () => {
    if (isLoading) return; // Prevent multiple submissions
    const validationError = validateCode(code);
    if (validationError) {
      showNotification("error", validationError);
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await authClient.twoFactor.verifyOtp({
        code: code,
      });

      if (error) {
        showNotification("error", error.message || "Failed to verify code");
        return;
      }

      showNotification(
        "success",
        "Two-factor authentication verified successfully"
      );
      push("/dashboard");
    } catch (error) {
      showNotification(
        "error",
        error instanceof Error
          ? error.message
          : "Invalid verification code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [code, isLoading, push, showNotification, validateCode]);

  const handleResendCode = useCallback(async () => {
    if (countdown > 0 || isResending) return;

    try {
      setIsResending(true);
      const { error } = await authClient.twoFactor.sendOtp();
      if (error) {
        showNotification(
          "error",
          error.message || "Failed to resend verification code"
        );
        return;
      }

      showNotification("success", "Verification code sent to your email");
      setCountdown(60);
    } catch (error) {
      showNotification(
        "error",
        error instanceof Error
          ? error.message
          : "Failed to resend verification code"
      );
    } finally {
      setIsResending(false);
    }
  }, [countdown, isResending, showNotification]);

  const handleCodeChange = useCallback(
    (value: string) => {
      setCode(value);
      if (notification?.type === "error") setNotification(null); // Clear error when user starts typing
    },
    [notification?.type]
  );

  const handleCodeComplete = useCallback(
    (value: string) => {
      setCode(value);
      if (value.length === 6) {
        onSubmit();
      }
    },
    [onSubmit]
  );

  return (
    <Center style={{ minHeight: "100vh" }}>
      <Paper
        p="xl"
        radius="lg"
        withBorder
        shadow="sm"
        style={{
          maxWidth: 500,
          margin: "auto",
          boxShadow: getDefaultShadow(),
          backgroundColor:
            colorScheme === "dark"
              ? theme.colors.dark[7]
              : theme.colors.gray[0],
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

        <Stack gap="xl">
          <Stack gap="sm" align="center">
            <ThemeIcon size={48} radius="xl" color="blue">
              <IconLock size={24} />
            </ThemeIcon>
            <Title
              order={2}
              size="h2"
              fw={600}
              ta="center"
              c={primaryTextColor}
            >
              Two-Factor Authentication
            </Title>
            <Text size="md" c="dimmed" ta="center">
              Enter the 6-digit code sent to your device.
            </Text>
            {email && (
              <Text size="sm" c="dimmed" ta="center">
                Signed in as: {email}
              </Text>
            )}
          </Stack>

          <Stack gap="md">
            <Stack gap="xs" align="center">
              <Text size="sm" fw={500} c={primaryTextColor}>
                Verification Code
              </Text>
              <PinInput
                length={6}
                type="number"
                value={code}
                onChange={handleCodeChange}
                onComplete={handleCodeComplete}
                size="lg"
                style={{ justifyContent: "center" }}
                disabled={isLoading}
                error={!!notification?.type && notification.type === "error"}
              />
            </Stack>

            <MantineButton
              onClick={onSubmit}
              fullWidth
              disabled={isLoading || code.length !== 6}
              leftSection={isLoading ? <Loader size="xs" /> : null}
              size="md"
              color="blue"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </MantineButton>
          </Stack>

          <Stack gap="md">
            <Group justify="center">
              <MantineButton
                variant="subtle"
                onClick={handleResendCode}
                disabled={countdown > 0 || isResending}
                size="sm"
                color="gray"
                leftSection={isResending ? <Loader size="xs" /> : null}
              >
                {isResending
                  ? "Sending..."
                  : countdown > 0
                  ? `Resend code in ${countdown}s`
                  : "Resend verification code"}
              </MantineButton>
            </Group>

            <Group justify="center">
              <Anchor
                href="/login"
                component={Link}
                size="sm"
                c={colorScheme === "dark" ? "gray.3" : "gray.7"}
                style={{ textDecoration: "none" }}
                styles={{
                  root: {
                    "&:hover": {
                      textDecoration: "underline",
                      opacity: 1,
                    },
                    opacity: 0.6,
                    transition: "opacity 0.2s ease",
                  },
                }}
              >
                Login with another account
              </Anchor>
            </Group>
          </Stack>
        </Stack>
      </Paper>
    </Center>
  );
}
