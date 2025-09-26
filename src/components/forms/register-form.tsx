"use client";

import { useState } from "react";
import {
  Button,
  TextInput,
  Paper,
  Title,
  Text,
  Stack,
  Group,
  FileInput,
  Avatar,
  Alert,
  Loader,
} from "@mantine/core";
import { IconUpload, IconAlertCircle, IconCheck } from "@tabler/icons-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  profileImage: File | null;
}

export function RegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    profileImage: null,
  });

  const [imagePreview, setImagePreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(""); // Clear error when user starts typing
  };

  const handleFileChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, profileImage: file }));

    if (file) {
      // Create preview URL for the selected image
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview("");
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return "First name is required";
    if (!formData.lastName.trim()) return "Last name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 8)
      return "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword)
      return "Passwords do not match";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email))
      return "Please enter a valid email address";

    // File validation (if provided)
    if (formData.profileImage) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(formData.profileImage.type)) {
        return "Profile image must be a valid image file (JPEG, PNG, GIF, or WebP)";
      }
      if (formData.profileImage.size > 5 * 1024 * 1024) {
        // 5MB limit
        return "Profile image must be less than 5MB";
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

      // Convert image to base64 if provided
      let imageData = "";
      if (formData.profileImage) {
        imageData = await convertFileToBase64(formData.profileImage);
      }

      const { error: authError } = await authClient.signUp.email({
        name: fullName,
        email: formData.email.trim(),
        password: formData.password,
        image: imageData || undefined, // Send base64 string or undefined
        callbackURL: "/login",
      });

      if (authError) {
        setError(authError.message || "Registration failed. Please try again.");
        return;
      }

      setSuccess(true);
      // Optional: Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        profileImage: null,
      });
      setImagePreview("");
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Paper
        className="w-full max-w-sm bg-white/95 backdrop-blur-sm"
        p="xl"
        radius="md"
        withBorder
      >
        <div className="text-center">
          <IconCheck size={48} className="text-green-500 mx-auto mb-4" />
          <Title order={2} className="text-xl text-gray-900 mb-2">
            Registration Successful!
          </Title>
          <Text size="sm" c="dimmed" className="mb-4">
            Please check your email to verify your account.
          </Text>
          <Link href="/login">
            <Button variant="outline" fullWidth>
              Go to Login
            </Button>
          </Link>
        </div>
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
          Create Account
        </Title>
        <Text size="sm" c="dimmed">
          Register for a new account to get started
        </Text>
      </div>

      <form onSubmit={handleSubmit}>
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

          {/* Profile Image Upload */}
          <div className="text-center">
            <div className="mb-3">
              <Avatar
                src={imagePreview}
                size="lg"
                radius="xl"
                mx="auto"
                className="border-2 border-gray-200"
              >
                {formData.firstName.charAt(0).toUpperCase() +
                  formData.lastName.charAt(0).toUpperCase()}
              </Avatar>
            </div>
            <FileInput
              label="Profile Picture (Optional)"
              placeholder="Choose image file"
              accept="image/*"
              leftSection={<IconUpload size="1rem" />}
              value={formData.profileImage}
              onChange={handleFileChange}
              styles={{
                label: {
                  color: "#374151",
                  fontWeight: 500,
                  textAlign: "center",
                },
              }}
              clearable
            />
            <Text size="xs" c="dimmed" mt="xs">
              Max file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
            </Text>
          </div>

          <Group grow>
            <TextInput
              label="First Name"
              placeholder="Enter your first name"
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              styles={{
                label: { color: "#374151", fontWeight: 500 },
              }}
              disabled={isLoading}
            />
            <TextInput
              label="Last Name"
              placeholder="Enter your last name"
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              styles={{
                label: { color: "#374151", fontWeight: 500 },
              }}
              disabled={isLoading}
            />
          </Group>

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

          <TextInput
            label="Confirm Password"
            placeholder="Confirm your password"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) =>
              handleInputChange("confirmPassword", e.target.value)
            }
            styles={{
              label: { color: "#374151", fontWeight: 500 },
            }}
            disabled={isLoading}
          />

          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            size="md"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? <Loader size="sm" /> : "Register"}
          </Button>

          <Text ta="center" size="sm" c="dimmed">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-cyan-600 hover:text-cyan-700 font-medium hover:underline"
            >
              Sign in
            </Link>
          </Text>
        </Stack>
      </form>
    </Paper>
  );
}
