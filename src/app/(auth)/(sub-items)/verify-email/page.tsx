"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Paper,
  Title,
  Text,
  Stack,
  Button,
  Alert,
  Loader,
  Center,
} from "@mantine/core";
import { IconCheck, IconX, IconMail } from "@tabler/icons-react";
import { authClient } from "@/lib/auth-client";

const VerifyEmailPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error" | "expired"
  >("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setVerificationStatus("error");
        setErrorMessage("No verification token provided");
        return;
      }

      try {
        await authClient.verifyEmail({
          query: {
            token: token,
          },
        });

        setVerificationStatus("success");

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } catch (error) {
        console.error("[v0] Email verification failed:", error);
        setVerificationStatus("error");
        setErrorMessage(
          (error as Error).message || "Email verification failed"
        );
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const renderContent = () => {
    switch (verificationStatus) {
      case "loading":
        return (
          <Stack align="center" gap="lg">
            <IconMail size={64} className="text-blue-500" />
            <Title order={2} className="text-xl text-gray-900">
              Verifying Your Email
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              Please wait while we verify your email address...
            </Text>
            <Loader size="md" />
          </Stack>
        );

      case "success":
        return (
          <Stack align="center" gap="lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <IconCheck size={32} className="text-green-600" />
            </div>
            <Title order={2} className="text-xl text-gray-900">
              Email Verified Successfully!
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              Your email has been verified. You will be redirected to your
              dashboard shortly.
            </Text>
            <Alert color="green" variant="light" className="w-full">
              <Text size="sm">Redirecting to dashboard in 3 seconds...</Text>
            </Alert>
          </Stack>
        );

      case "error":
        return (
          <Stack align="center" gap="lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <IconX size={32} className="text-red-600" />
            </div>
            <Title order={2} className="text-xl text-gray-900">
              Verification Failed
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              {errorMessage ||
                "We couldn't verify your email address. The link may be expired or invalid."}
            </Text>
            <Alert color="red" variant="light" className="w-full">
              <Text size="sm">
                Please try registering again or contact support if the problem
                persists.
              </Text>
            </Alert>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="mt-4"
            >
              Back to Login
            </Button>
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <Paper
        className="w-full max-w-md bg-white/95 backdrop-blur-sm"
        p="xl"
        radius="md"
        withBorder
      >
        <Center>{renderContent()}</Center>
      </Paper>
    </div>
  );
};

export default VerifyEmailPage;
