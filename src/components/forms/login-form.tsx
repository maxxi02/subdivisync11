"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  TextInput,
  Paper,
  Title,
  Text,
  Stack,
  Alert,
  Checkbox,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client"; // Adjust path as needed
import { getServerSession } from "@/better-auth/action";
import { Session } from "@/better-auth/auth-types";

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getServerSession();
      setSession(session);
    };
    fetchSession();

    if (session?.session.token) {
      router.replace("/dashboard");
    }
  }, [session]);

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(""); // Clear error when user starts typing
  };

  const validateForm = (): string | null => {
    if (!formData.email.trim()) return "Email is required";
    if (!formData.password) return "Password is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email))
      return "Please enter a valid email address";

    return null;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authClient.signIn.email(
        {
          email: formData.email, // Fixed: was using undefined 'email' variable
          password: formData.password, // Fixed: was using undefined 'password' variable
          callbackURL: "/dashboard",
        },
        {
          async onSuccess(context) {
            if (context.data.twoFactorRedirect) {
              console.log("2FA required:", context);
              router.push("/2fa-verification");
            } else {
              // Successful sign in without 2FA
              router.push("/dashboard");
            }
          },
          async onError(context) {
            console.error("Sign in error:", context.error.message);
            setError(
              context.error.message ||
                "Sign in failed. Please check your credentials."
            );

            if (context.error.status === 403) {
              alert("Please verify your email address");
              await authClient.sendVerificationEmail({
                email: formData.email,
                callbackURL: "/login",
              });
            }
          },
        }
      );

      // Removed the authError check as it's not defined and handled in onError callback
    } catch (err) {
      console.error("Sign in error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper className="w-full max-w-sm " p="xl">
      <div className="text-center mb-6">
        <Title order={2} className="text-xl text-gray-900 mb-2">
          Login
        </Title>
        <Text size="sm" c="dimmed">
          Sign in to your account to continue
        </Text>
      </div>

      <form onSubmit={handleEmailSignIn}>
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

          <TextInput
            label="Email"
            placeholder="Enter your email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            styles={{
              label: { color: "#374151", fontWeight: 500 },
            }}
            disabled={isLoading}
          />

          <TextInput
            label="Password"
            placeholder="Enter your password"
            type="password"
            required
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            styles={{
              label: { color: "#374151", fontWeight: 500 },
            }}
            disabled={isLoading}
          />

          <div className="flex items-center justify-between gap-2">
            <Checkbox
              label="Remember me"
              size="sm"
              checked={formData.rememberMe}
              onChange={(e) =>
                handleInputChange("rememberMe", e.target.checked)
              }
              disabled={isLoading}
              styles={{
                label: { color: "#6B7280", fontSize: "0.875rem" },
              }}
            />
            <Link
              href="/forgot-password"
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            size="md"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            Sign In
          </Button>

          {/* <Text ta="center" size="sm" c="dimmed">
            Don&#39;t have an account?{" "}
            <Link
              href="/register"
              className="text-cyan-600 hover:text-cyan-700 font-medium hover:underline"
            >
              Register
            </Link>
          </Text> */}
        </Stack>
      </form>
    </Paper>
  );
}
