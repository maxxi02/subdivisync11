"use client";

import type React from "react";
import {
  Button,
  TextInput,
  Paper,
  Title,
  Text,
  Stack,
  Progress,
  Box,
  Container,
  Center,
  useMantineColorScheme,
} from "@mantine/core";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm() {
  const { colorScheme } = useMantineColorScheme();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Check password strength
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (pwd.match(/[a-z]/)) strength += 25;
    if (pwd.match(/[A-Z]/)) strength += 25;
    if (pwd.match(/[0-9]/)) strength += 25;
    if (pwd.match(/[^a-zA-Z0-9]/)) strength += 25;
    return Math.min(strength, 100);
  };

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      setError(
        "Invalid or missing reset token. Please request a new password reset link."
      );
    }
  }, [token]);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/(?=.*[0-9])/.test(pwd)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setIsLoading(true);

    try {
      const { error: resetError } = await authClient.resetPassword({
        token: token,
        newPassword: password,
      });

      if (resetError) {
        // Handle specific error cases
        if (resetError.message?.includes("expired")) {
          setError(
            "Reset link has expired. Please request a new password reset."
          );
        } else if (resetError.message?.includes("invalid")) {
          setError("Invalid reset token. Please request a new password reset.");
        } else {
          setError(
            resetError.message || "Failed to reset password. Please try again."
          );
        }
      } else {
        // Success
        setIsSubmitted(true);

        // Redirect to login after successful reset
        setTimeout(() => {
          router.push("/login?message=password-reset-success");
        }, 3000);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 25) return "red";
    if (strength < 50) return "orange";
    if (strength < 75) return "yellow";
    return "green";
  };

  const getStrengthText = (strength: number) => {
    if (strength < 25) return "Weak";
    if (strength < 50) return "Fair";
    if (strength < 75) return "Good";
    return "Strong";
  };

  if (isSubmitted) {
    return (
      <Container className="min-h-screen">
        <Center className="min-h-screen">
          <Paper
            className="w-full max-w-sm backdrop-blur-sm"
            p="xl"
            radius="md"
            withBorder
            style={{
              backgroundColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.95)"
            }}
          >
            <div className="text-center mb-6">
              <Title order={2} className="text-xl mb-2" c={colorScheme === "dark" ? "white" : "dark"}>
                Password Reset Successful
              </Title>
              <Text size="sm" c="dimmed">
                Your password has been successfully updated
              </Text>
            </div>

            <Stack gap="md">
              <div 
                className="text-center p-4 rounded-md border"
                style={{
                  backgroundColor: colorScheme === "dark" ? "rgba(34, 197, 94, 0.1)" : "#f0fdf4",
                  borderColor: colorScheme === "dark" ? "rgba(34, 197, 94, 0.2)" : "#bbf7d0"
                }}
              >
                <Text size="sm" c="green.7">
                  You can now sign in with your new password. Redirecting to
                  login in 3 seconds...
                </Text>
              </div>

              <Link href="/login">
                <Button variant="outline" size="md" fullWidth>
                  Go to Sign In Now
                </Button>
              </Link>
            </Stack>
          </Paper>
        </Center>
      </Container>
    );
  }

  return (
    <Container className="min-h-screen">
      <Center className="min-h-screen">
        <Paper
          className="w-full max-w-sm backdrop-blur-sm"
          p="xl"
          radius="md"
          withBorder
          style={{
            backgroundColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.95)"
          }}
        >
          <div className="text-center mb-6">
            <Title order={2} className="text-xl mb-2" c={colorScheme === "dark" ? "white" : "dark"}>
              Reset Your Password
            </Title>
            <Text size="sm" c="dimmed">
              Enter your new password below
            </Text>
          </div>

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {error && (
                <div 
                  className="p-3 rounded-md border"
                  style={{
                    backgroundColor: colorScheme === "dark" ? "rgba(239, 68, 68, 0.1)" : "#fef2f2",
                    borderColor: colorScheme === "dark" ? "rgba(239, 68, 68, 0.2)" : "#fecaca"
                  }}
                >
                  <Text size="sm" c="red.7">
                    {error}
                  </Text>
                </div>
              )}

              <div>
                <TextInput
                  label="New Password"
                  placeholder="Enter your new password"
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  disabled={isLoading}
                  styles={{
                    label: { 
                      color: colorScheme === "dark" ? "#ffffff" : "#374151", 
                      fontWeight: 500 
                    },
                  }}
                />

                {password && (
                  <Box mt="xs">
                    <Text size="xs" c="dimmed" mb={4}>
                      Password strength: {getStrengthText(passwordStrength)}
                    </Text>
                    <Progress
                      value={passwordStrength}
                      color={getStrengthColor(passwordStrength)}
                      size="sm"
                      radius="sm"
                    />
                  </Box>
                )}
              </div>

              <TextInput
                label="Confirm New Password"
                placeholder="Confirm your new password"
                type="password"
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                required
                disabled={isLoading}
                styles={{
                  label: { 
                    color: colorScheme === "dark" ? "#ffffff" : "#374151", 
                    fontWeight: 500 
                  },
                }}
                error={
                  confirmPassword && password !== confirmPassword
                    ? "Passwords do not match"
                    : null
                }
              />

              <div 
                className="text-xs p-2 rounded"
                style={{
                  backgroundColor: colorScheme === "dark" ? "rgba(107, 114, 128, 0.1)" : "#f9fafb",
                  color: colorScheme === "dark" ? "#d1d5db" : "#6b7280"
                }}
              >
                <Text size="xs" c="dimmed">
                  Password requirements:
                </Text>
                <ul className="mt-1 space-y-1 text-xs">
                  <li
                    style={{
                      color: password.length >= 8 ? "#16a34a" : (colorScheme === "dark" ? "#9ca3af" : "#6b7280")
                    }}
                  >
                    • At least 8 characters
                  </li>
                  <li
                    style={{
                      color: /[a-z]/.test(password) ? "#16a34a" : (colorScheme === "dark" ? "#9ca3af" : "#6b7280")
                    }}
                  >
                    • One lowercase letter
                  </li>
                  <li
                    style={{
                      color: /[A-Z]/.test(password) ? "#16a34a" : (colorScheme === "dark" ? "#9ca3af" : "#6b7280")
                    }}
                  >
                    • One uppercase letter
                  </li>
                  <li
                    style={{
                      color: /[0-9]/.test(password) ? "#16a34a" : (colorScheme === "dark" ? "#9ca3af" : "#6b7280")
                    }}
                  >
                    • One number
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                color="blue"
                size="md"
                fullWidth
                loading={isLoading}
                disabled={
                  isLoading ||
                  !password ||
                  !confirmPassword ||
                  password !== confirmPassword ||
                  passwordStrength < 50 ||
                  !token
                }
              >
                {isLoading ? "Resetting..." : "Reset Password"}
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
      </Center>
    </Container>
  );
}
