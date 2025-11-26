"use client";

import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  useMantineTheme,
} from "@mantine/core";
import { useComputedColorScheme } from "@mantine/core";

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
      style={{
        minHeight: "100vh",
        backgroundColor:
          colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
        padding: "4rem 0",
      }}
    >
      <Container size="md">
        <Title
          order={1}
          ta="center"
          mb="xl"
          style={{
            color: colorScheme === "dark" ? theme.white : theme.colors.gray[9],
          }}
        >
          Frequently Asked Questions
        </Title>
        <Stack gap="md">
          {faqs.map((faq, index) => (
            <Paper
              key={index}
              p="md"
              radius="sm"
              style={{
                backgroundColor:
                  colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
                border: `1px solid ${
                  colorScheme === "dark"
                    ? theme.colors.dark[4]
                    : theme.colors.gray[2]
                }`,
              }}
            >
              <Text
                fw={600}
                mb={4}
                style={{
                  color:
                    colorScheme === "dark" ? theme.white : theme.colors.gray[8],
                }}
              >
                {faq.q}
              </Text>
              <Text
                size="sm"
                style={{
                  color:
                    colorScheme === "dark"
                      ? theme.colors.gray[4]
                      : theme.colors.gray[6],
                }}
              >
                {faq.a}
              </Text>
            </Paper>
          ))}
        </Stack>
      </Container>
    </div>
  );
}
