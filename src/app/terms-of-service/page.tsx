"use client";

import { Container, Title, Text, Stack, Paper } from "@mantine/core";
import { useMantineTheme, useComputedColorScheme } from "@mantine/core";
import dynamic from "next/dynamic";
import Link from "next/link";

const HeaderClientNoSSR = dynamic(
  () => import("../_components/HeaderClient"),
  { ssr: false }
);

export default function TermsOfServicePage() {
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
            Terms and Conditions
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
                  1. Acceptance of Terms
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
                  By accessing and using SubdiviSync, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
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
                  2. Use License
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
                  Permission is granted to temporarily access the materials on SubdiviSync for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
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
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to reverse engineer any software contained on SubdiviSync</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
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
                  3. User Accounts
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
                  You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password.
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
                  4. Property Listings and Applications
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
                  All property listings, pricing, and availability are subject to change without notice. SubdiviSync reserves the right to accept or reject any application for property rental or purchase at its sole discretion.
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
                  5. Payment Terms
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
                  All payments made through SubdiviSync are subject to the terms and conditions of the payment provider. Refunds and cancellations are subject to the policies of Lynville Residences Malvar 2 Sonera.
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
                  6. Limitation of Liability
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
                  In no event shall SubdiviSync or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on SubdiviSync.
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
                  7. Revisions and Errata
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
                  The materials appearing on SubdiviSync could include technical, typographical, or photographic errors. SubdiviSync does not warrant that any of the materials on its website are accurate, complete, or current.
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
                  8. Contact Information
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
                  If you have any questions about these Terms and Conditions, please contact us at:
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

