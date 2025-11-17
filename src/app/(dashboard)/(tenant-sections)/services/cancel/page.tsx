"use client";

import { Container, Card, Text, Stack, Button } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function PaymentCancel() {
  const router = useRouter();

  return (
    <Container size="sm" py="xl">
      <Card shadow="md" padding="xl" radius="lg" withBorder>
        <Stack gap="xl" align="center">
          <div style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <IconX size={48} color="white" stroke={3} />
          </div>

          <Stack gap="xs" align="center">
            <Text size="xl" fw={700}>Payment Cancelled</Text>
            <Text size="sm" c="dimmed" ta="center">
              Your payment was cancelled. No charges were made.
            </Text>
          </Stack>

          <Button
            onClick={() => router.push("/transactions")}
            variant="filled"
            fullWidth
          >
            Back to Transactions
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}
