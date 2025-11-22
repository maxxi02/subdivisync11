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
  Alert,
} from "@mantine/core";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { getServerSession } from "@/better-auth/action";
import { Session } from "@/better-auth/auth-types";
import { toast } from "react-hot-toast";
import { IconAlertCircle, IconClock } from "@tabler/icons-react";

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
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<{
    minutes: number;
    seconds: number;
  } | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(
    null
  );

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

  // Countdown timer effect
  useEffect(() => {
    if (!lockoutEndTime) {
      setRemainingTime(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = lockoutEndTime.getTime() - now.getTime();

      if (diff <= 0) {
        setLockoutEndTime(null);
        setRemainingTime(null);
        setAttemptsRemaining(null);
        toast.success("Account unlocked! You can try logging in again.");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setRemainingTime({ minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [lockoutEndTime]);

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

  const parseErrorMessage = (errorMessage: string) => {
    // Check if it's a lockout message
    const lockoutMatch = errorMessage.match(/try again in (\d+) minute\(s\)/i);
    if (lockoutMatch) {
      const minutes = parseInt(lockoutMatch[1]);
      const endTime = new Date();
      endTime.setMinutes(endTime.getMinutes() + minutes);
      setLockoutEndTime(endTime);
      return;
    }

    // Check if it's an attempts remaining message
    const attemptsMatch = errorMessage.match(/(\d+) attempt\(s\) remaining/i);
    if (attemptsMatch) {
      const attempts = parseInt(attemptsMatch[1]);
      setAttemptsRemaining(attempts);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Check if account is locked
    if (lockoutEndTime && new Date() < lockoutEndTime) {
      toast.error(
        "Account is locked. Please wait for the countdown to finish."
      );
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
            // Clear lockout state on success
            setLockoutEndTime(null);
            setRemainingTime(null);
            setAttemptsRemaining(null);

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

            // Parse error message for lockout or attempts info
            parseErrorMessage(errorMessage);

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

  const isLocked = lockoutEndTime && new Date() < lockoutEndTime;

  return (
    <Paper
      className="w-full max-w-sm"
      p="xl"
      style={{
        backgroundColor:
          colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
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
            color:
              colorScheme === "dark"
                ? theme.colors.gray[4]
                : theme.colors.gray[6],
          }}
        >
          Sign in to your account to continue
        </Text>
      </div>

      {/* Lockout Alert */}
      {isLocked && remainingTime && (
        <Alert
          icon={<IconClock size={20} />}
          title="Account Locked"
          color="red"
          className="mb-4"
          styles={{
            message: {
              fontSize: "0.875rem",
            },
          }}
        >
          <Text size="sm" fw={500} className="mb-2">
            Too many failed login attempts
          </Text>
          <div className="flex items-center gap-2">
            <Text size="xl" fw={700} className="tabular-nums">
              {String(remainingTime.minutes).padStart(2, "0")}:
              {String(remainingTime.seconds).padStart(2, "0")}
            </Text>
            <Text size="xs" c="dimmed">
              remaining
            </Text>
          </div>
          <Text size="xs" c="dimmed" className="mt-2">
            Your account will be automatically unlocked after this time.
          </Text>
        </Alert>
      )}

      {/* Attempts Warning */}
      {!isLocked && attemptsRemaining !== null && attemptsRemaining <= 3 && (
        <Alert
          icon={<IconAlertCircle size={20} />}
          title="Warning"
          color="orange"
          className="mb-4"
        >
          <Text size="sm">
            {attemptsRemaining === 1
              ? "This is your last attempt before your account gets locked for 10 minutes."
              : `You have ${attemptsRemaining} attempt${
                  attemptsRemaining > 1 ? "s" : ""
                } remaining before your account gets locked.`}
          </Text>
        </Alert>
      )}

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
                color:
                  colorScheme === "dark" ? theme.white : theme.colors.gray[9],
                fontWeight: 500,
              },
            }}
            disabled={isLoading || !!isLocked}
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
                color:
                  colorScheme === "dark" ? theme.white : theme.colors.gray[9],
                fontWeight: 500,
              },
            }}
            disabled={isLoading || !!isLocked}
          />

          <div className="flex items-center justify-between gap-2">
            <Checkbox
              label="Remember me"
              size="sm"
              checked={formData.rememberMe}
              onChange={(e) =>
                handleInputChange("rememberMe", e.target.checked)
              }
              disabled={isLoading || !!isLocked}
              styles={{
                label: {
                  color:
                    colorScheme === "dark"
                      ? theme.colors.gray[4]
                      : theme.colors.gray[6],
                  fontSize: "0.875rem",
                },
              }}
            />
            <Link
              href="/forgot-password"
              className="text-sm font-medium hover:underline"
              style={{
                color:
                  colorScheme === "dark"
                    ? theme.colors.blue[4]
                    : theme.colors.blue[6],
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
            disabled={isLoading || !!isLocked}
          >
            {isLocked ? "Account Locked" : "Sign In"}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
