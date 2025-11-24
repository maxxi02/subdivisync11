"use client";

import { Container, Title, Text, Stack, Paper } from "@mantine/core";
import { useMantineTheme, useComputedColorScheme } from "@mantine/core";
import dynamic from "next/dynamic";
import Link from "next/link";

const HeaderClientNoSSR = dynamic(
  () => import("../_components/HeaderClient"),
  { ssr: false }
);

export default function PrivacyPolicyPage() {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("dark", { getInitialValueInEffect: true });

  return (
    <div
      suppressHydrationWarning
      style={{
        minHeight: "100vh",
        backgroundColor:
          colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
      }}
    >
      <HeaderClientNoSSR />
      
      <Container size="lg" py="xl">
        <Stack gap="xl">
          <Title
            order={1}
            style={{
              color:
                colorScheme === "dark" ? theme.white : theme.colors.gray[9],
            }}
          >
            Privacy Policy
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
            Last updated: {new Date().toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>

          <Paper
            p="xl"
            radius="md"
            withBorder
            style={{
              backgroundColor:
                colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
            }}
          >
            <Stack gap="lg">
              <Stack gap="md">
                <Title
                  order={3}
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.white
                        : theme.colors.gray[9],
                  }}
                >
                  1. Information We Collect
                </Title>
                <Text
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.colors.gray[3]
                        : theme.colors.gray[7],
                    lineHeight: 1.6,
                  }}
                >
                  We collect information that you provide directly to us, including:
                </Text>
                <ul
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.colors.gray[3]
                        : theme.colors.gray[7],
                    paddingLeft: "1.5rem",
                    lineHeight: 1.8,
                  }}
                >
                  <li>Name, email address, phone number, and other contact information</li>
                  <li>Property application information and documents</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                  <li>Account credentials and authentication information</li>
                </ul>
              </Stack>

              <Stack gap="md">
                <Title
                  order={3}
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.white
                        : theme.colors.gray[9],
                  }}
                >
                  2. How We Use Your Information
                </Title>
                <Text
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.colors.gray[3]
                        : theme.colors.gray[7],
                    lineHeight: 1.6,
                  }}
                >
                  We use the information we collect to:
                </Text>
                <ul
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.colors.gray[3]
                        : theme.colors.gray[7],
                    paddingLeft: "1.5rem",
                    lineHeight: 1.8,
                  }}
                >
                  <li>Process and manage property applications</li>
                  <li>Facilitate payments and transactions</li>
                  <li>Send you important updates and announcements</li>
                  <li>Respond to your inquiries and provide customer support</li>
                  <li>Improve our services and user experience</li>
                </ul>
              </Stack>

              <Stack gap="md">
                <Title
                  order={3}
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.white
                        : theme.colors.gray[9],
                  }}
                >
                  3. Information Sharing
                </Title>
                <Text
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.colors.gray[3]
                        : theme.colors.gray[7],
                    lineHeight: 1.6,
                  }}
                >
                  We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                </Text>
                <ul
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.colors.gray[3]
                        : theme.colors.gray[7],
                    paddingLeft: "1.5rem",
                    lineHeight: 1.8,
                  }}
                >
                  <li>With payment processors to facilitate transactions</li>
                  <li>When required by law or to protect our rights</li>
                  <li>With your explicit consent</li>
                </ul>
              </Stack>

              <Stack gap="md">
                <Title
                  order={3}
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.white
                        : theme.colors.gray[9],
                  }}
                >
                  4. Data Security
                </Title>
                <Text
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.colors.gray[3]
                        : theme.colors.gray[7],
                    lineHeight: 1.6,
                  }}
                >
                  We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                </Text>
              </Stack>

              <Stack gap="md">
                <Title
                  order={3}
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.white
                        : theme.colors.gray[9],
                  }}
                >
                  5. Your Rights
                </Title>
                <Text
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.colors.gray[3]
                        : theme.colors.gray[7],
                    lineHeight: 1.6,
                  }}
                >
                  You have the right to:
                </Text>
                <ul
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.colors.gray[3]
                        : theme.colors.gray[7],
                    paddingLeft: "1.5rem",
                    lineHeight: 1.8,
                  }}
                >
                  <li>Access and review your personal information</li>
                  <li>Request corrections to inaccurate information</li>
                  <li>Request deletion of your account and data</li>
                  <li>Opt-out of certain communications</li>
                </ul>
              </Stack>

              <Stack gap="md">
                <Title
                  order={3}
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.white
                        : theme.colors.gray[9],
                  }}
                >
                  6. Cookies and Tracking
                </Title>
                <Text
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.colors.gray[3]
                        : theme.colors.gray[7],
                    lineHeight: 1.6,
                  }}
                >
                  We use cookies and similar tracking technologies to enhance your experience, analyze usage, and assist with our marketing efforts. You can control cookie preferences through your browser settings.
                </Text>
              </Stack>

              <Stack gap="md">
                <Title
                  order={3}
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.white
                        : theme.colors.gray[9],
                  }}
                >
                  7. Contact Us
                </Title>
                <Text
                  style={{
                    color:
                      colorScheme === "dark"
                        ? theme.colors.gray[3]
                        : theme.colors.gray[7],
                    lineHeight: 1.6,
                  }}
                >
                  If you have any questions about this Privacy Policy, please contact us at:
                  <br />
                  Email: customercare@lynvilleland.com.ph
                  <br />
                  Phone: 09178039073
                </Text>
              </Stack>
            </Stack>
          </Paper>

          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link
              href="/"
              style={{
                color:
                  colorScheme === "dark"
                    ? theme.colors.blue[4]
                    : theme.colors.blue[6],
                textDecoration: "none",
              }}
            >
              ← Back to Home
            </Link>
          </div>
        </Stack>
      </Container>
    </div>
  );
}

