"use client";
import type React from "react";

import {
  Button,
  Text,
  Title,
  Stack,
  Group,
  PinInput,
  ThemeIcon,
  Loader,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconLock, IconAlertCircle } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export function TwoFactorVerificationForm({
  className,
  email,
  ...props
}: React.ComponentProps<"div"> & {
  email?: string;
  password?: string;
  onBack?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const { push } = useRouter();

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateCode = (code: string): string | null => {
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
  };

  async function onSubmit() {
    const validationError = validateCode(code);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Complete the 2FA verification
      const { error } = await authClient.twoFactor.verifyOtp({
        code: code,
      });

      if (error) {
        setError(error.message || "Failed to verify code");
        notifications.show({
          title: "Error",
          message: "Failed to verify code",
          color: "red",
        });
        return;
      }

      notifications.show({
        title: "Success",
        message: "Two-factor authentication verified successfully",
        color: "green",
      });

      // Redirect to dashboard after successful verification
      push("/dashboard");
    } catch (error) {
      const errorMessage =
        (error as Error).message ||
        "Invalid verification code. Please try again.";
      setError(errorMessage);
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
      console.error("2FA verification error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // async function handleResendCode() {
  //   if (!email || countdown > 0) return;

  //   try {
  //     setIsResending(true);
  //     setError(""); // Clear any existing errors

  //     // Resend the 2FA code
  //     const { error } = await authClient.twoFactor.sendOtp();
  //     if (error) {
  //       setError("Failed to resend verification code");
  //       notifications.show({
  //         title: "Error",
  //         message: "Failed to resend verification code",
  //         color: "red",
  //       });
  //       return;
  //     }

  //     notifications.show({
  //       title: "Success",
  //       message: "Verification code sent to your device",
  //       color: "green",
  //     });

  //     // Start 60-second countdown
  //     setCountdown(60);
  //   } catch (error) {
  //     const errorMessage =
  //       (error as Error).message ||
  //       "Failed to resend verification code. Please try again.";
  //     setError(errorMessage);
  //     notifications.show({
  //       title: "Error",
  //       message: errorMessage,
  //       color: "red",
  //     });
  //     console.error("Resend 2FA error:", error);
  //   } finally {
  //     setIsResending(false);
  //   }
  // }

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (error) setError(""); // Clear error when user starts typing
  };

  const handleCodeComplete = (value: string) => {
    setCode(value);
    // Auto-submit when 6 digits are entered
    if (value.length === 6) {
      onSubmit();
    }
  };

  return (
    <Stack gap="xl" className={className} {...props}>
      <Stack gap="sm" align="center">
        <ThemeIcon size={48} radius="xl" color="blue">
          <IconLock size={24} />
        </ThemeIcon>
        <Title order={2} ta="center">
          Two-Factor Authentication
        </Title>
        <Text size="sm" c="dimmed" ta="center">
          Enter 6 digit code that we sent to your device.
        </Text>
        {email && (
          <Text size="xs" c="dimmed">
            Signed in as: {email}
          </Text>
        )}
      </Stack>

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

        <Stack gap="xs">
          <Text size="sm" fw={500}>
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
            error={!!error}
          />
        </Stack>

        <Button
          onClick={onSubmit}
          fullWidth
          disabled={isLoading || code.length !== 6}
          leftSection={isLoading ? <Loader size="xs" /> : null}
          size="md"
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </Button>
      </Stack>

      <Stack gap="md">
        <Group justify="center">
          <Button
            variant="subtle"
            onClick={async () => {
              try {
                await authClient.twoFactor.sendOtp();
                console.log(`OTP request sent!`);
              } catch (error) {
                console.error(
                  `Something went wrong requesting OTP ${error as Error}`
                );
              }
            }}
            disabled={countdown > 0 || isResending}
            size="sm"
            leftSection={isResending ? <Loader size="xs" /> : null}
          >
            {isResending
              ? "Sending..."
              : countdown > 0
              ? `Resend code in ${countdown}s`
              : "Resend verification code"}
          </Button>
        </Group>

        <Stack
          gap={"xs"}
          align="center"
          className="hover:text-white text-white/40"
        >
          <Link href={"/login"} className="text-md">
            Login another account
          </Link>
        </Stack>
      </Stack>
    </Stack>
  );
}
