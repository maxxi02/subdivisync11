"use client";
import type React from "react";
import {
  Button,
  TextInput,
  Paper,
  Title,
  Text,
  Stack,
  useMantineColorScheme,
  useMantineTheme,
  Anchor,
  alpha,
} from "@mantine/core";
import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleColor = colorScheme === "dark" ? "white" : "dark";
  const paperBg = alpha(theme.white, colorScheme === "dark" ? 0.05 : 0.95);
  const greenBgColor = alpha(theme.colors.green[6], 0.1);
  const greenBorderColor = alpha(theme.colors.green[6], 0.2);
  const errorBgColor = alpha(theme.colors.red[6], 0.1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { error: resetError } = await authClient.forgetPassword({
        email: email.trim().toLowerCase(),
        redirectTo: "/reset-password",
      });
      if (resetError) {
        if (resetError.message?.includes("User not found")) {
          setIsSubmitted(true);
        } else {
          setError(
            resetError.message ||
              "Failed to send reset email. Please try again."
          );
        }
      } else {
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  if (isSubmitted) {
    return (
      <Paper
        className="w-full max-w-sm backdrop-blur-sm"
        p="xl"
        radius="md"
        withBorder
        style={{
          backgroundColor: paperBg,
        }}
      >
        <div className="text-center mb-6">
          <Title order={2} className="text-xl mb-2" c={titleColor}>
            Check Your Email
          </Title>
          <Text size="sm" c="dimmed">
            We&#39;ve sent a password reset link to {email}
          </Text>
        </div>
        <Stack gap="md">
          <div
            className="text-center p-4 rounded-md border"
            style={{
              backgroundColor: greenBgColor,
              borderColor: greenBorderColor,
            }}
          >
            <Text size="sm" c="green.7">
              If an account with that email exists, you&#39;ll receive a password
              reset link shortly. The link will expire in 24 hours.
            </Text>
          </div>
          <Text size="xs" c="dimmed" ta="center">
            Didn&#39;t receive an email? Check your spam folder or try again in a
            few minutes.
          </Text>
          <Link href="/login">
            <Button variant="outline" size="md" fullWidth>
              Back to Sign In
            </Button>
          </Link>
          <Anchor
            component="button"
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              setEmail("");
              setError(null);
            }}
            c="blue"
            ta="center"
            size="sm"
            underline="hover"
            fw={500}
          >
            Try a different email address
          </Anchor>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      className="w-full max-w-sm backdrop-blur-sm"
      p="xl"
      radius="md"
      withBorder
    >
      <div className="text-center mb-6">
        <Title order={2} className="text-xl mb-2" c={titleColor}>
          Forgot Password?
        </Title>
        <Text size="sm" c="dimmed">
          Enter your email address and we&#39;ll send you a link to reset your
          password
        </Text>
      </div>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {error && (
            <Text
              size="sm"
              c="red"
              ta="center"
              className="p-2 rounded"
              style={{
                backgroundColor: errorBgColor,
              }}
            >
              {error}
            </Text>
          )}
          <TextInput
            label="Email"
            placeholder="Enter your email address"
            type="email"
            value={email}
            onChange={(e) => handleInputChange(e.target.value)}
            required
            disabled={isLoading}
            error={error ? " " : null} // Show error state without duplicate message
          />
          <Button
            type="submit"
            color="blue"
            size="md"
            fullWidth
            loading={isLoading}
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
          <Text ta="center" size="sm" c="dimmed">
            Remember your password?{" "}
            <Anchor
              component={Link}
              href="/login"
              c="blue"
              underline="hover"
              fw={500}
            >
              Back to Sign In
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}
