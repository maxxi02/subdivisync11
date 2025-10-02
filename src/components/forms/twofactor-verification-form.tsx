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
import { IconLock, IconAlertCircle } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface TwoFactorVerificationFormProps extends React.ComponentProps<"div"> {
  email?: string;
  password?: string;
  onBack?: () => void;
}

export function TwoFactorVerificationForm({
  className,
  email,
  ...props
}: TwoFactorVerificationFormProps) {
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
      toast.error(validationError);
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const { error } = await authClient.twoFactor.verifyOtp({
        code: code,
      });

      if (error) {
        const errorMessage = error.message || "Failed to verify code";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success("Two-factor authentication verified successfully");
      push("/dashboard");
    } catch (error) {
      const errorMessage =
        (error as Error).message ||
        "Invalid verification code. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("2FA verification error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendCode() {
    if (countdown > 0) return;

    try {
      setIsResending(true);
      setError("");

      const { error } = await authClient.twoFactor.sendOtp();
      if (error) {
        const errorMessage =
          error.message || "Failed to resend verification code";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success("Verification code sent to your email");
      setCountdown(60);
    } catch (error) {
      const errorMessage =
        (error as Error).message ||
        "Failed to resend verification code. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Resend 2FA error:", error);
    } finally {
      setIsResending(false);
    }
  }

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (error) setError(""); // Clear error when user starts typing
  };

  const handleCodeComplete = (value: string) => {
    setCode(value);
    if (value.length === 6) {
      onSubmit();
    }
  };

  useEffect(() => {
    const sendOTP = async () => {
      await authClient.twoFactor.sendOtp();
    };

    sendOTP();
    toast("Verification code sent to your email");
  }, []);

  return (
    <Stack gap="xl" className={className} {...props}>
      <Stack gap="sm" align="center">
        <ThemeIcon size={48} radius="xl" color="blue">
          <IconLock size={24} />
        </ThemeIcon>
        <Title order={2} ta="center" c="white">
          Two-Factor Authentication
        </Title>
        <Text size="sm" c="white" ta="center">
          Enter the 6-digit code sent to your device.
        </Text>
        {email && (
          <Text size="xs" c="white">
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
          <Text size="sm" fw={500} c="white">
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
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </Button>
      </Stack>

      <Stack gap="md">
        <Group justify="center">
          <Button
            variant="subtle"
            onClick={handleResendCode}
            disabled={countdown > 0 || isResending}
            size="sm"
            c="black"
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
          gap="xs"
          align="center"
          className="text-white/40 hover:text-white"
        >
          <Link href="/login" className="text-md text-white hover:underline">
            Login with another account
          </Link>
        </Stack>
      </Stack>
    </Stack>
  );
}
