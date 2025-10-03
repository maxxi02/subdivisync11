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
  Checkbox,
  useMantineTheme,
  useMantineColorScheme,
} from "@mantine/core";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { getServerSession } from "@/better-auth/action";
import { Session } from "@/better-auth/auth-types";
import { toast } from "react-hot-toast";

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export function LoginForm() {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [isLoading, setIsLoading] = useState(false);
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
  }, [session, router]);

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.email.trim()) return "Email is required";
    if (!formData.password) return "Password is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email))
      return "Please enter a valid email address";

    return null;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      await authClient.signIn.email(
        {
          email: formData.email,
          password: formData.password,
          callbackURL: "/dashboard",
        },
        {
          async onSuccess(context) {
            if (context.data.twoFactorRedirect) {
              await authClient.twoFactor.sendOtp();
              toast.success(
                "Two-factor authentication code sent to your email"
              );
              router.push("/2fa-verification");
            } else {
              toast.success("Successfully signed in!");
              router.push("/dashboard");
            }
          },
          async onError(context) {
            console.error("Sign in error:", context.error.message);
            const errorMessage =
              context.error.message ||
              "Sign in failed. Please check your credentials.";
            toast.error(errorMessage);

            if (context.error.status === 403) {
              toast.error("Please verify your email address");
              await authClient.sendVerificationEmail({
                email: formData.email,
                callbackURL: "/login",
              });
              toast.success("Verification email sent!");
            }
          },
        }
      );
    } catch (err) {
      console.error("Sign in error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper 
      className="w-full max-w-sm" 
      p="xl"
      style={{
        backgroundColor: colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
      }}
    >
      <div className="text-center mb-6">
        <Title 
          order={2} 
          className="text-xl mb-2"
          style={{
            color: colorScheme === "dark" ? theme.white : theme.colors.gray[9],
          }}
        >
          Login
        </Title>
        <Text 
          size="sm" 
          style={{
            color: colorScheme === "dark" ? theme.colors.gray[4] : theme.colors.gray[6],
          }}
        >
          Sign in to your account to continue
        </Text>
      </div>

      <form onSubmit={handleEmailSignIn}>
        <Stack gap="md">
          <TextInput
            label="Email"
            placeholder="Enter your email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            styles={{
              label: { 
                color: colorScheme === "dark" ? theme.white : theme.colors.gray[9], 
                fontWeight: 500 
              },
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
              label: { 
                color: colorScheme === "dark" ? theme.white : theme.colors.gray[9], 
                fontWeight: 500 
              },
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
                label: { 
                  color: colorScheme === "dark" ? theme.colors.gray[4] : theme.colors.gray[6], 
                  fontSize: "0.875rem" 
                },
              }}
            />
            <Link
              href="/forgot-password"
              className="text-sm font-medium hover:underline"
              style={{
                color: colorScheme === "dark" ? theme.colors.blue[4] : theme.colors.blue[6],
              }}
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
        </Stack>
      </form>
    </Paper>
  );
}
