"use client";

import { Container, Title, Text, Stack, Paper } from "@mantine/core";
import { useMantineTheme, useComputedColorScheme } from "@mantine/core";
import dynamic from "next/dynamic";
import Link from "next/link";

const HeaderClientNoSSR = dynamic(
  () => import("../_components/HeaderClient"),
  { ssr: false }
);

const faqs = [
  { q: "What is SubdiviSync?", a: "A responsive web-based platform that simplifies subdivision management by centralizing payments, service requests, and announcements." },
  { q: "Who can use SubdiviSync?", a: "Both subdivision administrators and homeowners at Lynville Residences can access the platform via desktop or mobile browsers." },
  { q: "Can I pay my dues online?", a: "Yes. SubdiviSync integrates with PayMongo for secure online payments, with instant confirmation." },
  { q: "How do I request maintenance or services?", a: "Submit requests through the portal with photo attachments and priority levels. Admins track and update progress in real time." },
  { q: "Can I track my property applications?", a: "Yes. You can monitor the status of your applications anytime through your dashboard." },
  { q: "Where can I see announcements?", a: "Community updates are posted by administrators and displayed on your dashboard, with email notifications sent automatically." },
  { q: "Is SubdiviSync mobile-friendly?", a: "Absolutely. It works seamlessly on both desktop and mobile browsers." },
  { q: "Does it require internet?", a: "Yes. SubdiviSync is fully online and not accessible offline." },
  { q: "Is my data secure?", a: "Yes. SubdiviSync uses HTTPS, secure authentication, and encrypted communication to protect homeowner and administrator information." },
  { q: "Can administrators generate reports?", a: "Yes. Reports on payments, service requests, and applications are automatically generated and accessible via the admin dashboard." },
];

export default function FAQsPage() {
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
            Frequently Asked Questions
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
            Find answers to common questions about SubdiviSync
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
              {faqs.map((faq, index) => (
                <Stack key={index} gap="md">
                  <Title
                    order={3}
                    style={{
                      color:
                        colorScheme === "dark"
                          ? theme.white
                          : theme.colors.gray[9],
                    }}
                  >
                    {faq.q}
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
                    {faq.a}
                  </Text>
                </Stack>
              ))}
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
