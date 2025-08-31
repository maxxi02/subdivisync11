"use client";

import type React from "react";
import { Button, TextInput, Paper, Title, Text, Stack } from "@mantine/core";
import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        className="w-full max-w-sm bg-white/95 backdrop-blur-sm"
        p="xl"
        radius="md"
        withBorder
      >
        <div className="text-center mb-6">
          <Title order={2} className="text-xl text-gray-900 mb-2">
            Check Your Email
          </Title>
          <Text size="sm" c="dimmed">
            We&#39;ve sent a password reset link to {email}
          </Text>
        </div>

        <Stack gap="md">
          <div className="text-center p-4 bg-green-50 rounded-md border border-green-200">
            <Text size="sm" c="green.7">
              If an account with that email exists, you&#39;ll receive a
              password reset link shortly. The link will expire in 24 hours.
            </Text>
          </div>

          <Text size="xs" c="dimmed" ta="center">
            Didn&#39;t receive an email? Check your spam folder or try again in
            a few minutes.
          </Text>

          <Link href="/login">
            <Button variant="outline" size="md" fullWidth>
              Back to Sign In
            </Button>
          </Link>

          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              setEmail("");
              setError(null);
            }}
            className="text-sm text-cyan-600 hover:text-cyan-700 font-medium hover:underline cursor-pointer bg-transparent border-none p-0"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            Try a different email address
          </button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      className="w-full max-w-sm bg-white/95 backdrop-blur-sm"
      p="xl"
      radius="md"
      withBorder
    >
      <div className="text-center mb-6">
        <Title order={2} className="text-xl text-gray-900 mb-2">
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
              className="bg-red-50 p-2 rounded"
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
            styles={{
              label: { color: "#374151", fontWeight: 500 },
            }}
            error={error ? " " : null} // Show error state without duplicate message
          />

          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            size="md"
            fullWidth
            loading={isLoading}
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>

          <Text ta="center" size="sm" c="dimmed">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-cyan-600 hover:text-cyan-700 font-medium hover:underline"
            >
              Back to Sign In
            </Link>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}
